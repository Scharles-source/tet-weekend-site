import { redirect } from "next/navigation";
import { CollecteEvenements } from "@/components/admin/CollecteEvenements";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { chargerCollecte } from "@/lib/crawlers/charger";
import { erreurPublique } from "@/lib/crawlers/serveur";
import { lireSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function PageCollecteEvenements() {
  const session = await lireSession();
  if (!session) redirect("/admin/login");
  if (!session.isAdmin) redirect("/admin");
  let donnees = null;
  let erreur: string | null = null;
  try {
    donnees = await chargerCollecte(session.email);
  } catch (e) {
    erreur = erreurPublique(e);
  }
  if (!donnees) {
    return (
      <main className="mx-auto max-w-lg pt-10">
        <h1 className="mb-3 text-2xl font-extrabold">Collecte — Événements</h1>
        <p className="text-sm text-amber-100">{erreur}</p>
        <div className="mt-6"><Deconnexion /></div>
      </main>
    );
  }
  return <CollecteEvenements donnees={donnees} />;
}
