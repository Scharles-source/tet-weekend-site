import { MARCHES } from "./marches.ts";
import { slugVille } from "./villes.ts";
import type { EvenementPublic } from "./types.ts";

/** Où se trouve le visiteur (ville approximative donnée par son réseau, ou ville choisie par lui). */
export interface Position {
  ville: string | null;
  region: string | null;
  pays: string | null;
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

/** Position construite à partir d'une ville choisie dans la liste du site. */
export function positionDepuisVille(nom: string, evenements: EvenementPublic[]): Position {
  const s = slugVille(nom);
  const e = evenements.find((x) => x.ville && slugVille(x.ville) === s);
  return { ville: nom, region: null, pays: e ? paysEvenement(e) : null };
}

export function etiquettePosition(p: Position): string {
  if (p.ville) return p.ville;
  if (p.pays === "HT") return "Haiti";
  return p.region ?? p.pays ?? "you";
}
