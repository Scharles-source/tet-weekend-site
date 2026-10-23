import { notFound } from "next/navigation";
import { CollecteEvenements } from "@/components/admin/CollecteEvenements";
import type { VueCollecte } from "@/lib/crawlers/vue";

export const dynamic = "force-dynamic";

const FIXTURE: VueCollecte = {
  email: "apercu@local",
  globalEnabled: true,
  schedulerEnabled: false,
  runnerEnLigne: false,
  heartbeatAt: null,
  comptes: { queued: 1, running: 0, blocked: 1, failed: 0 },
  aValider: 1,
  lieux: [{ id: "v1", nom: "Yanvalou", ville: "Pétion-Ville" }],
  sources: [
    {
      id: "src-1",
      platform: "instagram",
      handle: "@apercu",
      profileUrl: "https://instagram.com/apercu",
      displayName: "Aperçu local",
      sourceType: "media",
      city: "Pétion-Ville",
      country: "Haïti",
      active: true,
      scanFrequencyMinutes: 1440,
      maxPostsPerScan: 20,
      lastScannedAt: "2026-10-22T18:00:00.000Z",
      lastSuccessAt: null,
      lastStatus: "blocked",
      lastError: "Voie Instagram non configurée : utilise Importer une URL ou ajoute le flyer manuellement.",
      notes: "Source fictive.",
      candidats: 1,
    },
  ],
  jobs: [
    {
      id: "job-1",
      jobType: "scan_source",
      sourceId: "src-1",
      sourceNom: "Aperçu local",
      inputUrl: null,
      status: "blocked",
      createdAt: "2026-10-22T18:00:00.000Z",
      startedAt: "2026-10-22T18:00:05.000Z",
      finishedAt: "2026-10-22T18:00:06.000Z",
      counts: { scanned: 0, newCandidates: 0, duplicates: 0, ignored: 0, errors: 1 },
      errorMessage: "Voie Instagram non configurée : utilise Importer une URL ou ajoute le flyer manuellement.",
      config: {},
      logs: [
        { id: "1", level: "info", message: "Démarrage du job.", createdAt: "2026-10-22T18:00:05.000Z" },
        { id: "2", level: "warn", message: "Voie Instagram non configurée : utilise Importer une URL ou ajoute le flyer manuellement.", createdAt: "2026-10-22T18:00:06.000Z" },
      ],
    },
  ],
  candidats: [
    {
      id: "cand-1",
      platform: "instagram",
      sourcePostUrl: "https://instagram.com/p/apercu",
      compte: "@apercu",
      caption: "Bal fictif, hors base. samedi 24 octobre 2026 à 21h.",
      title: "Bal fictif",
      startsAt: "2026-10-25T01:00:00.000Z",
      endsAt: null,
      timezone: "America/Port-au-Prince",
      venueName: "Yanvalou",
      venueId: "v1",
      city: "Pétion-Ville",
      artistsText: null,
      priceText: null,
      isFree: false,
      category: "bals",
      description: null,
      flyerUrl: "/apercu-flyer/portrait.png",
      status: "needs_review",
      confidence: { titre: { niveau: "medium" }, date: { niveau: "high" }, lieu: { niveau: "high" } },
      duplicateOfEventId: null,
      duplicateOfCandidateId: null,
      rejectionReason: null,
    },
  ],
};

export default function PageApercuCollecte() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-[var(--black)] px-4 py-6 text-[var(--white)]">
      <CollecteEvenements donnees={FIXTURE} apercu />
    </div>
  );
}
