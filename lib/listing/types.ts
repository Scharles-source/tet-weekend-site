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
  artistes: ArtistePublic[];
  flyer: FlyerPublic | null;
  sponsored_from: string | null;
  sponsored_to: string | null;
  vues: number | null;
}
