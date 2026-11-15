import Link from "next/link";
import { BandeEvenement } from "@/components/listing/BandeEvenement";
import { BlocDate } from "@/components/listing/BlocDate";
import { Urgence } from "@/components/listing/Urgence";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";
import { flyerAllege } from "@/lib/listing/image-url";

const DEGRADES = [
  "linear-gradient(160deg,#5C1A26 0%,#38121C 100%)",
  "linear-gradient(160deg,#14524E 0%,#0D3331 100%)",
  "linear-gradient(160deg,#4B2A5E 0%,#2B1A3A 100%)",
  "linear-gradient(160deg,#77652A 0%,#453B16 100%)",
  "linear-gradient(160deg,#17573A 0%,#0E3524 100%)",
  "linear-gradient(160deg,#6E2430 0%,#40141D 100%)",
];

function degrade(id: string): string {
  let somme = 0;
  for (const c of id) somme += c.charCodeAt(0);
  return DEGRADES[somme % DEGRADES.length];
}

/**
 * Affiche à la Ticketmaster : le flyer rogné par le haut (pas en entier : le flyer complet vit sur la fiche),
 * puis la bande (infos essentielles, vues, « Invite friends »). `large` = carte pleine largeur d'une grille,
 * sinon petite affiche d'une rangée qui défile.
 */
export function Affiche({ evenement, className = "", large = false }: { evenement: EvenementPublic; className?: string; large?: boolean }) {
  const url = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;
  const categorie = nomCategorie(evenement.categorie);
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] shadow-[0_2px_10px_rgba(23,23,28,0.06)] ${className}`}>
      <Link
        href={`/evenements/${evenement.slug}`}
        aria-label={evenement.titre}
        className={`relative block overflow-hidden ${large ? "aspect-[16/10]" : "aspect-square"} bg-[var(--nuit-carte2)] text-inherit no-underline`}
        style={url ? undefined : { background: degrade(evenement.id) }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flyerAllege(url, large ? 828 : 640)} alt={evenement.flyer?.alt || evenement.titre} className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" decoding="async" />
        ) : (
          <div className="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-1">
            {categorie && <span className="text-[11px] font-bold tracking-[0.14em] text-[#E9A13B] uppercase">{categorie}</span>}
            <span className="font-[family-name:var(--font-display)] text-[28px] leading-none font-black text-balance text-white">{evenement.titre}</span>
          </div>
        )}
        {/* Bloc date aux couleurs du flyer (grand numéro + mois), en haut à
            gauche de l'image ; le badge « Happening now » vit dans la bande
            d'infos, aucun recouvrement. */}
        <BlocDate
          iso={evenement.date_debut}
          fuseau={evenement.fuseau}
          flyerUrl={url ? (flyerAllege(url, 128) ?? null) : null}
          className="absolute top-2.5 left-2.5"
        />
        <Urgence evenement={evenement} className="absolute top-2.5 right-2.5" />
      </Link>
      <BandeEvenement evenement={evenement} etroit={!large} />
    </article>
  );
}
