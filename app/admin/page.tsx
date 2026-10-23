import { redirect } from "next/navigation";
import { DashboardListing } from "@/components/admin/DashboardListing";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { chargerListing, type ArtisteAdmin, type CompteAdmin, type EvenementAdmin, type LieuAdmin } from "@/lib/admin/charger";
import { lireSession } from "@/lib/admin/session";
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
    };

async function preparerAdmin(): Promise<Acces> {
  if (!supabaseConfigure()) return { type: "login" };
  try {
    const session = await lireSession();
    if (!session) return { type: "login" };
    if (!session.isAdmin) return { type: "interdit", email: session.email };
    return { type: "ok", email: session.email, donnees: await chargerListing() };
  } catch (e) {
    return { type: "erreur", message: (e as Error).message };
  }
}

export default async function PageAdmin({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  const acces = await preparerAdmin();
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
        <p className="text-sm text-[#4A4136]">Le compte {acces.email ?? "connecté"} n&apos;a pas le droit d&apos;administration.</p>
        <div className="mt-6"><Deconnexion /></div>
      </main>
    );
  }
  return <DashboardListing {...acces.donnees} email={acces.email} section={section} />;
}
