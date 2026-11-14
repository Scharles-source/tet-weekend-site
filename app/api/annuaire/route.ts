import { NextResponse } from "next/server";
import { chargerAnnuaire, evenementAllege } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { POSITION_DEFAUT, pointDeReference, positionDepuisEntetes, positionDetecteeFiable, trierParDistance } from "@/lib/listing/proximite";

export const dynamic = "force-dynamic";

/**
 * Liste complète à venir, en version allégée (correctif audit 13 nov.
 * 2026) : la page d'accueil ne charge plus les ~150 événements dans son
 * HTML initial (508 Ko mesurés) — elle rend un premier jeu côté serveur et
 * le navigateur ne vient chercher la liste complète ici que lorsqu'un
 * filtre ville/moment est activé. Les champs lourds et inutiles aux cartes
 * (description, sources, prix) ne voyagent pas ; les badges de rareté, eux,
 * sont pré-calculés au chargement (badges_rarete).
 *
 * La liste part triée en radial (13 nov. 2026, demande de Smith) : par
 * distance croissante depuis le point du visiteur, lu dans les en-têtes
 * de géolocalisation de la requête — même point, même règle que le tri de
 * l'accueil. La réponse dépend donc du visiteur : elle n'est plus mise en
 * cache partagé, seulement en cache privé de son navigateur. Les données
 * elles-mêmes restent servies par le chargement mis en cache de
 * l'annuaire, donc le coût par requête reste faible. Quand le visiteur a
 * choisi une ville à la main, le navigateur retrie de toute façon sa
 * copie avec cette ville — qui prime sur la détection.
 */
export async function GET(request: Request) {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return NextResponse.json({ evenements: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const aVenir = charge.annuaire.evenements.filter((e) => !estTermine(e));
  const villes = new Set<string>();
  for (const e of charge.annuaire.evenements) {
    if (e.ville) villes.add(e.ville);
    if (e.lieu?.ville) villes.add(e.lieu.ville);
  }
  const detectee = positionDetecteeFiable(positionDepuisEntetes(request.headers), [...villes]);
  const point = pointDeReference(detectee) ?? pointDeReference(POSITION_DEFAUT);
  const evenements = trierParDistance(aVenir, point).map(evenementAllege);
  return NextResponse.json(
    { evenements },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
