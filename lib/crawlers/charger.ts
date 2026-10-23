import { clientServeur } from "@/lib/admin/supabase";
import { runnerEnLigne } from "./controle";
import type { VueCandidat, VueCollecte, VueJob, VueSource } from "./vue";

export async function chargerCollecte(email: string | null): Promise<VueCollecte> {
  const supabase = await clientServeur();
  const [reglages, runner, sources, jobs, logs, candidats, lieux, comptes, produits] = await Promise.all([
    supabase.from("crawler_settings").select("global_enabled,scheduler_enabled").eq("id", true).single(),
    supabase.from("crawler_runner").select("heartbeat_at").eq("id", 1).maybeSingle(),
    supabase.from("watch_accounts").select("id,plateforme,handle,url,display_name,type,city,country,actif,scan_frequency_minutes,max_posts_per_scan,last_scanned_at,last_success_at,last_status,last_error,notes").order("created_at", { ascending: false }),
    supabase.from("crawl_jobs").select("id,job_type,source_id,input_url,status,created_at,started_at,finished_at,counts,error_message,config").order("created_at", { ascending: false }).limit(80),
    supabase.from("crawl_job_logs").select("id,job_id,level,message,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("event_candidates").select("id,platform,source_post_url,caption,title,starts_at,ends_at,timezone,venue_name,venue_id,city,artists_text,price_text,is_free,category,description,flyer_storage_path,status,confidence,duplicate_of_event_id,duplicate_of_candidate_id,rejection_reason,source_id").eq("status", "needs_review").order("created_at", { ascending: false }).limit(40),
    supabase.from("venues").select("id,nom,ville").order("nom"),
    supabase.from("watch_accounts").select("id,handle,display_name"),
    supabase.from("event_candidates").select("source_id").limit(1000),
  ]);
  const erreur = [reglages.error, runner.error, sources.error, jobs.error, logs.error, candidats.error, lieux.error, comptes.error, produits.error].find(Boolean);
  if (erreur) throw new Error(erreur.message);
  const parSource = new Map((comptes.data ?? []).map((c) => [c.id, c.display_name || c.handle || "Source"]));
  const nombre = new Map<string, number>();
  for (const candidat of produits.data ?? []) {
    if (!candidat.source_id) continue;
    nombre.set(candidat.source_id, (nombre.get(candidat.source_id) ?? 0) + 1);
  }
  const journaux = logs.data ?? [];
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
    scanFrequencyMinutes: s.scan_frequency_minutes,
    maxPostsPerScan: s.max_posts_per_scan,
    lastScannedAt: s.last_scanned_at,
    lastSuccessAt: s.last_success_at,
    lastStatus: s.last_status,
    lastError: s.last_error,
    notes: s.notes,
    candidats: nombre.get(s.id) ?? 0,
  }));
  const vuesJobs: VueJob[] = (jobs.data ?? []).map((j) => ({
    id: j.id,
    jobType: j.job_type,
    sourceId: j.source_id,
    sourceNom: j.source_id ? parSource.get(j.source_id) ?? null : null,
    inputUrl: j.input_url,
    status: j.status,
    createdAt: j.created_at,
    startedAt: j.started_at,
    finishedAt: j.finished_at,
    counts: (j.counts ?? {}) as VueJob["counts"],
    errorMessage: j.error_message,
    config: (j.config ?? {}) as Record<string, unknown>,
    logs: journaux.filter((l) => l.job_id === j.id).map((l) => ({ id: String(l.id), level: l.level, message: l.message, createdAt: l.created_at })).reverse(),
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
  const liste = jobs.data ?? [];
  return {
    email,
    globalEnabled: reglages.data?.global_enabled !== false,
    schedulerEnabled: reglages.data?.scheduler_enabled === true,
    runnerEnLigne: runnerEnLigne(runner.data?.heartbeat_at ?? null, Date.now()),
    heartbeatAt: runner.data?.heartbeat_at ?? null,
    comptes: {
      queued: liste.filter((j) => j.status === "queued").length,
      running: liste.filter((j) => j.status === "running").length,
      blocked: liste.filter((j) => j.status === "blocked").length,
      failed: liste.filter((j) => j.status === "failed").length,
    },
    aValider: vuesCandidats.length,
    sources: vuesSources,
    jobs: vuesJobs,
    candidats: vuesCandidats,
    lieux: (lieux.data ?? []).map((l) => ({ id: l.id, nom: l.nom, ville: l.ville })),
  };
}
