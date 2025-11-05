import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "agro-ops-platform"; // GitHub Pages project path

// Note: Clerk middleware requires server-side functionality and cannot work with "output: export"
// For development, we disable static export to allow Clerk middleware to function
// For production deployment with Clerk, consider using a platform that supports SSR (Vercel, Netlify, etc.)
// If static export is required for GitHub Pages, Clerk will need to be configured differently
const enableStaticExport = process.env.ENABLE_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(enableStaticExport && { output: "export" }),
  // Ensure all asset URLs work when hosted under /agro-ops-platform
  assetPrefix: isProd ? `/${repoName}/` : undefined,
  basePath: isProd ? `/${repoName}` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};


export default nextConfig;
