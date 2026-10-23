export type StatutJob = "queued" | "running" | "paused" | "succeeded" | "failed" | "cancelled" | "blocked";
export type TypeJob = "scan_source" | "scan_all" | "import_url" | "retry_failed";

export interface JobControle {
  id: string;
  jobType: TypeJob;
  sourceId: string | null;
  status: StatutJob;
  scheduledFor: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  heartbeatAt: string | null;
  runnerId: string | null;
  cancelRequested: boolean;
  attempt: number;
  errorCode: string | null;
  errorMessage: string | null;
  config: Record<string, unknown>;
}

export interface SourceControle {
  id: string;
  active: boolean;
  scanFrequencyMinutes: number;
  lastScannedAt: string | null;
}

export interface ReglagesCrawl {
  globalEnabled: boolean;
  schedulerEnabled: boolean;
}

const ACTIFS: StatutJob[] = ["queued", "running"];

export function runnerEnLigne(heartbeatAt: string | null, maintenant: number): boolean {
  if (!heartbeatAt) return false;
  const instant = Date.parse(heartbeatAt);
  return Number.isFinite(instant) && maintenant - instant < 120_000;
}

export function peutCreerJob(
  jobs: JobControle[],
  demande: { jobType: TypeJob; sourceId?: string | null },
): string | null {
  if (demande.jobType === "scan_all" && jobs.some((j) => j.jobType === "scan_all" && ACTIFS.includes(j.status))) {
    return "Un scan de toutes les sources est déjà en cours.";
  }
  if (
    demande.jobType === "scan_source" &&
    demande.sourceId &&
    jobs.some((j) => j.jobType === "scan_source" && j.sourceId === demande.sourceId && ACTIFS.includes(j.status))
  ) {
    return "Un scan est déjà en file pour cette source.";
  }
  return null;
}

export function mettrePause(jobs: JobControle[], reglages: ReglagesCrawl): void {
  reglages.globalEnabled = false;
  for (const job of jobs) {
    if (job.status === "running") job.cancelRequested = true;
  }
}

export function reclamerJob(jobs: JobControle[], runnerId: string, maintenant: number, globalEnabled: boolean): JobControle | null {
  if (!globalEnabled) return null;
  const suivant = jobs
    .filter((j) => j.status === "queued" && Date.parse(j.scheduledFor) <= maintenant)
    .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor) || a.createdAt.localeCompare(b.createdAt))[0];
  if (!suivant) return null;
  suivant.status = "running";
  suivant.startedAt = suivant.startedAt ?? new Date(maintenant).toISOString();
  suivant.heartbeatAt = new Date(maintenant).toISOString();
  suivant.runnerId = runnerId;
  suivant.attempt += 1;
  return suivant;
}

export function reessayerJob(job: JobControle, maintenant: number): string | null {
  if (job.status !== "failed" && job.status !== "blocked") {
    return "Seuls un échec ou un blocage peuvent être réessayés.";
  }
  job.status = "queued";
  job.cancelRequested = false;
  job.errorCode = null;
  job.errorMessage = null;
  job.finishedAt = null;
  job.runnerId = null;
  job.scheduledFor = new Date(maintenant).toISOString();
  job.config = { ...job.config, manualRetry: true };
  return null;
}

/** Un blocage de plateforme n'est jamais remis en file tout seul. */
export function apresEchec(job: JobControle, code: "blocked" | "temporaire", maintenant: number): StatutJob {
  if (code === "blocked" || job.attempt >= 3) {
    job.status = code === "blocked" ? "blocked" : "failed";
    job.finishedAt = new Date(maintenant).toISOString();
    return job.status;
  }
  job.status = "queued";
  job.runnerId = null;
  job.scheduledFor = new Date(maintenant + job.attempt * 60_000).toISOString();
  return "queued";
}

export function jobsPlanifies(
  sources: SourceControle[],
  jobs: JobControle[],
  reglages: ReglagesCrawl,
  maintenant: number,
): { sourceId: string }[] {
  if (!reglages.schedulerEnabled || !reglages.globalEnabled) return [];
  const crees: { sourceId: string }[] = [];
  for (const source of sources) {
    if (!source.active || source.scanFrequencyMinutes <= 0) continue;
    const dernier = source.lastScannedAt ? Date.parse(source.lastScannedAt) : 0;
    if (maintenant - dernier < source.scanFrequencyMinutes * 60_000) continue;
    if (jobs.some((j) => j.sourceId === source.id && ACTIFS.includes(j.status))) continue;
    crees.push({ sourceId: source.id });
  }
  return crees;
}
