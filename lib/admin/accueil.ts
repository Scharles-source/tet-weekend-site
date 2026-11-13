import { clientServeur } from "./supabase.ts";

export interface ExtrasAccueil {
  /** Candidats de la collecte en attente de validation (null si illisible). */
  aValider: number | null;
  /** Engagement par événement (vide si la migration n'est pas appliquée). */
  engagement: Record<string, { vues: number; interets: number }>;
}

/** Lectures tolérantes : l'accueil s'affiche même si l'une des sources échoue. */
export async function chargerExtrasAccueil(): Promise<ExtrasAccueil> {
  const extras: ExtrasAccueil = { aValider: null, engagement: {} };
  try {
    const supabase = await clientServeur();
    const [candidats, engagement] = await Promise.all([
      supabase.from("event_candidates").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
      supabase.rpc("evenements_engagement"),
    ]);
    if (!candidats.error && typeof candidats.count === "number") extras.aValider = candidats.count;
    if (!engagement.error && Array.isArray(engagement.data)) {
      for (const ligne of engagement.data as { event_id: string; interets: number; vues: number }[]) {
        extras.engagement[ligne.event_id] = { vues: Number(ligne.vues), interets: Number(ligne.interets) };
      }
    }
  } catch {
    /* repli : valeurs par défaut */
  }
  return extras;
}
