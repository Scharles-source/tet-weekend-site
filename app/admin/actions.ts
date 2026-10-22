"use server";

import { revalidatePath, updateTag } from "next/cache";
import { clientServeur } from "@/lib/admin/supabase";
import { lireSession } from "@/lib/admin/session";
import { doublonsProbables, patchMasquerFlyer, patchReafficherFlyer, type EvenementComparable } from "@/lib/listing/flyer";
import { extensionPourMime, inspecterImage } from "@/lib/listing/image";
import { importerImageDepuisUrl } from "@/lib/listing/flyer-import";
import {
  SaisieInvalide,
  statutValide,
  validerArtiste,
  validerCompte,
  validerEvenement,
  validerLieu,
  type EvenementSaisi,
} from "@/lib/listing/validation";

const BUCKET = "event-flyers";

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
  nouveau_lieu?: Record<string, unknown> | null;
  nouveaux_artistes?: Record<string, unknown>[];
  confirmer_doublon?: boolean;
}): Promise<
  | { ok: true; id: string; artist_ids: string[]; venue_id: string | null }
  | { ok: false; erreur: string; doublon?: { id: string; titre: string; slug: string } }
> {
  try {
    await exigerAdmin();
    let evenement = validerEvenement(input.champs);
    const supabase = await clientServeur();
    const lieu = await creerLieu(input.nouveau_lieu);
    if (lieu) {
      evenement = { ...evenement, venue_id: lieu.id, ville: evenement.ville ?? lieu.ville };
    }
    const artistesCrees = await creerArtistes(input.nouveaux_artistes ?? []);
    evenement = { ...evenement, artist_ids: [...new Set([...evenement.artist_ids, ...artistesCrees])] };
    if (!input.confirmer_doublon) {
      const doublon = await chercherDoublon(supabase, evenement, input.id ?? null);
      if (doublon) {
        return { ok: false, erreur: "Un événement proche existe déjà.", doublon };
      }
    }
    const { artist_ids, ...ligne } = evenement;
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
    return { ok: true, id, artist_ids, venue_id: evenement.venue_id };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

async function creerLieu(brut?: Record<string, unknown> | null): Promise<{ id: string; ville: string | null } | null> {
  if (!brut || !String(brut.nom ?? "").trim()) return null;
  const lieu = validerLieu(brut);
  const { data, error } = await (await clientServeur()).from("venues").insert(lieu).select("id,ville").single();
  if (error) throw error;
  return { id: data.id as string, ville: (data.ville as string | null) ?? null };
}

async function creerArtistes(liste: Record<string, unknown>[]): Promise<string[]> {
  const ids: string[] = [];
  const supabase = await clientServeur();
  for (const brut of liste) {
    if (!String(brut.nom ?? "").trim()) continue;
    const artiste = validerArtiste(brut);
    const { data, error } = await supabase.from("artists").insert(artiste).select("id").single();
    if (error) throw error;
    ids.push(data.id as string);
  }
  return ids;
}

async function chercherDoublon(
  supabase: Awaited<ReturnType<typeof clientServeur>>,
  evenement: EvenementSaisi,
  id: string | null,
): Promise<{ id: string; titre: string; slug: string } | null> {
  const { data, error } = await supabase.from("events").select("id,titre,slug,date_debut,fuseau,venue_id,ville,source_url");
  if (error) throw error;
  const trouves = doublonsProbables(
    { id, titre: evenement.titre, date_debut: evenement.date_debut, fuseau: evenement.fuseau, venue_id: evenement.venue_id, ville: evenement.ville, source_url: evenement.source_url },
    (data ?? []) as EvenementComparable[],
  );
  const premier = trouves[0];
  return premier ? { id: premier.id, titre: premier.titre, slug: premier.slug } : null;
}

export async function receptionnerFlyer(formData: FormData): Promise<
  { ok: true; storagePath: string; publicUrl: string; width: number; height: number; mime: string } | { ok: false; erreur: string }
> {
  try {
    await exigerAdmin();
    const fichier = formData.get("fichier");
    if (!(fichier instanceof File)) return { ok: false, erreur: "Choisissez un fichier JPEG, PNG ou WebP." };
    const octets = new Uint8Array(await fichier.arrayBuffer());
    const image = inspecterImage(octets, fichier.type);
    return await deposerFlyer(octets, image.mime, image.width, image.height, texteForm(formData.get("ancien")));
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function importerFlyerDepuisUrl(url: string, ancien?: string | null): Promise<
  { ok: true; storagePath: string; publicUrl: string; width: number; height: number; mime: string } | { ok: false; erreur: string }
> {
  try {
    await exigerAdmin();
    const image = await importerImageDepuisUrl(url);
    return await deposerFlyer(image.octets, image.mime, image.width, image.height, ancien ?? null);
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

async function deposerFlyer(
  octets: Uint8Array,
  mime: "image/jpeg" | "image/png" | "image/webp",
  width: number,
  height: number,
  ancien: string | null,
) {
  const supabase = await clientServeur();
  const chemin = `flyers/${crypto.randomUUID()}.${extensionPourMime(mime)}`;
  const fichier = new Blob([copieOctets(octets)], { type: mime });
  const { error } = await supabase.storage.from(BUCKET).upload(chemin, fichier, { contentType: mime, upsert: false });
  if (error) return { ok: false as const, erreur: erreurDe(error) };
  if (ancien && ancien !== chemin) await supabase.storage.from(BUCKET).remove([ancien]);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(chemin);
  return { ok: true as const, storagePath: chemin, publicUrl: data.publicUrl, width, height, mime };
}

function copieOctets(octets: Uint8Array): ArrayBuffer {
  const copie = new ArrayBuffer(octets.byteLength);
  new Uint8Array(copie).set(octets);
  return copie;
}

function texteForm(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function masquerFlyer(input: { id: string; motif: string }): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const patch = patchMasquerFlyer(input.motif, new Date().toISOString());
    const { error } = await (await clientServeur()).from("events").update(patch).eq("id", input.id);
    if (error) return { ok: false, erreur: erreurDe(error) };
    rafraichir();
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function reafficherFlyer(id: string): Promise<{ ok: true; flyer_url: string } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const supabase = await clientServeur();
    const { data, error } = await supabase.from("events").select("flyer_storage_path").eq("id", id).single();
    if (error) return { ok: false, erreur: erreurDe(error) };
    const chemin = data.flyer_storage_path as string | null;
    const url = chemin ? supabase.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl : null;
    const patch = patchReafficherFlyer(chemin, url);
    const { error: maj } = await supabase.from("events").update(patch).eq("id", id);
    if (maj) return { ok: false, erreur: erreurDe(maj) };
    rafraichir();
    return { ok: true, flyer_url: patch.flyer_url };
  } catch (e) {
    return { ok: false, erreur: erreurDe(e) };
  }
}

export async function dupliquerEvenement(id: string): Promise<{ ok: true; id: string } | { ok: false; erreur: string }> {
  try {
    await exigerAdmin();
    const supabase = await clientServeur();
    const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
    if (error || !data) return { ok: false, erreur: "Événement introuvable." };
    const ligne = { ...data } as Record<string, unknown>;
    delete ligne.id;
    delete ligne.created_at;
    delete ligne.updated_at;
    ligne.statut = "brouillon";
    ligne.motif_retrait = null;
    ligne.retrait_demande_le = null;
    const base = `${data.slug}-copie`;
    let cree: string | null = null;
    for (let i = 0; i < 20 && !cree; i++) {
      ligne.slug = i === 0 ? base : `${base}-${i + 1}`;
      const { data: insere, error: insertion } = await supabase.from("events").insert(ligne).select("id").single();
      if (!insertion && insere) cree = insere.id as string;
      else if (insertion && !/duplicate key|23505/i.test(insertion.message)) return { ok: false, erreur: erreurDe(insertion) };
    }
    if (!cree) return { ok: false, erreur: "Impossible de dupliquer le slug." };
    const { data: liens } = await supabase.from("event_artists").select("artist_id").eq("event_id", id);
    if (liens && liens.length > 0) {
      await supabase.from("event_artists").insert(liens.map((l) => ({ event_id: cree, artist_id: l.artist_id })));
    }
    rafraichir();
    return { ok: true, id: cree };
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
