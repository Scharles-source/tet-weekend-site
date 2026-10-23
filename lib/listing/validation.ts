import { CATEGORIES, FUSEAU_DEFAUT, FUSEAUX, SOURCES, STATUTS, TYPES_ARTISTE, TYPES_COMPTE, TYPES_LIEU, PLATEFORMES, type Statut } from "./schema.ts";
import { formaterQuand, instantDepuisSaisie } from "./dates.ts";
import { SaisieInvalide } from "./erreurs.ts";
import { altFlyer } from "./flyer.ts";
import { MIMES_FLYER } from "./image.ts";
import { slugValide } from "./slug.ts";

export { SaisieInvalide };

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
  source_account: string | null;
  spotted_at: string | null;
  categorie: string | null;
  fuseau: string;
  a_verifier: boolean;
  statut: "brouillon" | "publie";
  artist_ids: string[];
  flyer_storage_path: string | null;
  flyer_url: string | null;
  flyer_card_url: string | null;
  flyer_width: number | null;
  flyer_height: number | null;
  flyer_mime_type: string | null;
  flyer_alt: string | null;
  flyer_credit: string | null;
  flyer_hidden_at: string | null;
  flyer_hidden_reason: string | null;
  sponsored_from: string | null;
  sponsored_to: string | null;
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
  const publication = texteOuNull(brut.statut) ?? "brouillon";
  if (publication !== "brouillon" && publication !== "publie") {
    throw new SaisieInvalide("La publication est brouillon ou publie.");
  }
  const flyer_url = urlOuNull(brut.flyer_url, "Flyer");
  const flyer_storage_path = cheminFlyer(brut.flyer_storage_path);
  const ville = texteOuNull(brut.ville);
  const spotted = texteOuNull(brut.spotted_at);
  let spotted_at: string | null = null;
  if (spotted) {
    try {
      spotted_at = instantDepuisSaisie(spotted, fuseau);
    } catch {
      throw new SaisieInvalide("Date de repérage invalide.");
    }
  }
  const sponsorDebut = texteOuNull(brut.sponsored_from);
  const sponsorFin = texteOuNull(brut.sponsored_to);
  let sponsored_from: string | null = null;
  let sponsored_to: string | null = null;
  try {
    sponsored_from = sponsorDebut ? instantDepuisSaisie(sponsorDebut, fuseau) : null;
    sponsored_to = sponsorFin ? instantDepuisSaisie(sponsorFin, fuseau) : null;
  } catch {
    throw new SaisieInvalide("Période de sponsoring invalide.");
  }
  if ((sponsored_from && !sponsored_to) || (!sponsored_from && sponsored_to)) {
    throw new SaisieInvalide("Indiquez le début et la fin du sponsoring.");
  }
  if (sponsored_from && sponsored_to && sponsored_to < sponsored_from) {
    throw new SaisieInvalide("La fin du sponsoring ne peut pas précéder le début.");
  }
  return {
    titre,
    slug: slugObligatoire(brut.slug),
    date_debut,
    date_fin,
    venue_id: texteOuNull(brut.venue_id),
    ville,
    description: texteOuNull(brut.description),
    prix: texteOuNull(brut.prix),
    source: parmi(brut.source, SOURCES, "Source"),
    source_url: urlOuNull(brut.source_url, "Lien d'origine"),
    source_account: texteOuNull(brut.source_account),
    spotted_at,
    categorie: parmi(brut.categorie, CATEGORIES.map((c) => c.slug), "Catégorie"),
    fuseau,
    a_verifier: booleen(brut.a_verifier),
    statut: publication,
    artist_ids: [...new Set(ids)],
    flyer_storage_path,
    flyer_url,
    flyer_card_url: urlOuNull(brut.flyer_card_url, "Flyer carte"),
    flyer_width: entierPositif(brut.flyer_width, "Largeur du flyer"),
    flyer_height: entierPositif(brut.flyer_height, "Hauteur du flyer"),
    flyer_mime_type: parmi(brut.flyer_mime_type, MIMES_FLYER, "Type du flyer"),
    flyer_alt: texteOuNull(brut.flyer_alt) ?? (flyer_url ? altFlyer(titre, ville, formaterQuand(date_debut, fuseau)) : null),
    flyer_credit: texteOuNull(brut.flyer_credit),
    flyer_hidden_at: instantOuNull(brut.flyer_hidden_at),
    flyer_hidden_reason: texteOuNull(brut.flyer_hidden_reason),
    sponsored_from,
    sponsored_to,
  };
}

function entierPositif(v: unknown, champ: string): number | null {
  if (vide(v)) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0 || n > 20000) throw new SaisieInvalide(`${champ} invalide.`);
  return n;
}

function cheminFlyer(v: unknown): string | null {
  const t = texteOuNull(v);
  if (!t) return null;
  if (t.includes("..") || t.startsWith("/") || !/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(t)) {
    throw new SaisieInvalide("Chemin de flyer invalide.");
  }
  return t;
}

function instantOuNull(v: unknown): string | null {
  const t = texteOuNull(v);
  if (!t) return null;
  const date = new Date(t);
  if (Number.isNaN(date.getTime())) throw new SaisieInvalide("Date de masquage invalide.");
  return date.toISOString();
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
