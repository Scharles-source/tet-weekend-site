import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { chargerAnnuaire } from "@/lib/listing/data";
import { villesDe } from "@/lib/listing/villes";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Villes — Tèt Weekend",
  description: "Événements haïtiens par ville, en Haïti et dans la diaspora.",
};

export default async function PageVilles() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const villes = villesDe(charge.annuaire);
  return (
      <Gabarit>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">Villes</h1>
        {villes.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">Aucune ville publiée pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {villes.map((v) => (
              <li key={v.slug}>
                <Link href={`/villes/${v.slug}`} className="underline">Événements haïtiens à {v.nom}</Link>
              </li>
            ))}
          </ul>
        )}
      </Gabarit>
    );
}
