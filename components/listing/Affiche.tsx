import Link from "next/link";
import { BandeEvenement } from "@/components/listing/BandeEvenement";
import { Urgence } from "@/components/listing/Urgence";
import { formaterBadge } from "@/lib/listing/dates";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";
import { flyerAllege } from "@/lib/listing/image-url";

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

/** Affiche portrait : le flyer d'abord, puis la bande (infos, « I'm going », partage). Pensée pour défiler au pouce. */
export function Affiche({ evenement, className = "" }: { evenement: EvenementPublic; className?: string }) {
  const url = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;
  const categorie = nomCategorie(evenement.categorie);
  return (
    <article className={`flex flex-col overflow-hidden rounded-[22px] bg-[#2A1F1B] ${className}`}>
      <Link
        href={`/evenements/${evenement.slug}`}
        aria-label={evenement.titre}
        className="relative block aspect-[4/5] overflow-hidden bg-[var(--nuit-carte2)] text-inherit no-underline"
        style={url ? undefined : { background: degrade(evenement.id) }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flyerAllege(url, 640)} alt={evenement.flyer?.alt || evenement.titre} className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" decoding="async" />
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
      </Link>
      <BandeEvenement evenement={evenement} etroit />
    </article>
  );
}
