import { clientServeur } from "./supabase.ts";
import { compterNouvelles, lireListeSoumissions, type SoumissionAdmin } from "./soumissions-pures.ts";

const BUCKET = "soumissions-flyers";

export type ChargementSoumissions = { ok: true; liste: SoumissionAdmin[] } | { ok: false; absente: boolean; message: string };

function fonctionAbsente(e: { code?: string; message?: string }): boolean {
  return e.code === "PGRST202" || e.code === "42883" || /could not find the function|does not exist/i.test(e.message ?? "");
}

/** Les 100 dernières soumissions, avec une URL signée (1 h) pour chaque flyer du bucket privé. */
export async function chargerSoumissions(): Promise<ChargementSoumissions> {
  try {
    const supabase = await clientServeur();
    const { data, error } = await supabase.rpc("soumissions_admin");
    if (error) return { ok: false, absente: fonctionAbsente(error), message: error.message };
    const base = lireListeSoumissions(data);
    const urls = new Map<string, string>();
    if (base.length > 0) {
      const { data: signees } = await supabase.storage.from(BUCKET).createSignedUrls(
        base.map((s) => s.flyer_path),
        3600,
      );
      for (const x of signees ?? []) if (x.path && x.signedUrl) urls.set(x.path, x.signedUrl);
    }
    return { ok: true, liste: base.map((s) => ({ ...s, flyer_url: urls.get(s.flyer_path) ?? null })) };
  } catch (e) {
    return { ok: false, absente: false, message: (e as Error).message };
  }
}

/** Nombre de nouvelles soumissions pour l'accueil de l'admin ; null si la migration n'est pas appliquée. */
export async function compterNouvellesSoumissions(): Promise<number | null> {
  try {
    const supabase = await clientServeur();
    const { data, error } = await supabase.rpc("soumissions_admin");
    if (error) return null;
    return compterNouvelles(lireListeSoumissions(data));
  } catch {
    return null;
  }
}
