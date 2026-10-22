import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { dansLeWeekend, estTermine } from "@/lib/listing/dates";
import { slugifier } from "@/lib/listing/slug";
import { villesDe } from "@/lib/listing/villes";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const charge = await chargerAnnuaire();
  const ville = charge.ok ? villesDe(charge.annuaire).find((v) => v.slug === slug) : undefined;
  const nom = ville?.nom ?? slug;
  return {
    title: `Événements haïtiens à ${nom} — Tèt Weekend`,
    description: `Bals, concerts et soirées haïtiens à ${nom}.`,
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
    const ici = annuaire.evenements.filter((e) => (e.ville ? slugifier(e.ville) : "") === slug);
    const weekend = ici.filter((e) => !estTermine(e) && dansLeWeekend(e.date_debut));
    const aVenir = ici.filter((e) => !estTermine(e));
    const lieux = annuaire.lieux.filter((l) => l.ville && slugifier(l.ville) === slug);
    return (
      <Gabarit>
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-extrabold">Événements haïtiens à {ville.nom}</h1>
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Ce weekend</h2>
          {weekend.length === 0 ? (
            <p className="text-sm text-[var(--text-sec)]">Rien de publié pour ce weekend.</p>
          ) : (
            weekend.map((e) => <CarteEvenement key={e.id} evenement={e} />)
          )}
        </section>
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-bold">À venir</h2>
          {aVenir.length === 0 ? (
            <p className="text-sm text-[var(--text-sec)]">Aucun événement à venir.</p>
          ) : (
            aVenir.map((e) => <CarteEvenement key={e.id} evenement={e} />)
          )}
        </section>
        {lieux.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold">Lieux</h2>
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
