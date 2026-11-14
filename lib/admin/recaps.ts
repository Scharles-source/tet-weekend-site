import { clientServeur } from "./supabase.ts";
import { compterAValider, lireListeRecaps, type RecapAdmin } from "./recaps-pures.ts";

export type ChargementRecaps = { ok: true; liste: RecapAdmin[] } | { ok: false; absente: boolean; message: string };

function fonctionAbsente(e: { code?: string; message?: string }): boolean {
  return e.code === "PGRST202" || e.code === "42883" || /could not find the function|does not exist/i.test(e.message ?? "");
}

/** Tous les récaps (à valider d'abord), pour la section admin « Récaps vidéo ». */
export async function chargerRecaps(): Promise<ChargementRecaps> {
  try {
    const supabase = await clientServeur();
    const { data, error } = await supabase.rpc("recaps_admin");
    if (error) return { ok: false, absente: fonctionAbsente(error), message: error.message };
    return { ok: true, liste: lireListeRecaps(data) };
  } catch (e) {
    return { ok: false, absente: false, message: (e as Error).message };
  }
}

/** Nombre de récaps à valider pour l'accueil de l'admin ; null si la migration n'est pas appliquée. */
export async function compterRecapsAValider(): Promise<number | null> {
  try {
    const supabase = await clientServeur();
    const { data, error } = await supabase.rpc("recaps_admin");
    if (error) return null;
    return compterAValider(lireListeRecaps(data));
  } catch {
    return null;
  }
}
