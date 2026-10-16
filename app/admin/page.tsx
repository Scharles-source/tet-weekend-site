import { redirect } from "next/navigation";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { SectionRestaurants } from "@/components/admin/SectionRestaurants";
import { chargerRestaurants } from "@/lib/admin/charger";
import { lireSession } from "@/lib/admin/session";
import { supabaseConfigure } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

export default async function PageAdmin() {
  if (!supabaseConfigure()) {
    redirect("/admin/login");
  }
  let session;
  try {
    session = await lireSession();
  } catch (e) {
    return (
      <main className="mx-auto max-w-lg pt-10">
        <h1 className="mb-3 text-2xl font-extrabold">Admin</h1>
        <p className="text-sm text-amber-100">
          Impossible de vérifier le profil admin : {(e as Error).message}. La migration{" "}
          <code>20261016000000_admin_restaurants_menus.sql</code> doit être appliquée.
        </p>
      </main>
    );
  }
  if (!session) redirect("/admin/login");
  if (!session.isAdmin) {
    return (
      <main className="mx-auto max-w-md pt-16">
        <h1 className="mb-3 text-2xl font-extrabold">Accès réservé</h1>
        <p className="text-sm text-[var(--text-sec)]">
          Le compte {session.email ?? "connecté"} n&apos;a pas le droit d&apos;administration.
        </p>
        <div className="mt-6">
          <Deconnexion />
        </div>
      </main>
    );
  }

  let restaurants;
  try {
    restaurants = await chargerRestaurants();
  } catch (e) {
    return (
      <main className="mx-auto max-w-lg pt-10">
        <h1 className="mb-3 text-2xl font-extrabold">Restaurants et menus</h1>
        <p className="text-sm text-amber-100">{(e as Error).message}</p>
      </main>
    );
  }

  return (
    <main>
      <SectionRestaurants restaurants={restaurants} email={session.email} />
    </main>
  );
}
