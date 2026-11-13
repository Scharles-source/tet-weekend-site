import { NextResponse } from "next/server";
import { echapperHtml, EMAIL_CONTACT, flyerValide, validerSoumission } from "@/lib/listing/soumission";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Reçoit le formulaire « Add an event » et l'envoie à contact@tetweekend.com (flyer en pièce jointe).
 * L'envoi passe par Resend : variables RESEND_API_KEY (obligatoire) et EMAIL_FROM (optionnelle, expéditeur vérifié).
 */
export async function POST(request: Request) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return NextResponse.json({ ok: false, erreur: "indisponible" }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, erreur: "invalide" }, { status: 400 });
  }
  // Champ piège : un humain ne le voit pas, un robot le remplit. On répond « ok » sans rien envoyer.
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
  const ligne = (nom: string, valeur: string) => (valeur ? `<tr><td style="padding:4px 12px 4px 0;color:#6E6252"><b>${nom}</b></td><td style="padding:4px 0">${echapperHtml(valeur).replace(/\n/g, "<br>")}</td></tr>` : "");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#191410"><h2 style="margin:0 0 12px">New event submitted</h2><table>${ligne("Event", s.evenement)}${ligne("Date", s.date)}${ligne("Venue", s.lieu)}${ligne("Details", s.details)}${ligne("Name", s.nom)}${ligne("Email", s.email)}${ligne("Phone", s.telephone)}</table><p style="color:#6E6252">The flyer is attached. Reply to this email to answer the organizer.</p></div>`;
  const extension = fichier.type === "image/png" ? "png" : fichier.type === "image/webp" ? "webp" : "jpg";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Tèt Weekend <onboarding@resend.dev>",
        to: [EMAIL_CONTACT],
        reply_to: s.email,
        subject: `New event: ${s.evenement}`,
        html,
        attachments: [{ filename: `flyer.${extension}`, content: Buffer.from(await fichier.arrayBuffer()).toString("base64") }],
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ ok: false, erreur: "envoi" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Soumission error", e);
    return NextResponse.json({ ok: false, erreur: "envoi" }, { status: 502 });
  }
}
