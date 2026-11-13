import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tetweekend.com"),
  verification: {
    google: "z0RYQLMp3mSHvtPSquY51QKux-vOoNwak_phgEBB5Uk",
  },
  title: "Tèt Weekend — Haitian Events",
  description: "Find the best Haitian events near you. Concerts, parties, festivals — never miss a night.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icone-tw-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icone-tw-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Tèt Weekend",
    description: "The reference for Haitian events, in Haiti and across the diaspora.",
    type: "website",
    url: "https://www.tetweekend.com",
    siteName: "Tèt Weekend",
    locale: "en_US",
    images: [{ url: "/partage-tw.png", width: 1200, height: 630, alt: "Tèt Weekend" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tèt Weekend",
    description: "The reference for Haitian events, in Haiti and across the diaspora.",
    images: ["/partage-tw.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Polices chargées par le navigateur (et non à la compilation) : un incident de téléchargement des polices ne peut plus faire échouer le déploiement. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root { --font-archivo: "Archivo"; --font-archivo-black: "Archivo Black", "Archivo", sans-serif; --font-inter: "Inter"; }
          :root { --page-px: 32px; }
          @media (max-width: 768px) {
            :root { --page-px: 20px; }
            .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
            .hero-visual { display: none !important; }
            .features-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            .app-grid-inner { grid-template-columns: 1fr !important; gap: 40px !important; }
            .app-phone { display: none !important; }
            .two-col-detail { grid-template-columns: 1fr !important; gap: 24px !important; }
            .detail-sticky { position: static !important; top: auto !important; }
          }
          @media (max-width: 480px) {
            :root { --page-px: 16px; }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
