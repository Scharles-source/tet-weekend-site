// Affichage admin : les 24 restos + test. Zones reprises de l'amorce SQL.

import { RESTAURANTS } from "../collecte/sources.ts";

const ZONES: Record<string, string[]> = {
  "portofino-ristorante-italiano": ["Pétion-Ville"],
  magdoos: ["Pétion-Ville"],
  "cafe36-resto-hotel-la-lorraine": ["Pétion-Ville"],
  "kay-bilolo": ["Delmas"],
  "karibe-hotel-la-brasserie": ["Pétion-Ville"],
  "kinam-hotel-restaurant": ["Pétion-Ville"],
  "pistachio-cafe-bistro": ["Pétion-Ville"],
  papaye: ["Pétion-Ville"],
  "la-reserve": ["Pétion-Ville"],
  "smoke-house-barbecue": ["Delmas"],
  "pizza-garden": ["Pétion-Ville"],
  "coin-des-artistes-vivano": ["Pétion-Ville"],
  "rootz-food-art-music": ["Pétion-Ville"],
  "gecko-lounge-bar": ["Delmas"],
  "timeout-sports-bar-grill": ["Delmas"],
  "le-poulet-d-or": ["Pétion-Ville"],
  "green-bar": ["Delmas"],
  "jojo-restaurant-evergreen": ["Pétion-Ville"],
  "point-chaud": ["Pétion-Ville", "Delmas"],
  "flame-lounge-bar-grill": ["Delmas"],
  "kokoriko-breakfast-lunch": ["Delmas"],
  "5-coins": ["Delmas", "Pétion-Ville"],
  "kokoye-bar-grill": ["Delmas", "Pétion-Ville"],
  "mr-frosty": ["Delmas"],
  "test-collecte-menu": [],
};

export interface RestaurantAdmin {
  slug: string;
  nom: string;
  zones: string[];
}

export const RESTAURANTS_ADMIN: RestaurantAdmin[] = [
  ...RESTAURANTS.map((r) => ({
    slug: r.slug,
    nom: r.nom,
    zones: ZONES[r.slug] ?? [],
  })),
  {
    slug: "test-collecte-menu",
    nom: "Test Collecte Menu (fictif)",
    zones: [],
  },
];

export const SLUGS_CONNUS = new Set(RESTAURANTS_ADMIN.map((r) => r.slug));

export function restaurantAdmin(slug: string): RestaurantAdmin | undefined {
  return RESTAURANTS_ADMIN.find((r) => r.slug === slug);
}
