import { dansLaPeriode, type Periode } from "./periode.ts";
import { nomCategorie } from "./schema.ts";
import type { ArtistePublic, EvenementPublic, LieuPublic } from "./types.ts";

export type Portee = "tout" | "evenements" | "artistes" | "lieux";

export interface Criteres {
  q: string;
  portee: Portee;
  categorie: string | null;
  ville: string | null;
  periode: Periode;
  gratuit: boolean;
}

export const CRITERES_VIDES: Criteres = { q: "", portee: "tout", categorie: null, ville: null, periode: "tout", gratuit: false };

export interface Donnees {
  evenements: EvenementPublic[];
  artistes: ArtistePublic[];
  lieux: LieuPublic[];
}

/** Minuscules, sans accents : « Pétion-Ville » et « petion ville » se retrouvent. */
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[-_']/g, " ").trim();
}

/** Prix en texte libre : gratuit si l'organisateur écrit « gratuit », « entrée libre » ou « free ». */
export function estGratuit(prix: string | null): boolean {
  return prix ? /\b(gratuit|libre|free)\b/.test(normaliser(prix)) : false;
}

function contientTout(texte: string, mots: string[]): boolean {
  const t = normaliser(texte);
  return mots.every((m) => t.includes(m));
}

export function nombreFiltres(c: Criteres): number {
  return [c.categorie, c.ville, c.periode !== "tout", c.gratuit].filter(Boolean).length;
}

export function rechercher(donnees: Donnees, c: Criteres, maintenant = new Date()): Donnees {
  const mots = normaliser(c.q).split(/\s+/).filter(Boolean);
  const villeNorm = c.ville ? normaliser(c.ville) : null;
  const voirEvenements = c.portee === "tout" || c.portee === "evenements";
  const voirArtistes = (c.portee === "tout" || c.portee === "artistes") && mots.length > 0;
  const voirLieux = (c.portee === "tout" || c.portee === "lieux") && mots.length > 0;

  const evenements = voirEvenements
    ? donnees.evenements
        .filter((e) => {
          if (!dansLaPeriode(e.date_debut, c.periode, maintenant, e.fuseau)) return false;
          if (c.categorie && e.categorie !== c.categorie) return false;
          if (villeNorm && normaliser(e.ville ?? "") !== villeNorm) return false;
          if (c.gratuit && !estGratuit(e.prix)) return false;
          if (mots.length === 0) return true;
          const texte = [e.titre, e.ville, e.lieu?.nom, nomCategorie(e.categorie), e.description, ...e.artistes.map((a) => a.nom)]
            .filter(Boolean)
            .join(" ");
          return contientTout(texte, mots);
        })
        .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
    : [];

  const artistes = voirArtistes
    ? donnees.artistes.filter(
        (a) => (!villeNorm || normaliser(a.ville_base ?? "") === villeNorm) && contientTout([a.nom, a.type, a.ville_base].filter(Boolean).join(" "), mots),
      )
    : [];

  const lieux = voirLieux
    ? donnees.lieux.filter(
        (l) => (!villeNorm || normaliser(l.ville ?? "") === villeNorm) && contientTout([l.nom, l.type, l.ville].filter(Boolean).join(" "), mots),
      )
    : [];

  return { evenements, artistes, lieux };
}
