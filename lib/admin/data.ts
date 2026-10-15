import { creerClientServeur } from "./supabase/server.ts";
import { runnerEnLigne, type CollecteEtatLigne, type CollecteJob, type RunnerStatut } from "./types.ts";

export async function lireJobs(limite = 20): Promise<CollecteJob[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("collecte_jobs")
    .select("id,slug,action,params,statut,log,created_at,started_at,finished_at")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as CollecteJob[];
}

export async function lireJob(id: string): Promise<CollecteJob | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("collecte_jobs")
    .select("id,slug,action,params,statut,log,created_at,started_at,finished_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CollecteJob) ?? null;
}

export async function lireEtats(): Promise<CollecteEtatLigne[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("collecte_etat")
    .select("slug,etat,dernier_job_id,mis_a_jour_le");
  if (error) throw new Error(error.message);
  return (data ?? []) as CollecteEtatLigne[];
}

export async function lireRunner(): Promise<RunnerStatut> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("collecte_runner")
    .select("dernier_heartbeat,version")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const hb = data?.dernier_heartbeat ?? null;
  return {
    en_ligne: runnerEnLigne(hb),
    dernier_heartbeat: hb,
    version: data?.version ?? null,
  };
}

export async function creerJob(input: {
  slug: string;
  action: string;
  params?: Record<string, unknown>;
}): Promise<CollecteJob> {
  const supabase = await creerClientServeur();

  const { data: doublons, error: errDup } = await supabase
    .from("collecte_jobs")
    .select("id")
    .eq("slug", input.slug)
    .eq("action", input.action)
    .in("statut", ["en_attente", "en_cours", "en_attente_action_humaine"])
    .limit(1);
  if (errDup) throw new Error(errDup.message);
  if (doublons && doublons.length > 0) {
    throw new Error("Un job identique est déjà en attente ou en cours.");
  }

  const { data, error } = await supabase
    .from("collecte_jobs")
    .insert({
      slug: input.slug,
      action: input.action,
      params: input.params ?? {},
      statut: "en_attente",
    })
    .select("id,slug,action,params,statut,log,created_at,started_at,finished_at")
    .single();
  if (error) throw new Error(error.message);
  return data as CollecteJob;
}
