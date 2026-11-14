import { redirect } from "next/navigation";
import { Coquille } from "@/components/admin/Coquille";
import { DashboardListing } from "@/components/admin/DashboardListing";
import { SectionRecaps } from "@/components/admin/SectionRecaps";
import { SectionSoumissions } from "@/components/admin/SectionSoumissions";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { chargerListing, type ArtisteAdmin, type CompteAdmin, type EvenementAdmin, type LieuAdmin } from "@/lib/admin/charger";
import { lireSession } from "@/lib/admin/session";
import { chargerRapportSeo } from "@/lib/admin/search-console";
import { periodeSeoValide, type PeriodeSeo, type RapportSeo } from "@/lib/admin/search-console-pures";
import { chargerRecaps, compterRecapsAValider, type ChargementRecaps } from "@/lib/admin/recaps";
import { chargerSoumissions, compterNouvellesSoumissions, type ChargementSoumissions } from "@/lib/admin/soumissions";
import { chargerStatistiques } from "@/lib/admin/statistiques";
import { periodeValide, type Periode, type Statistiques } from "@/lib/admin/statistiques-pures";
import { supabaseConfigure } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

type Acces =
  | { type: "login" }
  | { type: "interdit"; email: string | null }
  | { type: "erreur"; message: string }
  | {
      type: "ok";
      email: string | null;
      donnees: { lieux: LieuAdmin[]; artistes: ArtisteAdmin[]; evenements: EvenementAdmin[]; comptes: CompteAdmin[] };
      stats: Statistiques | null;
      rapportSeo: RapportSeo | null;
      soumissions: ChargementSoumissions | null;
      nouvelles: number | null;
      recaps: ChargementRecaps | null;
      recapsAValider: number | null;
    };

async function preparerAdmin(section: string | undefined, periode: Periode, seoPeriode: PeriodeSeo): Promise<Acces> {
  if (!supabaseConfigure()) return { type: "login" };
  try {
    const session = await lireSession();
    if (!session) return { type: "login" };
    if (!session.isAdmin) return { type: "interdit", email: session.email };
    const voirStats = section === undefined || section === "accueil" || section === "statistiques";
    const voirSeo = section === undefined || section === "accueil";
    const voirSoumissions = section === "soumissions";
    const voirRecaps = section === "recaps";
    const voirCompteur = section === undefined || section === "accueil";
    const [donnees, stats, rapportSeo, soumissions, nouvelles, recaps, recapsAValider] = await Promise.all([
      chargerListing(),
      voirStats ? chargerStatistiques(section === "statistiques" ? periode : "aujourdhui") : Promise.resolve(null),
      voirSeo ? chargerRapportSeo(seoPeriode) : Promise.resolve(null),
      voirSoumissions ? chargerSoumissions() : Promise.resolve(null),
      voirCompteur ? compterNouvellesSoumissions() : Promise.resolve(null),
      voirRecaps ? chargerRecaps() : Promise.resolve(null),
      voirCompteur ? compterRecapsAValider() : Promise.resolve(null),
    ]);
    return { type: "ok", email: session.email, donnees, stats, rapportSeo, soumissions, nouvelles, recaps, recapsAValider };
  } catch (e) {
    return { type: "erreur", message: (e as Error).message };
  }
}

export default async function PageAdmin({ searchParams }: { searchParams: Promise<{ section?: string; periode?: string; seo?: string }> }) {
  const { section, periode: periodeBrute, seo } = await searchParams;
  const periode = periodeValide(periodeBrute);
  const acces = await preparerAdmin(section, periode, periodeSeoValide(seo));
  if (acces.type === "login") redirect("/admin/login");
  if (acces.type === "erreur") {
    return (
      <main className="mx-auto max-w-lg pt-10">
        <h1 className="mb-3 font-[family-name:var(--font-display)] text-2xl font-extrabold">Admin</h1>
        <p className="text-sm text-[#92400E]">
          {acces.message}. Les migrations <code>20261022000000_listing_evenements.sql</code> et <code>20261022020000_flyers_evenements.sql</code> doivent être appliquées.
        </p>
      </main>
    );
  }
  if (acces.type === "interdit") {
    return (
      <main className="mx-auto max-w-md pt-16">
        <h1 className="mb-3 font-[family-name:var(--font-display)] text-2xl font-extrabold">Accès réservé</h1>
        <p className="text-sm text-[#3C4452]">Le compte {acces.email ?? "connecté"} n&apos;a pas le droit d&apos;administration.</p>
        <div className="mt-6"><Deconnexion /></div>
      </main>
    );
  }
  if (acces.soumissions) {
    return (
      <Coquille actif="soumissions" email={acces.email} titre="Soumissions">
        <SectionSoumissions resultat={acces.soumissions} />
      </Coquille>
    );
  }
  if (acces.recaps) {
    return (
      <Coquille actif="recaps" email={acces.email} titre="Récaps vidéo">
        <SectionRecaps resultat={acces.recaps} />
      </Coquille>
    );
  }
  return <DashboardListing {...acces.donnees} maintenantIso={new Date().toISOString()} stats={acces.stats} rapportSeo={acces.rapportSeo} periode={periode} email={acces.email} section={section} soumissionsNouvelles={acces.nouvelles} recapsAValider={acces.recapsAValider} />;
}
