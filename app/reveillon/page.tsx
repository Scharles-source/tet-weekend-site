import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estReveillon, estTermine } from "@/lib/listing/dates";

export const revalidate = 300;

const ANNEE = new Date().getFullYear();
const SITE = "https://www.tetweekend.com";

export const metadata: Metadata = {
  title: `Haitian New Year's Eve ${ANNEE} — December 31 Bals & January 1 Parties — Tèt Weekend`,
  description: `Where to ring in the New Year, Haitian style? December 31, ${ANNEE} bals and January 1, ${ANNEE + 1} parties (soup joumou), in Haiti and across the diaspora.`,
  alternates: { canonical: `${SITE}/reveillon` },
  openGraph: {
    title: `Haitian New Year's Eve ${ANNEE} — December 31 & January 1`,
    description: `The Haitian community's December 31 bals and New Year's Day parties, all in one place.`,
  },
};

export default async function PageReveillon() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const events = charge.annuaire.evenements
    .filter((e) => !estTermine(e) && estReveillon(e, ANNEE))
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Haitian New Year's Eve ${ANNEE} — December 31 & January 1`,
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/evenements/${e.slug}`,
    })),
  };

  return (
    <Gabarit>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">Haitian New Year&apos;s Eve &amp; New Year&apos;s Day</h1>
      <p className="mt-3 mb-8 max-w-2xl text-[15px] leading-relaxed text-[#4A4136]">
        On the night of <strong>December 31</strong>, the Haitian community dances: kompa bals, concerts and big parties, in Haiti and across the diaspora. And on{" "}
        <strong>January 1</strong>, Independence Day is celebrated around soup joumou — often with a party. This page gathers every New Year&apos;s Eve {ANNEE} and
        New Year&apos;s Day {ANNEE + 1} event, as soon as organizers announce them.
      </p>

      <section className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">
            No New Year&apos;s Eve events published yet — organizers announce their bals starting in November. Check back soon, or browse{" "}
            <Link href="/decembre" className="font-semibold text-[#E02B20] no-underline">
              all December events
            </Link>
            .
          </p>
        ) : (
          events.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>

      <p className="mt-10">
        <Link href="/decembre" className="text-sm font-semibold text-[#E02B20] no-underline">
          ← All Haitian events in December {ANNEE}
        </Link>
      </p>
    </Gabarit>
  );
}
