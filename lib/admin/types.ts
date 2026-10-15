export const ACTIONS_JOB = ["sites", "maps", "ocr", "export", "etat"] as const;
export type ActionJob = (typeof ACTIONS_JOB)[number];

export const STATUTS_JOB = [
  "en_attente",
  "en_cours",
  "en_attente_action_humaine",
  "termine",
  "erreur",
] as const;
export type StatutJob = (typeof STATUTS_JOB)[number];

export const ETATS_COLLECTE = [
  "pas_commence",
  "image_recue",
  "extraction_proposee",
  "verifie",
  "publie",
] as const;
export type EtatCollecteDb = (typeof ETATS_COLLECTE)[number];

export const LIBELLES_ETAT: Record<EtatCollecteDb, string> = {
  pas_commence: "pas commencé",
  image_recue: "image reçue",
  extraction_proposee: "extraction proposée",
  verifie: "vérifié",
  publie: "publié",
};

export const LIBELLES_ACTION: Record<ActionJob, string> = {
  sites: "Sites",
  maps: "Maps",
  ocr: "OCR",
  export: "Exporter",
  etat: "État",
};

export const LIBELLES_STATUT: Record<StatutJob, string> = {
  en_attente: "en attente",
  en_cours: "en cours",
  en_attente_action_humaine: "attente action humaine",
  termine: "terminé",
  erreur: "erreur",
};

export interface CollecteJob {
  id: string;
  slug: string;
  action: ActionJob;
  params: Record<string, unknown>;
  statut: StatutJob;
  log: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface CollecteEtatLigne {
  slug: string;
  etat: EtatCollecteDb;
  dernier_job_id: string | null;
  mis_a_jour_le: string;
}

export interface RunnerStatut {
  en_ligne: boolean;
  dernier_heartbeat: string | null;
  version: string | null;
}

/** Heartbeat < 2 minutes = runner en ligne. */
export function runnerEnLigne(dernierHeartbeat: string | null | undefined, maintenant = Date.now()): boolean {
  if (!dernierHeartbeat) return false;
  const t = new Date(dernierHeartbeat).getTime();
  if (!Number.isFinite(t)) return false;
  return maintenant - t < 2 * 60 * 1000;
}
