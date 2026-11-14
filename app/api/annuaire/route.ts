import { NextResponse } from "next/server";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import type { EvenementPublic } from "@/lib/listing/types";

export const dynamic = "force-dynamic";

/**
 * Liste complète à venir, en version allégée (correctif audit 13 nov.
 * 2026) : la page d'accueil ne charge plus les ~150 événements dans son
 * HTML initial (508 Ko mesurés) — elle rend un premier jeu côté serveur et
 * le navigateur ne vient chercher la liste complète ici que lorsqu'un
 * filtre ville/moment est activé. Les champs lourds et inutiles aux cartes
 * (description, sources) ne voyagent pas ; les badges de rareté, eux, sont
 * pré-calculés au chargement (badges_rarete).
 */
function allege(e: EvenementPublic): EvenementPublic {
  return {
    id: e.id,
    slug: e.slug,
    titre: e.titre,
    date_debut: e.date_debut,
    date_fin: e.date_fin,
    ville: e.ville,
    description: null,
    prix: e.prix,
    source: null,
    source_url: null,
    source_account: null,
    categorie: e.categorie,
    fuseau: e.fuseau,
    lieu: e.lieu
      ? {
          id: e.lieu.id,
          slug: e.lieu.slug,
          nom: e.lieu.nom,
          ville: e.lieu.ville,
          pays: e.lieu.pays,
          adresse: e.lieu.adresse,
          type: e.lieu.type,
          description: null,
          instagram: null,
          facebook: null,
          site_web: null,
        }
      : null,
    lieu_nom: e.lieu_nom ?? null,
    artistes: e.artistes.map((a) => ({
      id: a.id,
      slug: a.slug,
      nom: a.nom,
      type: null,
      ville_base: null,
      bio: null,
      instagram: null,
      facebook: null,
      site_web: null,
    })),
    flyer: e.flyer,
    sponsored_from: null,
    sponsored_to: null,
    vues: e.vues,
    ajoute_le: e.ajoute_le ?? null,
    interets: e.interets ?? null,
    vues_jour: e.vues_jour ?? null,
    rang_ville: e.rang_ville ?? null,
    badges_rarete: e.badges_rarete ?? null,
  };
}

export async function GET() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return NextResponse.json({ evenements: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const evenements = charge.annuaire.evenements.filter((e) => !estTermine(e)).map(allege);
  return NextResponse.json(
    { evenements },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300" } },
  );
}
