import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tèt Weekend — Kote fèt la?",
  description: "Découvre les meilleurs événements haïtiens près de toi. Concerts, soirées, festivals — ne rate plus rien.",
  openGraph: {
    title: "Tèt Weekend",
    description: "La référence des événements haïtiens & diaspora.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
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
