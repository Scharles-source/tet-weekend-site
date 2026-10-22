import Link from "next/link";
import { estTermine, formaterQuand } from "@/lib/listing/dates";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

export function CarteEvenement({ evenement }: { evenement: EvenementPublic }) {
  const termine = estTermine(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ");
  return (
    <article className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--blue)]">
        {formaterQuand(evenement.date_debut, evenement.fuseau)}
        {categorie ? ` · ${categorie}` : ""}
        {termine ? " · Événement terminé" : ""}
      </p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-extrabold leading-tight">
        <Link href={`/evenements/${evenement.slug}`} className="hover:underline">
          {evenement.titre}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-[var(--text-sec)]">{ou || "Lieu non indiqué"}</p>
      {evenement.artistes.length > 0 && (
        <p className="mt-1 text-sm">{evenement.artistes.map((a) => a.nom).join(", ")}</p>
      )}
      {evenement.prix && <p className="mt-2 text-sm">Entrée : {evenement.prix}</p>}
    </article>
  );
}
