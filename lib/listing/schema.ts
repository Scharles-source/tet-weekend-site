export const STATUTS = ["brouillon", "publie", "retire"] as const;
export type Statut = (typeof STATUTS)[number];

export const LIBELLES_STATUT: Record<Statut, string> = {
  brouillon: "brouillon",
  publie: "publié",
  retire: "retiré",
};

export const CATEGORIES = [
  { slug: "bals", nom: "Bals" },
  { slug: "concerts", nom: "Concerts" },
  { slug: "soirees-kompa", nom: "Soirées kompa" },
  { slug: "festivals", nom: "Festivals" },
  { slug: "autre", nom: "Autre" },
] as const;

export type SlugCategorie = (typeof CATEGORIES)[number]["slug"];

export const TYPES_ARTISTE = ["DJ", "groupe", "chanteur"] as const;
export const TYPES_LIEU = ["bar", "club", "restaurant", "salle"] as const;
export const SOURCES = ["instagram", "facebook", "eventbrite", "manuel"] as const;
export const PLATEFORMES = ["instagram", "facebook", "eventbrite"] as const;
export const TYPES_COMPTE = ["lieu", "artiste", "promoteur"] as const;

export const FUSEAU_DEFAUT = "America/Port-au-Prince";

export const FUSEAUX = [
  { id: "America/Port-au-Prince", nom: "Haïti" },
  { id: "America/New_York", nom: "Miami, New York, Boston" },
  { id: "America/Toronto", nom: "Montréal" },
  { id: "Europe/Paris", nom: "Paris" },
] as const;

export function nomCategorie(slug: string | null | undefined): string | null {
  return CATEGORIES.find((c) => c.slug === slug)?.nom ?? null;
}
