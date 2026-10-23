import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Tèt Weekend",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-clair min-h-dvh bg-[#FBF7EF] font-[family-name:var(--font-inter)] text-[#191410]">
      <style>{".admin-clair :focus-visible{outline:2px solid #E02B20;outline-offset:2px}"}</style>
      {children}
    </div>
  );
}
