import { NextResponse } from "next/server";
import { exigerAdminApi } from "@/lib/admin/auth";
import { lireJob } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await exigerAdminApi();
  if (!auth.ok) return NextResponse.json({ erreur: auth.message }, { status: auth.status });
  const { id } = await ctx.params;
  try {
    const job = await lireJob(id);
    if (!job) return NextResponse.json({ erreur: "Job introuvable." }, { status: 404 });
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 500 });
  }
}
