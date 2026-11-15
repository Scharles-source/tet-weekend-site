"use client";

/** Mémoire locale anonyme (sans compte) : identifiant du visiteur et événements « I'm going ». */
const CLE_VISITEUR = "tw_visiteur";
const CLE_INTERETS = "tw_jy_vais";

export function lire(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}

export function ecrire(cle: string, valeur: string) {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    /* navigation privée : on continue sans mémoire locale */
  }
}

export function visiteur(): string {
  let v = lire(CLE_VISITEUR);
  if (!v) {
    v = crypto.randomUUID();
    ecrire(CLE_VISITEUR, v);
  }
  return v;
}

export function interets(): string[] {
  try {
    const v = JSON.parse(lire(CLE_INTERETS) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function memoriserInteret(evenementId: string, actif: boolean) {
  const autres = interets().filter((x) => x !== evenementId);
  ecrire(CLE_INTERETS, JSON.stringify(actif ? [...autres, evenementId] : autres));
}

export async function envoyer(corps: Record<string, string>) {
  const res = await fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
  return res.ok ? ((await res.json()) as { ok: boolean; interesse?: boolean; total?: number }) : null;
}

/**
 * Compte un partage au clic sur « Invite friends » : un par jour et par visiteur, comme les vues.
 * Best-effort : un échec d'enregistrement n'empêche jamais le partage lui-même.
 */
export function enregistrerPartage(evenementId: string) {
  const jour = new Date().toISOString().slice(0, 10);
  const cle = `tw_partage_${evenementId}`;
  if (lire(cle) === jour) return;
  ecrire(cle, jour);
  void envoyer({ type: "partage", evenementId, visiteur: visiteur() }).catch(() => undefined);
}
