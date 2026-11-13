import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { chargerAnnuaire } from "@/lib/listing/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Artists — Tèt Weekend",
  description: "Haitian DJs, bands and singers, and their upcoming dates.",
};

export default async function PageArtistes() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { artistes } = charge.annuaire;
  return (
      <Gabarit>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">Artistes</h1>
        {artistes.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">No artists published yet.</p>
        ) : (
          <ul className="space-y-3">
            {artistes.map((artiste) => (
              <li key={artiste.id} className="rounded-[20px] border-[1.5px] border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-4 shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
                <Link href={`/artistes/${artiste.slug}`} className="font-medium hover:underline">
                  {artiste.nom}
                </Link>
                <p className="text-sm text-[var(--text-sec)]">{[artiste.type, artiste.ville_base].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </Gabarit>
    );
}
