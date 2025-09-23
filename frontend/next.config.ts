import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack for production builds
    turbo: false,
  },
  eslint: {
    // Optional: don’t block builds because of lint errors in prod
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;