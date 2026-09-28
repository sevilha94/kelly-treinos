import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // print de comprovante no celular passa facil de 1 MB, que e o padrao
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  // Referrer-Policy fica no padrao do navegador: sem referer, o player do
  // YouTube embutido recusa tocar
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
