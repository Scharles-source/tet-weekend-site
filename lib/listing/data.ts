import { altFlyer } from "./flyer.ts";
import { estTermine, formaterQuand } from "./dates.ts";
import { lieuDepuisDescription } from "./faits.ts";
import { rangsParVille } from "./preuve.ts";
import { signauxRarete } from "./rarete.ts";
import { nomVilleCanonique } from "./villes.ts";
import type { ArtistePublic, EvenementPublic, FlyerPublic, LieuPublic } from "./types.ts";

export class ConfigurationSupabaseManquante extends Error {
  constructor(manquantes: string[]) {
    super(
      `Missing Supabase configuration: ${manquantes.join(", ")}. ` +
        "Add these environment variables (Vercel or .env.local), then redeploy.",
    );
    this.name = "ConfigurationSupabaseManquante";
  }
}

export class ErreurDonnees extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurDonnees";
  }
}

const TAG = "evenements-public";

const COLONNES_LIEU = "id,slug,nom,ville,pays,adresse,type,description,instagram,facebook,site_web,updated_at";
const COLONNES_ARTISTE = "id,slug,nom,type,ville_base,bio,instagram,facebook,site_web,updated_at";

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const manquantes = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !cle && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter((v): v is string => Boolean(v));
  if (manquantes.length > 0) throw new ConfigurationSupabaseManquante(manquantes);
  return { url: (url as string).replace(/\/+$/, ""), cle: cle as string };
}

async function lire<T>(chemin: string): Promise<T> {
  const { url, cle } = configuration();
  let res: Response;
  try {
    res = await fetch(`${url}/rest/v1/${chemin}`, {
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, Accept: "application/json" },
      next: { revalidate: 300, tags: [TAG] },
    });
  } catch {
    throw new ErreurDonnees("The database could not be reached. Please try again in a moment.");
  }
  if (!res.ok) throw new ErreurDonnees(`The database answered ${res.status}. Please try again in a moment.`);
  return (await res.json()) as T;
}

function texte(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

/**
 * Affichage public des lieux géographiques (correctif audit 13 nov. 2026) :
 * la ville est ramenée à sa forme canonique (« Tampa, Floride » → « Tampa »,
 * « Boston, Massachusetts » → « Boston ») pour que les listes anglaises ne
 * mélangent plus États et pays en français et en anglais, et le pays des
 * lieux est affiché en anglais (« États-Unis » → « United States »).
 */
function villeAffichee(v: string | null): string | null {
  return v ? nomVilleCanonique(v) : null;
}

const PAYS_AFFICHES: Record<string, string> = {
  "haiti": "Haiti",
  "haïti": "Haiti",
  "etats-unis": "United States",
  "états-unis": "United States",
  "etats-unis d'amerique": "United States",
  "états-unis d'amérique": "United States",
};

function paysAffiche(v: string | null): string | null {
  if (!v) return null;
  return PAYS_AFFICHES[v.trim().toLowerCase()] ?? v;
}

function lieuDe(brut: Record<string, unknown> | null): LieuPublic | null {
  if (!brut || typeof brut.id !== "string") return null;
  return {
    id: brut.id,
    slug: String(brut.slug),
    nom: String(brut.nom),
    ville: villeAffichee(texte(brut.ville)),
    pays: paysAffiche(texte(brut.pays)),
    adresse: texte(brut.adresse),
    type: texte(brut.type),
    description: texte(brut.description),
    instagram: texte(brut.instagram),
    facebook: texte(brut.facebook),
    site_web: texte(brut.site_web),
    modifie_le: texte(brut.updated_at),
  };
}

function artisteDe(brut: Record<string, unknown>): ArtistePublic {
  return {
    id: String(brut.id),
    slug: String(brut.slug),
    nom: String(brut.nom),
    type: texte(brut.type),
    ville_base: texte(brut.ville_base),
    bio: texte(brut.bio),
    instagram: texte(brut.instagram),
    facebook: texte(brut.facebook),
    site_web: texte(brut.site_web),
    modifie_le: texte(brut.updated_at),
  };
}

interface EvenementBrut extends Record<string, unknown> {
  venues?: Record<string, unknown> | Record<string, unknown>[] | null;
  event_artists?: { artists?: Record<string, unknown> | null }[] | null;
}

function urlPostOrigine(): RegExp {
  return /https?:\/\/(?:www\.)?(?:instagram\.com\/(?:p|reel|tv)\/|facebook\.com\/(?:[\w.-]+\/)?(?:posts|videos|photos|reel)\/|facebook\.com\/(?:share|events)\/|fb\.watch\/)[^\s)]*/gi;
}

export function descriptionPublique(valeur: string | null): string | null {
  if (!valeur) return null;
  const sansParentheses = valeur.replace(/\(([^()]*)\)/g, (tout, dedans: string) => {
    const reste = dedans.replace(urlPostOrigine(), "").replace(/^(?:\s|[:.-]|affiche|source|post)+$/i, "").trim();
    return reste ? `(${reste})` : "";
  });
  const sans = sansParentheses
    .replace(urlPostOrigine(), "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .trim();
  return sans || null;
}

function evenementDe(brut: EvenementBrut): EvenementPublic {
  const venueBrut = Array.isArray(brut.venues) ? brut.venues[0] : brut.venues;
  const artistes = (brut.event_artists ?? [])
    .map((l) => l.artists)
    .filter((a): a is Record<string, unknown> => Boolean(a && typeof a.id === "string"))
    .map(artisteDe);
  const evenement: EvenementPublic = {
    id: String(brut.id),
    slug: String(brut.slug),
    titre: String(brut.titre),
    date_debut: String(brut.date_debut),
    date_fin: texte(brut.date_fin),
    ville: villeAffichee(texte(brut.ville) ?? lieuDe(venueBrut ?? null)?.ville ?? null),
    description: descriptionPublique(texte(brut.description)),
    prix: texte(brut.prix),
    source: texte(brut.source),
    source_url: null,
    source_account: texte(brut.source_account),
    categorie: texte(brut.categorie),
    fuseau: texte(brut.fuseau) ?? "America/Port-au-Prince",
    lieu: lieuDe(venueBrut ?? null),
    artistes,
    flyer: null,
    sponsored_from: null,
    sponsored_to: null,
    vues: null,
    modifie_le: texte(brut.updated_at),
  };
  const lieu = evenement.lieu?.nom ?? evenement.ville;
  evenement.flyer = flyerDe(brut, evenement.titre, lieu, formaterQuand(evenement.date_debut, evenement.fuseau));
  // Nom du lieu affichable même sans lieu lié : celui énoncé dans la description.
  evenement.lieu_nom = evenement.lieu?.nom ?? lieuDepuisDescription(evenement.description);
  evenement.badges_rarete = signauxRarete(evenement);
  return evenement;
}

function flyerDe(brut: Record<string, unknown>, titre: string, lieu: string | null, quand: string): FlyerPublic | null {
  const url = texte(brut.flyer_url);
  if (!url) return null;
  const mime = texte(brut.flyer_mime_type);
  return {
    publicUrl: url,
    cardUrl: texte(brut.flyer_card_url),
    width: typeof brut.flyer_width === "number" ? brut.flyer_width : null,
    height: typeof brut.flyer_height === "number" ? brut.flyer_height : null,
    mimeType: mime === "image/jpeg" || mime === "image/png" || mime === "image/webp" ? mime : null,
    alt: texte(brut.flyer_alt) ?? altFlyer(titre, lieu, quand),
    credit: texte(brut.flyer_credit),
  };
}

export interface Annuaire {
  lieux: LieuPublic[];
  artistes: ArtistePublic[];
  evenements: EvenementPublic[];
}

export async function lireAnnuaire(): Promise<Annuaire> {
  const selectEvents = encodeURIComponent(
    `id,slug,titre,date_debut,date_fin,ville,description,prix,source,source_account,categorie,fuseau,updated_at,flyer_url,flyer_card_url,flyer_width,flyer_height,flyer_mime_type,flyer_alt,flyer_credit,venues(${COLONNES_LIEU}),event_artists(artists(${COLONNES_ARTISTE}))`,
  );
  const [lieux, artistes, evenements, sponsors, ajouts, engagement] = await Promise.all([
    lire<Record<string, unknown>[]>(`venues?select=${COLONNES_LIEU}&order=nom.asc`),
    lire<Record<string, unknown>[]>(`artists?select=${COLONNES_ARTISTE}&order=nom.asc`),
    lire<EvenementBrut[]>(`events?select=${selectEvents}&order=date_debut.asc`),
    lireSponsors(),
    lireAjouts(),
    lireEngagement(),
  ]);
  const liste = evenements.map((brut) => {
      const evenement = evenementDe(brut);
      evenement.ajoute_le = ajouts.get(evenement.id) ?? null;
      const eng = engagement.get(evenement.id);
      if (eng) {
        evenement.vues = eng.vues;
        evenement.interets = eng.interets;
        evenement.vues_jour = eng.vues_jour;
      }
      const sponsor = sponsors.get(evenement.id);
      if (sponsor) {
        evenement.sponsored_from = sponsor.sponsored_from;
        evenement.sponsored_to = sponsor.sponsored_to;
      }
      return evenement;
  });
  const rangs = rangsParVille(liste.filter((e) => !estTermine(e)));
  for (const e of liste) e.rang_ville = rangs.get(e.id) ?? null;
  return {
    lieux: lieux.map((l) => lieuDe(l)).filter((l): l is LieuPublic => Boolean(l)),
    artistes: artistes.filter((a) => typeof a.id === "string").map(artisteDe),
    evenements: liste,
  };
}

export function evenementAllege(e: EvenementPublic): EvenementPublic {
  return {
    ...e,
    description: null,
    prix: null,
    source: null,
    source_url: null,
    source_account: null,
    lieu: e.lieu ? ({ nom: e.lieu.nom, ville: e.lieu.ville, slug: e.lieu.slug } as unknown as LieuPublic) : null,
    artistes: e.artistes.map((a) => ({ nom: a.nom, slug: a.slug }) as unknown as ArtistePublic),
  };
}

/** Lecture séparée : si les colonnes n'existent pas encore, la bannière reste en trending. */
async function lireSponsors(): Promise<Map<string, { sponsored_from: string | null; sponsored_to: string | null }>> {
  const { url, cle } = configuration();
  try {
    const res = await fetch(`${url}/rest/v1/events?select=id,sponsored_from,sponsored_to`, {
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, Accept: "application/json" },
      next: { revalidate: 300, tags: [TAG] },
    });
    if (!res.ok) return new Map();
    const rows = (await res.json()) as { id: string; sponsored_from: string | null; sponsored_to: string | null }[];
    return new Map(rows.map((row) => [row.id, { sponsored_from: row.sponsored_from, sponsored_to: row.sponsored_to }]));
  } catch {
    return new Map();
  }
}

/** Lecture séparée : si la colonne manque, on perd seulement le badge « Nouveau ». */
async function lireAjouts(): Promise<Map<string, string>> {
  const { url, cle } = configuration();
  try {
    const res = await fetch(`${url}/rest/v1/events?select=id,created_at`, {
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, Accept: "application/json" },
      next: { revalidate: 300, tags: [TAG] },
    });
    if (!res.ok) return new Map();
    const rows = (await res.json()) as { id: string; created_at: string | null }[];
    return new Map(rows.filter((r) => r.created_at).map((r) => [r.id, r.created_at as string]));
  } catch {
    return new Map();
  }
}

/** Lecture séparée : tant que les migrations d'engagement ne sont pas appliquées, rien n'est affiché. */
async function lireEngagement(): Promise<Map<string, { interets: number; vues: number; vues_jour: number | null }>> {
  const { url, cle } = configuration();
  const appeler = (fonction: string) =>
    fetch(`${url}/rest/v1/rpc/${fonction}`, {
      method: "POST",
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: "{}",
      next: { revalidate: 300, tags: [TAG] },
    });
  try {
    // Version avec les vues du jour ; sinon, la version d'origine.
    let res = await appeler("evenements_engagement_jour");
    if (!res.ok) res = await appeler("evenements_engagement");
    if (!res.ok) return new Map();
    const rows = (await res.json()) as { event_id: string; interets: number; vues: number; vues_jour?: number }[];
    return new Map(
      rows.map((r) => [r.event_id, { interets: Number(r.interets), vues: Number(r.vues), vues_jour: r.vues_jour === undefined ? null : Number(r.vues_jour) }]),
    );
  } catch {
    return new Map();
  }
}

export async function emailContact(): Promise<string> {
  try {
    const rows = await lire<{ valeur: string }[]>("settings?select=valeur&cle=eq.contact_email");
    const valeur = rows[0]?.valeur?.trim() ?? "";
    if (valeur.includes("@")) return valeur;
  } catch {
    /* repli sur l'adresse déjà utilisée pour l'admin du site */
  }
  return "smithcharles8484@gmail.com";
}

export async function chargerAnnuaire(): Promise<{ ok: true; annuaire: Annuaire } | { ok: false; erreur: unknown }> {
  try {
    return { ok: true, annuaire: await lireAnnuaire() };
  } catch (erreur) {
    return { ok: false, erreur };
  }
}

export function urlInstagram(handle: string | null): string | null {
  if (!handle) return null;
  const h = handle.trim().replace(/^@/, "");
  if (!h) return null;
  if (/^https?:\/\//i.test(h)) return h;
  return `https://instagram.com/${encodeURIComponent(h)}`;
}

export function urlFacebook(valeur: string | null): string | null {
  if (!valeur) return null;
  const h = valeur.trim().replace(/^@/, "");
  if (!h) return null;
  if (/^https?:\/\//i.test(h)) return h;
  return `https://facebook.com/${encodeURIComponent(h)}`;
}

export function urlSite(valeur: string | null): string | null {
  if (!valeur) return null;
  const h = valeur.trim();
  if (!h) return null;
  if (/^https?:\/\//i.test(h)) return h;
  return `https://${h}`;
}
