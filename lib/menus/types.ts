export type Devise = "HTG" | "USD";

export type Zone = "Pétion-Ville" | "Delmas";

export const ZONES: Zone[] = ["Pétion-Ville", "Delmas"];

export type Categorie =
  | "Menu du jour"
  | "Menu de la semaine"
  | "Spécial"
  | "Carte"
  | "Entrées"
  | "Plats"
  | "Desserts"
  | "Boissons"
  | "Cocktails"
  | "Promotions";

/** Ordre d'affichage : menus datés d'abord, puis la carte, puis les promotions. */
export const CATEGORIES: Categorie[] = [
  "Menu du jour",
  "Menu de la semaine",
  "Spécial",
  "Carte",
  "Entrées",
  "Plats",
  "Desserts",
  "Boissons",
  "Cocktails",
  "Promotions",
];

/** Catégories pouvant constituer l'offre « en cours » mise en avant. */
export const CATEGORIES_DATEES: Categorie[] = ["Menu du jour", "Menu de la semaine", "Spécial"];

export interface Restaurant {
  id: string;
  slug: string;
  nom: string;
  zones: Zone[];
  quartier: string | null;
  adresse: string | null;
  point_repere: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsapp: string | null;
  telephone: string | null;
  instagram: string | null;
  horaires: string | null;
  jours_fermeture: string | null;
  heure_limite_cuisine: string | null;
  type_cuisine: string | null;
  ambiance: string | null;
  devise: Devise | null;
  taux_htg_usd: number | null;
  taxe_pct: number | null;
  taxe_incluse: boolean | null;
  service_pct: number | null;
  service_inclus: boolean | null;
  parking_garde: boolean | null;
  groupe_electrogene: boolean | null;
  climatisation: boolean | null;
  terrasse: boolean | null;
  modes_paiement: string[] | null;
  photo_carte_url: string | null;
  date_dernier_releve: string | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  categorie: Categorie;
  nom: string;
  description: string | null;
  prix: number;
  devise: Devise;
  disponible: boolean;
  ordre: number;
  source_url: string | null;
  /** AAAA-MM-JJ : date de la publication / du relevé du prix. */
  date_releve: string | null;
  valide_du: string | null;
  valide_au: string | null;
  a_verifier: boolean;
}

export interface Reglages {
  /** HTG pour 1 USD. Null si non renseigné (placeholder 0 en base). */
  tauxGlobal: number | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
}
