# Deploy — FluxiaVoice Dashboard via Coolify

Esse projeto roda como container Next.js standalone na sua VPS via Coolify.

## Requisitos
- Coolify rodando na VPS (você já tem em https://coolify.salestecnologia.com.br)
- Postgres do n8n acessível **dentro da network do Coolify** (você já tem)
- Repositório Git com esse projeto (vamos criar)
- DNS apontado: `fluxiavoice.salestecnologia.com.br` → IP da VPS

## Passo a passo

### 1. Subir o código pra um repo Git
```bash
cd ~/projetos/fluxiavoice/dashboard
git init
git add .
git commit -m "FluxiaVoice dashboard initial"
gh repo create fluxiavoice-dashboard --private --source=. --remote=origin --push
# OU manualmente: cria um repo no GitHub/GitLab e faz git push
```

### 2. No Coolify, criar nova aplicação
1. Projetos → escolha um projeto → **Add Resource** → **Application**
2. Source: **Public Repository** (se for público) ou **Private Repository** (configurar deploy key)
3. Repository: `https://github.com/SEU_USUARIO/fluxiavoice-dashboard`
4. Branch: `main`
5. Build Pack: **Dockerfile**
6. Port Exposes: `3000`

### 3. Variáveis de ambiente
No tab **Environment Variables** da aplicação, adicione:

```
DATABASE_URL=postgres://n8n:SENHA_INTERNA@d7rol2d624oqmzswjs8h6py4:5432/postgres?schema=fluxia
NEXTAUTH_SECRET=COLE_O_NEXTAUTH_SECRET_DO_.ENV_LOCAL
NEXTAUTH_URL=https://fluxiavoice.salestecnologia.com.br
RETELL_API_KEY=key_xxx
```

**Importante:** o `DATABASE_URL` em produção usa o **hostname interno** do container Postgres no Coolify (`d7rol2d624oqmzswjs8h6py4`), não o público. Isso é mais rápido e seguro.

### 4. Build args
No tab **Build** da aplicação, adicione build arg pra Prisma generate funcionar:

- `DATABASE_URL` = mesmo valor da env var acima

### 5. Domain
Em **Domains**: `https://fluxiavoice.salestecnologia.com.br`
- Coolify gera SSL automático via Let's Encrypt
- Garanta que o DNS aponta pro IP da VPS antes (já fizemos: A record fluxiavoice → 72.60.137.234)

### 6. Network
Conecta a aplicação na mesma network do n8n + Postgres pra resolver o hostname interno.

### 7. Deploy
Clica em **Deploy**. Coolify vai:
1. Pegar o código do repo
2. Rodar `docker build` com o Dockerfile
3. Subir o container expondo porta 3000
4. Caddy/Traefik faz o proxy reverso + SSL pro domínio

### 8. Verificar
Acessa `https://fluxiavoice.salestecnologia.com.br/login` → tela editorial split deve aparecer.

## Updates futuros
A cada `git push` na branch `main`, o Coolify pode auto-deploy (se configurar webhook) ou você clica **Redeploy** manualmente.

## Troubleshooting

### Build falha em "prisma generate"
- Confirma que o build arg `DATABASE_URL` foi configurado no Coolify
- Database precisa estar acessível durante o build (mesmo se for só pra gerar tipos)

### "Cannot resolve hostname d7rol2d624oqmzswjs8h6py4"
- A aplicação não está na mesma network do Postgres
- No Coolify: Resource → Network → conecta na mesma rede do n8n

### Página /login mostra erro de Prisma
- Variável `DATABASE_URL` em runtime está errada
- Tab **Environment Variables** → verifica e força redeploy
