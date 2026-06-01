# ============================================================================
# FluxiaVoice — Dashboard Next.js
# Multi-stage build: deps → build → runner
# ============================================================================

# --------- Stage 1: deps ---------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# --------- Stage 2: builder ---------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URL é necessário em build-time pelo Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Build do Next.js (gera .next/standalone)
RUN npx prisma generate
RUN npm run build

# --------- Stage 3: runner ---------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# usuário não-root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# copia o build standalone (já contém node_modules necessários)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Prisma engine + schema (precisa em runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
