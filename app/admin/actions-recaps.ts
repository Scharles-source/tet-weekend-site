"use server";

import { revalidatePath } from "next/cache";
import { lireSession } from "@/lib/admin/session";
import { statutRecapValide } from "@/lib/admin/recaps-pures";
import { clientServeur } from "@/lib/admin/supabase";

/** Change le statut d'un récap vidéo (à valider, publiée, écartée) via marquer_recap, réservée à l'admin. Publier ou retirer met aussi à jour l'accueil public. */
export async function marquerRecap(input: { id: string; statut: string }): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    const session = await lireSession();
    if (!session?.isAdmin) return { ok: false, erreur: "Accès réservé." };
    if (!statutRecapValide(input.statut) || !/^[0-9a-f-]{36}$/i.test(input.id)) return { ok: false, erreur: "Demande invalide." };
    const { error } = await (await clientServeur()).rpc("marquer_recap", { p_id: input.id, p_statut: input.statut });
    if (error) return { ok: false, erreur: error.message };
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}
