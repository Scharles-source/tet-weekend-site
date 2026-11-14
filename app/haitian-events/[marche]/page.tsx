import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { dansLeWeekend, estTermine } from "@/lib/listing/dates";
import { evenementDuMarche, marcheParSlug, MARCHES } from "@/lib/listing/marches";
import { slugVille, villesDe } from "@/lib/listing/villes";

export const revalidate = 300;

const SITE = "https://www.tetweekend.com";

export async function generateMetadata({ params }: { params: Promise<{ marche: string }> }): Promise<Metadata> {
  const { marche: slug } = await params;
  const marche = marcheParSlug(slug);
  if (!marche) return { title: "Tèt Weekend" };
  return {
    title: `${marche.titre} — Tèt Weekend`,
    description: marche.description,
    alternates: { canonical: `${SITE}/haitian-events/${marche.slug}` },
  };
}

export default async function PageMarche({ params }: { params: Promise<{ marche: string }> }) {
  const { marche: slug } = await params;
  const marche = marcheParSlug(slug);
  if (!marche) notFound();
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const annuaire = charge.annuaire;
  const ici = annuaire.evenements.filter((e) => evenementDuMarche(e, marche));
  const aVenir = ici.filter((e) => !estTermine(e));
  const weekend = aVenir.filter((e) => dansLeWeekend(e.date_debut));
  const idsWeekend = new Set(weekend.map((e) => e.id));
  // « Coming up » ne répète pas « This weekend » (correctif audit 13 nov. 2026).
  const aVenirApres = aVenir.filter((e) => !idsWeekend.has(e.id));
  const slugsMarches = new Set(marche.villes.map((v) => slugVille(v)));
  const villes = villesDe({ lieux: [], evenements: aVenir }).filter((v) => slugsMarches.has(v.slug));
  const autres = MARCHES.filter((m) => m.slug !== marche.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: marche.titre,
    itemListElement: aVenir.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/evenements/${e.slug}`,
    })),
  };
  return (
    <Gabarit>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-extrabold">Haitian Events in {marche.nom}</h1>
      <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-[#4A4136]">{marche.intro}</p>
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">This weekend</h2>
        {weekend.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">Nothing published for this weekend.</p>
        ) : (
          weekend.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>
      <section className="mt-8 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">Coming up</h2>
        {aVenirApres.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">{weekend.length > 0 ? "No other upcoming events." : "No upcoming events."}</p>
        ) : (
          aVenirApres.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>
      {villes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">Cities in {marche.nom}</h2>
          <ul className="flex flex-wrap gap-2">
            {villes.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/villes/${v.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-[#E5D9BE] bg-white px-4 text-sm font-semibold text-[#191410] no-underline"
                >
                  {v.nom}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-10">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">More markets</h2>
        <ul className="flex flex-wrap gap-2">
          {autres.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/haitian-events/${m.slug}`}
                className="inline-flex min-h-10 items-center rounded-full border border-[#E5D9BE] bg-white px-4 text-sm font-semibold text-[#191410] no-underline"
              >
                Haitian Events in {m.nom}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Gabarit>
  );
}
