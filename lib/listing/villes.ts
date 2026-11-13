import { slugifier } from "./slug.ts";
import type { Annuaire } from "./data.ts";

/**
 * Ville canonique (correctif SEO, 13 nov. 2026) : la colonne ville est un
 * texte libre (« Atlanta », « Atlanta, Géorgie », « Marietta, Géorgie
 * (Atlanta) ») et chaque variante créait sa propre page ville — pages
 * dupliquées, parfois vides, qui se disputaient les mêmes recherches.
 * La ville de base est le segment d'avant la première virgule, sans la
 * parenthèse finale ; le slug se calcule toujours sur ce segment, donc
 * toutes les variantes fusionnent sur une seule page. L'affichage garde
 * « , D.C. » pour Washington, seule exception.
 */
function segmentVille(nom: string): string {
  const propre = nom.trim().replace(/\s+/g, " ");
  const sansParenthese = propre.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const virgule = sansParenthese.indexOf(",");
  const base = (virgule === -1 ? sansParenthese : sansParenthese.slice(0, virgule)).trim();
  return base || propre;
}

export function nomVilleCanonique(nom: string): string {
  const propre = nom.trim().replace(/\s+/g, " ");
  const virgule = propre.indexOf(",");
  if (virgule !== -1 && /^d\.?\s?c\.?\.?$/i.test(propre.slice(virgule + 1).trim())) {
    return `${segmentVille(nom)}, D.C.`;
  }
  return segmentVille(nom);
}

/** Slug de la page ville pour n'importe quelle variante du nom. */
export function slugVille(nom: string): string {
  return slugifier(segmentVille(nom));
}

export function villesDe(annuaire: Pick<Annuaire, "lieux" | "evenements">): { slug: string; nom: string }[] {
  const noms = new Map<string, string>();
  const noter = (ville: string | null | undefined) => {
    if (!ville) return;
    const slug = slugVille(ville);
    const nom = nomVilleCanonique(ville);
    const existant = noms.get(slug);
    // En cas de variantes, garder l'affichage le plus précis (« Washington, D.C. »).
    if (!existant || (nom.endsWith(", D.C.") && !existant.endsWith(", D.C."))) noms.set(slug, nom);
  };
  for (const lieu of annuaire.lieux) noter(lieu.ville);
  for (const evenement of annuaire.evenements) noter(evenement.ville);
  return [...noms.entries()]
    .map(([slug, nom]) => ({ slug, nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
