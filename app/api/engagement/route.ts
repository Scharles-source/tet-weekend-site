import { NextResponse } from "next/server";
import { estUuid } from "@/lib/listing/engagement";

export const dynamic = "force-dynamic";

/** Enregistre une vue ou bascule « J'y vais ». Les écritures passent par des fonctions SQL qui vérifient que l'événement est publié. */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) return NextResponse.json({ ok: false }, { status: 503 });

  const texte = await request.text();
  if (texte.length > 1024) return NextResponse.json({ ok: false }, { status: 413 });
  let corps: { type?: unknown; evenementId?: unknown; visiteur?: unknown };
  try {
    corps = JSON.parse(texte);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if ((corps.type !== "vue" && corps.type !== "interet") || !estUuid(corps.evenementId) || !estUuid(corps.visiteur)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // « I'm in » est définitif : confirmer_interet ajoute le visiteur une seule fois et ne le retire jamais.
  // Tant que la migration correspondante n'est pas appliquée, on retombe sur l'ancienne fonction.
  const fonction = corps.type === "vue" ? "enregistrer_vue" : "confirmer_interet";
  const appeler = (nom: string) =>
    fetch(`${url}/rest/v1/rpc/${nom}`, {
      method: "POST",
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_event: corps.evenementId, p_visiteur: corps.visiteur }),
      cache: "no-store",
    });
  try {
    let res = await appeler(fonction);
    if (corps.type === "interet" && res.status === 404) res = await appeler("basculer_interet");
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
    if (corps.type === "vue") return NextResponse.json({ ok: true });
    const r = (await res.json()) as { interesse?: boolean; total?: number };
    return NextResponse.json({ ok: true, interesse: Boolean(r.interesse), total: Number(r.total ?? 0) });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
