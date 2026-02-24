import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  basePath: '/hist12b',
  assetPrefix: '/hist12b/',
  images: { unoptimized: true },
};

export default nextConfig;
