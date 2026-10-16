"use server";

import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { clientServeur } from "@/lib/admin/supabase";
import { lireSession } from "@/lib/admin/session";
import { statutValide, validerArticle, SaisieInvalide } from "@/lib/admin/validation";

async function exigerAdmin() {
  const session = await lireSession();
  if (!session?.isAdmin) throw new Error("Accès réservé.");
  return session;
}

function rafraichirPublic() {
  updateTag("menus-public");
  revalidatePath("/");
  revalidatePath("/admin");
}

function erreurDe(e: unknown): string {
  if (e instanceof SaisieInvalide) return e.message;
  const msg =
    e instanceof Error
      ? e.message
      : e && typeof e === "object" && "message" in e && typeof e.message === "string"
        ? e.message
        : "Erreur inconnue.";
  if (/publié|retiré/i.test(msg)) return "Statut refusé : utiliser publie ou retire, sans accent.";
  return msg;
}

export async function changerStatut(input: {
  id: string;
  statut: string;
  motif?: string | null;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const statut = statutValide(input.statut);
    const motif = input.motif?.trim() ? input.motif.trim() : null;
    const supabase = await clientServeur();
    const patch: Record<string, string | null> = { statut };
    if (statut === "retire") {
      patch.motif_retrait = motif;
      patch.retrait_demande_le = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Port-au-Prince",
      }).format(new Date());
    }
    const { error } = await supabase.from("restaurants").update(patch).eq("id", input.id);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichirPublic();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function enregistrerArticle(input: {
  id?: string | null;
  champs: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const article = validerArticle(input.champs);
    const supabase = await clientServeur();
    if (input.id) {
      const reste = { ...article };
      delete (reste as { restaurant_id?: string }).restaurant_id;
      const { error } = await supabase.from("menu_items").update(reste).eq("id", input.id);
      if (error) return { ok: false, erreur: erreurDe(error) };
    } else {
      const { error } = await supabase.from("menu_items").insert(article);
      if (error) return { ok: false, erreur: erreurDe(error) };
    }
    rafraichirPublic();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function supprimerArticle(id: string): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const supabase = await clientServeur();
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichirPublic();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}
