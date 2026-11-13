import { slugVille } from "./villes.ts";
import type { EvenementPublic } from "./types.ts";

/**
 * Pages marchés en anglais (bascule du site en anglais, 13 nov. 2026) :
 * les quatre zones que Smith a choisies — Haïti, l'État de New York, la
 * Floride et le Massachusetts (Boston en tête). Ce sont les requêtes que
 * la diaspora tape réellement dans Google (« haitian events in New York »,
 * « haitian events this weekend »…). L'appartenance d'un événement à un
 * marché se décide sur sa ville canonique (voir villes.ts) ; les villes
 * hors liste restent sur leurs pages villes ordinaires.
 */
export interface Marche {
  slug: string;
  nom: string;
  titre: string;
  description: string;
  intro: string;
  villes: string[];
}

export const MARCHES: Marche[] = [
  {
    slug: "new-york",
    nom: "New York",
    titre: "Haitian Events in New York — This Weekend & Coming Up",
    description:
      "Haitian events in New York: kompa parties, bals, concerts and festivals in Brooklyn, Queens, Long Island and across New York State — this weekend, tonight and coming up.",
    intro:
      "Kompa parties, bals, concerts and festivals across New York State — Brooklyn, Queens, Long Island, Spring Valley and beyond. Every Haitian event announced for the New York area, in one place: what's on this weekend, tonight and in the weeks ahead.",
    villes: [
      "New York", "Brooklyn", "Queens", "Bronx", "Staten Island", "Long Island City", "Franklin Square",
      "Floral Park", "Spring Valley", "Albany", "Syracuse", "Rochester", "Buffalo", "Yonkers",
      "Mount Vernon", "Hempstead", "Westbury", "Elmsford", "White Plains", "New Rochelle", "Jamaica",
      "Far Rockaway", "Valley Stream", "Uniondale", "West Hempstead", "Elmont", "Long Island",
    ],
  },
  {
    slug: "florida",
    nom: "Florida",
    titre: "Haitian Events in Florida — This Weekend & Coming Up",
    description:
      "Haitian events in Florida: kompa parties, bals, concerts and festivals in Miami, Fort Lauderdale, Pompano Beach, Orlando and Tampa — this weekend, tonight and coming up.",
    intro:
      "Kompa parties, bals, concerts and festivals across Florida — Miami, North Miami, Fort Lauderdale, Pompano Beach, Orlando, Tampa and more. Every Haitian event announced in the Sunshine State, in one place: what's on this weekend, tonight and in the weeks ahead.",
    villes: [
      "Miami", "North Miami", "Miami Gardens", "Fort Lauderdale", "Hollywood", "Pompano Beach",
      "Orlando", "Tampa", "Jacksonville", "West Palm Beach", "Tamarac", "Miramar", "Lauderhill",
      "Sunrise", "Plantation", "Davie", "Boca Raton", "Delray Beach", "Boynton Beach",
      "Deerfield Beach", "Kissimmee", "Naples", "Fort Myers", "Hialeah", "Aventura", "Coral Gables",
      "Doral", "Lake Worth", "Riviera Beach", "Margate", "Coconut Creek", "Pembroke Pines",
      "Winter Park", "Altamonte Springs", "Clearwater", "St. Petersburg", "Sarasota", "Lakeland",
      "Daytona Beach", "Gainesville",
    ],
  },
  {
    slug: "massachusetts",
    nom: "Massachusetts",
    titre: "Haitian Events in Massachusetts — Boston & Beyond",
    description:
      "Haitian events in Massachusetts: kompa parties, bals and concerts in Boston, Brockton, Everett, Cambridge and Randolph — this weekend, tonight and coming up.",
    intro:
      "Kompa parties, bals and concerts in Massachusetts — Boston first, plus Brockton, Everett, Cambridge, Malden and Randolph. Every Haitian event announced in the Boston area and across the state, in one place: what's on this weekend, tonight and in the weeks ahead.",
    villes: [
      "Boston", "Brockton", "Cambridge", "Everett", "Malden", "Randolph", "Lynn", "Worcester",
      "Somerville", "Revere", "Chelsea", "Quincy", "Stoughton", "Mattapan", "Dorchester",
      "Hyde Park", "Roslindale", "Avon", "Braintree", "Fall River", "Lowell", "Lawrence",
      "Framingham", "Norwood", "Taunton",
    ],
  },
  {
    slug: "haiti",
    nom: "Haiti",
    titre: "Haitian Events in Haiti — Things to Do This Weekend",
    description:
      "Haitian events in Haiti: bals, concerts, kompa parties and festivals in Port-au-Prince, Pétion-Ville, Cap-Haïtien and across the country — this weekend and coming up.",
    intro:
      "Bals, concerts, kompa parties and festivals across Haiti — Port-au-Prince, Pétion-Ville, Delmas, Cap-Haïtien and the provinces. What's happening in Haiti this weekend and in the weeks ahead, gathered from the flyers organizers publish.",
    villes: [
      "Port-au-Prince", "Pétion-Ville", "Delmas", "Carrefour", "Tabarre", "Cap-Haïtien", "Jacmel",
      "Les Cayes", "Okay", "Gonaïves", "Jérémie", "Saint-Marc", "Hinche", "Port-de-Paix",
      "Fort-Liberté", "Léogâne", "Kenscoff", "Croix-des-Bouquets", "Aquin", "Môle-Saint-Nicolas",
      "Trou-du-Nord", "Jean-Rabel", "Mirebalais", "Petit-Goâve", "Grand-Goâve", "Ouanaminthe",
      "Milot", "Limbé", "Saint-Louis-du-Nord", "Arcahaie", "Cabaret", "Cité Soleil", "Beauchamp",
      "Croix-fer", "Mariani", "Puits-Blain", "Turgeau", "Canapé-Vert",
    ],
  },
];

export function marcheParSlug(slug: string): Marche | undefined {
  return MARCHES.find((m) => m.slug === slug);
}

export function evenementDuMarche(e: EvenementPublic, marche: Marche): boolean {
  const slugs = new Set(marche.villes.map((v) => slugVille(v)));
  if (e.ville && slugs.has(slugVille(e.ville))) return true;
  if (e.lieu?.ville && slugs.has(slugVille(e.lieu.ville))) return true;
  // Haïti : le pays du lieu fait foi quand la ville n'est pas dans la liste.
  if (marche.slug === "haiti" && e.lieu?.pays && /ha[iï]ti/i.test(e.lieu.pays)) return true;
  return false;
}
