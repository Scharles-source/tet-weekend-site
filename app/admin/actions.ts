"use server";

import { revalidatePath, updateTag } from "next/cache";
import { clientServeur } from "@/lib/admin/supabase";
import { lireSession } from "@/lib/admin/session";
import {
  SaisieInvalide,
  statutValide,
  validerArtiste,
  validerCompte,
  validerEvenement,
  validerLieu,
} from "@/lib/listing/validation";

const TABLES = ["venues", "artists", "events"] as const;
type TableStatut = (typeof TABLES)[number];

async function exigerAdmin() {
  const session = await lireSession();
  if (!session?.isAdmin) throw new Error("Accès réservé.");
}

function rafraichir() {
  updateTag("evenements-public");
  for (const chemin of ["/", "/evenements", "/lieux", "/artistes", "/villes", "/categories", "/admin", "/sitemap.xml"]) {
    revalidatePath(chemin);
  }
}

function erreurDe(e: unknown): string {
  if (e instanceof SaisieInvalide) return e.message;
  const msg = e instanceof Error ? e.message : "Erreur inconnue.";
  if (/publié|retiré/i.test(msg)) return "Statut refusé : utiliser publie ou retire, sans accent.";
  if (/duplicate key|23505/i.test(msg)) return "Ce slug existe déjà.";
  return msg;
}

export async function changerStatut(input: {
  table: TableStatut;
  id: string;
  statut: string;
  motif?: string | null;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    if (!TABLES.includes(input.table)) return { ok: false, erreur: "Table inconnue." };
    const statut = statutValide(input.statut);
    const patch: Record<string, string | null> = { statut };
    if (statut === "retire") {
      patch.motif_retrait = input.motif?.trim() ? input.motif.trim() : null;
      patch.retrait_demande_le = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Port-au-Prince" }).format(new Date());
    }
    const { error } = await (await clientServeur()).from(input.table).update(patch).eq("id", input.id);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichir();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function enregistrerLieu(input: {
  id?: string | null;
  champs: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const lieu = validerLieu(input.champs);
    const supabase = await clientServeur();
    const { error } = input.id
      ? await supabase.from("venues").update(lieu).eq("id", input.id)
      : await supabase.from("venues").insert(lieu);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichir();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function enregistrerArtiste(input: {
  id?: string | null;
  champs: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const artiste = validerArtiste(input.champs);
    const supabase = await clientServeur();
    const { error } = input.id
      ? await supabase.from("artists").update(artiste).eq("id", input.id)
      : await supabase.from("artists").insert(artiste);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichir();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function enregistrerEvenement(input: {
  id?: string | null;
  champs: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const evenement = validerEvenement(input.champs);
    const { artist_ids, ...ligne } = evenement;
    const supabase = await clientServeur();
    let id = input.id ?? null;
    if (id) {
      const { error } = await supabase.from("events").update(ligne).eq("id", id);
      if (error) return { ok: false, erreur: erreurDe(error) };
    } else {
      const { data, error } = await supabase.from("events").insert(ligne).select("id").single();
      if (error) return { ok: false, erreur: erreurDe(error) };
      id = data.id as string;
    }
    const { error: suppression } = await supabase.from("event_artists").delete().eq("event_id", id);
    if (suppression) return { ok: false, erreur: erreurDe(suppression) };
    if (artist_ids.length > 0) {
      const { error } = await supabase.from("event_artists").insert(artist_ids.map((artist_id) => ({ event_id: id, artist_id })));
      if (error) return { ok: false, erreur: erreurDe(error) };
    }
    rafraichir();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function enregistrerCompte(input: {
  id?: string | null;
  champs: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const compte = validerCompte(input.champs);
    const supabase = await clientServeur();
    const { error } = input.id
      ? await supabase.from("watch_accounts").update(compte).eq("id", input.id)
      : await supabase.from("watch_accounts").insert(compte);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichir();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}
