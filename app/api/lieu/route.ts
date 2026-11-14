import { NextResponse } from "next/server";
import { positionDepuisEntetes } from "@/lib/listing/proximite";

export const dynamic = "force-dynamic";

/**
 * Position approximative du visiteur, d'après les en-têtes de
 * géolocalisation de Vercel (adresse IP) : ville, région, pays, et le
 * point exact (latitude/longitude) quand Vercel le fournit — c'est lui
 * qui sert de centre au tri radial du fil (voir proximite.ts).
 * Rien n'est enregistré ni conservé : la réponse sert seulement à
 * ordonner le fil.
 */
export function GET(request: Request) {
  return NextResponse.json(positionDepuisEntetes(request.headers), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
