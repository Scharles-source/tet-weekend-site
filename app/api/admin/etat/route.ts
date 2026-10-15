import { NextResponse } from "next/server";
import { exigerAdminApi } from "@/lib/admin/auth";
import { lireEtats, lireRunner } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigerAdminApi();
  if (!auth.ok) return NextResponse.json({ erreur: auth.message }, { status: auth.status });
  try {
    const [etats, runner] = await Promise.all([lireEtats(), lireRunner()]);
    return NextResponse.json({ etats, runner });
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 500 });
  }
}
