import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },

  async rewrites() {
    return [
      // Proxy pages admin + assets (basePath génère /ad/admin/_next/static/...)
      {
        source: "/ad/admin",
        destination: "https://tet-weekend-dashboard-scharles-sources-projects.vercel.app/ad/admin",
      },
      {
        source: "/ad/admin/:path*",
        destination: "https://tet-weekend-dashboard-scharles-sources-projects.vercel.app/ad/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
