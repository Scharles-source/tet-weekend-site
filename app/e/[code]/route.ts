import { NextResponse } from "next/server";
import { chargerAnnuaire } from "@/lib/listing/data";
import { codeCourt, estCodeCourt } from "@/lib/listing/lien-court";

export const revalidate = 300;

/** Lien court d'un événement : redirige vers la fiche (en gardant ?s= pour savoir d'où vient le visiteur). */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const origine = new URL(request.url);
  const accueil = new URL("/", origine);
  if (!estCodeCourt(code.toLowerCase())) return NextResponse.redirect(accueil, 307);
  const charge = await chargerAnnuaire();
  if (!charge.ok) return NextResponse.redirect(accueil, 307);
  const evenement = charge.annuaire.evenements.find((e) => codeCourt(e.id) === code.toLowerCase());
  if (!evenement) return NextResponse.redirect(accueil, 307);
  const cible = new URL(`/evenements/${evenement.slug}`, origine);
  const s = origine.searchParams.get("s");
  if (s) cible.searchParams.set("s", s);
  return NextResponse.redirect(cible, 308);
}
