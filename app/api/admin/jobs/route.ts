import { NextResponse } from "next/server";
import { exigerAdminApi } from "@/lib/admin/auth";
import { SLUGS_CONNUS } from "@/lib/admin/catalogue";
import { creerJob, lireJobs } from "@/lib/admin/data";
import { ACTIONS_JOB, type ActionJob } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigerAdminApi();
  if (!auth.ok) return NextResponse.json({ erreur: auth.message }, { status: auth.status });
  try {
    const jobs = await lireJobs(20);
    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await exigerAdminApi();
  if (!auth.ok) return NextResponse.json({ erreur: auth.message }, { status: auth.status });

  let corps: { slug?: string; action?: string; params?: Record<string, unknown> };
  try {
    corps = await req.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const slug = String(corps.slug ?? "").trim();
  const action = String(corps.action ?? "").trim() as ActionJob;
  if (!ACTIONS_JOB.includes(action)) {
    return NextResponse.json(
      { erreur: `Action inconnue : ${action}. Valeurs : ${ACTIONS_JOB.join(", ")}` },
      { status: 400 }
    );
  }
  const slugOk = SLUGS_CONNUS.has(slug) || (action === "etat" && slug === "_global");
  if (!slugOk) {
    return NextResponse.json({ erreur: `Slug inconnu : ${slug}` }, { status: 400 });
  }

  try {
    const job = await creerJob({ slug, action, params: corps.params ?? {} });
    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = /déjà en attente|déjà en cours/i.test(msg) ? 409 : 500;
    return NextResponse.json({ erreur: msg }, { status });
  }
}
