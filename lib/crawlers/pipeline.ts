import { FUSEAU_DEFAUT } from "../listing/schema.ts";
import { apresEchec, type JobControle } from "./controle.ts";
import {
  detectDuplicate,
  extractPrice,
  matchArtists,
  matchVenue,
  nettoyerContexte,
  normalizePostUrl,
  parseEventDateTime,
  payloadNettoye,
  titreDepuisLegende,
  type NiveauConfiance,
} from "./extract.ts";
import { importerUrlPublique, type OptionsFournisseur } from "./providers.ts";
import type { RawPost, WatchPlatform, WatchSource } from "./types.ts";

export interface Compteurs {
  scanned: number;
  newCandidates: number;
  duplicates: number;
  ignored: number;
  errors: number;
}

export interface CandidatCree {
  id: string;
  platform: WatchPlatform;
  sourcePostId: string | null;
  sourcePostUrl: string;
  caption: string | null;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  venueName: string | null;
  venueId: string | null;
  city: string | null;
  artistsText: string | null;
  priceText: string | null;
  isFree: boolean | null;
  mediaSha256: string | null;
  confidence: Record<string, { niveau: NiveauConfiance; source?: string }>;
  rawPayload: Record<string, unknown>;
  status: "needs_review";
  duplicateOfEventId: string | null;
  duplicateOfCandidateId: string | null;
}

export interface Existant {
  id: string;
  title?: string | null;
  startsAt?: string | null;
  venue?: string | null;
  city?: string | null;
  sourceUrl?: string | null;
  mediaSha256?: string | null;
  table: "event" | "candidate";
}

export interface MagasinCrawl {
  lireJob(id: string): Promise<JobControle>;
  sauverJob(job: JobControle, compteurs: Compteurs): Promise<void>;
  journaliser(jobId: string, level: "info" | "warn" | "error", message: string, contexte?: Record<string, unknown>): Promise<void>;
  sourcesActives(): Promise<(WatchSource & { active: boolean })[]>;
  sourceParId(id: string): Promise<(WatchSource & { active: boolean }) | null>;
  marquerSource(id: string, patch: { lastStatus: string; lastError: string | null; scanned?: boolean }): Promise<void>;
  existants(): Promise<Existant[]>;
  ajouterCandidat(jobId: string, sourceId: string | null, candidat: CandidatCree): Promise<void>;
  lieux(): Promise<{ id: string; nom: string; ville: string | null }[]>;
  artistes(): Promise<{ id: string; nom: string }[]>;
}

const compteursVides = (): Compteurs => ({ scanned: 0, newCandidates: 0, duplicates: 0, ignored: 0, errors: 0 });

export async function traiterJob(
  magasin: MagasinCrawl,
  job: JobControle & { inputUrl?: string | null },
  maintenant: number,
  options: OptionsFournisseur = {},
): Promise<JobControle> {
  const compteurs = compteursVides();
  await magasin.journaliser(job.id, "info", "Démarrage du job.", { type: job.jobType });
  try {
    if (job.jobType === "import_url") {
      await ingererUrl(magasin, job, job.inputUrl ?? "", compteurs, options);
    } else {
      await scannerSources(magasin, job, compteurs, options);
    }
    const frais = await magasin.lireJob(job.id);
    if (frais.cancelRequested || frais.status === "cancelled") {
      frais.status = "cancelled";
      frais.finishedAt = new Date(maintenant).toISOString();
      await magasin.sauverJob(frais, compteurs);
      await magasin.journaliser(job.id, "info", "Job annulé.");
      return frais;
    }
    if (compteurs.newCandidates === 0 && compteurs.errors > 0 && compteurs.scanned === 0) {
      frais.status = "blocked";
      frais.errorCode = "blocked";
      frais.finishedAt = new Date(maintenant).toISOString();
      await magasin.sauverJob(frais, compteurs);
      return frais;
    }
    frais.status = "succeeded";
    frais.finishedAt = new Date(maintenant).toISOString();
    frais.errorCode = null;
    await magasin.sauverJob(frais, compteurs);
    await magasin.journaliser(job.id, "info", "Job terminé.", { ...compteurs });
    return frais;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur.";
    const frais = await magasin.lireJob(job.id);
    frais.errorMessage = message.slice(0, 300);
    frais.errorCode = "temporaire";
    const statut = apresEchec(frais, "temporaire", maintenant);
    await magasin.sauverJob(frais, compteurs);
    await magasin.journaliser(job.id, "error", message.slice(0, 300));
    return { ...frais, status: statut };
  }
}

async function scannerSources(
  magasin: MagasinCrawl,
  job: JobControle,
  compteurs: Compteurs,
  options: OptionsFournisseur,
): Promise<void> {
  const { fournisseurPour } = await import("./providers.ts");
  let sources = job.jobType === "scan_all" ? await magasin.sourcesActives() : [];
  if (job.jobType === "scan_source" && job.sourceId) {
    const une = await magasin.sourceParId(job.sourceId);
    sources = une ? [une] : [];
  }
  sources = sources.filter((s) => s.active);
  if (sources.length === 0) {
    compteurs.ignored += 1;
    await magasin.journaliser(job.id, "info", "Source inactive ou absente, ignorée.");
    return;
  }
  let premierBlocage: string | null = null;
  for (const source of sources) {
    const frais = await magasin.lireJob(job.id);
    if (frais.cancelRequested) {
      frais.status = "cancelled";
      return;
    }
    const provider = fournisseurPour(source.platform, options);
    const resultat = await provider.scan(source);
    if (resultat.blockedReason) {
      compteurs.errors += 1;
      premierBlocage ??= resultat.blockedReason;
      await magasin.journaliser(job.id, "warn", resultat.blockedReason, { sourceId: source.id });
      await magasin.marquerSource(source.id, { lastStatus: "blocked", lastError: resultat.blockedReason });
      continue;
    }
    for (const post of resultat.posts) {
      const encore = await magasin.lireJob(job.id);
      if (encore.cancelRequested) {
        encore.status = "cancelled";
        return;
      }
      await ingererPost(magasin, job, source, post, compteurs);
    }
    compteurs.scanned += 1;
    await magasin.marquerSource(source.id, { lastStatus: "succeeded", lastError: null, scanned: true });
  }
  if (compteurs.scanned === 0 && premierBlocage) {
    const frais = await magasin.lireJob(job.id);
    frais.errorMessage = premierBlocage;
    frais.errorCode = "blocked";
    apresEchec(frais, "blocked", Date.now());
  }
}

async function ingererUrl(
  magasin: MagasinCrawl,
  job: JobControle,
  url: string,
  compteurs: Compteurs,
  options: OptionsFournisseur,
): Promise<void> {
  const lu = await importerUrlPublique(url, options);
  if (lu.type === "bloque") {
    compteurs.errors += 1;
    const frais = await magasin.lireJob(job.id);
    frais.errorMessage = lu.motif;
    frais.errorCode = "blocked";
    apresEchec(frais, "blocked", Date.now());
    await magasin.journaliser(job.id, "warn", lu.motif);
    return;
  }
  if (lu.type === "assistee") {
    await magasin.ajouterCandidat(job.id, job.sourceId, candidatAssiste(url, lu.motif));
    compteurs.newCandidates += 1;
    await magasin.journaliser(job.id, "info", lu.motif);
    return;
  }
  await ingererPost(magasin, job, { id: job.sourceId ?? "import", platform: plateformeDe(url), maxPostsPerScan: 1 }, lu.post, compteurs);
  compteurs.scanned += 1;
}

function plateformeDe(url: string): WatchPlatform {
  try {
    const hote = new URL(url).hostname.toLowerCase();
    if (hote.endsWith("instagram.com")) return "instagram";
    if (hote.endsWith("facebook.com")) return "facebook";
    if (hote.endsWith("eventbrite.com")) return "eventbrite";
  } catch {
    /* manuel */
  }
  return "manual";
}

async function ingererPost(
  magasin: MagasinCrawl,
  job: JobControle,
  source: WatchSource,
  post: RawPost,
  compteurs: Compteurs,
): Promise<void> {
  const url = normalizePostUrl(post.url);
  if (!url) {
    compteurs.ignored += 1;
    return;
  }
  const lieux = await magasin.lieux();
  const artistes = await magasin.artistes();
  const caption = (post.caption ?? "").slice(0, 4000);
  const date = caption ? parseEventDateTime(caption, new Date(), FUSEAU_DEFAUT) : null;
  const titre = titreDepuisLegende(caption);
  const prix = extractPrice(caption);
  const lieu = matchVenue(caption, lieux);
  const artistesTrouves = matchArtists(caption, artistes);
  const existants = await magasin.existants();
  const doublon = detectDuplicate(
    {
      title: titre.title,
      startsAt: date?.startsAt,
      venue: lieu?.nom ?? null,
      city: lieu?.ville ?? null,
      url,
      timezone: FUSEAU_DEFAUT,
    },
    existants,
  );
  if (doublon || existants.some((e) => e.sourceUrl && normalizePostUrl(e.sourceUrl) === url)) {
    compteurs.duplicates += 1;
    await magasin.journaliser(job.id, "info", "Doublon ignoré.", { url });
    return;
  }
  const confiance = {
    titre: { niveau: titre.niveau, source: titre.title ? "caption" : undefined },
    date: {
      niveau: date?.startsAt ? "high" : date?.dateTexte ? "medium" : "missing",
      source: date ? "caption" : undefined,
    } as { niveau: NiveauConfiance; source?: string },
    lieu: { niveau: (lieu ? "high" : "missing") as NiveauConfiance, source: lieu ? "caption" : undefined },
  };
  await magasin.ajouterCandidat(job.id, source.id === "import" ? job.sourceId : source.id, {
    id: crypto.randomUUID(),
    platform: source.platform,
    sourcePostId: post.externalId ?? null,
    sourcePostUrl: url,
    caption: caption || null,
    title: titre.title,
    startsAt: date?.startsAt ?? null,
    endsAt: date?.endsAt ?? null,
    timezone: FUSEAU_DEFAUT,
    venueName: lieu?.nom ?? null,
    venueId: lieu?.id ?? null,
    city: lieu?.ville ?? null,
    artistsText: artistesTrouves.length ? artistesTrouves.map((a) => a.nom).join(", ") : null,
    priceText: prix.priceText ?? null,
    isFree: prix.isFree ?? null,
    mediaSha256: null,
    confidence: confiance,
    rawPayload: payloadNettoye({ postedAt: post.postedAt ?? null }),
    status: "needs_review",
    duplicateOfEventId: null,
    duplicateOfCandidateId: null,
  });
  compteurs.newCandidates += 1;
}

function candidatAssiste(url: string, motif: string): CandidatCree {
  return {
    id: crypto.randomUUID(),
    platform: plateformeDe(url),
    sourcePostId: null,
    sourcePostUrl: normalizePostUrl(url) || url,
    caption: null,
    title: null,
    startsAt: null,
    endsAt: null,
    timezone: FUSEAU_DEFAUT,
    venueName: null,
    venueId: null,
    city: null,
    artistsText: null,
    priceText: null,
    isFree: null,
    mediaSha256: null,
    confidence: {
      titre: { niveau: "missing" },
      date: { niveau: "missing" },
      lieu: { niveau: "missing" },
    },
    rawPayload: payloadNettoye({ saisie: "assistee", motif }),
    status: "needs_review",
    duplicateOfEventId: null,
    duplicateOfCandidateId: null,
  };
}

export function contexteJournal(contexte?: Record<string, unknown>): Record<string, unknown> {
  return nettoyerContexte(contexte);
}
