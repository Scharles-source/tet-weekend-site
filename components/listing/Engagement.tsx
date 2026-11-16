"use client";

import { useEffect, useState } from "react";
import { enregistrerPartage, envoyer, ecrire, lire, visiteur } from "@/lib/listing/engagement-client";
import { partagerCarteEvenement } from "@/lib/listing/partage-carte";
import { libelleVues } from "@/lib/listing/preuve";

/**
 * Compte une vue par jour et par visiteur (anonyme, sans compte), montre le nombre de vues dès la première
 * et propose « Invite your friends ». Plus de « I'm in » (décision de Smith, 15 nov. 2026).
 */
export function Engagement({ evenementId, titre = "", termine, vues = null }: { evenementId: string; titre?: string; termine: boolean; vues?: number | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [partageEnCours, setPartageEnCours] = useState(false);

  useEffect(() => {
    const id = visiteur();
    const jour = new Date().toISOString().slice(0, 10);
    const cle = `tw_vue_${evenementId}`;
    if (!termine && lire(cle) !== jour) {
      ecrire(cle, jour);
      void envoyer({ type: "vue", evenementId, visiteur: id }).catch(() => undefined);
    }
  }, [evenementId, termine]);

  if (termine) return null;

  /** Un seul geste : la carte part directement dans la feuille de partage native (ou se télécharge, lien copié). */
  async function partager() {
    if (partageEnCours) return;
    setPartageEnCours(true);
    try {
      await partagerCarteEvenement(evenementId, titre, (texte) => {
        setMessage(texte);
        window.setTimeout(() => setMessage(null), 3500);
      });
    } finally {
      setPartageEnCours(false);
    }
  }

  const nombre = libelleVues(vues);
  return (
    <div className="mt-6 flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => {
          enregistrerPartage(evenementId);
          void partager();
        }}
        disabled={partageEnCours}
        className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl border-0 bg-[var(--accent)] px-5 text-[16px] font-extrabold text-[#1C1305] disabled:opacity-70"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <path d="M19 8v6M16 11h6" />
        </svg>
        Invite your friends
      </button>
      {(nombre || message) && (
        <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--nuit-muet)]" role="status">
          {!message && (
            <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          {message ?? nombre}
        </p>
      )}
    </div>
  );
}
