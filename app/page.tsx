import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { ListeEvenements } from "@/components/listing/ListeEvenements";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { CATEGORIES } from "@/lib/listing/schema";
import { villesDe } from "@/lib/listing/villes";

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
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { annuaire } = charge;
  const aVenir = annuaire.evenements.filter((e) => !estTermine(e));
  const villes = villesDe(annuaire);
    return (
      <Gabarit>
        <header className="mb-6">
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-[clamp(28px,6vw,42px)] font-extrabold leading-tight">
            Où et quand ça se passe
          </h1>
          <p className="text-[15px] text-[var(--text-sec)]">
            Bals, concerts, soirées et festivals haïtiens — Haïti et la diaspora. On indique le lieu et l&apos;heure.
            On ne vend pas de billets.
          </p>
        </header>
        <ListeEvenements evenements={aVenir} vide="Aucun événement à venir pour le moment." />
        <nav className="mt-8 space-y-3 text-sm">
          <p className="font-medium">Catégories</p>
          <ul className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="rounded-full border border-white/15 px-3 py-2">
                  {c.nom}
                </Link>
              </li>
            ))}
          </ul>
          {villes.length > 0 && (
            <>
              <p className="font-medium">Villes</p>
              <ul className="flex flex-wrap gap-2">
                {villes.map((v) => (
                  <li key={v.slug}>
                    <Link href={`/villes/${v.slug}`} className="rounded-full border border-white/15 px-3 py-2">
                      {v.nom}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </Gabarit>
    );
}
