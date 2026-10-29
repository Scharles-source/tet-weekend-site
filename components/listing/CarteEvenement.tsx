"use client";

import Link from "next/link";
import { useState } from "react";
import { FlyerHeader } from "@/components/listing/FlyerHeader";
import { FlyerViewer } from "@/components/listing/FlyerViewer";
import { estTermine, formaterBadge, formaterPastille, formaterQuand } from "@/lib/listing/dates";
import { creditPublic } from "@/lib/listing/flyer";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const CARTE = "overflow-hidden rounded-[20px] border-[1.5px] border-[#EFE5D2] bg-white shadow-[0_3px_14px_rgba(80,55,10,0.06)]";

export function CarteEvenement({ evenement }: { evenement: EvenementPublic }) {
  const [ouvert, setOuvert] = useState(false);
  const termine = estTermine(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ");
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
      <div className="p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#B91C1C]">
          {quand}
          {categorie ? ` · ${categorie}` : ""}
          {termine ? " · Événement terminé" : ""}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-[19.5px] font-black leading-tight text-[#191410]">
          <Link href={`/evenements/${evenement.slug}`} className="text-[#191410] no-underline">
            {evenement.titre}
          </Link>
        </h2>
        <p className="mt-1 text-[13.5px] font-semibold text-[#4A4136]">{ou || "Lieu non indiqué"}</p>
        {evenement.artistes.length > 0 && (
          <p className="mt-1 text-[12.5px] text-[#8A7B66]">{evenement.artistes.map((a) => a.nom).join(", ")}</p>
        )}
        {evenement.prix && <p className="mt-2 text-[13.5px] text-[#4A4136]">Entrée : {evenement.prix}</p>}
      </div>
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </article>
  );
}

export function LigneEvenement({ evenement }: { evenement: EvenementPublic }) {
  const pastille = formaterPastille(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ") || "Lieu non indiqué";
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
        <img src={evenement.flyer.cardUrl || evenement.flyer.publicUrl} alt="" aria-hidden className="h-[56px] w-[56px] shrink-0 rounded-[11px] object-cover" />
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
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ");
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
            <img src={urlCouverture} alt={evenement.titre} className="absolute inset-0 h-full w-full object-cover object-top" />
            <button type="button" className="absolute inset-0 z-10 cursor-pointer" aria-label={`Voir le flyer entier de ${evenement.titre}`} onClick={() => setOuvert(true)} />
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
      <div className="p-3.5 lg:p-4">
        <p className="text-[10.5px] font-bold tracking-wide text-[#B91C1C] uppercase">{quand}</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-[16.5px] font-black leading-tight text-[#191410] lg:text-[18.5px]">
          <Link href={`/evenements/${evenement.slug}`} className="text-[#191410] no-underline">
            {evenement.titre}
          </Link>
        </h3>
        <p className="mt-1 truncate text-[13px] font-semibold text-[#4A4136]">{ou || "Lieu non indiqué"}</p>
        {evenement.artistes.length > 0 && (
          <p className="mt-1 truncate text-[12px] text-[#8A7B66]">{evenement.artistes.map((a) => a.nom).join(", ")}</p>
        )}
        {evenement.prix && <p className="mt-1.5 text-[13px] text-[#4A4136]">Entrée : {evenement.prix}</p>}
      </div>
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
            Voir le flyer en entier
          </button>
          {credit && <span className="text-[#8A7B66]">Flyer : {credit}</span>}
        </div>
      )}
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </div>
  );
}
