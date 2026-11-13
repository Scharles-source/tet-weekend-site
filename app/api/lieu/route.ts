import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function decoder(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/**
 * Ville approximative du visiteur, d'après les en-têtes de géolocalisation de Vercel (adresse IP, niveau ville).
 * Rien n'est enregistré ni conservé : la réponse sert seulement à ordonner le fil.
 */
export function GET(request: Request) {
  const h = request.headers;
  return NextResponse.json(
    { ville: decoder(h.get("x-vercel-ip-city")), region: h.get("x-vercel-ip-country-region"), pays: h.get("x-vercel-ip-country") },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
