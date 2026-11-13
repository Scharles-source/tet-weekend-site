import { notFound } from "next/navigation";
import { DashboardListing } from "@/components/admin/DashboardListing";
import type { ArtisteAdmin, CompteAdmin, EvenementAdmin, LieuAdmin } from "@/lib/admin/charger";
import { periodeValide, type Statistiques } from "@/lib/admin/statistiques-pures";

export const dynamic = "force-dynamic";

const lieu: LieuAdmin = {
  id: "lieu-1",
  slug: "sobs",
  nom: "SOB's",
  ville: "New York",
  pays: "États-Unis",
  adresse: "204 Varick St",
  type: "club",
  description: null,
  instagram: null,
  facebook: null,
  site_web: null,
  statut: "publie",
};

const artiste: ArtisteAdmin = {
  id: "art-1",
  slug: "mia-belle",
  nom: "Mia Belle",
  type: "DJ",
  ville_base: "New York",
  bio: null,
  instagram: null,
  facebook: null,
  site_web: null,
  statut: "publie",
};

function evenement(partiel: Partial<EvenementAdmin> & Pick<EvenementAdmin, "id" | "slug" | "titre" | "date_debut" | "statut">): EvenementAdmin {
  return {
    date_fin: null,
    venue_id: lieu.id,
    ville: "New York",
    description: "Soirée de démonstration, hors production.",
    prix: null,
    source: "instagram",
    source_url: "https://instagram.com/p/apercu-admin",
    source_account: "@apercu",
    spotted_at: "2026-10-22T18:00:00.000Z",
    categorie: "soirees-kompa",
    fuseau: "America/New_York",
    a_verifier: false,
    artist_ids: [artiste.id],
    flyer_storage_path: null,
    flyer_url: null,
    flyer_card_url: null,
    flyer_width: null,
    flyer_height: null,
    flyer_mime_type: null,
    flyer_alt: null,
    flyer_credit: null,
    flyer_hidden_at: null,
    flyer_hidden_reason: null,
    sponsored_from: null,
    sponsored_to: null,
    ...partiel,
  };
}

/** Chiffres fictifs, pour voir la mise en page (page de développement uniquement). */
const STATS: Statistiques = {
  periode: "aujourdhui",
  heure_actuelle: 14,
  en_ligne: { total: 12, mobile: 9, ordinateur: 3 },
  visiteurs: 148,
  pages_vues: 391,
  visiteurs_hier_meme_heure: 125,
  pages_vues_hier_meme_heure: 358,
  jy_vais: 23,
  jy_vais_hier_meme_heure: 18,
  actions: { agenda: 12, flyer: 18 },
  serie_type: "heure",
  serie: Array.from({ length: 24 }, (_, h) => ({ x: String(h), n: [2, 1, 1, 0, 0, 1, 3, 6, 9, 11, 13, 15, 18, 22, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0][h] })),
  serie_precedente: [2, 2, 1, 1, 1, 2, 3, 5, 8, 10, 12, 14, 15, 17, 19, 21, 24, 28, 26, 22, 15, 9, 5, 3],
  sources: [{ nom: "instagram", n: 68 }, { nom: "whatsapp", n: 40 }, { nom: "direct", n: 22 }, { nom: "google", n: 10 }, { nom: "facebook", n: 8 }],
  pays: [{ code: "HT", n: 80 }, { code: "US", n: 41 }, { code: "CA", n: 18 }, { code: "FR", n: 9 }],
  villes: [{ nom: "Port-au-Prince", pays: "HT", n: 47 }, { nom: "Miami", pays: "US", n: 23 }, { nom: "Montréal", pays: "CA", n: 15 }, { nom: "New York", pays: "US", n: 12 }],
  localisation: { haiti: 80, diaspora: 68, inconnu: 0 },
  appareils: { mobile: 120, ordinateur: 28 },
  evenements: [
    { id: "e2", titre: "Bal Kompa du Vendredi", ville: "Pétion-Ville", date_debut: "2026-11-14T23:00:00.000Z", statut: "publie", vues: 74, flyers: 18, agendas: 7, interets: 31 },
    { id: "e3", titre: "Festival de Décembre", ville: "Jacmel", date_debut: "2026-12-06T20:00:00.000Z", statut: "publie", vues: 52, flyers: 11, agendas: 5, interets: 12 },
    { id: "e4", titre: "Concert Plein Air", ville: "Cap-Haïtien", date_debut: "2026-11-15T22:00:00.000Z", statut: "publie", vues: 41, flyers: 6, agendas: 0, interets: 9 },
  ],
};

export default async function PageApercuAdmin({ searchParams }: { searchParams: Promise<{ section?: string; periode?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { section = "evenements", periode: brute } = await searchParams;
  const periode = periodeValide(brute);
  const stats: Statistiques = periode === "aujourdhui" ? STATS : { ...STATS, periode, serie_type: "jour", serie_precedente: null, serie: Array.from({ length: periode === "7j" ? 7 : 30 }, (_, i) => ({ x: `${String(i + 1).padStart(2, "0")}/11`, n: 80 + ((i * 37) % 70) })) };
  return (
    <DashboardListing
      email="apercu@local"
      section={section}
      periode={periode}
      stats={stats}
      extras={{ aValider: 3, engagement: {} }}
      maintenantIso={new Date().toISOString()}
      lieux={[lieu]}
      artistes={[artiste]}
      comptes={[] as CompteAdmin[]}
      evenements={[
        evenement({ id: "e1", slug: "sak-pase-apercu", titre: "Sak Pasé — aperçu", date_debut: "2026-10-24T03:00:00.000Z", date_fin: "2026-10-24T08:00:00.000Z", statut: "brouillon" }),
        evenement({ id: "e2", slug: "akuna-apercu", titre: "AKUNA — aperçu", date_debut: "2026-10-18T02:00:00.000Z", statut: "publie", prix: "30 $ US", ville: "Pétion-Ville", venue_id: null }),
      ]}
    />
  );
}
