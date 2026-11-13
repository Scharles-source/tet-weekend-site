import Link from "next/link";
import { Urgence } from "@/components/listing/Urgence";
import { formaterBadge } from "@/lib/listing/dates";
import { estTresConsulte } from "@/lib/listing/engagement";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const DEGRADES = [
  "linear-gradient(160deg,#C21810 0%,#5B1209 100%)",
  "linear-gradient(160deg,#5B2EE5 0%,#1E1459 100%)",
  "linear-gradient(160deg,#F97316 0%,#8A2A05 100%)",
  "linear-gradient(160deg,#0E8F7A 0%,#064238 100%)",
];

function degrade(id: string): string {
  let somme = 0;
  for (const c of id) somme += c.charCodeAt(0);
  return DEGRADES[somme % DEGRADES.length];
}

/** Affiche portrait : le flyer d'abord, les infos dessous. Pensée pour défiler au pouce. */
export function Affiche({ evenement, className = "" }: { evenement: EvenementPublic; className?: string }) {
  const url = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;
  const categorie = nomCategorie(evenement.categorie);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ") || "Lieu non indiqué";
  return (
    <Link href={`/evenements/${evenement.slug}`} className={`flex flex-col gap-2.5 text-inherit no-underline ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[var(--nuit-carte2)]" style={url ? undefined : { background: degrade(evenement.id) }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={evenement.flyer?.alt || evenement.titre} className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" />
        ) : (
          <div className="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-1">
            {categorie && <span className="text-[11px] font-bold tracking-[0.14em] text-[#FFE3A8] uppercase">{categorie}</span>}
            <span className="font-[family-name:var(--font-display)] text-[28px] leading-none font-black text-balance text-white">{evenement.titre}</span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-[rgba(15,12,11,0.82)] px-2.5 py-1 text-xs font-bold text-[var(--nuit-texte)]">
          {formaterBadge(evenement.date_debut, evenement.fuseau)}
        </span>
        <Urgence evenement={evenement} className="absolute top-2.5 right-2.5" />
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <span className="line-clamp-2 text-[15px] leading-snug font-bold text-[var(--nuit-texte)]">{evenement.titre}</span>
        <span className="truncate text-[13.5px] text-[var(--nuit-muet)]">{ou}</span>
        {evenement.prix && <span className="truncate text-[13px] font-semibold text-[var(--or)]">{evenement.prix}</span>}
        {estTresConsulte(evenement.vues) && (
          <span className="mt-1 w-fit rounded-full bg-[var(--or)] px-2.5 py-0.5 text-xs font-extrabold text-[var(--encre)]">Très consulté</span>
        )}
      </div>
    </Link>
  );
}
