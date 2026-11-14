import { MARCHES } from "./marches.ts";
import { slugVille } from "./villes.ts";
import { coordonneesEvenement, coordonneesVille, distanceKm, villeLaPlusProche, type Point } from "./coordonnees.ts";
import type { EvenementPublic } from "./types.ts";

/**
 * Où se trouve le visiteur (ville approximative donnée par son réseau, ou
 * ville choisie par lui). Quand le réseau fournit latitude et longitude,
 * c'est le point exact qui fait foi pour le tri radial ; ville, région et
 * pays servent de repli et d'étiquette.
 */
export interface Position {
  ville: string | null;
  region: string | null;
  pays: string | null;
  lat?: number | null;
  lng?: number | null;
}

/** Normalise un pays écrit en toutes lettres ou en code (« Haïti », « HT », « United States »…). */
export function codePays(texte: string | null | undefined): string | null {
  if (!texte) return null;
  const t = texte.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (t === "ht" || t === "haiti") return "HT";
  if (/^(us|usa|united states|united states of america|etats-unis|etats unis)$/.test(t)) return "US";
  if (t === "ca" || t === "canada") return "CA";
  if (t === "fr" || t === "france") return "FR";
  return /^[a-z]{2}$/.test(t) ? t.toUpperCase() : null;
}

/**
 * Zones de proximité (une ville, ses voisines) : plus larges que les pages marchés du SEO, qui restent inchangées.
 * Les listes des quatre marchés viennent de marches.ts ; on y ajoute les villes voisines et les autres grandes zones de la diaspora.
 */
interface Zone {
  slug: string;
  pays: string;
  /** Codes d'État / de province / de région renvoyés par la géolocalisation (« NY », « QC »…). */
  regions: string[];
  villes: string[];
}

const villesDuMarche = (slug: string): string[] => MARCHES.find((m) => m.slug === slug)?.villes ?? [];

const ZONES: Zone[] = [
  {
    slug: "new-york",
    pays: "US",
    regions: ["NY", "NJ"],
    villes: [
      ...villesDuMarche("new-york"),
      "Newark", "Elizabeth", "Passaic", "Orange", "East Orange", "Irvington", "Jersey City", "Paterson", "Hackensack", "Union City",
      "Union", "Linden", "Plainfield", "Bayonne", "Hoboken", "Montclair", "Teaneck", "New Brunswick",
    ],
  },
  { slug: "florida", pays: "US", regions: ["FL"], villes: villesDuMarche("florida") },
  {
    slug: "massachusetts",
    pays: "US",
    regions: ["MA", "RI"],
    villes: [...villesDuMarche("massachusetts"), "Providence", "Pawtucket", "Cranston", "Worcester", "Brockton", "Everett", "Malden", "Cambridge", "Fall River", "New Bedford"],
  },
  {
    slug: "haiti",
    pays: "HT",
    regions: [],
    villes: [
      ...villesDuMarche("haiti"),
      "Aquin", "Bonaire", "Môle-Saint-Nicolas", "Jacmel", "Gonaïves", "Jérémie", "Hinche", "Léogâne", "Petit-Goâve", "Saint-Marc",
      "Les Cayes", "Port-de-Paix", "Ouanaminthe", "Fort-Liberté", "Cap-Haïtien", "Pétion-Ville", "Delmas", "Tabarre", "Carrefour",
    ],
  },
  { slug: "philadelphie", pays: "US", regions: ["PA", "DE"], villes: ["Philadelphia", "Camden", "Wilmington", "Chester", "Trenton"] },
  { slug: "washington", pays: "US", regions: ["DC", "MD", "VA"], villes: ["Washington", "Silver Spring", "Baltimore", "Alexandria", "Arlington", "Hyattsville", "Takoma Park", "Richmond"] },
  { slug: "atlanta", pays: "US", regions: ["GA"], villes: ["Atlanta", "Stone Mountain", "Decatur", "Marietta", "Lithonia", "Smyrna", "Duluth"] },
  { slug: "texas", pays: "US", regions: ["TX"], villes: ["Dallas", "Garland", "Houston", "Irving", "Plano", "Austin", "Arlington", "San Antonio"] },
  { slug: "montreal", pays: "CA", regions: ["QC"], villes: ["Montréal", "Laval", "Longueuil", "Brossard", "Saint-Léonard"] },
  { slug: "paris", pays: "FR", regions: [], villes: ["Paris", "Saint-Denis", "Créteil", "Bobigny", "Montreuil"] },
];

const ZONE_UNIQUE_DU_PAYS: Record<string, string> = { HT: "haiti", CA: "montreal", FR: "paris" };

function slugsDe(z: Zone): Set<string> {
  return new Set(z.villes.map((v) => slugVille(v)));
}
const SLUGS = new Map(ZONES.map((z) => [z.slug, slugsDe(z)]));

function zoneParVille(ville: string | null | undefined): Zone | undefined {
  if (!ville) return undefined;
  const s = slugVille(ville);
  return ZONES.find((z) => SLUGS.get(z.slug)?.has(s));
}

/** Zone d'un événement : par sa ville, par la ville de son lieu, ou par Haïti quand le pays du lieu le dit. */
export function zoneDe(e: EvenementPublic): string | null {
  const z = zoneParVille(e.ville) ?? zoneParVille(e.lieu?.ville);
  if (z) return z.slug;
  return codePays(e.lieu?.pays) === "HT" ? "haiti" : null;
}

export function paysEvenement(e: EvenementPublic): string | null {
  const direct = codePays(e.lieu?.pays);
  if (direct) return direct;
  const z = ZONES.find((x) => x.slug === zoneDe(e));
  return z?.pays ?? null;
}

/** Zone du visiteur : par sa ville, par son État / province, ou par son pays quand il n'a qu'une zone (Haïti, Canada, France). */
export function zoneDePosition(p: Position): string | null {
  if (p.pays === "HT") return "haiti";
  const parVille = zoneParVille(p.ville);
  if (parVille) return parVille.slug;
  if (p.region && p.pays) {
    const r = p.region.toUpperCase();
    const z = ZONES.find((x) => x.pays === p.pays && x.regions.includes(r));
    if (z) return z.slug;
  }
  return p.pays ? (ZONE_UNIQUE_DU_PAYS[p.pays] ?? null) : null;
}

/** 0 = sa ville, 1 = sa zone (Brooklyn → New York), 2 = son pays, 3 = ailleurs. */
export function rangProximite(e: EvenementPublic, p: Position): 0 | 1 | 2 | 3 {
  if (p.ville && e.ville && slugVille(e.ville) === slugVille(p.ville)) return 0;
  const zone = zoneDePosition(p);
  if (zone && zoneDe(e) === zone) return 1;
  if (p.pays) {
    const pays = paysEvenement(e);
    if (pays && pays === p.pays) return 2;
  }
  return 3;
}

/** Tri stable : à rang égal, l'ordre d'origine (par date) est conservé. */
export function trierParProximite<T extends EvenementPublic>(evenements: T[], p: Position | null): T[] {
  if (!p) return evenements;
  return evenements
    .map((e, i) => ({ e, i, r: rangProximite(e, p) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.e);
}

/** Nombre d'événements dans sa ville ou sa zone. */
export function nombreProches(evenements: EvenementPublic[], p: Position): number {
  return evenements.filter((e) => rangProximite(e, p) <= 1).length;
}

/** Position construite à partir d'une ville choisie dans la liste du site : son point est celui de la ville. */
export function positionDepuisVille(nom: string, evenements: EvenementPublic[]): Position {
  const s = slugVille(nom);
  const e = evenements.find((x) => x.ville && slugVille(x.ville) === s);
  const point = coordonneesVille(nom);
  return { ville: nom, region: null, pays: e ? paysEvenement(e) : null, lat: point?.lat ?? null, lng: point?.lng ?? null };
}

export function etiquettePosition(p: Position): string {
  if (p.ville) return p.ville;
  if (p.pays === "HT") return "Haiti";
  return p.region ?? p.pays ?? "you";
}

/**
 * Position par défaut quand le réseau ne dit rien d'utilisable (correctif
 * audit 13 nov. 2026) : le cœur du catalogue, Port-au-Prince / Pétion-Ville,
 * plutôt qu'un ordre qui laisserait croire que le site vise d'abord une
 * ville de la diaspora.
 */
const POINT_PETION_VILLE = coordonneesVille("Pétion-Ville");
export const POSITION_DEFAUT: Position = {
  ville: "Pétion-Ville",
  region: null,
  pays: "HT",
  lat: POINT_PETION_VILLE?.lat ?? null,
  lng: POINT_PETION_VILLE?.lng ?? null,
};

/** La ville fait-elle partie du catalogue (villes des événements ou villes d'une zone connue) ? */
export function villeDuCatalogue(nom: string, villesEvenements: string[]): boolean {
  const s = slugVille(nom);
  if (villesEvenements.some((v) => slugVille(v) === s)) return true;
  return Boolean(zoneParVille(nom));
}

/**
 * Position détectée rendue fiable : la géolocalisation par adresse IP est
 * approximative au niveau de la ville (elle a déjà annoncé « Clifton », une
 * ville sans aucun événement, comme point de référence). Une ville détectée
 * hors catalogue est donc retirée : la zone et le pays, eux, restent
 * fiables et suffisent au tri comme à l'étiquette affichée.
 * Quand le réseau donne le point exact (latitude/longitude), il est
 * conservé tel quel — c'est lui qui trie — et l'étiquette prend la ville
 * détectée si elle est au catalogue, sinon la ville du catalogue la plus
 * proche du point (à distance raisonnable), sinon la région ou le pays.
 */
export function positionDetecteeFiable(p: Position, villesEvenements: string[]): Position {
  const point = pointExact(p);
  if (p.ville && villeDuCatalogue(p.ville, villesEvenements)) return p;
  if (point) {
    const proche = villeLaPlusProche(point);
    if (proche && proche.distance <= 250) return { ...p, ville: proche.nom };
    return { ...p, ville: null };
  }
  if (p.ville) return { ...p, ville: null };
  return p;
}

/** Le point exact d'une position, quand latitude et longitude sont présentes et valides. */
export function pointExact(p: Position | null | undefined): Point | null {
  if (!p || typeof p.lat !== "number" || typeof p.lng !== "number") return null;
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null;
  if (Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) return null;
  return { lat: p.lat, lng: p.lng };
}

/** Ville-repère de chaque zone : le point où la zone est ancrée quand on ne connaît que la région ou le pays du visiteur. */
const ANCRES_ZONES: Record<string, string> = {
  "new-york": "New York",
  "florida": "Miami",
  "massachusetts": "Boston",
  "haiti": "Pétion-Ville",
  "philadelphie": "Philadelphia",
  "washington": "Washington",
  "atlanta": "Atlanta",
  "texas": "Dallas",
  "montreal": "Montréal",
  "paris": "Paris",
};

/**
 * Point de référence du tri radial, par ordre de précision décroissante :
 * le point exact du réseau, les coordonnées de la ville (détectée au
 * catalogue ou choisie), l'ancre de la zone déduite de la région ou du
 * pays, et — pour Haïti, pays à zone unique — Pétion-Ville. Null quand la
 * position ne dit rien d'exploitable (État américain hors zones connues,
 * par exemple) : l'ordre par date est alors conservé.
 */
export function pointDeReference(p: Position | null): Point | null {
  if (!p) return null;
  const exact = pointExact(p);
  if (exact) return exact;
  if (p.ville) {
    const c = coordonneesVille(p.ville);
    if (c) return c;
  }
  const zone = zoneDePosition(p);
  if (zone) {
    const ancre = ANCRES_ZONES[zone];
    if (ancre) return coordonneesVille(ancre);
  }
  return null;
}

/** Distance d'un événement au point du visiteur ; infinie quand sa ville n'est pas au catalogue (il reste alors en fin de liste, par date). */
export function distanceEvenement(e: EvenementPublic, point: Point): number {
  const c = coordonneesEvenement(e);
  return c ? distanceKm(point, c) : Number.POSITIVE_INFINITY;
}

/**
 * Tri radial (demande de Smith, 13 nov. 2026) : TOUS les événements sont
 * ordonnés par distance croissante depuis le point du visiteur — même
 * ville d'abord, puis proche, puis de plus en plus loin. Tri stable : à
 * distance égale (même ville), l'ordre d'origine, qui est l'ordre par
 * date, est conservé. Sans point exploitable, la liste ne bouge pas.
 */
export function trierParDistance<T extends EvenementPublic>(evenements: T[], point: Point | null): T[] {
  if (!point) return evenements;
  return evenements
    .map((e, i) => ({ e, i, d: distanceEvenement(e, point) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.e);
}

function decoderEntete(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function coordonneeEntete(v: string | null, borne: number): number | null {
  if (!v) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && Math.abs(n) <= borne ? n : null;
}

/**
 * Position détectée à partir des en-têtes de géolocalisation IP de Vercel
 * (niveau ville, et point exact quand latitude/longitude sont fournies).
 * Partagé par /api/lieu (qui l'expose au navigateur) et /api/annuaire
 * (qui trie côté serveur avec le même point).
 */
export function positionDepuisEntetes(h: Headers): Position {
  return {
    ville: decoderEntete(h.get("x-vercel-ip-city")),
    region: h.get("x-vercel-ip-country-region"),
    pays: h.get("x-vercel-ip-country"),
    lat: coordonneeEntete(h.get("x-vercel-ip-latitude"), 90),
    lng: coordonneeEntete(h.get("x-vercel-ip-longitude"), 180),
  };
}
