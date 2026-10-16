import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Tèt Weekend",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--black)] px-4 py-6 text-[var(--white)] sm:px-6">{children}</div>;
}
