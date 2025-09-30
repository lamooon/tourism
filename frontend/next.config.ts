import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path((?!countries$).*)",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
