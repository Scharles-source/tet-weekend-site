import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Flyers des événements (stockage public Supabase), réduits par l'optimiseur d'images.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },

  async redirects() {
    return [
      { source: "/restaurant/:slug", destination: "/lieux/:slug", permanent: true },
    ];
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
