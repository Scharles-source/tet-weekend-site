"use client";

import { useState } from "react";

/**
 * Partage de la fiche (correctif audit 13 nov. 2026) : WhatsApp — le réflexe
 * de partage en Haïti — et partage général (Web Share API, repli copie du
 * lien). Le texte partagé porte le titre, la date et le lien de la fiche.
 */
export function PartageFiche({
  titre,
  quand,
  lieu,
  url,
}: {
  titre: string;
  quand: string;
  lieu: string | null;
  url: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const texte = `${titre} — ${quand}${lieu ? ` · ${lieu}` : ""}`;
  const lienWhatsApp = `https://wa.me/?text=${encodeURIComponent(`${texte}\n${url}`)}`;

  async function partager() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: titre, text: texte, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setMessage(url);
    }
    window.setTimeout(() => setMessage(null), 2500);
  }

  return (
    <>
      <a
        href={lienWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-[#1FA855] px-5 text-[15px] font-extrabold text-white no-underline"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.38-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.8-1.84-.21-.45-.42-.39-.56-.4h-.48c-.17 0-.43.06-.68.31-.24.25-.93.91-.93 2.22 0 1.31.95 2.57 1.08 2.75.14.18 1.87 2.85 4.53 4 .63.27 1.13.44 1.51.56.64.2 1.21.17 1.67.1.51-.08 1.56-.62 1.9-1.21.34-.6.34-1.1.24-1.21-.09-.11-.23-.17-.48-.29z" />
        </svg>
        WhatsApp
      </a>
      <button
        type="button"
        onClick={partager}
        className="inline-flex min-h-12 items-center gap-2 rounded-[14px] border border-[#6B5B4D] px-5 text-[15px] font-bold text-[var(--nuit-texte)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Share
      </button>
      {message && (
        <span role="status" className="inline-flex min-h-12 items-center text-[13.5px] font-semibold text-[var(--nuit-texte2)]">
          {message}
        </span>
      )}
    </>
  );
}
