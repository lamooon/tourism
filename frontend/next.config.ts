import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Optional: don’t block builds because of lint errors in prod
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;