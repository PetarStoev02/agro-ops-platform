import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "agro-ops-platform"; // GitHub Pages project path

const nextConfig: NextConfig = {
  output: "export",
  // Ensure all asset URLs work when hosted under /agro-ops-platform
  assetPrefix: isProd ? `/${repoName}/` : undefined,
  basePath: isProd ? `/${repoName}` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
