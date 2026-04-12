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
      // Proxy assets admin (JS/CSS) — assetPrefix pointe vers /ad/assets
      {
        source: "/ad/assets/_next/:path*",
        destination: "https://tet-weekend-dashboard-scharles-sources-projects.vercel.app/_next/:path*",
      },
      // Proxy pages admin
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
