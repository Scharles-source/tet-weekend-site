import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/ad/admin",
        destination: "https://tet-weekend-admin.vercel.app/dashboard",
        permanent: false,
      },
      {
        source: "/ad/admin/:path*",
        destination: "https://tet-weekend-admin.vercel.app/dashboard/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
