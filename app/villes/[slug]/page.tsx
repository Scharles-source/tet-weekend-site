import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { dansLeWeekend, estTermine } from "@/lib/listing/dates";
import { slugVille, villesDe } from "@/lib/listing/villes";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const charge = await chargerAnnuaire();
  const ville = charge.ok ? villesDe(charge.annuaire).find((v) => v.slug === slug) : undefined;
  const nom = ville?.nom ?? slug;
  return {
    title: `Haitian Events in ${nom} — Tèt Weekend`,
    description: `Haitian events in ${nom}: bals, concerts and kompa parties — this weekend and coming up.`,
    alternates: { canonical: `https://www.tetweekend.com/villes/${slug}` },
  };
}

export default async function PageVille({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const annuaire = charge.annuaire;
    const ville = villesDe(annuaire).find((v) => v.slug === slug);
    if (!ville) notFound();
    const ici = annuaire.evenements.filter((e) => (e.ville ? slugVille(e.ville) : "") === slug);
    const weekend = ici.filter((e) => !estTermine(e) && dansLeWeekend(e.date_debut));
    const idsWeekend = new Set(weekend.map((e) => e.id));
    // « Coming up » ne répète pas « This weekend » (correctif audit 13 nov. 2026).
    const aVenir = ici.filter((e) => !estTermine(e) && !idsWeekend.has(e.id));
    const lieux = annuaire.lieux.filter((l) => l.ville && slugVille(l.ville) === slug);
    return (
      <Gabarit>
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-extrabold">Haitian Events in {ville.nom}</h1>
        <p className="mb-6 text-[15px] text-[#4A4136]">Haitian events in {ville.nom} — this weekend and coming up.</p>
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
          {aVenir.length === 0 ? (
            <p className="text-sm text-[var(--text-sec)]">{weekend.length > 0 ? "No other upcoming events." : "No upcoming events."}</p>
          ) : (
            aVenir.map((e) => <CarteEvenement key={e.id} evenement={e} />)
          )}
        </section>
        {lieux.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold">Venues</h2>
            <ul className="space-y-1 text-sm">
              {lieux.map((l) => (
                <li key={l.id}>
                  <a className="underline" href={`/lieux/${l.slug}`}>{l.nom}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Gabarit>
    );
}
