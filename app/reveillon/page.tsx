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
  title: `Réveillon haïtien ${ANNEE} — Bals du 31 décembre & fêtes du 1er janvier — Tèt Weekend`,
  description: `Où fêter le réveillon en mode haïtien ? Bals du 31 décembre ${ANNEE} et fêtes du 1er janvier ${ANNEE + 1} (soup joumou), en Haïti et dans la diaspora.`,
  alternates: { canonical: `${SITE}/reveillon` },
  openGraph: {
    title: `Réveillon haïtien ${ANNEE} — 31 décembre & 1er janvier`,
    description: `Les bals du 31 décembre et les fêtes du Jour de l'An de la communauté haïtienne, au même endroit.`,
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
    name: `Réveillon haïtien ${ANNEE} — 31 décembre & 1er janvier`,
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/evenements/${e.slug}`,
    })),
  };

  return (
    <Gabarit>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">Réveillon &amp; Jour de l&apos;An haïtiens</h1>
      <p className="mt-3 mb-8 max-w-2xl text-[15px] leading-relaxed text-[#4A4136]">
        La nuit du <strong>31 décembre</strong>, la communauté haïtienne danse : bals kompa, concerts et grandes soirées, en Haïti comme dans la diaspora. Et le{" "}
        <strong>1er janvier</strong>, on célèbre l&apos;Indépendance autour de la soup joumou — souvent avec une fête. Cette page rassemble tous les événements du
        réveillon {ANNEE} et du Jour de l&apos;An {ANNEE + 1}, dès que les organisateurs les annoncent.
      </p>

      <section className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">
            Aucun événement du réveillon publié pour le moment — les organisateurs annoncent leurs bals dès novembre. Revenez bientôt, ou parcourez{" "}
            <Link href="/decembre" className="font-semibold text-[#E02B20] no-underline">
              tous les événements de décembre
            </Link>
            .
          </p>
        ) : (
          events.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>

      <p className="mt-10">
        <Link href="/decembre" className="text-sm font-semibold text-[#E02B20] no-underline">
          ← Tous les événements haïtiens de décembre {ANNEE}
        </Link>
      </p>
    </Gabarit>
  );
}
