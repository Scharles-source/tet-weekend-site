import { NextResponse } from "next/server";
import { estUuid } from "@/lib/listing/engagement";
import { estRobot, SOURCES } from "@/lib/listing/mesure";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{1,120}$/;

/**
 * Mesure d'audience anonyme : visite, présence « en ligne » et actions (flyer, agenda).
 * Le pays et la ville viennent des en-têtes de l'hébergeur ; rien n'est demandé au téléphone.
 * Les écritures passent par des fonctions SQL qui valident tout (voir la migration 20261113000000).
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) return NextResponse.json({ ok: false }, { status: 503 });
  if (estRobot(request.headers.get("user-agent"))) return NextResponse.json({ ok: true });

  const texte = await request.text();
  if (texte.length > 1024) return NextResponse.json({ ok: false }, { status: 413 });
  let corps: Record<string, unknown>;
  try {
    corps = JSON.parse(texte) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!estUuid(corps.visiteur)) return NextResponse.json({ ok: false }, { status: 400 });
  const appareil = corps.appareil === "ordinateur" ? "ordinateur" : "mobile";
  const slug = typeof corps.slug === "string" && SLUG.test(corps.slug) ? corps.slug : null;

  let fonction: string;
  let args: Record<string, unknown>;
  if (corps.type === "vue") {
    const chemin = typeof corps.chemin === "string" ? corps.chemin : "";
    if (!chemin.startsWith("/") || chemin.length > 200) return NextResponse.json({ ok: false }, { status: 400 });
    const source = typeof corps.source === "string" && (SOURCES as readonly string[]).includes(corps.source) ? corps.source : "autre";
    fonction = "enregistrer_visite";
    args = {
      p_visiteur: corps.visiteur,
      p_chemin: chemin,
      p_slug: slug,
      p_source: source,
      p_pays: request.headers.get("x-vercel-ip-country"),
      p_ville: ville(request.headers.get("x-vercel-ip-city")),
      p_appareil: appareil,
    };
  } else if (corps.type === "ping") {
    fonction = "signaler_presence";
    args = { p_visiteur: corps.visiteur, p_appareil: appareil };
  } else if (corps.type === "action" && (corps.action === "agenda" || corps.action === "flyer") && slug) {
    fonction = "enregistrer_action";
    args = { p_visiteur: corps.visiteur, p_type: corps.action, p_slug: slug };
  } else {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fonction}`, {
      method: "POST",
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}

function ville(brut: string | null): string | null {
  if (!brut) return null;
  try {
    return decodeURIComponent(brut).slice(0, 80);
  } catch {
    return brut.slice(0, 80);
  }
}
