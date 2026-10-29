import { notFound } from "next/navigation";
import { CollecteEvenements } from "@/components/admin/CollecteEvenements";
import type { VueCollecte } from "@/lib/crawlers/vue";

export const dynamic = "force-dynamic";

const FIXTURE: VueCollecte = {
  email: "apercu@local",
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
      notes: "Source fictive.",
      candidats: 1,
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
    <div className="min-h-screen bg-[#FBF7EF] px-4 py-6 text-[#191410]">
      <CollecteEvenements donnees={FIXTURE} apercu />
    </div>
  );
}
