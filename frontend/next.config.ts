import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*/",                 // matches with trailing slash
        destination: `${backendUrl}/api/:path*/`, // preserves trailing slash
      },
      {
        source: "/api/:path*",                  // fallback if no slash
        destination: `${backendUrl}/api/:path*/`, // force add trailing slash
      },
    ];
  }
};

export default nextConfig;