import type { Metadata } from "next";
import { AccueilPublic } from "@/components/listing/AccueilPublic";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { choisirBanniere } from "@/lib/listing/banniere";
import { chargerAnnuaire, emailContact } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tèt Weekend — Événements haïtiens",
  description:
    "Où et quand ont lieu les bals, concerts et soirées haïtiens, en Haïti et dans la diaspora. Tèt Weekend ne vend pas de billets.",
};

export default async function Accueil() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit large>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const aVenir = charge.annuaire.evenements.filter((e) => !estTermine(e));
  const email = await emailContact();
  return (
    <Gabarit large>
      <AccueilPublic evenements={aVenir} panneaux={choisirBanniere(aVenir)} email={email} />
    </Gabarit>
  );
}
