import type { Metadata } from "next";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { Agenda } from "@/components/listing/Agenda";
import { ListeEvenements } from "@/components/listing/ListeEvenements";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { villesDe } from "@/lib/listing/villes";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Événements haïtiens — ce week-end et à venir — Tèt Weekend",
  description:
    "Les événements haïtiens à venir, en Haïti et dans la diaspora : bals, concerts kompa, soirées et festivals. Haitian events this weekend and tonight — parties, concerts and kompa nights.",
};

export default async function PageEvenements() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { evenements } = charge.annuaire;
  const aVenir = evenements.filter((e) => !estTermine(e));
  const termines = evenements.filter((e) => estTermine(e)).reverse();
    return (
      <Gabarit>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-black">Agenda</h1>
        {aVenir.length === 0 ? (
          <p className="text-[15px] text-[var(--nuit-texte2)]">Aucun événement à venir pour le moment.</p>
        ) : (
          <Agenda evenements={aVenir} maintenantIso={new Date().toISOString()} villes={villesDe({ lieux: charge.annuaire.lieux, evenements: aVenir }).map((v) => v.nom)} />
        )}
        {termines.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Déjà passés</h2>
            <ListeEvenements evenements={termines} vide="" />
          </section>
        )}
      </Gabarit>
    );
}
