import { createHash } from "node:crypto";
import { instantDepuisSaisie } from "../listing/dates.ts";
import { titresProches, jourEvenement, normaliserUrl, normaliserTitre } from "../listing/flyer.ts";

export type NiveauConfiance = "high" | "medium" | "low" | "missing";

export interface ParsedDateTime {
  startsAt: string | null;
  endsAt: string | null;
  dateTexte: string | null;
  heureManquante: boolean;
}

export interface PrixLu {
  priceText?: string;
  isFree?: boolean;
}

export interface VenueMatch {
  id: string;
  nom: string;
  ville: string | null;
}

export interface ArtistMatch {
  id: string;
  nom: string;
}

export interface DuplicateMatch {
  id: string;
  kind: "url" | "media" | "texte";
  table: "event" | "candidate";
}

const MOIS: Record<string, number> = {
  janvier: 1, janvye: 1, january: 1, jan: 1,
  fevrier: 2, fevriye: 2, february: 2, feb: 2,
  mars: 3, mas: 3, march: 3, mar: 3,
  avril: 4, april: 4, apr: 4,
  mai: 5, me: 5, may: 5,
  juin: 6, jen: 6, june: 6, jun: 6,
  juillet: 7, jiye: 7, july: 7, jul: 7,
  aout: 8, out: 8, august: 8, aug: 8,
  septembre: 9, septanm: 9, september: 9, sep: 9, sept: 9,
  octobre: 10, oktob: 10, october: 10, oct: 10,
  novembre: 11, novanm: 11, november: 11, nov: 11,
  decembre: 12, desanm: 12, december: 12, dec: 12,
};

const MOIS_PATTERN = Object.keys(MOIS).sort((a, b) => b.length - a.length).join("|");

export function empreinteSha256(octets: Uint8Array): string {
  return createHash("sha256").update(octets).digest("hex");
}

export function normalizePostUrl(url: string): string {
  try {
    return normaliserUrl(url).replace(/^(https?:\/\/)www\./, "$1");
  } catch {
    return "";
  }
}

export function normalizeEventKey(input: {
  title?: string | null;
  startsAt?: string | null;
  venue?: string | null;
  city?: string | null;
}): string {
  return [input.title, input.startsAt?.slice(0, 10), input.venue, input.city]
    .map((v) => normaliserTitre(v ?? ""))
    .filter(Boolean)
    .join("|");
}

function sansAccent(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function heureEcrite(texte: string): { h: number; m: number } | null {
  const brut = sansAccent(texte);
  if (/\bminuit\b/.test(brut)) return { h: 0, m: 0 };
  if (/\bmidi\b/.test(brut)) return { h: 12, m: 0 };
  const pm = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(brut) ?? /\b(\d{1,2})\s*h\s*(\d{2})?\s*(am|pm)\b/.exec(brut);
  if (pm) {
    let h = Number(pm[1]);
    const m = Number(pm[2] ?? "0");
    const mer = pm[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    if (h > 23 || m > 59) return null;
    return { h, m };
  }
  const h24 = /\b(\d{1,2})\s*h\s*(\d{2})?\b/.exec(brut);
  if (h24) {
    const h = Number(h24[1]);
    const m = Number(h24[2] ?? "0");
    if (h > 23 || m > 59) return null;
    return { h, m };
  }
  const clock = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(brut);
  if (clock) return { h: Number(clock[1]), m: Number(clock[2]) };
  return null;
}

interface JourLu {
  year: number;
  month: number;
  day: number;
  endDay?: number;
  endMonth?: number;
}

function jourEcrit(texte: string): JourLu | null {
  const brut = sansAccent(texte);
  const plage = new RegExp(`\\b(\\d{1,2})\\s+au\\s+(\\d{1,2})\\s+(${MOIS_PATTERN})\\s+(\\d{4})\\b`).exec(brut);
  if (plage) {
    const month = MOIS[plage[3]];
    const day = Number(plage[1]);
    const endDay = Number(plage[2]);
    if (month && day >= 1 && day <= 31 && endDay >= 1 && endDay <= 31) {
      return { year: Number(plage[4]), month, day, endDay, endMonth: month };
    }
  }
  const fr = new RegExp(`\\b(\\d{1,2})\\s+(${MOIS_PATTERN})\\s+(\\d{4})\\b`).exec(brut);
  if (fr) {
    const month = MOIS[fr[2]];
    const day = Number(fr[1]);
    if (month && day >= 1 && day <= 31) return { year: Number(fr[3]), month, day };
  }
  const en = new RegExp(`\\b(${MOIS_PATTERN})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`).exec(brut);
  if (en) {
    const month = MOIS[en[1]];
    const day = Number(en[2]);
    if (month && day >= 1 && day <= 31) return { year: Number(en[3]), month, day };
  }
  const num = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/.exec(brut);
  if (num) {
    const day = Number(num[1]);
    const month = Number(num[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { year: Number(num[3]), month, day };
    }
  }
  return null;
}

/** Année absente : null. L'heure absente ne devient pas minuit. */
export function parseEventDateTime(text: string, _referenceDate: Date, timezone: string): ParsedDateTime | null {
  const jour = jourEcrit(text);
  if (!jour) return null;
  const heure = heureEcrite(text);
  const dateTexte = `${jour.year}-${pad(jour.month)}-${pad(jour.day)}`;
  if (!heure) {
    return { startsAt: null, endsAt: null, dateTexte, heureManquante: true };
  }
  const local = `${dateTexte}T${pad(heure.h)}:${pad(heure.m)}`;
  const startsAt = instantDepuisSaisie(local, timezone);
  let endsAt: string | null = null;
  if (jour.endDay && jour.endMonth) {
    const fin = `${jour.year}-${pad(jour.endMonth)}-${pad(jour.endDay)}T${pad(heure.h)}:${pad(heure.m)}`;
    endsAt = instantDepuisSaisie(fin, timezone);
  }
  return { startsAt, endsAt, dateTexte, heureManquante: false };
}

export function extractPrice(text: string): PrixLu {
  const brut = text.normalize("NFD").replace(/\p{M}/gu, "");
  if (/\bgratuit|\bentree libre\b|\bfree\b/i.test(brut)) return { priceText: "Gratuit", isFree: true };
  const montant = /(\d[\d\s.,]{0,12})\s*(\$|usd|us\b|htg|euros?|€)/i.exec(brut);
  if (montant) return { priceText: `${montant[1].trim()} ${montant[2]}`.replace(/\s+/g, " ") };
  const entree = /entr[ée]e\s+([^.\n]{1,40})/i.exec(text);
  if (entree && /\d/.test(entree[1])) return { priceText: entree[1].trim() };
  return {};
}

export function matchVenue(
  text: string,
  venues: { id: string; nom: string; ville: string | null }[],
): VenueMatch | null {
  const hay = normaliserTitre(text);
  if (!hay) return null;
  const trouves = venues.filter((v) => {
    const nom = normaliserTitre(v.nom);
    return nom.length >= 4 && (hay.includes(nom) || nom.includes(hay));
  });
  if (trouves.length !== 1) return null;
  return trouves[0];
}

export function matchArtists(
  text: string,
  artists: { id: string; nom: string }[],
): ArtistMatch[] {
  const hay = normaliserTitre(text);
  if (!hay) return [];
  return artists.filter((a) => {
    const nom = normaliserTitre(a.nom);
    return nom.length >= 3 && hay.includes(nom);
  });
}

export function detectDuplicate(
  candidate: {
    title?: string | null;
    startsAt?: string | null;
    venue?: string | null;
    city?: string | null;
    url?: string | null;
    mediaSha256?: string | null;
    timezone?: string | null;
  },
  existing: {
    id: string;
    title?: string | null;
    startsAt?: string | null;
    venue?: string | null;
    city?: string | null;
    sourceUrl?: string | null;
    mediaSha256?: string | null;
    table: "event" | "candidate";
  }[],
): DuplicateMatch | null {
  const url = candidate.url ? normalizePostUrl(candidate.url) : "";
  const fuseau = candidate.timezone ?? "America/Port-au-Prince";
  for (const e of existing) {
    if (url && e.sourceUrl && normalizePostUrl(e.sourceUrl) === url) {
      return { id: e.id, kind: "url", table: e.table };
    }
    if (candidate.mediaSha256 && e.mediaSha256 && candidate.mediaSha256 === e.mediaSha256) {
      return { id: e.id, kind: "media", table: e.table };
    }
    if (!candidate.title || !e.title || !candidate.startsAt || !e.startsAt) continue;
    if (!titresProches(candidate.title, e.title)) continue;
    const memeJour = jourEvenement(candidate.startsAt, fuseau) === jourEvenement(e.startsAt, fuseau);
    const memeLieu =
      (candidate.venue && e.venue && normaliserTitre(candidate.venue) === normaliserTitre(e.venue)) ||
      (!candidate.venue && candidate.city && e.city && normaliserTitre(candidate.city) === normaliserTitre(e.city));
    if (memeJour && memeLieu) return { id: e.id, kind: "texte", table: e.table };
  }
  return null;
}

export function titreDepuisLegende(caption: string | null): { title: string | null; niveau: NiveauConfiance } {
  if (!caption?.trim()) return { title: null, niveau: "missing" };
  const ligne = caption.trim().split("\n")[0]?.trim() ?? "";
  if (ligne.length >= 3 && ligne.length <= 80) return { title: ligne, niveau: "medium" };
  return { title: null, niveau: "missing" };
}

const CLES_INTERDITES = /token|cookie|password|authorization|secret|api[_-]?key|service_role|bearer/i;

export function nettoyerContexte(contexte: Record<string, unknown> | undefined): Record<string, unknown> {
  const sortie: Record<string, unknown> = {};
  if (!contexte) return sortie;
  for (const [cle, valeur] of Object.entries(contexte).slice(0, 20)) {
    if (CLES_INTERDITES.test(cle)) continue;
    if (typeof valeur === "string") {
      if (CLES_INTERDITES.test(valeur)) continue;
      sortie[cle] = valeur.slice(0, 500);
    } else if (typeof valeur === "number" || typeof valeur === "boolean" || valeur == null) {
      sortie[cle] = valeur;
    }
  }
  return sortie;
}

export function payloadNettoye(brut: Record<string, unknown>): Record<string, unknown> {
  const propre = nettoyerContexte(brut);
  const json = JSON.stringify(propre);
  if (json.length <= 4000) return propre;
  return { coupe: true };
}
