import { NextResponse } from "next/server";
import { clientServeur, supabaseConfigure } from "@/lib/admin/supabase";
import { flyerValide, validerSoumission } from "@/lib/listing/soumission";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BUCKET = "soumissions-flyers";

/** Migration pas encore appliquée : fonction, table ou bucket introuvables. */
function elementAbsent(erreur: { code?: string; message?: string } | null | undefined): boolean {
  if (!erreur) return false;
  return (
    erreur.code === "PGRST202" ||
    erreur.code === "42883" ||
    erreur.code === "42P01" ||
    /could not find the function|does not exist|bucket not found/i.test(erreur.message ?? "")
  );
}

/**
 * Reçoit le formulaire « Add an event / Become a partner » : le flyer part dans le bucket privé « soumissions-flyers »,
 * les champs dans la table soumissions (fonction enregistrer_soumission). Rien n'est envoyé par e-mail ;
 * les soumissions se lisent dans l'admin.
 */
export async function POST(request: Request) {
  if (!supabaseConfigure()) return NextResponse.json({ ok: false, erreur: "indisponible" }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, erreur: "invalide" }, { status: 400 });
  }
  // Champ piège : un humain ne le voit pas, un robot le remplit. On répond « ok » sans rien enregistrer.
  if (typeof form.get("site") === "string" && String(form.get("site")).trim() !== "") return NextResponse.json({ ok: true });

  const champs = Object.fromEntries(["nom", "email", "telephone", "evenement", "date", "lieu", "details"].map((k) => [k, form.get(k)]));
  const verif = validerSoumission(champs);
  if (!verif.ok) return NextResponse.json({ ok: false, erreur: "champs", champs: verif.erreurs }, { status: 400 });

  const fichier = form.get("flyer");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return NextResponse.json({ ok: false, erreur: "champs", champs: { flyer: "Add your flyer." } }, { status: 400 });
  }
  const probleme = flyerValide({ type: fichier.type, size: fichier.size });
  if (probleme) return NextResponse.json({ ok: false, erreur: "champs", champs: { flyer: probleme } }, { status: 400 });

  const s = verif.valeur;
  const extension = fichier.type === "image/png" ? "png" : fichier.type === "image/webp" ? "webp" : "jpg";
  const chemin = `${crypto.randomUUID()}.${extension}`;

  try {
    const supabase = await clientServeur();
    const envoi = await supabase.storage.from(BUCKET).upload(chemin, Buffer.from(await fichier.arrayBuffer()), { contentType: fichier.type, upsert: false });
    if (envoi.error) {
      if (elementAbsent(envoi.error as { code?: string; message?: string })) return NextResponse.json({ ok: false, erreur: "indisponible" }, { status: 503 });
      console.error("Soumission : envoi du flyer", envoi.error.message);
      return NextResponse.json({ ok: false, erreur: "envoi" }, { status: 502 });
    }
    const { error } = await supabase.rpc("enregistrer_soumission", {
      p_nom: s.nom,
      p_email: s.email,
      p_telephone: s.telephone,
      p_evenement: s.evenement,
      p_date: s.date,
      p_lieu: s.lieu,
      p_details: s.details,
      p_flyer_path: chemin,
    });
    if (error) {
      if (elementAbsent(error)) return NextResponse.json({ ok: false, erreur: "indisponible" }, { status: 503 });
      console.error("Soumission : enregistrement", error.message);
      return NextResponse.json({ ok: false, erreur: "envoi" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Soumission error", e);
    return NextResponse.json({ ok: false, erreur: "envoi" }, { status: 502 });
  }
}
