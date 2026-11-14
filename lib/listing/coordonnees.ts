import { slugVille } from "./villes.ts";
import type { EvenementPublic } from "./types.ts";

/**
 * Coordonnées des villes du catalogue (correctif « tri radial », 13 nov.
 * 2026, demandé par Smith) : le tri par proximité ne raisonne plus en
 * grandes zones (ville / zone / pays) mais en distance réelle, croissante,
 * depuis le point du visiteur — même ville d'abord, puis proche, puis de
 * plus en plus loin, sur tout le catalogue.
 *
 * Les lieux (venues) n'ont pas de coordonnées en base : un événement prend
 * donc les coordonnées de la ville de son lieu lié, sinon celles de sa
 * propre ville. Précision visée : le centre-ville — largement assez pour
 * ordonner des villes entre elles. Clés = slugs de villes (voir
 * villes.ts : toutes les variantes d'un nom partagent le même slug).
 */
export interface Point {
  lat: number;
  lng: number;
}

export interface VilleCoordonnees extends Point {
  nom: string;
}

const VILLES: Record<string, VilleCoordonnees> = {
  // — Haïti —
  "aquin": { nom: "Aquin", lat: 18.28, lng: -73.4 },
  "arcahaie": { nom: "Arcahaie", lat: 18.77, lng: -72.51 },
  "beauchamp": { nom: "Beauchamp", lat: 18.6, lng: -72.3 },
  "cabaret": { nom: "Cabaret", lat: 18.73, lng: -72.42 },
  "canape-vert": { nom: "Canapé-Vert", lat: 18.53, lng: -72.33 },
  "cap-haitien": { nom: "Cap-Haïtien", lat: 19.76, lng: -72.2 },
  "carrefour": { nom: "Carrefour", lat: 18.54, lng: -72.41 },
  "cite-soleil": { nom: "Cité Soleil", lat: 18.58, lng: -72.34 },
  "croix-des-bouquets": { nom: "Croix-des-Bouquets", lat: 18.58, lng: -72.23 },
  "croix-fer": { nom: "Croix-fer", lat: 19.0, lng: -71.97 },
  "delmas": { nom: "Delmas", lat: 18.56, lng: -72.3 },
  "ennery": { nom: "Ennery", lat: 19.48, lng: -72.48 },
  "fort-liberte": { nom: "Fort-Liberté", lat: 19.66, lng: -71.84 },
  "gonaives": { nom: "Gonaïves", lat: 19.45, lng: -72.69 },
  "grand-goave": { nom: "Grand-Goâve", lat: 18.43, lng: -72.77 },
  "hinche": { nom: "Hinche", lat: 19.14, lng: -72.02 },
  "jacmel": { nom: "Jacmel", lat: 18.23, lng: -72.53 },
  "jean-rabel": { nom: "Jean-Rabel", lat: 19.87, lng: -73.19 },
  "jeremie": { nom: "Jérémie", lat: 18.65, lng: -74.12 },
  "kenscoff": { nom: "Kenscoff", lat: 18.42, lng: -72.28 },
  "leogane": { nom: "Léogâne", lat: 18.51, lng: -72.63 },
  "les-cayes": { nom: "Les Cayes", lat: 18.19, lng: -73.75 },
  "limbe": { nom: "Limbé", lat: 19.71, lng: -72.4 },
  "mariani": { nom: "Mariani", lat: 18.53, lng: -72.45 },
  "milot": { nom: "Milot", lat: 19.6, lng: -72.21 },
  "mirebalais": { nom: "Mirebalais", lat: 18.83, lng: -72.1 },
  "mole-saint-nicolas": { nom: "Môle-Saint-Nicolas", lat: 19.8, lng: -73.38 },
  "okay": { nom: "Okay", lat: 18.19, lng: -73.75 },
  "ouanaminthe": { nom: "Ouanaminthe", lat: 19.55, lng: -71.72 },
  "petion-ville": { nom: "Pétion-Ville", lat: 18.512, lng: -72.286 },
  "petit-goave": { nom: "Petit-Goâve", lat: 18.43, lng: -72.86 },
  "port-au-prince": { nom: "Port-au-Prince", lat: 18.54, lng: -72.34 },
  "port-de-paix": { nom: "Port-de-Paix", lat: 19.94, lng: -72.83 },
  "puits-blain": { nom: "Puits-Blain", lat: 18.56, lng: -72.28 },
  "saint-louis-du-nord": { nom: "Saint-Louis-du-Nord", lat: 19.93, lng: -72.71 },
  "saint-marc": { nom: "Saint-Marc", lat: 19.11, lng: -72.7 },
  "tabarre": { nom: "Tabarre", lat: 18.58, lng: -72.27 },
  "trou-du-nord": { nom: "Trou-du-Nord", lat: 19.63, lng: -72.01 },
  "turgeau": { nom: "Turgeau", lat: 18.53, lng: -72.33 },
  // — New York et son aire —
  "albany": { nom: "Albany", lat: 42.65, lng: -73.76 },
  "bronx": { nom: "Bronx", lat: 40.84, lng: -73.86 },
  "brooklyn": { nom: "Brooklyn", lat: 40.678, lng: -73.944 },
  "buffalo": { nom: "Buffalo", lat: 42.89, lng: -78.88 },
  "elmont": { nom: "Elmont", lat: 40.7, lng: -73.7 },
  "elmsford": { nom: "Elmsford", lat: 41.05, lng: -73.82 },
  "far-rockaway": { nom: "Far Rockaway", lat: 40.6, lng: -73.76 },
  "floral-park": { nom: "Floral Park", lat: 40.72, lng: -73.7 },
  "franklin-square": { nom: "Franklin Square", lat: 40.71, lng: -73.68 },
  "hempstead": { nom: "Hempstead", lat: 40.71, lng: -73.62 },
  "jamaica": { nom: "Jamaica", lat: 40.7, lng: -73.8 },
  "long-island": { nom: "Long Island", lat: 40.75, lng: -73.6 },
  "long-island-city": { nom: "Long Island City", lat: 40.75, lng: -73.94 },
  "mount-vernon": { nom: "Mount Vernon", lat: 40.91, lng: -73.84 },
  "new-rochelle": { nom: "New Rochelle", lat: 40.91, lng: -73.78 },
  "new-york": { nom: "New York", lat: 40.713, lng: -74.006 },
  "queens": { nom: "Queens", lat: 40.73, lng: -73.82 },
  "rochester": { nom: "Rochester", lat: 43.16, lng: -77.61 },
  "south-ozone-park": { nom: "South Ozone Park", lat: 40.68, lng: -73.81 },
  "spring-valley": { nom: "Spring Valley", lat: 41.11, lng: -74.04 },
  "staten-island": { nom: "Staten Island", lat: 40.58, lng: -74.15 },
  "syracuse": { nom: "Syracuse", lat: 43.05, lng: -76.15 },
  "uniondale": { nom: "Uniondale", lat: 40.7, lng: -73.59 },
  "valley-stream": { nom: "Valley Stream", lat: 40.66, lng: -73.71 },
  "west-hempstead": { nom: "West Hempstead", lat: 40.7, lng: -73.65 },
  "westbury": { nom: "Westbury", lat: 40.76, lng: -73.59 },
  "white-plains": { nom: "White Plains", lat: 41.03, lng: -73.76 },
  "yonkers": { nom: "Yonkers", lat: 40.93, lng: -73.9 },
  // — New Jersey —
  "bayonne": { nom: "Bayonne", lat: 40.67, lng: -74.11 },
  "east-orange": { nom: "East Orange", lat: 40.77, lng: -74.2 },
  "elizabeth": { nom: "Elizabeth", lat: 40.66, lng: -74.21 },
  "hackensack": { nom: "Hackensack", lat: 40.89, lng: -74.04 },
  "hillside": { nom: "Hillside", lat: 40.7, lng: -74.23 },
  "hoboken": { nom: "Hoboken", lat: 40.74, lng: -74.03 },
  "irvington": { nom: "Irvington", lat: 40.72, lng: -74.23 },
  "jersey-city": { nom: "Jersey City", lat: 40.72, lng: -74.04 },
  "linden": { nom: "Linden", lat: 40.63, lng: -74.24 },
  "montclair": { nom: "Montclair", lat: 40.82, lng: -74.21 },
  "new-brunswick": { nom: "New Brunswick", lat: 40.49, lng: -74.45 },
  "newark": { nom: "Newark", lat: 40.74, lng: -74.17 },
  "orange": { nom: "Orange", lat: 40.77, lng: -74.23 },
  "passaic": { nom: "Passaic", lat: 40.857, lng: -74.129 },
  "paterson": { nom: "Paterson", lat: 40.92, lng: -74.17 },
  "plainfield": { nom: "Plainfield", lat: 40.62, lng: -74.41 },
  "teaneck": { nom: "Teaneck", lat: 40.9, lng: -74.01 },
  "trenton": { nom: "Trenton", lat: 40.22, lng: -74.76 },
  "union": { nom: "Union", lat: 40.7, lng: -74.26 },
  "union-city": { nom: "Union City", lat: 40.78, lng: -74.02 },
  // — Nouvelle-Angleterre —
  "avon": { nom: "Avon", lat: 42.13, lng: -71.04 },
  "boston": { nom: "Boston", lat: 42.36, lng: -71.06 },
  "braintree": { nom: "Braintree", lat: 42.21, lng: -71.0 },
  "bridgeport": { nom: "Bridgeport", lat: 41.18, lng: -73.19 },
  "brockton": { nom: "Brockton", lat: 42.08, lng: -71.02 },
  "cambridge": { nom: "Cambridge", lat: 42.37, lng: -71.11 },
  "chelsea": { nom: "Chelsea", lat: 42.39, lng: -71.03 },
  "cranston": { nom: "Cranston", lat: 41.78, lng: -71.44 },
  "dorchester": { nom: "Dorchester", lat: 42.3, lng: -71.07 },
  "everett": { nom: "Everett", lat: 42.41, lng: -71.05 },
  "fall-river": { nom: "Fall River", lat: 41.7, lng: -71.16 },
  "framingham": { nom: "Framingham", lat: 42.28, lng: -71.42 },
  "hyde-park": { nom: "Hyde Park", lat: 42.26, lng: -71.12 },
  "lawrence": { nom: "Lawrence", lat: 42.71, lng: -71.16 },
  "lowell": { nom: "Lowell", lat: 42.63, lng: -71.32 },
  "lynn": { nom: "Lynn", lat: 42.47, lng: -70.95 },
  "malden": { nom: "Malden", lat: 42.43, lng: -71.07 },
  "mattapan": { nom: "Mattapan", lat: 42.28, lng: -71.09 },
  "new-bedford": { nom: "New Bedford", lat: 41.64, lng: -70.93 },
  "new-london": { nom: "New London", lat: 41.36, lng: -72.1 },
  "norwood": { nom: "Norwood", lat: 42.19, lng: -71.2 },
  "pawtucket": { nom: "Pawtucket", lat: 41.88, lng: -71.38 },
  "providence": { nom: "Providence", lat: 41.82, lng: -71.41 },
  "quincy": { nom: "Quincy", lat: 42.25, lng: -71.0 },
  "randolph": { nom: "Randolph", lat: 42.16, lng: -71.04 },
  "revere": { nom: "Revere", lat: 42.41, lng: -71.01 },
  "roslindale": { nom: "Roslindale", lat: 42.28, lng: -71.12 },
  "somerville": { nom: "Somerville", lat: 42.39, lng: -71.1 },
  "stoughton": { nom: "Stoughton", lat: 42.13, lng: -71.1 },
  "taunton": { nom: "Taunton", lat: 41.9, lng: -71.09 },
  "worcester": { nom: "Worcester", lat: 42.26, lng: -71.8 },
  // — Philadelphie et Washington —
  "alexandria": { nom: "Alexandria", lat: 38.8, lng: -77.05 },
  "arlington": { nom: "Arlington", lat: 38.88, lng: -77.09 },
  "baltimore": { nom: "Baltimore", lat: 39.29, lng: -76.61 },
  "camden": { nom: "Camden", lat: 39.93, lng: -75.12 },
  "chester": { nom: "Chester", lat: 39.85, lng: -75.36 },
  "hyattsville": { nom: "Hyattsville", lat: 38.97, lng: -76.95 },
  "philadelphia": { nom: "Philadelphia", lat: 39.95, lng: -75.16 },
  "richmond": { nom: "Richmond", lat: 37.54, lng: -77.44 },
  "silver-spring": { nom: "Silver Spring", lat: 39.0, lng: -77.03 },
  "takoma-park": { nom: "Takoma Park", lat: 38.98, lng: -77.0 },
  "washington": { nom: "Washington", lat: 38.9, lng: -77.04 },
  "wilmington": { nom: "Wilmington", lat: 39.74, lng: -75.55 },
  // — Atlanta —
  "atlanta": { nom: "Atlanta", lat: 33.75, lng: -84.39 },
  "decatur": { nom: "Decatur", lat: 33.77, lng: -84.3 },
  "duluth": { nom: "Duluth", lat: 34.0, lng: -84.14 },
  "lithonia": { nom: "Lithonia", lat: 33.71, lng: -84.11 },
  "marietta": { nom: "Marietta", lat: 33.95, lng: -84.55 },
  "smyrna": { nom: "Smyrna", lat: 33.88, lng: -84.51 },
  "stone-mountain": { nom: "Stone Mountain", lat: 33.81, lng: -84.15 },
  // — Floride —
  "altamonte-springs": { nom: "Altamonte Springs", lat: 28.66, lng: -81.37 },
  "aventura": { nom: "Aventura", lat: 25.96, lng: -80.14 },
  "boca-raton": { nom: "Boca Raton", lat: 26.37, lng: -80.07 },
  "boynton-beach": { nom: "Boynton Beach", lat: 26.53, lng: -80.09 },
  "clearwater": { nom: "Clearwater", lat: 27.97, lng: -82.8 },
  "coconut-creek": { nom: "Coconut Creek", lat: 26.25, lng: -80.18 },
  "coral-gables": { nom: "Coral Gables", lat: 25.72, lng: -80.27 },
  "davie": { nom: "Davie", lat: 26.08, lng: -80.23 },
  "daytona-beach": { nom: "Daytona Beach", lat: 29.21, lng: -81.02 },
  "deerfield-beach": { nom: "Deerfield Beach", lat: 26.32, lng: -80.1 },
  "delray-beach": { nom: "Delray Beach", lat: 26.46, lng: -80.07 },
  "doral": { nom: "Doral", lat: 25.82, lng: -80.35 },
  "fort-lauderdale": { nom: "Fort Lauderdale", lat: 26.12, lng: -80.14 },
  "fort-myers": { nom: "Fort Myers", lat: 26.64, lng: -81.87 },
  "gainesville": { nom: "Gainesville", lat: 29.65, lng: -82.32 },
  "hialeah": { nom: "Hialeah", lat: 25.86, lng: -80.28 },
  "hollywood": { nom: "Hollywood", lat: 26.01, lng: -80.15 },
  "jacksonville": { nom: "Jacksonville", lat: 30.33, lng: -81.66 },
  "kissimmee": { nom: "Kissimmee", lat: 28.29, lng: -81.41 },
  "lake-worth": { nom: "Lake Worth", lat: 26.62, lng: -80.06 },
  "lakeland": { nom: "Lakeland", lat: 28.04, lng: -81.95 },
  "lauderhill": { nom: "Lauderhill", lat: 26.14, lng: -80.21 },
  "margate": { nom: "Margate", lat: 26.25, lng: -80.21 },
  "miami": { nom: "Miami", lat: 25.79, lng: -80.22 },
  "miami-gardens": { nom: "Miami Gardens", lat: 25.94, lng: -80.25 },
  "miramar": { nom: "Miramar", lat: 25.98, lng: -80.28 },
  "naples": { nom: "Naples", lat: 26.14, lng: -81.79 },
  "north-miami": { nom: "North Miami", lat: 25.9, lng: -80.19 },
  "orlando": { nom: "Orlando", lat: 28.54, lng: -81.38 },
  "pembroke-pines": { nom: "Pembroke Pines", lat: 26.01, lng: -80.34 },
  "plantation": { nom: "Plantation", lat: 26.13, lng: -80.23 },
  "pompano-beach": { nom: "Pompano Beach", lat: 26.24, lng: -80.12 },
  "riviera-beach": { nom: "Riviera Beach", lat: 26.78, lng: -80.06 },
  "sarasota": { nom: "Sarasota", lat: 27.34, lng: -82.53 },
  "seffner": { nom: "Seffner", lat: 27.98, lng: -82.28 },
  "st-petersburg": { nom: "St. Petersburg", lat: 27.77, lng: -82.64 },
  "sunrise": { nom: "Sunrise", lat: 26.17, lng: -80.26 },
  "tamarac": { nom: "Tamarac", lat: 26.21, lng: -80.25 },
  "tampa": { nom: "Tampa", lat: 27.95, lng: -82.46 },
  "west-palm-beach": { nom: "West Palm Beach", lat: 26.71, lng: -80.06 },
  "winter-park": { nom: "Winter Park", lat: 28.6, lng: -81.34 },
  // — Texas, Midwest, Sud, Ouest —
  "austin": { nom: "Austin", lat: 30.27, lng: -97.74 },
  "cincinnati": { nom: "Cincinnati", lat: 39.1, lng: -84.51 },
  "dallas": { nom: "Dallas", lat: 32.78, lng: -96.8 },
  "garland": { nom: "Garland", lat: 32.91, lng: -96.64 },
  "houston": { nom: "Houston", lat: 29.76, lng: -95.37 },
  "irving": { nom: "Irving", lat: 32.81, lng: -96.95 },
  "la-nouvelle-orleans": { nom: "La Nouvelle-Orléans", lat: 29.95, lng: -90.07 },
  "oakland": { nom: "Oakland", lat: 37.8, lng: -122.27 },
  "plano": { nom: "Plano", lat: 33.02, lng: -96.7 },
  "san-antonio": { nom: "San Antonio", lat: 29.42, lng: -98.49 },
  // — Canada —
  "brossard": { nom: "Brossard", lat: 45.46, lng: -73.47 },
  "gatineau": { nom: "Gatineau", lat: 45.48, lng: -75.7 },
  "laval": { nom: "Laval", lat: 45.56, lng: -73.72 },
  "longueuil": { nom: "Longueuil", lat: 45.53, lng: -73.52 },
  "montreal": { nom: "Montréal", lat: 45.5, lng: -73.57 },
  "saint-leonard": { nom: "Saint-Léonard", lat: 45.59, lng: -73.59 },
  // — France et reste du monde —
  "baie-mahault": { nom: "Baie-Mahault", lat: 16.27, lng: -61.59 },
  "bobigny": { nom: "Bobigny", lat: 48.91, lng: 2.44 },
  "bonaire": { nom: "Bonaire", lat: 12.2, lng: -68.27 },
  "budapest": { nom: "Budapest", lat: 47.5, lng: 19.04 },
  "creteil": { nom: "Créteil", lat: 48.79, lng: 2.46 },
  "le-blanc-mesnil": { nom: "Le Blanc-Mesnil", lat: 48.94, lng: 2.46 },
  "mitry-mory": { nom: "Mitry-Mory", lat: 48.97, lng: 2.6 },
  "montreuil": { nom: "Montreuil", lat: 48.86, lng: 2.44 },
  "paris": { nom: "Paris", lat: 48.86, lng: 2.35 },
  "rotterdam": { nom: "Rotterdam", lat: 51.92, lng: 4.48 },
  "saint-denis": { nom: "Saint-Denis", lat: 48.94, lng: 2.36 },
  "shanghai": { nom: "Shanghai", lat: 31.23, lng: 121.47 },
};

/** Coordonnées d'une ville du catalogue, par n'importe quelle variante de son nom (« Miami, Floride », « Miami »…). */
export function coordonneesVille(nom: string | null | undefined): Point | null {
  if (!nom) return null;
  const entree = VILLES[slugVille(nom)];
  return entree ? { lat: entree.lat, lng: entree.lng } : null;
}

/** Distance à vol d'oiseau, en kilomètres (formule de haversine). */
export function distanceKm(a: Point, b: Point): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ville du catalogue la plus proche d'un point (sert à nommer l'endroit détecté quand sa ville n'est pas au catalogue). */
export function villeLaPlusProche(point: Point): (VilleCoordonnees & { distance: number }) | null {
  let meilleure: (VilleCoordonnees & { distance: number }) | null = null;
  for (const entree of Object.values(VILLES)) {
    const d = distanceKm(point, entree);
    if (!meilleure || d < meilleure.distance) meilleure = { ...entree, distance: d };
  }
  return meilleure;
}

/**
 * Coordonnées d'un événement : celles de la ville de son lieu lié si elle
 * est au catalogue, sinon celles de sa propre ville. Les lieux n'ont pas de
 * coordonnées propres en base ; le jour où ils en auront, c'est ici qu'elles
 * primeront sur celles de la ville.
 */
export function coordonneesEvenement(e: EvenementPublic): Point | null {
  return coordonneesVille(e.lieu?.ville) ?? coordonneesVille(e.ville);
}
