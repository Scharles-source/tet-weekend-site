import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { preparerEvenementDepuisCandidat } from "./approuver.ts";
import {
  apresEchec,
  jobsPlanifies,
  mettrePause,
  peutCreerJob,
  reclamerJob,
  reessayerJob,
  runnerEnLigne,
  type JobControle,
} from "./controle.ts";
import type { CandidatCree, Compteurs, Existant, MagasinCrawl } from "./pipeline.ts";
import { traiterJob } from "./pipeline.ts";
import { MESSAGE_INSTAGRAM } from "./providers.ts";
import type { WatchSource } from "./types.ts";

function job(partiel: Partial<JobControle> = {}): JobControle {
  return {
    id: "job-1",
    jobType: "scan_source",
    sourceId: "src-1",
    status: "running",
    scheduledFor: "2026-10-22T00:00:00.000Z",
    createdAt: "2026-10-22T00:00:00.000Z",
    startedAt: "2026-10-22T00:00:00.000Z",
    finishedAt: null,
    heartbeatAt: null,
    runnerId: "runner-12345678",
    cancelRequested: false,
    attempt: 1,
    errorCode: null,
    errorMessage: null,
    config: {},
    ...partiel,
  };
}

class Memoire implements MagasinCrawl {
  job: JobControle;
  candidats: CandidatCree[] = [];
  evenements: { statut: string }[] = [];
  logs: string[] = [];
  sources: (WatchSource & { active: boolean })[];
  existant: Existant[] = [];
  compteurs: Compteurs | null = null;
  constructor(courant: JobControle, sources: (WatchSource & { active: boolean })[]) {
    this.job = courant;
    this.sources = sources;
  }
  async lireJob() {
    return this.job;
  }
  async sauverJob(valeur: JobControle, compteurs: Compteurs) {
    this.job = { ...this.job, ...valeur };
    this.compteurs = compteurs;
  }
  async journaliser(_id: string, _level: "info" | "warn" | "error", message: string) {
    this.logs.push(message);
  }
  async sourcesActives() {
    return this.sources.filter((s) => s.active);
  }
  async sourceParId(id: string) {
    return this.sources.find((s) => s.id === id) ?? null;
  }
  async marquerSource() {}
  async existants() {
    return [...this.existant, ...this.candidats.map((c) => ({ id: c.id, sourceUrl: c.sourcePostUrl, title: c.title, startsAt: c.startsAt, venue: c.venueName, city: c.city, table: "candidate" as const }))];
  }
  async ajouterCandidat(_jobId: string, _sourceId: string | null, candidat: CandidatCree) {
    this.candidats.push(candidat);
    if (this.annulerApresPremier) this.job.cancelRequested = true;
  }
  async lieux() {
    return [{ id: "v1", nom: "Yanvalou", ville: "Pétion-Ville" }];
  }
  async artistes() {
    return [];
  }
  annulerApresPremier = false;
}

const source = (platform: WatchSource["platform"], active = true): WatchSource & { active: boolean } => ({
  id: "src-1",
  platform,
  profileUrl: "https://exemple.com/agenda",
  displayName: "Exemple",
  maxPostsPerScan: 5,
  active,
});

test("scan fictif, correction, approbation en brouillon, flyer promu", async () => {
  const memoire = new Memoire(job({ jobType: "scan_source" }), [source("website")]);
  const html = "<title>Bal Yanvalou</title><meta name=\"description\" content=\"samedi 24 octobre 2026 à 21h au Yanvalou. Entrée 20 $ US\">";
  await traiterJob(memoire, memoire.job, Date.parse("2026-10-22T12:00:00.000Z"), {
    resoudre: async () => ["1.1.1.1"],
    attendre: async () => {},
    fetch: async (url) => {
      if (String(url).endsWith("/robots.txt")) return new Response("User-agent: *\nDisallow:", { status: 200 });
      return new Response(html, { status: 200 });
    },
  });
  assert.equal(memoire.job.status, "succeeded");
  assert.equal(memoire.candidats.length, 1);
  assert.equal(memoire.evenements.length, 0);
  const candidat = memoire.candidats[0];
  assert.equal(candidat?.title, "Bal Yanvalou");
  assert.equal(candidat?.venueId, "v1");
  candidat!.sourcePostUrl = candidat!.sourcePostUrl;
  const corrige = { ...candidat!, title: "Bal corrigé" };
  const evenement = preparerEvenementDepuisCandidat(
    {
      titre: corrige.title,
      dateDebut: "2026-10-24T21:00",
      dateFin: null,
      fuseau: "America/Port-au-Prince",
      ville: "Pétion-Ville",
      lieu: "Yanvalou",
      artistes: null,
      prix: "20 $ US",
      gratuit: false,
      categorie: "bals",
      description: null,
    },
    undefined,
    "candidats/abc.png",
  );
  memoire.evenements.push({ statut: evenement.statut });
  assert.equal(evenement.statut, "brouillon");
  assert.equal(evenement.flyerPublic, "flyers/abc.png");
  assert.equal(evenement.prix, "20 $ US");
});

test("le runner ne crée pas d'événement publié", () => {
  for (const chemin of ["../../scripts/events-runner.ts", "./pipeline.ts"]) {
    const sourceTexte = readFileSync(new URL(chemin, import.meta.url), "utf8");
    assert.equal(/\.from\("events"\)\s*\.\s*(insert|update|upsert)/.test(sourceTexte), false);
    assert.equal(sourceTexte.includes("preparerEvenementDepuisCandidat"), false);
    assert.equal(sourceTexte.includes('statut: "publie"'), false);
  }
  assert.equal(preparerEvenementDepuisCandidat(
    { titre: "X", dateDebut: "2026-10-24T21:00", dateFin: null, fuseau: "America/Port-au-Prince", ville: null, lieu: null, artistes: null, prix: null, gratuit: false, categorie: null, description: null },
    true,
    null,
  ).statut, "publie");
});

test("instagram bloqué, sans retry automatique", async () => {
  const memoire = new Memoire(job(), [source("instagram")]);
  let appels = 0;
  await traiterJob(memoire, memoire.job, Date.now(), { fetch: async () => { appels += 1; return new Response("no"); } });
  assert.equal(appels, 0);
  assert.equal(memoire.job.status, "blocked");
  assert.match(memoire.job.errorMessage ?? "", /Importer une URL/);
  assert.equal(memoire.logs.some((l) => l.includes(MESSAGE_INSTAGRAM)), true);
  const copie = { ...memoire.job, attempt: 1 };
  assert.equal(apresEchec(copie, "blocked", Date.now()), "blocked");
  assert.equal(copie.status, "blocked");
});

test("pause, annulation, source inactive, pas de double job", async () => {
  const maintenant = Date.parse("2026-10-22T12:00:00.000Z");
  const file = [job({ status: "queued", attempt: 0 })];
  assert.equal(reclamerJob(file, "runner-12345678", maintenant, false), null);
  const pris = reclamerJob(file, "runner-12345678", maintenant, true);
  assert.equal(pris?.status, "running");
  assert.equal(reclamerJob(file, "runner-22222222", maintenant, true), null);

  const reglages = { globalEnabled: true, schedulerEnabled: false };
  mettrePause(file, reglages);
  assert.equal(reglages.globalEnabled, false);
  assert.equal(file[0]?.cancelRequested, true);

  const inactif = new Memoire(job(), [source("website", false)]);
  await traiterJob(inactif, inactif.job, maintenant, {});
  assert.equal(inactif.job.status, "succeeded");
  assert.equal(inactif.candidats.length, 0);

  const annule = new Memoire(job(), [source("website")]);
  annule.annulerApresPremier = true;
  await traiterJob(annule, annule.job, maintenant, {
    resoudre: async () => ["1.1.1.1"],
    attendre: async () => {},
    fetch: async (url) => new Response(String(url).endsWith("robots.txt") ? "User-agent: *\nAllow: /" : "<title>Un</title><meta name=\"description\" content=\"Deux\">", { status: 200 }),
  });
  assert.equal(annule.job.status, "cancelled");

  const doublon = peutCreerJob([job({ status: "queued" })], { jobType: "scan_source", sourceId: "src-1" });
  assert.match(doublon ?? "", /déjà en file/);
  const bloque = job({ status: "blocked" });
  assert.equal(reessayerJob(bloque, maintenant), null);
  assert.equal(bloque.status, "queued");
});

test("planificateur et runner hors ligne", () => {
  const maintenant = Date.parse("2026-10-22T12:00:00.000Z");
  assert.equal(runnerEnLigne(null, maintenant), false);
  assert.equal(runnerEnLigne(new Date(maintenant - 30_000).toISOString(), maintenant), true);
  assert.equal(runnerEnLigne(new Date(maintenant - 180_000).toISOString(), maintenant), false);
  const crees = jobsPlanifies(
    [{ id: "s", active: true, scanFrequencyMinutes: 1440, lastScannedAt: null }],
    [],
    { globalEnabled: true, schedulerEnabled: true },
    maintenant,
  );
  assert.equal(crees.length, 1);
  assert.equal(
    jobsPlanifies([{ id: "s", active: true, scanFrequencyMinutes: 1440, lastScannedAt: null }], [], { globalEnabled: true, schedulerEnabled: false }, maintenant).length,
    0,
  );
});

test("robots.txt arrête le site", async () => {
  const memoire = new Memoire(job(), [source("website")]);
  await traiterJob(memoire, memoire.job, Date.now(), {
    resoudre: async () => ["1.1.1.1"],
    attendre: async () => {},
    fetch: async () => new Response("User-agent: *\nDisallow: /", { status: 200 }),
  });
  assert.equal(memoire.job.status, "blocked");
  assert.match(memoire.job.errorMessage ?? "", /robots\.txt/);
});
