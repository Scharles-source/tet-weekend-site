import { SaisieInvalide } from "../listing/erreurs.ts";
import { FREQUENCES, PLATEFORMES_SOURCE, TYPES_SOURCE } from "./vue.ts";

function texte(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t ? t : null;
}

export interface SourceSaisie {
  plateforme: (typeof PLATEFORMES_SOURCE)[number];
  handle: string | null;
  url: string | null;
  display_name: string | null;
  type: (typeof TYPES_SOURCE)[number];
  city: string | null;
  country: string | null;
  scan_frequency_minutes: number;
  max_posts_per_scan: number;
  notes: string | null;
  actif: boolean;
}

export function validerSource(brut: Record<string, unknown>): SourceSaisie {
  const plateforme = texte(brut.platform ?? brut.plateforme);
  const type = texte(brut.sourceType ?? brut.type) ?? "lieu";
  if (!plateforme || !(PLATEFORMES_SOURCE as readonly string[]).includes(plateforme)) {
    throw new SaisieInvalide("Plateforme invalide.");
  }
  if (!(TYPES_SOURCE as readonly string[]).includes(type)) throw new SaisieInvalide("Type de source invalide.");
  const handle = texte(brut.handle);
  const url = texte(brut.profileUrl ?? brut.url);
  if (!handle && !url) throw new SaisieInvalide("Indique un handle ou une URL.");
  if (url && !/^https?:\/\//i.test(url)) throw new SaisieInvalide("L'URL doit commencer par http:// ou https://.");
  const frequence = Number(brut.scanFrequencyMinutes ?? brut.scan_frequency_minutes ?? 1440);
  if (!FREQUENCES.some((f) => f.minutes === frequence)) throw new SaisieInvalide("Fréquence inconnue.");
  const max = Number(brut.maxPostsPerScan ?? brut.max_posts_per_scan ?? 20);
  if (!Number.isInteger(max) || max < 1 || max > 50) throw new SaisieInvalide("Le maximum de posts doit être entre 1 et 50.");
  return {
    plateforme: plateforme as SourceSaisie["plateforme"],
    handle,
    url,
    display_name: texte(brut.displayName ?? brut.display_name),
    type: type as SourceSaisie["type"],
    city: texte(brut.city),
    country: texte(brut.country),
    scan_frequency_minutes: frequence,
    max_posts_per_scan: max,
    notes: texte(brut.notes)?.slice(0, 1000) ?? null,
    actif: brut.active === undefined && brut.actif === undefined ? true : brut.active === true || brut.actif === true || brut.active === "true",
  };
}

export function validerJobDemande(brut: Record<string, unknown>): { job_type: string; source_id: string | null; input_url: string | null } {
  const jobType = texte(brut.jobType ?? brut.job_type);
  if (!jobType || !["scan_source", "scan_all", "import_url", "retry_failed"].includes(jobType)) {
    throw new SaisieInvalide("Type de job inconnu.");
  }
  const sourceId = texte(brut.sourceId ?? brut.source_id);
  const inputUrl = texte(brut.inputUrl ?? brut.input_url);
  if (jobType === "scan_source" && !sourceId) throw new SaisieInvalide("Choisis une source à scanner.");
  if (jobType === "import_url") {
    if (!inputUrl || !/^https?:\/\//i.test(inputUrl)) throw new SaisieInvalide("Colle une URL http ou https.");
  }
  return { job_type: jobType, source_id: jobType === "scan_source" ? sourceId : null, input_url: jobType === "import_url" ? inputUrl : null };
}
