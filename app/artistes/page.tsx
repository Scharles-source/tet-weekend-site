import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { chargerAnnuaire } from "@/lib/listing/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Artistes — Tèt Weekend",
  description: "DJ, groupes et chanteurs haïtiens, et leurs prochaines dates.",
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
          <p className="text-sm text-[var(--text-sec)]">Aucun artiste publié pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {artistes.map((artiste) => (
              <li key={artiste.id} className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
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
