"use server";

import { revalidatePath } from "next/cache";
import { lireSession } from "@/lib/admin/session";
import { statutSoumissionValide } from "@/lib/admin/soumissions-pures";
import { clientServeur } from "@/lib/admin/supabase";

/** Change le statut d'une soumission (nouveau, lu, traité, archivé) via marquer_soumission, réservée à l'admin. */
export async function marquerSoumission(input: { id: string; statut: string }): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    const session = await lireSession();
    if (!session?.isAdmin) return { ok: false, erreur: "Accès réservé." };
    if (!statutSoumissionValide(input.statut) || !/^[0-9a-f-]{36}$/i.test(input.id)) return { ok: false, erreur: "Demande invalide." };
    const { error } = await (await clientServeur()).rpc("marquer_soumission", { p_id: input.id, p_statut: input.statut });
    if (error) return { ok: false, erreur: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}
