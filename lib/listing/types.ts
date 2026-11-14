export interface LieuPublic {
  id: string;
  slug: string;
  nom: string;
  ville: string | null;
  pays: string | null;
  adresse: string | null;
  type: string | null;
  description: string | null;
  instagram: string | null;
  facebook: string | null;
  site_web: string | null;
  /** Dernière modification en base (sert au lastmod du sitemap). */
  modifie_le?: string | null;
}

export interface ArtistePublic {
  id: string;
  slug: string;
  nom: string;
  type: string | null;
  ville_base: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  site_web: string | null;
  /** Dernière modification en base (sert au lastmod du sitemap). */
  modifie_le?: string | null;
}

export interface FlyerPublic {
  publicUrl: string;
  cardUrl: string | null;
  width: number | null;
  height: number | null;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | null;
  alt: string;
  credit: string | null;
}

export interface EvenementPublic {
  id: string;
  slug: string;
  titre: string;
  date_debut: string;
  date_fin: string | null;
  ville: string | null;
  description: string | null;
  prix: string | null;
  source: string | null;
  source_url: string | null;
  source_account: string | null;
  categorie: string | null;
  fuseau: string;
  lieu: LieuPublic | null;
  /** Nom du lieu affichable : lieu lié, sinon le nom énoncé dans la description (« Lieu : … »). Calculé au chargement. */
  lieu_nom?: string | null;
  artistes: ArtistePublic[];
  flyer: FlyerPublic | null;
  sponsored_from: string | null;
  sponsored_to: string | null;
  vues: number | null;
  /** Date d'ajout sur le site (sert au badge « Nouveau »). Absente si la base ne la fournit pas. */
  ajoute_le?: string | null;
  /** Dernière modification en base (sert au lastmod du sitemap). */
  modifie_le?: string | null;
  /** Nombre de « I'm in » (null tant que la base ne le fournit pas). */
  interets?: number | null;
  /** Vues d'aujourd'hui (une par visiteur) ; absent tant que la migration « engagement social » n'est pas appliquée. */
  vues_jour?: number | null;
  /** 1 quand l'événement est le plus vu de sa ville (calculé, jamais saisi). */
  rang_ville?: number | null;
  /** Badges de rareté pré-calculés (la liste allégée de l'API ne transporte pas la description qui sert à les déduire). */
  badges_rarete?: string[] | null;
}
