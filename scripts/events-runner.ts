import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { jobsPlanifies, type JobControle, type SourceControle } from "../lib/crawlers/controle.ts";
import { contexteJournal, traiterJob, type CandidatCree, type Compteurs, type MagasinCrawl } from "../lib/crawlers/pipeline.ts";
import type { WatchPlatform, WatchSource } from "../lib/crawlers/types.ts";

const runnerId = crypto.randomUUID();
let arret = false;
let jobEnCours: string | null = null;

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    const fin = () => {
      clearTimeout(timer);
      resolve();
    };
    process.once("SIGINT", fin);
    process.once("SIGTERM", fin);
  });
}

function ligneJob(row: Record<string, unknown>): JobControle & { inputUrl: string | null } {
  return {
    id: String(row.id),
    jobType: row.job_type as JobControle["jobType"],
    sourceId: (row.source_id as string | null) ?? null,
    status: row.status as JobControle["status"],
    scheduledFor: String(row.scheduled_for),
    createdAt: String(row.created_at),
    startedAt: (row.started_at as string | null) ?? null,
    finishedAt: (row.finished_at as string | null) ?? null,
    heartbeatAt: (row.heartbeat_at as string | null) ?? null,
    runnerId: (row.runner_id as string | null) ?? null,
    cancelRequested: row.cancel_requested === true,
    attempt: Number(row.attempt ?? 0),
    errorCode: (row.error_code as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    config: (row.config as Record<string, unknown>) ?? {},
    inputUrl: (row.input_url as string | null) ?? null,
  };
}

function ligneSource(row: Record<string, unknown>): WatchSource & { active: boolean } {
  return {
    id: String(row.id),
    platform: row.plateforme as WatchPlatform,
    handle: (row.handle as string | null) ?? null,
    profileUrl: (row.url as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    maxPostsPerScan: Number(row.max_posts_per_scan ?? 20),
    active: row.actif !== false,
  };
}

function magasin(supabase: SupabaseClient): MagasinCrawl {
  return {
    async lireJob(id) {
      const { data, error } = await supabase.from("crawl_jobs").select("*").eq("id", id).single();
      if (error) throw new Error("Lecture du job impossible.");
      return ligneJob(data);
    },
    async sauverJob(job, compteurs: Compteurs) {
      const { error } = await supabase.from("crawl_jobs").update({
        status: job.status,
        finished_at: job.finishedAt,
        scheduled_for: job.scheduledFor,
        runner_id: job.runnerId,
        error_code: job.errorCode,
        error_message: job.errorMessage,
        counts: compteurs,
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      if (error) throw new Error("Mise à jour du job impossible.");
    },
    async journaliser(jobId, level, message, contexte) {
      await supabase.from("crawl_job_logs").insert({
        job_id: jobId,
        level,
        message: message.slice(0, 500),
        context: contexteJournal(contexte),
      });
    },
    async sourcesActives() {
      const { data, error } = await supabase.from("watch_accounts").select("*").eq("actif", true);
      if (error) throw new Error("Lecture des sources impossible.");
      return (data ?? []).map((row) => ligneSource(row));
    },
    async sourceParId(id) {
      const { data } = await supabase.from("watch_accounts").select("*").eq("id", id).maybeSingle();
      return data ? ligneSource(data) : null;
    },
    async marquerSource(id, patch) {
      await supabase.from("watch_accounts").update({
        last_status: patch.lastStatus,
        last_error: patch.lastError,
        ...(patch.scanned ? { last_scanned_at: new Date().toISOString(), last_success_at: patch.lastStatus === "succeeded" ? new Date().toISOString() : undefined } : {}),
      }).eq("id", id);
    },
    async existants() {
      const [evenements, candidats] = await Promise.all([
        supabase.from("events").select("id,titre,date_debut,ville,source_url"),
        supabase.from("event_candidates").select("id,title,starts_at,city,venue_name,source_post_url,media_sha256"),
      ]);
      return [
        ...(evenements.data ?? []).map((e) => ({
          id: String(e.id),
          title: e.titre as string | null,
          startsAt: e.date_debut as string | null,
          city: e.ville as string | null,
          sourceUrl: e.source_url as string | null,
          table: "event" as const,
        })),
        ...(candidats.data ?? []).map((c) => ({
          id: String(c.id),
          title: c.title as string | null,
          startsAt: c.starts_at as string | null,
          city: c.city as string | null,
          venue: c.venue_name as string | null,
          sourceUrl: c.source_post_url as string | null,
          mediaSha256: c.media_sha256 as string | null,
          table: "candidate" as const,
        })),
      ];
    },
    async ajouterCandidat(jobId, sourceId, candidat: CandidatCree) {
      const { error } = await supabase.from("event_candidates").insert({
        id: candidat.id,
        job_id: jobId,
        source_id: sourceId,
        platform: candidat.platform,
        source_post_id: candidat.sourcePostId,
        source_post_url: candidat.sourcePostUrl,
        caption: candidat.caption,
        title: candidat.title,
        starts_at: candidat.startsAt,
        ends_at: candidat.endsAt,
        timezone: candidat.timezone,
        venue_name: candidat.venueName,
        venue_id: candidat.venueId,
        city: candidat.city,
        artists_text: candidat.artistsText,
        price_text: candidat.priceText,
        is_free: candidat.isFree,
        media_sha256: candidat.mediaSha256,
        confidence: candidat.confidence,
        raw_payload: candidat.rawPayload,
        status: "needs_review",
      });
      if (error && !/duplicate|unique/i.test(error.message)) throw new Error("Candidat non enregistré.");
    },
    async lieux() {
      const { data } = await supabase.from("venues").select("id,nom,ville");
      return (data ?? []).map((v) => ({ id: String(v.id), nom: String(v.nom), ville: (v.ville as string | null) ?? null }));
    },
    async artistes() {
      const { data } = await supabase.from("artists").select("id,nom");
      return (data ?? []).map((a) => ({ id: String(a.id), nom: String(a.nom) }));
    },
  };
}

async function planifier(supabase: SupabaseClient): Promise<void> {
  const { data: reglages } = await supabase.from("crawler_settings").select("*").eq("id", true).single();
  if (!reglages?.scheduler_enabled || !reglages.global_enabled) return;
  const [{ data: sources }, { data: jobs }] = await Promise.all([
    supabase.from("watch_accounts").select("id,actif,scan_frequency_minutes,last_scanned_at"),
    supabase.from("crawl_jobs").select("id,source_id,status").in("status", ["queued", "running"]),
  ]);
  const dus = jobsPlanifies(
    (sources ?? []).map((s) => ({
      id: String(s.id),
      active: s.actif !== false,
      scanFrequencyMinutes: Number(s.scan_frequency_minutes ?? 0),
      lastScannedAt: (s.last_scanned_at as string | null) ?? null,
    })) satisfies SourceControle[],
    (jobs ?? []).map((j) => job({ id: String(j.id), sourceId: (j.source_id as string | null) ?? null, status: j.status as JobControle["status"] })),
    { globalEnabled: true, schedulerEnabled: true },
    Date.now(),
  );
  for (const du of dus) {
    const { data } = await supabase.from("crawl_jobs").insert({
      job_type: "scan_source",
      source_id: du.sourceId,
      requested_by: null,
      config: { origin: "scheduler" },
    }).select("id").single();
    if (data?.id) {
      await supabase.from("crawl_job_logs").insert({
        job_id: data.id,
        level: "info",
        message: "Job créé par le planificateur.",
        context: { origin: "scheduler" },
      });
    }
  }
}

function job(partiel: Partial<JobControle> & { id: string }): JobControle {
  return {
    jobType: "scan_source",
    sourceId: null,
    status: "queued",
    scheduledFor: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    heartbeatAt: null,
    runnerId: null,
    cancelRequested: false,
    attempt: 0,
    errorCode: null,
    errorMessage: null,
    config: {},
    ...partiel,
  };
}

async function remettreEnFile(supabase: SupabaseClient): Promise<void> {
  if (!jobEnCours) return;
  await supabase.from("crawl_jobs").update({
    status: "queued",
    runner_id: null,
    updated_at: new Date().toISOString(),
  }).eq("id", jobEnCours).eq("status", "running");
  jobEnCours = null;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    console.error("Le runner a besoin de SUPABASE_SERVICE_ROLE_KEY en local. Cette clé ne va ni dans le navigateur, ni dans Vercel.");
    process.exit(1);
  }
  const supabase = createClient(url, cle, { auth: { persistSession: false } });
  const battement = setInterval(() => {
    void supabase.rpc("crawler_heartbeat", { p_runner_id: runnerId });
  }, 30_000);
  const stopper = () => {
    arret = true;
  };
  process.on("SIGINT", stopper);
  process.on("SIGTERM", stopper);
  console.log("Runner d'événements démarré. Il s'arrête avec Ctrl+C. Aucun événement n'est publié.");
  try {
    while (!arret) {
      await supabase.rpc("crawler_heartbeat", { p_runner_id: runnerId });
      const { data: reglages } = await supabase.from("crawler_settings").select("global_enabled").eq("id", true).single();
      if (!reglages?.global_enabled) {
        await dormir(15_000);
        continue;
      }
      const { data: pris } = await supabase.rpc("claim_crawl_job", { p_runner_id: runnerId });
      const ligne = Array.isArray(pris) ? pris[0] : null;
      if (!ligne) {
        await planifier(supabase);
        await dormir(10_000);
        continue;
      }
      const courant = ligneJob(ligne);
      jobEnCours = courant.id;
      await traiterJob(magasin(supabase), courant, Date.now());
      jobEnCours = null;
    }
  } finally {
    clearInterval(battement);
    await remettreEnFile(supabase);
    console.log("Runner arrêté.");
  }
}

void main();
