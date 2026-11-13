import { MARCHES, evenementDuMarche, type Marche } from "./marches.ts";
import { slugVille } from "./villes.ts";
import type { EvenementPublic } from "./types.ts";

/** Où se trouve le visiteur (ville approximative donnée par son réseau, ou ville choisie par lui). */
export interface Position {
  ville: string | null;
  region: string | null;
  pays: string | null;
}

/** Normalise un pays écrit en toutes lettres ou en code (« Haïti », « HT », « United States »…). */
export function codePays(texte: string | null | undefined): string | null {
  if (!texte) return null;
  const t = texte.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (t === "ht" || t === "haiti") return "HT";
  if (/^(us|usa|united states|united states of america|etats-unis|etats unis)$/.test(t)) return "US";
  if (t === "ca" || t === "canada") return "CA";
  if (t === "fr" || t === "france") return "FR";
  return /^[a-z]{2}$/.test(t) ? t.toUpperCase() : null;
}

const PAYS_DU_MARCHE: Record<string, string> = { "new-york": "US", florida: "US", massachusetts: "US", haiti: "HT" };
const MARCHE_DE_L_ETAT: Record<string, string> = { NY: "new-york", FL: "florida", MA: "massachusetts" };

export function marcheDe(e: EvenementPublic): Marche | undefined {
  return MARCHES.find((m) => evenementDuMarche(e, m));
}

export function paysEvenement(e: EvenementPublic): string | null {
  const direct = codePays(e.lieu?.pays);
  if (direct) return direct;
  const m = marcheDe(e);
  return m ? (PAYS_DU_MARCHE[m.slug] ?? null) : null;
}

/** Marché (zone) du visiteur : Haïti par le pays, sinon par sa ville, sinon par son État. */
export function marcheDePosition(p: Position): string | null {
  if (p.pays === "HT") return "haiti";
  if (p.ville) {
    const s = slugVille(p.ville);
    const m = MARCHES.find((x) => x.villes.some((v) => slugVille(v) === s));
    if (m) return m.slug;
  }
  if (p.pays === "US" && p.region) return MARCHE_DE_L_ETAT[p.region.toUpperCase()] ?? null;
  return null;
}

/** 0 = sa ville, 1 = sa zone (Brooklyn → New York), 2 = son pays, 3 = ailleurs. */
export function rangProximite(e: EvenementPublic, p: Position): 0 | 1 | 2 | 3 {
  if (p.ville && e.ville && slugVille(e.ville) === slugVille(p.ville)) return 0;
  const zone = marcheDePosition(p);
  if (zone) {
    const m = marcheDe(e);
    if (m && m.slug === zone) return 1;
  }
  if (p.pays) {
    const pays = paysEvenement(e);
    if (pays && pays === p.pays) return 2;
  }
  return 3;
}

/** Tri stable : à rang égal, l'ordre d'origine (par date) est conservé. */
export function trierParProximite<T extends EvenementPublic>(evenements: T[], p: Position | null): T[] {
  if (!p) return evenements;
  return evenements
    .map((e, i) => ({ e, i, r: rangProximite(e, p) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.e);
}

/** Nombre d'événements dans sa ville ou sa zone. */
export function nombreProches(evenements: EvenementPublic[], p: Position): number {
  return evenements.filter((e) => rangProximite(e, p) <= 1).length;
}

/** Position construite à partir d'une ville choisie dans la liste du site. */
export function positionDepuisVille(nom: string, evenements: EvenementPublic[]): Position {
  const s = slugVille(nom);
  const e = evenements.find((x) => x.ville && slugVille(x.ville) === s);
  return { ville: nom, region: null, pays: e ? paysEvenement(e) : null };
}

export function etiquettePosition(p: Position): string {
  if (p.ville) return p.ville;
  if (p.pays === "HT") return "Haiti";
  return p.region ?? p.pays ?? "you";
}
