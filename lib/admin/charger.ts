import { clientServeur } from "./supabase.ts";

export interface LieuAdmin {
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
  statut: string;
}

export interface ArtisteAdmin {
  id: string;
  slug: string;
  nom: string;
  type: string | null;
  ville_base: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  site_web: string | null;
  statut: string;
}

export interface EvenementAdmin {
  id: string;
  slug: string;
  titre: string;
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
  statut: string;
  artist_ids: string[];
}

export interface CompteAdmin {
  id: string;
  plateforme: string;
  handle: string | null;
  url: string | null;
  type: string;
  actif: boolean;
}

export async function chargerListing(): Promise<{
  lieux: LieuAdmin[];
  artistes: ArtisteAdmin[];
  evenements: EvenementAdmin[];
  comptes: CompteAdmin[];
}> {
  const supabase = await clientServeur();
  const [lieux, artistes, evenements, comptes] = await Promise.all([
    supabase.from("venues").select("id,slug,nom,ville,pays,adresse,type,description,instagram,facebook,site_web,statut").order("nom"),
    supabase.from("artists").select("id,slug,nom,type,ville_base,bio,instagram,facebook,site_web,statut").order("nom"),
    supabase
      .from("events")
      .select("id,slug,titre,date_debut,date_fin,venue_id,ville,description,prix,source,source_url,categorie,fuseau,a_verifier,statut,event_artists(artist_id)")
      .order("date_debut", { ascending: false }),
    supabase.from("watch_accounts").select("id,plateforme,handle,url,type,actif").order("created_at", { ascending: false }),
  ]);
  for (const res of [lieux, artistes, evenements, comptes]) {
    if (res.error) throw new Error(res.error.message);
  }
  return {
    lieux: (lieux.data ?? []) as LieuAdmin[],
    artistes: (artistes.data ?? []) as ArtisteAdmin[],
    evenements: ((evenements.data ?? []) as (Omit<EvenementAdmin, "artist_ids"> & { event_artists?: { artist_id: string }[] })[]).map(
      (e) => {
        const { event_artists, ...reste } = e;
        return { ...reste, artist_ids: (event_artists ?? []).map((l) => l.artist_id) };
      },
    ),
    comptes: (comptes.data ?? []) as CompteAdmin[],
  };
}
