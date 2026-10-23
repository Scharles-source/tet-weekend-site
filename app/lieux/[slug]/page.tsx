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
  return { title: `${slug} — Lieu — Tèt Weekend`, alternates: { canonical: `https://www.tetweekend.com/lieux/${slug}` } };
}

export default async function PageLieu({ params }: { params: Promise<{ slug: string }> }) {
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
    const lieu = annuaire.lieux.find((l) => l.slug === slug);
    if (!lieu) notFound();
    const ici = annuaire.evenements.filter((e) => e.lieu?.id === lieu.id);
    const aVenir = ici.filter((e) => !estTermine(e));
    const passes = ici.filter((e) => estTermine(e)).reverse();
    const question = [lieu.nom, lieu.adresse, lieu.ville, lieu.pays].filter(Boolean).join(", ");
    const instagram = urlInstagram(lieu.instagram);
    const facebook = urlFacebook(lieu.facebook);
    const site = urlSite(lieu.site_web);
    return (
      <Gabarit>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{lieu.nom}</h1>
        <p className="mt-2 text-sm text-[var(--text-sec)]">{[lieu.type, lieu.ville, lieu.pays].filter(Boolean).join(" · ")}</p>
        {lieu.adresse && <p className="mt-1">{lieu.adresse}</p>}
        {lieu.description && <p className="mt-4 whitespace-pre-wrap">{lieu.description}</p>}
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          {instagram && (
            <li>
              <a className="underline" href={instagram}>Instagram</a>
            </li>
          )}
          {facebook && (
            <li>
              <a className="underline" href={facebook}>Facebook</a>
            </li>
          )}
          {site && (
            <li>
              <a className="underline" href={site}>Site</a>
            </li>
          )}
          {lieu.ville && (
            <li>
              <Link className="underline" href={`/villes/${slugVille(lieu.ville)}`}>
                Événements à {lieu.ville}
              </Link>
            </li>
          )}
        </ul>
        {(lieu.adresse || lieu.ville) && (
          <iframe
            title={`Carte : ${lieu.nom}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(question)}&z=15&output=embed`}
            className="mt-6 h-56 w-full rounded-[20px] border border-[#EFE5D2]"
            loading="lazy"
          />
        )}
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-bold">À venir</h2>
          {aVenir.length === 0 ? <p className="text-sm text-[var(--text-sec)]">Aucun événement à venir.</p> : aVenir.map((e) => <CarteEvenement key={e.id} evenement={e} />)}
        </section>
        {passes.length > 0 && (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-bold">Déjà passés</h2>
            {passes.map((e) => (
              <CarteEvenement key={e.id} evenement={e} />
            ))}
          </section>
        )}
      </Gabarit>
    );
}

function slugVille(nom: string): string {
  return nom.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
