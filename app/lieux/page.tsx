import type { Metadata } from "next";
import Link from "next/link";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { chargerAnnuaire } from "@/lib/listing/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Lieux — Tèt Weekend",
  description: "Bars, clubs, salles et restaurants où ont lieu les événements haïtiens.",
};

export default async function PageLieux() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { lieux } = charge.annuaire;
  return (
      <Gabarit>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">Lieux</h1>
        {lieux.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">Aucun lieu publié pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {lieux.map((lieu) => (
              <li key={lieu.id} className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
                <Link href={`/lieux/${lieu.slug}`} className="font-medium hover:underline">
                  {lieu.nom}
                </Link>
                <p className="text-sm text-[var(--text-sec)]">{[lieu.type, lieu.ville].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </Gabarit>
    );
}
