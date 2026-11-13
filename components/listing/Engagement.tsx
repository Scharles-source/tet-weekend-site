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

  async function basculer() {
    if (occupe) return;
    setOccupe(true);
    try {
      const r = await envoyer({ type: "interet", evenementId, visiteur: visiteur() });
      if (r?.ok) {
        setActif(Boolean(r.interesse));
        setTotal(r.total ?? null);
        memoriserInteret(evenementId, Boolean(r.interesse));
      }
    } catch {
      /* hors ligne : rien ne change */
    } finally {
      setOccupe(false);
    }
  }

  const label = libelleInteret(total);
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={actif}
        disabled={occupe}
        onClick={basculer}
        className={`inline-flex min-h-12 items-center rounded-[14px] px-5 text-[15px] font-extrabold ${actif ? "bg-[var(--creme)] text-[var(--encre)]" : "border-2 border-[var(--accent)] text-[var(--nuit-texte)]"}`}
      >
        {actif ? "I'm going ✓" : "I'm going"}
      </button>
      {label && <span className="text-sm font-semibold text-[var(--or)]">{label}</span>}
    </div>
  );
}
