import { clientServeur } from "./supabase.ts";
import type { InstallationsApp, Periode, Statistiques } from "./statistiques-pures.ts";

/** Lecture tolérante : null si la migration n'est pas appliquée ou si la lecture échoue. */
export async function chargerStatistiques(periode: Periode): Promise<Statistiques | null> {
  try {
    const supabase = await clientServeur();
    const { data, error } = await supabase.rpc("statistiques_admin", { p_periode: periode });
    if (error || !data || typeof data !== "object") return null;
    const stats = data as Statistiques;
    const app = await supabase.rpc("installations_admin");
    stats.app = !app.error && app.data && typeof app.data === "object" ? (app.data as InstallationsApp) : null;
    return stats;
  } catch {
    return null;
  }
}
