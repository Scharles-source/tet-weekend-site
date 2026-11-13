import { redirect } from "next/navigation";
import { lireSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * La section Collecte n'existe plus (décision de Smith, 13 nov. 2026) :
 * la veille dépose les événements repérés directement en brouillon dans
 * l'écran Événements. L'ancienne adresse y redirige, pour les signets.
 */
export default async function PageCollecteEvenements() {
  const session = await lireSession();
  if (!session) redirect("/admin/login");
  if (!session.isAdmin) redirect("/admin");
  redirect("/admin?section=evenements");
}
