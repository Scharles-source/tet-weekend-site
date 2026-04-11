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
      // Proxy toutes les requêtes /ad/admin/* vers l'app admin sur Vercel
      // Les assets (_next/static) se chargent directement via assetPrefix côté admin
      {
        source: "/ad/admin",
        destination: "https://tet-weekend-admin.vercel.app/ad/admin",
      },
      {
        source: "/ad/admin/:path*",
        destination: "https://tet-weekend-admin.vercel.app/ad/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
