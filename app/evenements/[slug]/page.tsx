import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement, ZoneFlyer } from "@/components/listing/CarteEvenement";
import { lienGoogleAgenda } from "@/lib/listing/calendrier";
import { lireAnnuaire, chargerAnnuaire } from "@/lib/listing/data";
import { estTermine, formaterQuand } from "@/lib/listing/dates";
import { jsonLdEvenement } from "@/lib/listing/jsonld";
import { nomCategorie } from "@/lib/listing/schema";
import { slugifier } from "@/lib/listing/slug";
import type { EvenementPublic } from "@/lib/listing/types";

export const revalidate = 300;

const SITE = "https://www.tetweekend.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { evenements } = await lireAnnuaire();
    const evenement = evenements.find((e) => e.slug === slug);
    if (!evenement) return { title: "Événement — Tèt Weekend" };
    const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(", ");
    const description = [evenement.description, ou].filter(Boolean).join(" — ") || evenement.titre;
    return {
      title: `${evenement.titre} — Tèt Weekend`,
      description,
      alternates: { canonical: `${SITE}/evenements/${evenement.slug}` },
      openGraph: evenement.flyer
        ? {
            title: evenement.titre,
            description,
            images: [{
              url: evenement.flyer.publicUrl,
              width: evenement.flyer.width ?? undefined,
              height: evenement.flyer.height ?? undefined,
              alt: evenement.flyer.alt,
            }],
          }
        : undefined,
    };
  } catch {
    return { title: "Événement — Tèt Weekend" };
  }
}

export default async function PageEvenement({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const evenement = charge.annuaire.evenements.find((e) => e.slug === slug);
  if (!evenement) notFound();
  return <Fiche evenement={evenement} tous={charge.annuaire.evenements} />;
}

function Fiche({ evenement, tous }: { evenement: EvenementPublic; tous: EvenementPublic[] }) {
  const url = `${SITE}/evenements/${evenement.slug}`;
  const termine = estTermine(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const idsArtistes = new Set(evenement.artistes.map((a) => a.id));
  const suivantsArtistes = tous.filter(
    (e) => e.id !== evenement.id && !estTermine(e) && e.artistes.some((a) => idsArtistes.has(a.id)),
  );
  const suivantsLieu = tous.filter(
    (e) => e.id !== evenement.id && !estTermine(e) && evenement.lieu && e.lieu?.id === evenement.lieu.id,
  );
  const questionCarte = [evenement.lieu?.nom, evenement.lieu?.adresse, evenement.ville].filter(Boolean).join(", ");
  const jsonLd = jsonLdEvenement(evenement, url);

  return (
    <Gabarit>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        {termine && (
          <p className="mb-3 rounded-xl bg-[#FDECEA] px-3 py-2 text-sm font-semibold text-[#B91C1C]">
            Événement terminé
          </p>
        )}
        <ZoneFlyer evenement={evenement} />
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-black leading-tight text-[#191410]">{evenement.titre}</h1>
        <p className="mt-2 text-[#4A4136]">{formaterQuand(evenement.date_debut, evenement.fuseau)}</p>
        {evenement.date_fin && (
          <p className="text-sm text-[var(--text-sec)]">Fin : {formaterQuand(evenement.date_fin, evenement.fuseau)}</p>
        )}
        {categorie && (
          <p className="mt-2">
            <Link href={`/categories/${evenement.categorie}`} className="text-sm font-semibold text-[#E02B20] no-underline">
              {categorie}
            </Link>
          </p>
        )}
        <p className="mt-4">
          {evenement.lieu ? (
            <Link href={`/lieux/${evenement.lieu.slug}`} className="font-medium underline">
              {evenement.lieu.nom}
            </Link>
          ) : (
            "Lieu non indiqué"
          )}
          {evenement.ville && (
            <>
              {" · "}
              <Link href={`/villes/${slugifier(evenement.ville)}`} className="underline">
                {evenement.ville}
              </Link>
            </>
          )}
        </p>
        {evenement.lieu?.adresse && <p className="text-sm text-[var(--text-sec)]">{evenement.lieu.adresse}</p>}
        {evenement.artistes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {evenement.artistes.map((a) => (
              <li key={a.id}>
                <Link href={`/artistes/${a.slug}`} className="rounded-full border border-[#EFE5D2] bg-white px-3 py-1 text-[#4A4136] no-underline">
                  {a.nom}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {evenement.prix && <p className="mt-4">Entrée : {evenement.prix}</p>}
        {evenement.description && <p className="mt-4 whitespace-pre-wrap text-[15px]">{evenement.description}</p>}
        {evenement.source_url && (
          <p className="mt-4">
            <a href={evenement.source_url} className="font-semibold text-[#E02B20] no-underline" rel="noreferrer">
              Voir le post d&apos;origine
            </a>
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={lienGoogleAgenda(evenement, url)} className="min-h-11 rounded-full bg-[#E02B20] px-4 py-3 text-sm font-semibold text-white">
            Ajouter à Google Agenda
          </a>
          <a href={`/evenements/${evenement.slug}/calendrier`} className="min-h-11 rounded-full border border-[#EFE5D2] bg-white px-4 py-3 text-sm text-[#191410]">
            Télécharger .ics
          </a>
        </div>
        {questionCarte && (evenement.lieu?.adresse || evenement.ville) && (
          <iframe
            title={`Carte : ${evenement.titre}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(questionCarte)}&z=15&output=embed`}
            className="mt-6 h-56 w-full rounded-[20px] border border-[#EFE5D2]"
            loading="lazy"
          />
        )}
      </article>
      {termine && suivantsArtistes.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-bold">Prochains événements des mêmes artistes</h2>
          {suivantsArtistes.map((e) => (
            <CarteEvenement key={e.id} evenement={e} />
          ))}
        </section>
      )}
      {termine && suivantsLieu.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-bold">Prochains événements du même lieu</h2>
          {suivantsLieu.map((e) => (
            <CarteEvenement key={e.id} evenement={e} />
          ))}
        </section>
      )}
    </Gabarit>
  );
}
