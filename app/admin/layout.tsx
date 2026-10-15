import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin collecte — Tèt Weekend",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
