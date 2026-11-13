"use client";

import { useEffect, useState } from "react";
import { envoyer, ecrire, interets, lire, memoriserInteret, visiteur } from "@/lib/listing/engagement-client";
import { libelleInteret } from "@/lib/listing/engagement";

/** Compte une vue par jour et par visiteur, et propose « J'y vais » (anonyme, sans compte). */
export function Engagement({ evenementId, interetsInitiaux, termine }: { evenementId: string; interetsInitiaux: number | null; termine: boolean }) {
  const [actif, setActif] = useState(false);
  const [total, setTotal] = useState<number | null>(interetsInitiaux);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    const id = visiteur();
    const jour = new Date().toISOString().slice(0, 10);
    const cle = `tw_vue_${evenementId}`;
    if (!termine && lire(cle) !== jour) {
      ecrire(cle, jour);
      void envoyer({ type: "vue", evenementId, visiteur: id }).catch(() => undefined);
    }
    setActif(interets().includes(evenementId));
  }, [evenementId, termine]);

  if (termine) return null;

  /** « I'm in » est définitif : un seul clic par personne et par événement. */
  async function confirmer() {
    if (actif || occupe) return;
    setOccupe(true);
    const avant = total;
    setActif(true);
    setTotal((avant ?? 0) + 1);
    memoriserInteret(evenementId, true);
    try {
      const r = await envoyer({ type: "interet", evenementId, visiteur: visiteur() });
      if (r?.ok && r.interesse) setTotal(r.total ?? (avant ?? 0) + 1);
      else throw new Error("non confirmé");
    } catch {
      setActif(false);
      setTotal(avant);
      memoriserInteret(evenementId, false);
    } finally {
      setOccupe(false);
    }
  }

  const nombre = libelleInteret(total) ? total : null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={actif}
        aria-label={actif ? "You're in" : undefined}
        disabled={occupe || actif}
        onClick={confirmer}
        className={`inline-flex min-h-12 items-center gap-2 rounded-[14px] px-5 text-[15px] font-extrabold ${actif ? "bg-[var(--creme)] text-[var(--encre)]" : "border-2 border-[var(--accent)] text-[var(--nuit-texte)]"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {!actif && "I'm in"}
        {nombre !== null && <span className="text-[13px] opacity-80">{nombre}</span>}
      </button>
    </div>
  );
}
