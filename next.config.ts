import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone gera um build self-contained pra Docker (não precisa npm install na imagem final)
  output: "standalone",

  // Imagens externas permitidas (gravações Retell, avatars etc.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "retell-utils-public.s3.us-west-2.amazonaws.com" },
    ],
  },

  // Headers de segurança básicos
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
