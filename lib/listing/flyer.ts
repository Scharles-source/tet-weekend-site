import { saisieDepuisInstant } from "./dates.ts";
import type { MimeFlyer } from "./image.ts";

export type EventFlyer = {
  storagePath: string;
  publicUrl: string;
  cardUrl?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: MimeFlyer | null;
  alt: string;
  credit?: string | null;
  hiddenAt?: string | null;
};

/** Cadre 4:5 visuel. L'image nette est affichée en contain, jamais via ce fond. */
export function flyerFrameStyle(flyer: Pick<EventFlyer, "publicUrl" | "cardUrl">) {
  return {
    backgroundColor: "#0D0A14",
    aspectRatio: "4 / 3",
    ["--flyer-flou" as string]: `url(${flyer.cardUrl || flyer.publicUrl})`,
  } as const;
}

export function altFlyer(titre: string, lieu: string | null, quand: string): string {
  return `Flyer — ${titre}, ${lieu?.trim() || "lieu non indiqué"}, ${quand}`;
}

export function creditPublic(credit: string | null, compte: string | null, source: string | null): string | null {
  const valeur = credit?.trim() || compte?.trim() || (source && source !== "manuel" ? source : "");
  return valeur || null;
}

export function ratioTexte(width: number, height: number): string {
  const d = pgcd(width, height);
  return `${width / d}:${height / d}`;
}

export function resolutionFaible(width: number, height: number): boolean {
  return width < 800 || height < 800;
}

export function normaliserTitre(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normaliserUrl(url: string): string {
  const u = new URL(url.trim());
  u.hash = "";
  const host = u.hostname.toLowerCase();
  const chemin = u.pathname.replace(/\/+$/, "") || "/";
  const params = [...u.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  const recherche = params.length ? `?${new URLSearchParams(params).toString()}` : "";
  return `${u.protocol}//${host}${chemin}${recherche}`;
}

export function titresProches(a: string, b: string): boolean {
  const na = normaliserTitre(a);
  const nb = normaliserTitre(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 8 && nb.length >= 8 && (na.includes(nb) || nb.includes(na))) return true;
  const distance = levenshtein(na, nb);
  const max = Math.max(na.length, nb.length);
  return max <= 24 ? distance <= 2 : distance / max <= 0.15;
}

export function jourEvenement(date: string, fuseau: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) return date.slice(0, 10);
  return saisieDepuisInstant(date, fuseau).slice(0, 10);
}

export interface EvenementComparable {
  id: string;
  titre: string;
  slug: string;
  date_debut: string;
  fuseau: string;
  venue_id: string | null;
  ville: string | null;
  source_url: string | null;
}

export function doublonsProbables(
  candidat: Omit<EvenementComparable, "id" | "slug"> & { id?: string | null },
  existants: EvenementComparable[],
): EvenementComparable[] {
  let urlCandidat: string | null = null;
  if (candidat.source_url) {
    try {
      urlCandidat = normaliserUrl(candidat.source_url);
    } catch {
      urlCandidat = candidat.source_url.trim();
    }
  }
  return existants.filter((existant) => {
    if (candidat.id && existant.id === candidat.id) return false;
    if (urlCandidat && existant.source_url) {
      try {
        if (normaliserUrl(existant.source_url) === urlCandidat) return true;
      } catch {
        if (existant.source_url.trim() === urlCandidat) return true;
      }
    }
    const memeJour = jourEvenement(candidat.date_debut, candidat.fuseau) === jourEvenement(existant.date_debut, existant.fuseau);
    return memeJour && memeEndroit(candidat, existant) && titresProches(candidat.titre, existant.titre);
  });
}

export function patchMasquerFlyer(motif: string, maintenantIso: string): {
  flyer_hidden_at: string;
  flyer_hidden_reason: string;
  flyer_url: null;
  flyer_card_url: null;
} {
  const raison = motif.trim();
  if (!raison) throw new Error("Indiquez la raison du masquage.");
  return {
    flyer_hidden_at: maintenantIso,
    flyer_hidden_reason: raison,
    flyer_url: null,
    flyer_card_url: null,
  };
}

export function patchReafficherFlyer(storagePath: string | null, urlPublique: string | null): {
  flyer_hidden_at: null;
  flyer_hidden_reason: null;
  flyer_url: string;
} {
  if (!storagePath || !urlPublique) throw new Error("Aucun fichier de flyer à réafficher.");
  return {
    flyer_hidden_at: null,
    flyer_hidden_reason: null,
    flyer_url: urlPublique,
  };
}

function memeEndroit(
  a: { venue_id: string | null; ville: string | null },
  b: { venue_id: string | null; ville: string | null },
): boolean {
  if (a.venue_id && b.venue_id) return a.venue_id === b.venue_id;
  const va = normaliserTitre(a.ville ?? "");
  const vb = normaliserTitre(b.ville ?? "");
  return Boolean(va && vb && va === vb);
}

function pgcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function levenshtein(a: string, b: string): number {
  const ligne = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = ligne[0];
    ligne[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const haut = ligne[j];
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      ligne[j] = Math.min(ligne[j] + 1, ligne[j - 1] + 1, diag + cout);
      diag = haut;
    }
  }
  return ligne[b.length];
}
