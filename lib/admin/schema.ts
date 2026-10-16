// Valeurs EXACTES de la contrainte SQL — jamais « publié » ni « retiré ».
export const STATUTS = ["brouillon", "publie", "retire"] as const;
export type StatutRestaurant = (typeof STATUTS)[number];

export const LIBELLES_STATUT: Record<StatutRestaurant, string> = {
  brouillon: "brouillon",
  publie: "publié",
  retire: "retiré",
};

/** Contrainte menu_items après 20261015000000 (catégories datées + carte). */
export const CATEGORIES_MENU = [
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
] as const;

export type CategorieMenu = (typeof CATEGORIES_MENU)[number];

export const DEVISES = ["HTG", "USD"] as const;
export type DeviseMenu = (typeof DEVISES)[number];

export const ZONES = ["Pétion-Ville", "Delmas"] as const;
