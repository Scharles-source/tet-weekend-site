import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estEnDecembre, estReveillon, estTermine } from "@/lib/listing/dates";
import { slugifier } from "@/lib/listing/slug";

export const revalidate = 300;

const ANNEE = new Date().getFullYear();
const SITE = "https://www.tetweekend.com";

export const metadata: Metadata = {
  title: `Événements haïtiens en décembre ${ANNEE} — Bals, concerts & réveillon — Tèt Weekend`,
  description: `Tous les événements haïtiens de décembre ${ANNEE} : bals, concerts kompa, soirées et le réveillon du 31 décembre, en Haïti et dans la diaspora.`,
  alternates: { canonical: `${SITE}/decembre` },
  openGraph: {
    title: `Décembre ${ANNEE} — Événements haïtiens`,
    description: `Bals, concerts et soirées haïtiens de décembre ${ANNEE}, jusqu'au réveillon du 31.`,
  },
};

export default async function PageDecembre() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const aVenir = charge.annuaire.evenements.filter((e) => !estTermine(e));
  const parDate = (a: (typeof aVenir)[number], b: (typeof aVenir)[number]) => a.date_debut.localeCompare(b.date_debut);
  const reveillon = aVenir.filter((e) => estReveillon(e, ANNEE)).sort(parDate);
  const decembre = aVenir.filter((e) => estEnDecembre(e, ANNEE) && !estReveillon(e, ANNEE)).sort(parDate);
  const villes = [...new Map([...reveillon, ...decembre].filter((e) => e.ville).map((e) => [slugifier(e.ville as string), e.ville as string])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1], "fr"),
  );
  const tous = [...reveillon, ...decembre].sort(parDate);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Événements haïtiens en décembre ${ANNEE}`,
    itemListElement: tous.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/evenements/${e.slug}`,
    })),
  };

  return (
    <Gabarit>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">Événements haïtiens en décembre {ANNEE}</h1>
      <p className="mt-3 mb-8 max-w-2xl text-[15px] leading-relaxed text-[#4A4136]">
        Décembre, c&apos;est le mois des grandes retrouvailles : bals, concerts kompa, soirées et fêtes de fin d&apos;année, en Haïti comme dans la diaspora —
        jusqu&apos;au <strong>réveillon du 31 décembre</strong> et aux fêtes du <strong>1er janvier</strong>. Cette page rassemble tous les événements haïtiens de
        décembre {ANNEE}, ville par ville, dès que les organisateurs les annoncent.
      </p>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">Réveillon &amp; Jour de l&apos;An</h2>
        {reveillon.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">
            Les bals du 31 décembre et les fêtes du 1er janvier seront annoncés ici dès leur parution.{" "}
            <Link href="/reveillon" className="font-semibold text-[#E02B20] no-underline">
              Voir la page Réveillon
            </Link>
          </p>
        ) : (
          <>
            {reveillon.map((e) => (
              <CarteEvenement key={e.id} evenement={e} />
            ))}
            <p>
              <Link href="/reveillon" className="text-sm font-semibold text-[#E02B20] no-underline">
                Tous les événements du réveillon →
              </Link>
            </p>
          </>
        )}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">Tout le mois de décembre</h2>
        {decembre.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">
            Aucun autre événement de décembre publié pour le moment — les annonces arrivent dès novembre. En attendant,{" "}
            <Link href="/evenements" className="font-semibold text-[#E02B20] no-underline">
              voir tous les événements à venir
            </Link>
            .
          </p>
        ) : (
          decembre.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>

      {villes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">Décembre par ville</h2>
          <ul className="flex flex-wrap gap-2">
            {villes.map(([slug, nom]) => (
              <li key={slug}>
                <Link
                  href={`/villes/${slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-[#E5D9BE] bg-white px-4 text-sm font-semibold text-[#191410] no-underline"
                >
                  {nom}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Gabarit>
  );
}
