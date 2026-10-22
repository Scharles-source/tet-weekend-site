import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { nomCategorie } from "@/lib/listing/schema";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const nom = nomCategorie(slug) ?? "Catégorie";
  return {
    title: `${nom} haïtiens — Tèt Weekend`,
    description: `${nom} : dates, lieux et artistes.`,
    alternates: { canonical: `https://www.tetweekend.com/categories/${slug}` },
  };
}

export default async function PageCategorie({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const nom = nomCategorie(slug);
  if (!nom) notFound();
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { evenements } = charge.annuaire;
  const ici = evenements.filter((e) => e.categorie === slug);
    const aVenir = ici.filter((e) => !estTermine(e));
    const passes = ici.filter((e) => estTermine(e)).reverse();
    return (
      <Gabarit>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">{nom}</h1>
        <div className="space-y-3">
          {aVenir.length === 0 ? (
            <p className="text-sm text-[var(--text-sec)]">Aucun événement à venir dans cette catégorie.</p>
          ) : (
            aVenir.map((e) => <CarteEvenement key={e.id} evenement={e} />)
          )}
        </div>
        {passes.length > 0 && (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-bold">Déjà passés</h2>
            {passes.map((e) => <CarteEvenement key={e.id} evenement={e} />)}
          </section>
        )}
      </Gabarit>
    );
}
