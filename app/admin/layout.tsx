import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Tèt Weekend",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-clair min-h-dvh bg-[#F3F4F7] font-[family-name:var(--font-inter)] text-[#12161F]">
      <style>{".admin-clair :focus-visible{outline:2px solid #1D3FD8;outline-offset:2px}"}</style>
      {children}
    </div>
  );
}
