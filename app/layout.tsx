import type { Metadata } from "next";
import { Archivo, Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-archivo", display: "swap" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo-black", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Tèt Weekend — Kote fèt la?",
  description: "Découvre les meilleurs événements haïtiens près de toi. Concerts, soirées, festivals — ne rate plus rien.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Tèt Weekend",
    description: "La référence des événements haïtiens & diaspora.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${archivoBlack.variable} ${inter.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
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
