import { slugifier } from "./slug.ts";
import type { Annuaire } from "./data.ts";

export function villesDe(annuaire: Pick<Annuaire, "lieux" | "evenements">): { slug: string; nom: string }[] {
  const noms = new Map<string, string>();
  for (const lieu of annuaire.lieux) {
    if (lieu.ville) noms.set(slugifier(lieu.ville), lieu.ville);
  }
  for (const evenement of annuaire.evenements) {
    if (evenement.ville) noms.set(slugifier(evenement.ville), evenement.ville);
  }
  return [...noms.entries()]
    .map(([slug, nom]) => ({ slug, nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
