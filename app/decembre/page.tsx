import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estEnDecembre, estReveillon, estTermine } from "@/lib/listing/dates";
import { nomVilleCanonique, slugVille } from "@/lib/listing/villes";

export const revalidate = 300;

const ANNEE = new Date().getFullYear();
const SITE = "https://www.tetweekend.com";

export const metadata: Metadata = {
  title: `Haitian Events in December ${ANNEE} — Bals, Concerts & New Year's Eve — Tèt Weekend`,
  description: `All the Haitian events of December ${ANNEE}: bals, kompa concerts, parties and New Year's Eve on December 31, in Haiti and across the diaspora.`,
  alternates: { canonical: `${SITE}/decembre` },
  openGraph: {
    title: `December ${ANNEE} — Haitian Events`,
    description: `Haitian bals, concerts and parties of December ${ANNEE}, up to New Year's Eve on the 31st.`,
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
  const villes = [...new Map([...reveillon, ...decembre].filter((e) => e.ville).map((e) => [slugVille(e.ville as string), nomVilleCanonique(e.ville as string)])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1], "fr"),
  );
  const tous = [...reveillon, ...decembre].sort(parDate);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Haitian Events in December ${ANNEE}`,
    itemListElement: tous.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/evenements/${e.slug}`,
    })),
  };

  return (
    <Gabarit>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">Haitian Events in December {ANNEE}</h1>
      <p className="mt-3 mb-8 max-w-2xl text-[15px] leading-relaxed text-[#4A4136]">
        December is the month of the big homecomings: bals, kompa concerts, parties and year-end celebrations, in Haiti and across the diaspora —
        all the way to <strong>New Year&apos;s Eve on December 31</strong> and the <strong>January 1</strong> celebrations. This page gathers every Haitian event of
        December {ANNEE}, city by city, as soon as organizers announce them.
      </p>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">New Year&apos;s Eve &amp; New Year&apos;s Day</h2>
        {reveillon.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">
            The December 31 bals and January 1 celebrations will be announced here as soon as they are published.{" "}
            <Link href="/reveillon" className="font-semibold text-[#E02B20] no-underline">
              See the New Year&apos;s Eve page
            </Link>
          </p>
        ) : (
          <>
            {reveillon.map((e) => (
              <CarteEvenement key={e.id} evenement={e} />
            ))}
            <p>
              <Link href="/reveillon" className="text-sm font-semibold text-[#E02B20] no-underline">
                All New Year&apos;s Eve events →
              </Link>
            </p>
          </>
        )}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">All of December</h2>
        {decembre.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">
            No other December events published yet — announcements start in November. In the meantime,{" "}
            <Link href="/evenements" className="font-semibold text-[#E02B20] no-underline">
              see all upcoming events
            </Link>
            .
          </p>
        ) : (
          decembre.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>

      {villes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">December by city</h2>
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
