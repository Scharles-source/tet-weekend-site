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
  source_account: string | null;
  spotted_at: string | null;
  categorie: string | null;
  fuseau: string;
  a_verifier: boolean;
  statut: string;
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
  const colonnes = "id,slug,titre,date_debut,date_fin,venue_id,ville,description,prix,source,source_url,source_account,spotted_at,categorie,fuseau,a_verifier,statut,flyer_storage_path,flyer_url,flyer_card_url,flyer_width,flyer_height,flyer_mime_type,flyer_alt,flyer_credit,flyer_hidden_at,flyer_hidden_reason,event_artists(artist_id)";
  const [lieux, artistes, comptes] = await Promise.all([
    supabase.from("venues").select("id,slug,nom,ville,pays,adresse,type,description,instagram,facebook,site_web,statut").order("nom"),
    supabase.from("artists").select("id,slug,nom,type,ville_base,bio,instagram,facebook,site_web,statut").order("nom"),
    supabase.from("watch_accounts").select("id,plateforme,handle,url,type,actif").order("created_at", { ascending: false }),
  ]);
  type ReponseEvents = { data: Record<string, unknown>[] | null; error: { message: string } | null };
  let evenements = await supabase
    .from("events")
    .select(`sponsored_from,sponsored_to,${colonnes}`)
    .order("date_debut", { ascending: false }) as unknown as ReponseEvents;
  if (evenements.error && /sponsored_from|sponsored_to/.test(evenements.error.message)) {
    evenements = await supabase.from("events").select(colonnes).order("date_debut", { ascending: false }) as unknown as ReponseEvents;
  }
  for (const res of [lieux, artistes, evenements, comptes]) {
    if (res.error) throw new Error(res.error.message);
  }
  return {
    lieux: (lieux.data ?? []) as LieuAdmin[],
    artistes: (artistes.data ?? []) as ArtisteAdmin[],
    evenements: ((evenements.data ?? []) as (Omit<EvenementAdmin, "artist_ids"> & { event_artists?: { artist_id: string }[] })[]).map(
      (e) => {
        const { event_artists, sponsored_from, sponsored_to, ...reste } = e;
        return {
          ...reste,
          sponsored_from: typeof sponsored_from === "string" ? sponsored_from : null,
          sponsored_to: typeof sponsored_to === "string" ? sponsored_to : null,
          artist_ids: (event_artists ?? []).map((l) => l.artist_id),
        };
      },
    ),
    comptes: (comptes.data ?? []) as CompteAdmin[],
  };
}
