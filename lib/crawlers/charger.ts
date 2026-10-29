import { clientServeur } from "@/lib/admin/supabase";
import type { VueCandidat, VueCollecte, VueSource } from "./vue";

export async function chargerCollecte(email: string | null): Promise<VueCollecte> {
  const supabase = await clientServeur();
  const [sources, candidats, lieux, comptes, produits] = await Promise.all([
    supabase.from("watch_accounts").select("id,plateforme,handle,url,display_name,type,city,country,actif,notes").order("created_at", { ascending: false }),
    supabase.from("event_candidates").select("id,platform,source_post_url,caption,title,starts_at,ends_at,timezone,venue_name,venue_id,city,artists_text,price_text,is_free,category,description,flyer_storage_path,status,confidence,duplicate_of_event_id,duplicate_of_candidate_id,rejection_reason,source_id").eq("status", "needs_review").order("created_at", { ascending: false }).limit(40),
    supabase.from("venues").select("id,nom,ville").order("nom"),
    supabase.from("watch_accounts").select("id,handle,display_name"),
    supabase.from("event_candidates").select("source_id").limit(1000),
  ]);
  const erreur = [sources.error, candidats.error, lieux.error, comptes.error, produits.error].find(Boolean);
  if (erreur) throw new Error(erreur.message);
  const parSource = new Map((comptes.data ?? []).map((c) => [c.id, c.display_name || c.handle || "Source"]));
  const nombre = new Map<string, number>();
  for (const candidat of produits.data ?? []) {
    if (!candidat.source_id) continue;
    nombre.set(candidat.source_id, (nombre.get(candidat.source_id) ?? 0) + 1);
  }
  const vuesSources: VueSource[] = (sources.data ?? []).map((s) => ({
    id: s.id,
    platform: s.plateforme,
    handle: s.handle,
    profileUrl: s.url,
    displayName: s.display_name,
    sourceType: s.type,
    city: s.city,
    country: s.country,
    active: s.actif,
    notes: s.notes,
    candidats: nombre.get(s.id) ?? 0,
  }));
  const vuesCandidats: VueCandidat[] = [];
  for (const c of candidats.data ?? []) {
    let flyerUrl: string | null = null;
    if (c.flyer_storage_path) {
      const signe = await supabase.storage.from("event-candidate-flyers").createSignedUrl(c.flyer_storage_path, 3600);
      flyerUrl = signe.data?.signedUrl ?? null;
    }
    vuesCandidats.push({
      id: c.id,
      platform: c.platform,
      sourcePostUrl: c.source_post_url,
      compte: c.source_id ? parSource.get(c.source_id) ?? null : null,
      caption: c.caption,
      title: c.title,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      timezone: c.timezone,
      venueName: c.venue_name,
      venueId: c.venue_id,
      city: c.city,
      artistsText: c.artists_text,
      priceText: c.price_text,
      isFree: c.is_free,
      category: c.category,
      description: c.description,
      flyerUrl,
      status: c.status,
      confidence: (c.confidence ?? {}) as VueCandidat["confidence"],
      duplicateOfEventId: c.duplicate_of_event_id,
      duplicateOfCandidateId: c.duplicate_of_candidate_id,
      rejectionReason: c.rejection_reason,
    });
  }
  return {
    email,
    aValider: vuesCandidats.length,
    sources: vuesSources,
    candidats: vuesCandidats,
    lieux: (lieux.data ?? []).map((l) => ({ id: l.id, nom: l.nom, ville: l.ville })),
  };
}
