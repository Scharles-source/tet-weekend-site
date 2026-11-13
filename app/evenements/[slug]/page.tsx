import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { CarteEvenement, ZoneFlyer } from "@/components/listing/CarteEvenement";
import { Engagement } from "@/components/listing/Engagement";
import { lienGoogleAgenda } from "@/lib/listing/calendrier";
import { lireAnnuaire, chargerAnnuaire } from "@/lib/listing/data";
import { estTermine, formaterQuand } from "@/lib/listing/dates";
import { artistesDepuisDescription, lieuDepuisDescription } from "@/lib/listing/faits";
import { jsonLdEvenement } from "@/lib/listing/jsonld";
import { nomCategorie } from "@/lib/listing/schema";
import { nomVilleCanonique, slugVille } from "@/lib/listing/villes";
import type { EvenementPublic } from "@/lib/listing/types";

export const revalidate = 300;

const SITE = "https://www.tetweekend.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { evenements } = await lireAnnuaire();
    const evenement = evenements.find((e) => e.slug === slug);
    if (!evenement) return { title: "Event — Tèt Weekend" };
    // Description rédigée (correctif SEO, 13 nov. 2026) : titre, date, lieu,
    // ville et artistes dans une vraie phrase — l'ancien texte brut de la
    // description (« Artistes : … Lieu : … ») était tronqué et réécrit par
    // Google sans la date, l'information la plus cherchée pour un événement.
    const lieuNom = evenement.lieu?.nom ?? lieuDepuisDescription(evenement.description);
    const ville = evenement.ville ? nomVilleCanonique(evenement.ville) : null;
    const ou = [lieuNom, ville].filter(Boolean).join(", ");
    const artistes =
      evenement.artistes.length > 0
        ? evenement.artistes.map((a) => a.nom)
        : artistesDepuisDescription(evenement.description);
    const segments = [
      `${evenement.titre} — ${formaterQuand(evenement.date_debut, evenement.fuseau)}${ou ? `, ${ou}` : ""}.`,
    ];
    if (artistes.length > 0) segments.push(`With ${artistes.slice(0, 3).join(", ")}.`);
    segments.push("Flyer, venue and details on Tèt Weekend.");
    const descriptionBrute = segments.join(" ");
    const description = descriptionBrute.length > 160 ? `${descriptionBrute.slice(0, 157).trimEnd()}…` : descriptionBrute;
    const url = `${SITE}/evenements/${evenement.slug}`;
    return {
      title: `${evenement.titre} — Tèt Weekend`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: evenement.titre,
        description,
        url,
        type: "website",
        ...(evenement.flyer
          ? {
              images: [{
                url: evenement.flyer.publicUrl,
                width: evenement.flyer.width ?? undefined,
                height: evenement.flyer.height ?? undefined,
                alt: evenement.flyer.alt,
              }],
            }
          : {}),
      },
      twitter: evenement.flyer
        ? {
            card: "summary_large_image",
            title: evenement.titre,
            description,
            images: [evenement.flyer.publicUrl],
          }
        : {
            card: "summary",
            title: evenement.titre,
            description,
          },
    };
  } catch {
    return { title: "Event — Tèt Weekend" };
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
          <p className="mb-3 rounded-xl bg-[rgba(255,77,63,0.16)] px-3 py-2 text-sm font-semibold text-[var(--accent-texte)]">
            Event ended
          </p>
        )}
        <ZoneFlyer evenement={evenement} />
        {categorie && (
          <p className="mb-2">
            <Link href={`/categories/${evenement.categorie}`} className="inline-flex min-h-8 items-center rounded-full border border-[#6B5B4D] px-3 text-xs font-bold tracking-[0.08em] text-[var(--nuit-texte2)] uppercase no-underline">
              {categorie}
            </Link>
          </p>
        )}
        <h1 className="font-[family-name:var(--font-display)] text-[34px] leading-[1.03] font-black tracking-tight text-[var(--nuit-texte)]">{evenement.titre}</h1>

        <div className="mt-5 space-y-2.5">
          <div className="rounded-2xl border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-3.5">
            <p className="text-[15px] font-bold text-[var(--nuit-texte)]">{formaterQuand(evenement.date_debut, evenement.fuseau)}</p>
            <p className="text-[13px] text-[var(--nuit-muet)]">
              {evenement.date_fin ? `Ends: ${formaterQuand(evenement.date_fin, evenement.fuseau)} · ` : ""}Local time
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-3.5">
            <p className="text-[15px] font-bold text-[var(--nuit-texte)]">
              {evenement.lieu ? (
                <Link href={`/lieux/${evenement.lieu.slug}`} className="text-[var(--nuit-texte)] underline">
                  {evenement.lieu.nom}
                </Link>
              ) : (
                "Venue not listed"
              )}
              {evenement.ville && (
                <>
                  {" · "}
                  <Link href={`/villes/${slugVille(evenement.ville)}`} className="text-[var(--nuit-texte)] underline">
                    {evenement.ville}
                  </Link>
                </>
              )}
            </p>
            {evenement.lieu?.adresse && <p className="text-[13px] text-[var(--nuit-muet)]">{evenement.lieu.adresse}</p>}
          </div>
          {evenement.prix && (
            <div className="rounded-2xl border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-3.5">
              <p className="text-[15px] font-bold text-[var(--or)]">Admission: {evenement.prix}</p>
              <p className="text-[13px] text-[var(--nuit-muet)]">Price given by the organizer. Tèt Weekend does not sell tickets.</p>
            </div>
          )}
        </div>

        {evenement.artistes.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2.5 font-[family-name:var(--font-display)] text-xl font-black text-[var(--nuit-texte)]">Lineup</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {evenement.artistes.map((a) => (
                <li key={a.id}>
                  <Link href={`/artistes/${a.slug}`} className="flex min-h-11 items-center rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 font-semibold text-[var(--nuit-texte)] no-underline">
                    {a.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {evenement.description && (
          <div className="mt-6">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl font-black text-[var(--nuit-texte)]">Details</h2>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-[var(--nuit-texte2)]">{evenement.description}</p>
          </div>
        )}
        <Engagement evenementId={evenement.id} interetsInitiaux={evenement.interets ?? null} termine={termine} />
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={lienGoogleAgenda(evenement, url)} className="inline-flex min-h-12 items-center rounded-[14px] bg-[var(--accent)] px-5 text-[15px] font-extrabold text-white no-underline">
            Add to Google Calendar
          </a>
          <a href={`/evenements/${evenement.slug}/calendrier`} className="inline-flex min-h-12 items-center rounded-[14px] border border-[#6B5B4D] px-5 text-[15px] font-bold text-[var(--nuit-texte)] no-underline">
            Download .ics
          </a>
        </div>
        {questionCarte && (evenement.lieu?.adresse || evenement.ville) && (
          <iframe
            title={`Map: ${evenement.titre}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(questionCarte)}&z=15&output=embed`}
            className="mt-6 h-56 w-full rounded-[20px] border border-[var(--nuit-ligne)]"
            loading="lazy"
          />
        )}
      </article>
      {termine && suivantsArtistes.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-bold">Upcoming events by the same artists</h2>
          {suivantsArtistes.map((e) => (
            <CarteEvenement key={e.id} evenement={e} />
          ))}
        </section>
      )}
      {termine && suivantsLieu.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-bold">Upcoming events at the same venue</h2>
          {suivantsLieu.map((e) => (
            <CarteEvenement key={e.id} evenement={e} />
          ))}
        </section>
      )}
    </Gabarit>
  );
}
