import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import { chargerAnnuaire, urlFacebook, urlInstagram, urlSite } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const charge = await chargerAnnuaire();
  const artiste = charge.ok ? charge.annuaire.artistes.find((a) => a.slug === slug) : undefined;
  if (!artiste) {
    return {
      title: "Artiste — Tèt Weekend",
      alternates: { canonical: `https://www.tetweekend.com/artistes/${slug}` },
    };
  }
  const typeLabel = artiste.type === "groupe" ? "Groupe haïtien" : artiste.type === "chanteur" ? "Chanteur haïtien" : artiste.type === "DJ" ? "DJ haïtien" : "Artiste haïtien";
  const base = artiste.ville_base ? ` basé à ${artiste.ville_base}` : "";
  const description = artiste.bio?.trim()
    ? artiste.bio.trim().slice(0, 155)
    : `${artiste.nom} (${typeLabel.toLowerCase()})${base} : ses prochains concerts, bals et soirées haïtiens, sur Tèt Weekend.`;
  return {
    title: `${artiste.nom} — ${typeLabel} — Tèt Weekend`,
    description,
    alternates: { canonical: `https://www.tetweekend.com/artistes/${slug}` },
  };
}

export default async function PageArtiste({ params }: { params: Promise<{ slug: string }> }) {
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
    const artiste = annuaire.artistes.find((a) => a.slug === slug);
    if (!artiste) notFound();
    const dates = annuaire.evenements.filter((e) => e.artistes.some((a) => a.id === artiste.id));
    const aVenir = dates.filter((e) => !estTermine(e));
    const passes = dates.filter((e) => estTermine(e)).reverse();
    const lieux = new Map<string, { slug: string; nom: string }>();
    for (const e of dates) {
      if (e.lieu) lieux.set(e.lieu.id, { slug: e.lieu.slug, nom: e.lieu.nom });
    }
    return (
      <Gabarit>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{artiste.nom}</h1>
        <p className="mt-2 text-sm text-[var(--text-sec)]">{[artiste.type, artiste.ville_base].filter(Boolean).join(" · ")}</p>
        {artiste.bio && <p className="mt-4 whitespace-pre-wrap">{artiste.bio}</p>}
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          {urlInstagram(artiste.instagram) && (
            <li><a className="underline" href={urlInstagram(artiste.instagram) as string}>Instagram</a></li>
          )}
          {urlFacebook(artiste.facebook) && (
            <li><a className="underline" href={urlFacebook(artiste.facebook) as string}>Facebook</a></li>
          )}
          {urlSite(artiste.site_web) && (
            <li><a className="underline" href={urlSite(artiste.site_web) as string}>Site</a></li>
          )}
        </ul>
        {lieux.size > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-bold">Lieux</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {[...lieux.values()].map((l) => (
                <li key={l.slug}>
                  <Link href={`/lieux/${l.slug}`} className="rounded-full border border-[#EFE5D2] bg-white px-3 py-1 text-[#4A4136] no-underline">{l.nom}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-bold">Dates à venir</h2>
          {aVenir.length === 0 ? <p className="text-sm text-[var(--text-sec)]">Aucune date à venir.</p> : aVenir.map((e) => <CarteEvenement key={e.id} evenement={e} />)}
        </section>
        {passes.length > 0 && (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-bold">Dates passées</h2>
            {passes.map((e) => <CarteEvenement key={e.id} evenement={e} />)}
          </section>
        )}
      </Gabarit>
    );
}
