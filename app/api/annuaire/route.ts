import { NextResponse } from "next/server";
import { chargerAnnuaire, evenementAllege } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";

export const dynamic = "force-dynamic";

/**
 * Liste complète à venir, en version allégée (correctif audit 13 nov.
 * 2026) : la page d'accueil ne charge plus les ~150 événements dans son
 * HTML initial (508 Ko mesurés) — elle rend un premier jeu côté serveur et
 * le navigateur ne vient chercher la liste complète ici que lorsqu'un
 * filtre ville/moment est activé. Les champs lourds et inutiles aux cartes
 * (description, sources, prix) ne voyagent pas ; les badges de rareté, eux,
 * sont pré-calculés au chargement (badges_rarete).
 */
export async function GET() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return NextResponse.json({ evenements: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const evenements = charge.annuaire.evenements.filter((e) => !estTermine(e)).map(evenementAllege);
  return NextResponse.json(
    { evenements },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300" } },
  );
}
