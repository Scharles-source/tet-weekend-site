import { notFound } from "next/navigation";
import { DashboardListing } from "@/components/admin/DashboardListing";
import type { ArtisteAdmin, CompteAdmin, EvenementAdmin, LieuAdmin } from "@/lib/admin/charger";

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

export default function PageApercuAdmin() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <DashboardListing
      email="apercu@local"
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
