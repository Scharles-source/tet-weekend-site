import type { Metadata } from "next";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { ListeEvenements } from "@/components/listing/ListeEvenements";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Événements haïtiens — Tèt Weekend",
  description: "Les événements haïtiens à venir, en Haïti et dans la diaspora.",
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
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">Événements</h1>
        <ListeEvenements evenements={aVenir} vide="Aucun événement à venir pour le moment." />
        {termines.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Déjà passés</h2>
            <ListeEvenements evenements={termines} vide="" />
          </section>
        )}
      </Gabarit>
    );
}
