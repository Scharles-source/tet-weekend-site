import type { Metadata } from "next";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { Recherche } from "@/components/listing/Recherche";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { villesDe } from "@/lib/listing/villes";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Rechercher une soirée — Tèt Weekend",
  description: "Cherche un événement, un DJ, un lieu ou une ville, avec des filtres par moment, catégorie et prix.",
  robots: { index: false },
};

export default async function PageRecherche() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { annuaire } = charge;
  const evenements = annuaire.evenements.filter((e) => !estTermine(e));
  const villes = villesDe({ lieux: annuaire.lieux, evenements }).map((v) => v.nom);
  return (
    <Gabarit>
      <Recherche donnees={{ evenements, artistes: annuaire.artistes, lieux: annuaire.lieux }} villes={villes} />
    </Gabarit>
  );
}
