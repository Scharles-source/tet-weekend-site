import { enregistrerEvenement } from "@/app/admin/actions";
import { clientServeur } from "@/lib/admin/supabase";
import { lireSession } from "@/lib/admin/session";
import { SaisieInvalide } from "@/lib/listing/erreurs";
import { extensionPourMime, inspecterImage } from "@/lib/listing/image";
import { FUSEAU_DEFAUT, SOURCES } from "@/lib/listing/schema";
import { slugifier } from "@/lib/listing/slug";
import { peutCreerJob } from "./controle";
import { validerJobDemande, validerSource } from "./validation";

const BUCKET_PUBLIC = "event-flyers";
const BUCKET_PRIVE = "event-candidate-flyers";

export function erreurPublique(e: unknown): string {
  if (e instanceof SaisieInvalide) return e.message;
  const message = e instanceof Error ? e.message : "";
  if (/service_role|bearer|token|jwt|secret|authorization/i.test(message)) return "Erreur interne.";
  if (/does not exist|schema cache|relation/i.test(message)) {
    return "La migration 20261022030000_crawlers_evenements.sql n'est pas appliquée.";
  }
  return message.slice(0, 240) || "Enregistrement impossible.";
}

export function reponseErreur(e: unknown, statut = 400): Response {
  return Response.json({ ok: false, erreur: erreurPublique(e) }, { status: statut });
}

async function exiger(): Promise<{ userId: string } | Response> {
  const session = await lireSession();
  if (!session) return Response.json({ ok: false, erreur: "Connexion requise." }, { status: 401 });
  if (!session.isAdmin) return Response.json({ ok: false, erreur: "Accès réservé." }, { status: 403 });
  return { userId: session.userId };
}

async function lireJson(requete: Request): Promise<Record<string, unknown>> {
  const brut = await requete.json().catch(() => null);
  if (!brut || typeof brut !== "object") throw new SaisieInvalide("Requête invalide.");
  return brut as Record<string, unknown>;
}

export async function creerJob(requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const demande = validerJobDemande(await lireJson(requete));
    const supabase = await clientServeur();
    const { data: actifs, error } = await supabase.from("crawl_jobs").select("id,job_type,source_id,status").in("status", ["queued", "running"]);
    if (error) return reponseErreur(error);
    const refus = peutCreerJob(
      (actifs ?? []).map((j) => ({
        id: String(j.id),
        jobType: j.job_type,
        sourceId: j.source_id,
        status: j.status,
        scheduledFor: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        heartbeatAt: null,
        runnerId: null,
        cancelRequested: false,
        attempt: 0,
        errorCode: null,
        errorMessage: null,
        config: {},
      })),
      { jobType: demande.job_type as "scan_source", sourceId: demande.source_id },
    );
    if (refus) return Response.json({ ok: false, erreur: refus }, { status: 409 });
    const { data, error: insertion } = await supabase.from("crawl_jobs").insert({
      job_type: demande.job_type,
      source_id: demande.source_id,
      input_url: demande.input_url,
      requested_by: acces.userId,
      config: {},
    }).select("id").single();
    if (insertion) return reponseErreur(insertion);
    return Response.json({ ok: true, id: data.id });
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function annulerJob(id: string): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  const supabase = await clientServeur();
  const { data, error } = await supabase.from("crawl_jobs").select("status").eq("id", id).maybeSingle();
  if (error) return reponseErreur(error);
  if (!data) return Response.json({ ok: false, erreur: "Job introuvable." }, { status: 404 });
  if (!["queued", "running", "paused"].includes(data.status)) {
    return Response.json({ ok: false, erreur: "Ce job ne peut plus être annulé." }, { status: 409 });
  }
  const patch = data.status === "queued"
    ? { status: "cancelled", finished_at: new Date().toISOString(), cancel_requested: true }
    : { cancel_requested: true };
  const { error: maj } = await supabase.from("crawl_jobs").update(patch).eq("id", id);
  if (maj) return reponseErreur(maj);
  return Response.json({ ok: true });
}

export async function reessayerJobHttp(id: string): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  const supabase = await clientServeur();
  const { data, error } = await supabase.from("crawl_jobs").select("status,config").eq("id", id).maybeSingle();
  if (error) return reponseErreur(error);
  if (!data) return Response.json({ ok: false, erreur: "Job introuvable." }, { status: 404 });
  if (data.status !== "failed" && data.status !== "blocked") {
    return Response.json({ ok: false, erreur: "Seuls un échec ou un blocage peuvent être réessayés." }, { status: 409 });
  }
  const { error: maj } = await supabase.from("crawl_jobs").update({
    status: "queued",
    cancel_requested: false,
    error_code: null,
    error_message: null,
    finished_at: null,
    runner_id: null,
    scheduled_for: new Date().toISOString(),
    config: { ...(data.config ?? {}), manualRetry: true },
  }).eq("id", id);
  if (maj) return reponseErreur(maj);
  return Response.json({ ok: true });
}

export async function mettreReglages(requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const brut = await lireJson(requete);
    const patch: Record<string, unknown> = { updated_by: acces.userId, updated_at: new Date().toISOString() };
    if ("globalEnabled" in brut) patch.global_enabled = brut.globalEnabled === true;
    if ("schedulerEnabled" in brut) patch.scheduler_enabled = brut.schedulerEnabled === true;
    const supabase = await clientServeur();
    const { error } = await supabase.from("crawler_settings").update(patch).eq("id", true);
    if (error) return reponseErreur(error);
    if (patch.global_enabled === false) {
      await supabase.from("crawl_jobs").update({ cancel_requested: true }).eq("status", "running");
    }
    return Response.json({ ok: true });
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function lireStatut(): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  const supabase = await clientServeur();
  const [reglages, runner, jobs, candidats] = await Promise.all([
    supabase.from("crawler_settings").select("global_enabled,scheduler_enabled").eq("id", true).maybeSingle(),
    supabase.from("crawler_runner").select("heartbeat_at").eq("id", 1).maybeSingle(),
    supabase.from("crawl_jobs").select("status"),
    supabase.from("event_candidates").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
  ]);
  const erreur = reglages.error || runner.error || jobs.error || candidats.error;
  if (erreur) return reponseErreur(erreur);
  const liste = jobs.data ?? [];
  const battement = runner.data?.heartbeat_at ? Date.parse(runner.data.heartbeat_at) : NaN;
  return Response.json({
    ok: true,
    crawler: reglages.data?.global_enabled ? "active" : "paused",
    schedulerEnabled: reglages.data?.scheduler_enabled === true,
    runner: { online: Number.isFinite(battement) && Date.now() - battement < 120_000, heartbeatAt: runner.data?.heartbeat_at ?? null },
    jobs: {
      queued: liste.filter((j) => j.status === "queued").length,
      running: liste.filter((j) => j.status === "running").length,
      blocked: liste.filter((j) => j.status === "blocked").length,
      failed: liste.filter((j) => j.status === "failed").length,
    },
    review: candidats.count ?? 0,
    hosted: false,
  });
}

export async function creerSource(requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const source = validerSource(await lireJson(requete));
    const supabase = await clientServeur();
    const { data, error } = await supabase.from("watch_accounts").insert(source).select("id").single();
    if (error) return reponseErreur(error.code === "23505" ? new SaisieInvalide("Cette source active existe déjà.") : error);
    return Response.json({ ok: true, id: data.id });
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function modifierSource(id: string, requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const brut = await lireJson(requete);
    const supabase = await clientServeur();
    if (Object.keys(brut).length === 1 && ("active" in brut || "actif" in brut)) {
      const { error } = await supabase.from("watch_accounts").update({ actif: brut.active === true || brut.actif === true }).eq("id", id);
      if (error) return reponseErreur(error);
      return Response.json({ ok: true });
    }
    const source = validerSource(brut);
    const { error } = await supabase.from("watch_accounts").update(source).eq("id", id);
    if (error) return reponseErreur(error.code === "23505" ? new SaisieInvalide("Cette source active existe déjà.") : error);
    return Response.json({ ok: true });
  } catch (e) {
    return reponseErreur(e);
  }
}

function sourceEvenement(platform: string): (typeof SOURCES)[number] {
  if (platform === "instagram" || platform === "facebook" || platform === "eventbrite") return platform;
  return "manuel";
}

function mimeDe(octets: Uint8Array): "image/jpeg" | "image/png" | "image/webp" {
  if (octets[0] === 0xff && octets[1] === 0xd8) return "image/jpeg";
  if (octets[0] === 0x89 && octets[1] === 0x50) return "image/png";
  return "image/webp";
}

async function promouvoirFlyer(chemin: string | null): Promise<{ storagePath: string; publicUrl: string; width: number; height: number; mime: string } | null> {
  if (!chemin) return null;
  const supabase = await clientServeur();
  const telecharge = await supabase.storage.from(BUCKET_PRIVE).download(chemin);
  if (telecharge.error || !telecharge.data) return null;
  const octets = new Uint8Array(await telecharge.data.arrayBuffer());
  const mime = mimeDe(octets);
  const image = inspecterImage(octets, mime);
  const destination = `flyers/${crypto.randomUUID()}.${extensionPourMime(mime)}`;
  const copie = new ArrayBuffer(octets.byteLength);
  new Uint8Array(copie).set(octets);
  const envoi = await supabase.storage.from(BUCKET_PUBLIC).upload(destination, new Blob([copie], { type: mime }), { contentType: mime, upsert: false });
  if (envoi.error) throw new SaisieInvalide("Le flyer n'a pas pu être copié vers le dossier public.");
  const { data } = supabase.storage.from(BUCKET_PUBLIC).getPublicUrl(destination);
  return { storagePath: destination, publicUrl: data.publicUrl, width: image.width, height: image.height, mime };
}

export async function approuverCandidat(id: string, requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const brut = await lireJson(requete);
    const publish = brut.publish === true;
    const fields = (brut.fields ?? {}) as Record<string, unknown>;
    const supabase = await clientServeur();
    const { data: candidat, error } = await supabase.from("event_candidates").select("*").eq("id", id).maybeSingle();
    if (error) return reponseErreur(error);
    if (!candidat) return Response.json({ ok: false, erreur: "Candidat introuvable." }, { status: 404 });
    if (candidat.status === "imported") return Response.json({ ok: false, erreur: "Ce candidat est déjà importé." }, { status: 409 });
    const titre = String(fields.titre ?? candidat.title ?? "").trim();
    const dateDebut = String(fields.dateDebut ?? "").trim();
    if (!titre || !dateDebut) return Response.json({ ok: false, erreur: "Le titre et la date sont obligatoires pour créer le brouillon." }, { status: 400 });
    // Règle (Smith, 28 oct. 2026) : un candidat sans flyer ne devient pas un événement.
    if (!candidat.flyer_storage_path) {
      return Response.json(
        { ok: false, erreur: "Approbation refusée : ce candidat n'a pas de flyer (règle : aucun événement sans flyer)." },
        { status: 400 },
      );
    }
    const flyer = await promouvoirFlyer(candidat.flyer_storage_path as string | null);
    const artistes = String(fields.artistes ?? candidat.artists_text ?? "").trim();
    const lieu = String(fields.lieu ?? candidat.venue_name ?? "").trim();
    let description = String(fields.description ?? candidat.description ?? "").trim();
    if (artistes && !description.includes(artistes)) description = [description, `Artistes : ${artistes}`].filter(Boolean).join("\n");
    if (lieu && !fields.venueId && !description.includes(lieu)) description = [description, `Lieu : ${lieu}`].filter(Boolean).join("\n");
    const prix = fields.gratuit === true ? "Gratuit" : String(fields.prix ?? "").trim() || null;
    const slugBase = slugifier(titre);
    const champs = {
      titre,
      slug: slugBase,
      date_debut: dateDebut,
      date_fin: String(fields.dateFin ?? "").trim() || null,
      venue_id: String(fields.venueId ?? candidat.venue_id ?? "").trim() || null,
      ville: String(fields.ville ?? candidat.city ?? "").trim() || null,
      description: description || null,
      prix,
      source: sourceEvenement(String(candidat.platform)),
      source_url: candidat.source_post_url,
      source_account: String(fields.compte ?? "").trim() || null,
      categorie: String(fields.categorie ?? candidat.category ?? "").trim() || null,
      fuseau: String(fields.fuseau ?? candidat.timezone ?? FUSEAU_DEFAUT),
      a_verifier: !publish,
      statut: publish ? "publie" : "brouillon",
      artist_ids: [],
      flyer_storage_path: flyer?.storagePath ?? null,
      flyer_url: flyer?.publicUrl ?? null,
      flyer_width: flyer?.width ?? null,
      flyer_height: flyer?.height ?? null,
      flyer_mime_type: flyer?.mime ?? null,
      flyer_alt: flyer ? `Flyer — ${titre}` : null,
      flyer_credit: null,
    };
    let cree = await enregistrerEvenement({ champs, confirmer_doublon: brut.confirmerDoublon === true });
    if (!cree.ok && /slug|duplicate|unique|23505/i.test(cree.erreur)) {
      cree = await enregistrerEvenement({ champs: { ...champs, slug: `${slugBase}-${crypto.randomUUID().slice(0, 6)}` }, confirmer_doublon: brut.confirmerDoublon === true });
    }
    if (!cree.ok) return Response.json(cree, { status: cree.doublon ? 409 : 400 });
    const { error: maj } = await supabase.from("event_candidates").update({
      status: "imported",
      title: titre,
      reviewed_by: acces.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (maj) return reponseErreur(maj);
    return Response.json({ ok: true, id: cree.id, statut: publish ? "publie" : "brouillon" });
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function rejeterCandidat(id: string, requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  const brut = await lireJson(requete).catch((): Record<string, unknown> => ({}));
  const supabase = await clientServeur();
  const { error } = await supabase.from("event_candidates").update({
    status: "rejected",
    rejection_reason: String(brut.reason ?? "").trim().slice(0, 500) || null,
    reviewed_by: acces.userId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "needs_review");
  if (error) return reponseErreur(error);
  return Response.json({ ok: true });
}

export async function sauverCandidat(id: string, requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const brut = await lireJson(requete);
    const fields = (brut.fields ?? brut) as Record<string, unknown>;
    const supabase = await clientServeur();
    const { error } = await supabase.from("event_candidates").update({
      title: String(fields.titre ?? "").trim() || null,
      city: String(fields.ville ?? "").trim() || null,
      venue_name: String(fields.lieu ?? "").trim() || null,
      venue_id: String(fields.venueId ?? "").trim() || null,
      artists_text: String(fields.artistes ?? "").trim() || null,
      price_text: fields.gratuit === true ? "Gratuit" : String(fields.prix ?? "").trim() || null,
      is_free: fields.gratuit === true,
      category: String(fields.categorie ?? "").trim() || null,
      description: String(fields.description ?? "").trim() || null,
      timezone: String(fields.fuseau ?? FUSEAU_DEFAUT),
    }).eq("id", id).eq("status", "needs_review");
    if (error) return reponseErreur(error);
    return Response.json({ ok: true });
  } catch (e) {
    return reponseErreur(e);
  }
}

export async function marquerDoublon(id: string, requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  const brut = await lireJson(requete).catch((): Record<string, unknown> => ({}));
  const supabase = await clientServeur();
  const { error } = await supabase.from("event_candidates").update({
    status: "duplicate",
    duplicate_of_event_id: String(brut.duplicateOfEventId ?? "").trim() || null,
    duplicate_of_candidate_id: String(brut.duplicateOfCandidateId ?? "").trim() || null,
    reviewed_by: acces.userId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return reponseErreur(error);
  return Response.json({ ok: true });
}

export async function traiterLot(requete: Request): Promise<Response> {
  const acces = await exiger();
  if (acces instanceof Response) return acces;
  try {
    const brut = await lireJson(requete);
    const action = String(brut.action ?? "");
    if (action !== "reject" && action !== "duplicate") {
      return Response.json({ ok: false, erreur: "La sélection multiple ne publie pas." }, { status: 400 });
    }
    const ids = Array.isArray(brut.ids) ? brut.ids.map((id) => String(id)).filter(Boolean).slice(0, 50) : [];
    if (ids.length === 0) return Response.json({ ok: false, erreur: "Aucun candidat sélectionné." }, { status: 400 });
    const supabase = await clientServeur();
    const patch = action === "reject"
      ? { status: "rejected", rejection_reason: String(brut.reason ?? "").trim().slice(0, 500) || null, reviewed_by: acces.userId, reviewed_at: new Date().toISOString() }
      : { status: "duplicate", reviewed_by: acces.userId, reviewed_at: new Date().toISOString() };
    const { error } = await supabase.from("event_candidates").update(patch).in("id", ids).eq("status", "needs_review");
    if (error) return reponseErreur(error);
    return Response.json({ ok: true });
  } catch (e) {
    return reponseErreur(e);
  }
}
