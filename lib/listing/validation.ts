import { CATEGORIES, FUSEAU_DEFAUT, FUSEAUX, SOURCES, STATUTS, TYPES_ARTISTE, TYPES_COMPTE, TYPES_LIEU, PLATEFORMES, type Statut } from "./schema.ts";
import { instantDepuisSaisie } from "./dates.ts";
import { slugValide } from "./slug.ts";

export class SaisieInvalide extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaisieInvalide";
  }
}

export function statutValide(v: string): Statut {
  if ((STATUTS as readonly string[]).includes(v)) return v as Statut;
  throw new SaisieInvalide(`Statut invalide « ${v} ». Valeurs acceptées : brouillon, publie, retire (sans accent).`);
}

function vide(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

export function texteOuNull(v: unknown): string | null {
  if (vide(v)) return null;
  return String(v).trim();
}

function parmi<T extends string>(v: unknown, valeurs: readonly T[], champ: string): T | null {
  const t = texteOuNull(v);
  if (!t) return null;
  if (!(valeurs as readonly string[]).includes(t)) {
    throw new SaisieInvalide(`${champ} invalide. Valeurs : ${valeurs.join(", ")}.`);
  }
  return t as T;
}

function urlOuNull(v: unknown, champ: string): string | null {
  const t = texteOuNull(v);
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) throw new SaisieInvalide(`${champ} doit commencer par http:// ou https://.`);
  return t;
}

function slugObligatoire(v: unknown): string {
  const slug = texteOuNull(v);
  if (!slug || !slugValide(slug)) throw new SaisieInvalide("Slug invalide : minuscules, chiffres et tirets.");
  return slug;
}

function booleen(v: unknown): boolean {
  return v === true || v === "true" || v === "oui";
}

export interface LieuSaisi {
  nom: string;
  slug: string;
  ville: string | null;
  pays: string | null;
  adresse: string | null;
  type: string | null;
  description: string | null;
  instagram: string | null;
  facebook: string | null;
  site_web: string | null;
}

export function validerLieu(brut: Record<string, unknown>): LieuSaisi {
  const nom = texteOuNull(brut.nom);
  if (!nom) throw new SaisieInvalide("Le nom du lieu est obligatoire.");
  return {
    nom,
    slug: slugObligatoire(brut.slug),
    ville: texteOuNull(brut.ville),
    pays: texteOuNull(brut.pays),
    adresse: texteOuNull(brut.adresse),
    type: parmi(brut.type, TYPES_LIEU, "Type de lieu"),
    description: texteOuNull(brut.description),
    instagram: texteOuNull(brut.instagram),
    facebook: texteOuNull(brut.facebook),
    site_web: urlOuNull(brut.site_web, "Site web"),
  };
}

export interface ArtisteSaisi {
  nom: string;
  slug: string;
  type: string | null;
  ville_base: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  site_web: string | null;
}

export function validerArtiste(brut: Record<string, unknown>): ArtisteSaisi {
  const nom = texteOuNull(brut.nom);
  if (!nom) throw new SaisieInvalide("Le nom de l'artiste est obligatoire.");
  return {
    nom,
    slug: slugObligatoire(brut.slug),
    type: parmi(brut.type, TYPES_ARTISTE, "Type d'artiste"),
    ville_base: texteOuNull(brut.ville_base),
    bio: texteOuNull(brut.bio),
    instagram: texteOuNull(brut.instagram),
    facebook: texteOuNull(brut.facebook),
    site_web: urlOuNull(brut.site_web, "Site web"),
  };
}

export interface EvenementSaisi {
  titre: string;
  slug: string;
  date_debut: string;
  date_fin: string | null;
  venue_id: string | null;
  ville: string | null;
  description: string | null;
  prix: string | null;
  source: string | null;
  source_url: string | null;
  categorie: string | null;
  fuseau: string;
  a_verifier: boolean;
  artist_ids: string[];
}

export function validerEvenement(brut: Record<string, unknown>): EvenementSaisi {
  const titre = texteOuNull(brut.titre);
  if (!titre) throw new SaisieInvalide("Le titre est obligatoire.");
  const fuseau = texteOuNull(brut.fuseau) ?? FUSEAU_DEFAUT;
  if (!FUSEAUX.some((f) => f.id === fuseau)) throw new SaisieInvalide("Fuseau horaire inconnu.");
  const debutLocal = texteOuNull(brut.date_debut);
  if (!debutLocal) throw new SaisieInvalide("La date de début est obligatoire.");
  let date_debut: string;
  let date_fin: string | null;
  try {
    date_debut = instantDepuisSaisie(debutLocal, fuseau);
    const finLocal = texteOuNull(brut.date_fin);
    date_fin = finLocal ? instantDepuisSaisie(finLocal, fuseau) : null;
  } catch {
    throw new SaisieInvalide("Date invalide. Format attendu : AAAA-MM-JJTHH:mm.");
  }
  if (date_fin && date_fin < date_debut) throw new SaisieInvalide("La fin ne peut pas précéder le début.");
  const ids = Array.isArray(brut.artist_ids) ? brut.artist_ids.map((id) => String(id).trim()).filter(Boolean) : [];
  return {
    titre,
    slug: slugObligatoire(brut.slug),
    date_debut,
    date_fin,
    venue_id: texteOuNull(brut.venue_id),
    ville: texteOuNull(brut.ville),
    description: texteOuNull(brut.description),
    prix: texteOuNull(brut.prix),
    source: parmi(brut.source, SOURCES, "Source"),
    source_url: urlOuNull(brut.source_url, "Lien d'origine"),
    categorie: parmi(brut.categorie, CATEGORIES.map((c) => c.slug), "Catégorie"),
    fuseau,
    a_verifier: booleen(brut.a_verifier),
    artist_ids: [...new Set(ids)],
  };
}

export interface CompteSaisi {
  plateforme: string;
  handle: string | null;
  url: string | null;
  type: string;
  actif: boolean;
}

export function validerCompte(brut: Record<string, unknown>): CompteSaisi {
  const plateforme = parmi(brut.plateforme, PLATEFORMES, "Plateforme");
  const type = parmi(brut.type, TYPES_COMPTE, "Type de compte");
  if (!plateforme || !type) throw new SaisieInvalide("Plateforme et type sont obligatoires.");
  const handle = texteOuNull(brut.handle);
  const url = urlOuNull(brut.url, "URL");
  if (!handle && !url) throw new SaisieInvalide("Indiquez un handle ou une URL.");
  return { plateforme, handle, url, type, actif: brut.actif === undefined ? true : booleen(brut.actif) };
}
