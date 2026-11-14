"use client";

import Link from "next/link";
import { useState } from "react";
import { BandeEvenement } from "@/components/listing/BandeEvenement";
import { FlyerHeader } from "@/components/listing/FlyerHeader";
import { FlyerViewer } from "@/components/listing/FlyerViewer";
import { formaterBadge, formaterPastille } from "@/lib/listing/dates";
import { creditPublic } from "@/lib/listing/flyer";
import type { EvenementPublic } from "@/lib/listing/types";
import { flyerAllege } from "@/lib/listing/image-url";

const CARTE = "overflow-hidden rounded-[20px] border-[1.5px] border-[#EFE5D2] bg-white shadow-[0_3px_14px_rgba(80,55,10,0.06)]";

export function CarteEvenement({ evenement }: { evenement: EvenementPublic }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <article className={CARTE}>
      <div style={{ containerType: "inline-size" }}>
        <FlyerHeader
          flyer={evenement.flyer}
          title={evenement.titre}
          dateLabel={formaterBadge(evenement.date_debut, evenement.fuseau)}
          lieu={evenement.lieu?.nom ?? evenement.ville}
          variant="carte"
          onOpen={() => setOuvert(true)}
        />
      </div>
      <BandeEvenement evenement={evenement} />
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </article>
  );
}

export function LigneEvenement({ evenement }: { evenement: EvenementPublic }) {
  const pastille = formaterPastille(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ") || "Venue not listed";
  return (
    <Link href={`/evenements/${evenement.slug}`} className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-[#EFE5D2] bg-white p-3 text-inherit no-underline shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
      <span className="flex h-[56px] w-[56px] shrink-0 flex-col items-center justify-center rounded-xl bg-[#FDECEA]">
        <span className="font-[family-name:var(--font-display)] text-[19px] font-black leading-none text-[#191410]">{pastille.jour}</span>
        <span className="mt-0.5 text-[10px] font-semibold text-[#B91C1C]">{pastille.mois}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-bold text-[#191410]">{evenement.titre}</span>
        <span className="block truncate text-[12.5px] text-[#8A7B66]">{ou}</span>
      </span>
      {evenement.flyer ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flyerAllege(evenement.flyer.cardUrl || evenement.flyer.publicUrl, 128)} alt="" aria-hidden width={56} height={56} loading="lazy" decoding="async" className="h-[56px] w-[56px] shrink-0 rounded-[11px] object-cover" />
      ) : (
        <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[11px] bg-[#F3E6D8] font-[family-name:var(--font-display)] text-[20px] font-black text-[#8A7B66]">
          {evenement.titre.charAt(0).toUpperCase()}
        </span>
      )}
    </Link>
  );
}

export function CarteEvenementCompacte({ evenement }: { evenement: EvenementPublic }) {
  const [ouvert, setOuvert] = useState(false);
  const urlCouverture = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;
  return (
    <article className={CARTE}>
      {/* Mobile : flyer entier sur fond flouté (composant partagé) */}
      <div className="lg:hidden" style={{ containerType: "inline-size" }}>
        <FlyerHeader
          flyer={evenement.flyer}
          title={evenement.titre}
          dateLabel={formaterBadge(evenement.date_debut, evenement.fuseau)}
          lieu={evenement.lieu?.nom ?? evenement.ville}
          variant="carte"
          onOpen={() => setOuvert(true)}
        />
      </div>
      {/* Desktop : zone image fixe, flyer cadré par le haut */}
      <div className="relative hidden h-[300px] overflow-hidden lg:block" style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        {urlCouverture ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flyerAllege(urlCouverture, 640)} alt={evenement.titre} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
            <button type="button" className="absolute inset-0 z-10 cursor-pointer" aria-label={`View the full flyer for ${evenement.titre}`} onClick={() => setOuvert(true)} />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ background: "linear-gradient(150deg, #F97316, #E02B20 55%, #5B2EE5)" }}>
            <p className="font-[family-name:var(--font-display)] text-[22px] font-black text-white">{evenement.titre}</p>
          </div>
        )}
        <span className="pointer-events-none absolute top-3 left-3 z-20 rounded-full bg-[#191410] px-2.5 py-1 text-xs font-semibold text-white">
          {formaterBadge(evenement.date_debut, evenement.fuseau)}
        </span>
      </div>
      <BandeEvenement evenement={evenement} compact />
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </article>
  );
}

export function ZoneFlyer({ evenement }: { evenement: EvenementPublic }) {
  const [ouvert, setOuvert] = useState(false);
  const lieu = evenement.lieu?.nom ?? evenement.ville;
  const credit = evenement.flyer ? creditPublic(evenement.flyer.credit, evenement.source_account, evenement.source) : null;
  return (
    <div className="mb-6" style={{ containerType: "inline-size" }}>
      <FlyerHeader
        flyer={evenement.flyer}
        title={evenement.titre}
        dateLabel={formaterBadge(evenement.date_debut, evenement.fuseau)}
        lieu={lieu}
        variant="banniere"
        onOpen={() => setOuvert(true)}
      />
      {evenement.flyer && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" className="min-h-11 rounded-full border border-[#EFE5D2] bg-white px-4 text-[#191410]" onClick={() => setOuvert(true)}>
            View the full flyer
          </button>
          {credit && <span className="text-[#8A7B66]">Flyer: {credit}</span>}
        </div>
      )}
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </div>
  );
}
