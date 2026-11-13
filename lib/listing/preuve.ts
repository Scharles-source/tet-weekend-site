import { MIN_EVENEMENTS_CLASSEMENT, SEUIL_VUES, SEUIL_VUES_JOUR } from "./engagement.ts";

export interface Preuve {
  /** Phrase complète (carte large). */
  texte: string;
  /** Version courte (affiche étroite). */
  court: string;
}

interface Source {
  ville?: string | null;
  vues?: number | null;
  vues_jour?: number | null;
  rang_ville?: number | null;
}

function abrege(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/** Une seule preuve sociale par événement, vraie, par ordre d'impact : classement, vues du jour, vues cumulées. */
export function preuveSociale(e: Source): Preuve | null {
  if (e.rang_ville === 1 && e.ville) {
    return { texte: `#1 trending in ${e.ville}`, court: `#1 in ${e.ville}` };
  }
  if (typeof e.vues_jour === "number" && e.vues_jour >= SEUIL_VUES_JOUR) {
    return { texte: `Seen ${e.vues_jour} times today`, court: `${abrege(e.vues_jour)} seen today` };
  }
  if (typeof e.vues === "number" && e.vues >= SEUIL_VUES) {
    return { texte: `${abrege(e.vues)} views`, court: `${abrege(e.vues)} views` };
  }
  return null;
}

/**
 * Rang « tendance » de chaque événement dans sa ville (1 = le plus vu aujourd'hui, à défaut le plus vu).
 * Aucun classement dans une ville qui compte moins de MIN_EVENEMENTS_CLASSEMENT événements, ni sous les seuils de vues :
 * être « n°1 » d'une liste de un événement ne prouve rien.
 */
export function rangsParVille(evenements: { id: string; ville: string | null; vues?: number | null; vues_jour?: number | null }[]): Map<string, number> {
  const rangs = new Map<string, number>();
  const parVille = new Map<string, typeof evenements>();
  for (const e of evenements) {
    if (!e.ville) continue;
    parVille.set(e.ville, [...(parVille.get(e.ville) ?? []), e]);
  }
  for (const liste of parVille.values()) {
    if (liste.length < MIN_EVENEMENTS_CLASSEMENT) continue;
    const score = (e: (typeof liste)[number]) => (typeof e.vues_jour === "number" && e.vues_jour > 0 ? e.vues_jour : (e.vues ?? 0));
    const tries = [...liste].sort((a, b) => score(b) - score(a));
    const premier = tries[0];
    const second = tries[1];
    const assez = typeof premier.vues_jour === "number" && premier.vues_jour >= SEUIL_VUES_JOUR ? true : (premier.vues ?? 0) >= SEUIL_VUES;
    if (assez && score(premier) > score(second)) rangs.set(premier.id, 1);
  }
  return rangs;
}
