import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for API routes to work
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
