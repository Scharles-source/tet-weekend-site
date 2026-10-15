// Pipeline de collecte des menus : bots → OCR → extraction proposée → relecture humaine → export.
// Aucune étape n'écrit dans Supabase : l'import reste manuel (scripts/import-menus.mjs).

export const CATEGORIES_EXTRACTION = ["Entrées", "Plats", "Desserts", "Boissons", "Cocktails", "Autre"] as const;
export type CategorieExtraction = (typeof CATEGORIES_EXTRACTION)[number];

/** Catégories acceptées par scripts/import-menus.mjs (« Autre » doit être reclassée à la relecture). */
export const CATEGORIES_IMPORT = [
  "Menu du jour", "Menu de la semaine", "Spécial", "Carte",
  "Entrées", "Plats", "Desserts", "Boissons", "Cocktails",
  "Promotions",
] as const;
export const CATEGORIES_IMPORT_DATEES = ["Menu du jour", "Menu de la semaine", "Spécial", "Promotions"];

export type Devise = "HTG" | "USD";

export const ETATS = ["pas_commence", "image_recue", "extraction_proposee", "verifie", "publie"] as const;
export type EtatCollecte = (typeof ETATS)[number];

export const LIBELLES_ETAT: Record<EtatCollecte, string> = {
  pas_commence: "pas commencé",
  image_recue: "image reçue",
  extraction_proposee: "extraction proposée",
  verifie: "vérifié",
  publie: "publié",
};

export type StatutLigne = "à vérifier" | "vérifié" | "rejeté";

export type TypeSource = "site-page" | "site-pdf" | "site-image" | "maps-photo" | "maps-lien" | "manuel";

export interface Source {
  id: string;
  type: TypeSource;
  /** Chemin relatif au dossier du restaurant (absent pour un simple lien). */
  fichier: string | null;
  url: string | null;
  recupere_le: string;
  /** Date de la photo (AAAA-MM-JJ, au 1er du mois si seul le mois est connu). */
  date_photo: string | null;
  date_photo_texte: string | null;
  a_reverifier: boolean;
  ocr_fait_le: string | null;
  note: string | null;
}

export interface Ligne {
  id: string;
  source: string;
  nom: string;
  description: string | null;
  prix: number | null;
  devise: Devise | null;
  categorie: string;
  /** Intitulé de section lu sur la carte (ex. « Pizza »), pour aider la relecture. */
  section: string | null;
  disponible: boolean;
  /** 0 à 1. Sert à prioriser la relecture, jamais à décider. */
  confiance: number;
  texte_brut: string;
  avertissements: string[];
  date_releve: string | null;
  valide_du: string | null;
  valide_au: string | null;
  source_url: string | null;
  statut: StatutLigne;
  verifie_le: string | null;
}

export interface Collecte {
  slug: string;
  nom: string;
  etat: EtatCollecte;
  /** Date (AAAA-MM-JJ) à laquelle chaque état a été atteint. */
  historique: Partial<Record<EtatCollecte, string>>;
  site_maps: string | null;
  categories_maps: string[];
  collecte_manuelle: string[];
  sources: Source[];
  lignes: Ligne[];
}

export interface RestaurantSource {
  slug: string;
  nom: string;
  instagram: string | null;
  recherche_maps: string;
  site: { url: string; origine: string } | null;
  site_note: string | null;
  pistes: string[];
}

/** Ligne de texte lue (OCR, page web ou PDF). confiance : 0–100, null si texte natif. */
export interface LigneTexte {
  texte: string;
  confiance: number | null;
}
