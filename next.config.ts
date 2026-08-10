import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // print de comprovante no celular passa facil de 1 MB, que e o padrao
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  /* config options here */
};

export default nextConfig;
