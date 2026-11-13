import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", robots: { index: false, follow: false } };

/** Page affichée par l'application quand le téléphone n'a plus de réseau. */
export default function HorsLigne() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FBF7EF] px-6 text-center text-[#191410]">
      <h1 className="text-[28px] font-black">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#6E6252]">
        Tèt Weekend needs a connection to show the latest parties. Check your network and try again.
      </p>
      {/* Lien classique voulu : on recharge vraiment la page pour retester le réseau. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="mt-6 inline-flex min-h-12 items-center rounded-[14px] bg-[#2E2622] px-6 text-[15px] font-extrabold text-white no-underline">
        Try again
      </a>
    </main>
  );
}
