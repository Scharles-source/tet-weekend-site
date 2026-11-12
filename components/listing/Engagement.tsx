"use client";

import { useEffect, useState } from "react";
import { libelleInteret } from "@/lib/listing/engagement";

const CLE_VISITEUR = "tw_visiteur";
const CLE_INTERETS = "tw_jy_vais";

function lire(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}
function ecrire(cle: string, valeur: string) {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    /* navigation privée : on continue sans mémoire locale */
  }
}
function visiteur(): string {
  let v = lire(CLE_VISITEUR);
  if (!v) {
    v = crypto.randomUUID();
    ecrire(CLE_VISITEUR, v);
  }
  return v;
}
function interets(): string[] {
  try {
    const v = JSON.parse(lire(CLE_INTERETS) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
async function envoyer(corps: Record<string, string>) {
  const res = await fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
  return res.ok ? ((await res.json()) as { ok: boolean; interesse?: boolean; total?: number }) : null;
}

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
        const autres = interets().filter((x) => x !== evenementId);
        ecrire(CLE_INTERETS, JSON.stringify(r.interesse ? [...autres, evenementId] : autres));
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
        {actif ? "J'y vais ✓" : "J'y vais"}
      </button>
      {label && <span className="text-sm font-semibold text-[var(--or)]">{label}</span>}
    </div>
  );
}
