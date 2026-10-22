import { altFlyer } from "./flyer.ts";
import { formaterQuand } from "./dates.ts";
import type { ArtistePublic, EvenementPublic, FlyerPublic, LieuPublic } from "./types.ts";

export class ConfigurationSupabaseManquante extends Error {
  constructor(manquantes: string[]) {
    super(
      `Configuration Supabase manquante : ${manquantes.join(", ")}. ` +
        "Ajoutez ces variables d'environnement (Vercel ou .env.local) puis redéployez.",
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

const COLONNES_LIEU = "id,slug,nom,ville,pays,adresse,type,description,instagram,facebook,site_web";
const COLONNES_ARTISTE = "id,slug,nom,type,ville_base,bio,instagram,facebook,site_web";

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
    throw new ErreurDonnees("Impossible de joindre la base de données. Réessayez dans un instant.");
  }
  if (!res.ok) throw new ErreurDonnees(`La base de données a répondu ${res.status}. Réessayez dans un instant.`);
  return (await res.json()) as T;
}

function texte(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function lieuDe(brut: Record<string, unknown> | null): LieuPublic | null {
  if (!brut || typeof brut.id !== "string") return null;
  return {
    id: brut.id,
    slug: String(brut.slug),
    nom: String(brut.nom),
    ville: texte(brut.ville),
    pays: texte(brut.pays),
    adresse: texte(brut.adresse),
    type: texte(brut.type),
    description: texte(brut.description),
    instagram: texte(brut.instagram),
    facebook: texte(brut.facebook),
    site_web: texte(brut.site_web),
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
  };
}

interface EvenementBrut extends Record<string, unknown> {
  venues?: Record<string, unknown> | Record<string, unknown>[] | null;
  event_artists?: { artists?: Record<string, unknown> | null }[] | null;
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
    ville: texte(brut.ville) ?? lieuDe(venueBrut ?? null)?.ville ?? null,
    description: texte(brut.description),
    prix: texte(brut.prix),
    source: texte(brut.source),
    source_url: texte(brut.source_url),
    source_account: texte(brut.source_account),
    categorie: texte(brut.categorie),
    fuseau: texte(brut.fuseau) ?? "America/Port-au-Prince",
    lieu: lieuDe(venueBrut ?? null),
    artistes,
    flyer: null,
  };
  const lieu = evenement.lieu?.nom ?? evenement.ville;
  evenement.flyer = flyerDe(brut, evenement.titre, lieu, formaterQuand(evenement.date_debut, evenement.fuseau));
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
    `id,slug,titre,date_debut,date_fin,ville,description,prix,source,source_url,source_account,categorie,fuseau,flyer_url,flyer_card_url,flyer_width,flyer_height,flyer_mime_type,flyer_alt,flyer_credit,venues(${COLONNES_LIEU}),event_artists(artists(${COLONNES_ARTISTE}))`,
  );
  const [lieux, artistes, evenements] = await Promise.all([
    lire<Record<string, unknown>[]>(`venues?select=${COLONNES_LIEU}&order=nom.asc`),
    lire<Record<string, unknown>[]>(`artists?select=${COLONNES_ARTISTE}&order=nom.asc`),
    lire<EvenementBrut[]>(`events?select=${selectEvents}&order=date_debut.asc`),
  ]);
  return {
    lieux: lieux.map((l) => lieuDe(l)).filter((l): l is LieuPublic => Boolean(l)),
    artistes: artistes.filter((a) => typeof a.id === "string").map(artisteDe),
    evenements: evenements.map(evenementDe),
  };
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
