"use client";

import Link from "next/link";
import { useState } from "react";
import { FlyerHeader } from "@/components/listing/FlyerHeader";
import { FlyerViewer } from "@/components/listing/FlyerViewer";
import { estTermine, formaterQuand } from "@/lib/listing/dates";
import { creditPublic } from "@/lib/listing/flyer";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

export function CarteEvenement({ evenement }: { evenement: EvenementPublic }) {
  const [ouvert, setOuvert] = useState(false);
  const termine = estTermine(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ");
  return (
    <article className="overflow-hidden rounded-[18px] border border-white/10 bg-[var(--surface)]">
      <div style={{ containerType: "inline-size" }}>
        <FlyerHeader
          flyer={evenement.flyer}
          title={evenement.titre}
          dateLabel={quand}
          lieu={evenement.lieu?.nom ?? evenement.ville}
          variant="carte"
          onOpen={() => setOuvert(true)}
        />
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--blue)]">
          {quand}
          {categorie ? ` · ${categorie}` : ""}
          {termine ? " · Événement terminé" : ""}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-extrabold leading-tight">
          <Link href={`/evenements/${evenement.slug}`} className="hover:underline">
            {evenement.titre}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-[var(--text-sec)]">{ou || "Lieu non indiqué"}</p>
        {evenement.artistes.length > 0 && <p className="mt-1 text-sm">{evenement.artistes.map((a) => a.nom).join(", ")}</p>}
        {evenement.prix && <p className="mt-2 text-sm">Entrée : {evenement.prix}</p>}
      </div>
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </article>
  );
}

export function ZoneFlyer({ evenement }: { evenement: EvenementPublic }) {
  const [ouvert, setOuvert] = useState(false);
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const lieu = evenement.lieu?.nom ?? evenement.ville;
  const credit = evenement.flyer ? creditPublic(evenement.flyer.credit, evenement.source_account, evenement.source) : null;
  return (
    <div className="mb-6" style={{ containerType: "inline-size" }}>
      <FlyerHeader
        flyer={evenement.flyer}
        title={evenement.titre}
        dateLabel={quand}
        lieu={lieu}
        variant="banniere"
        onOpen={() => setOuvert(true)}
      />
      {evenement.flyer && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" className="min-h-11 rounded-xl border border-white/15 px-4" onClick={() => setOuvert(true)}>
            Voir le flyer en entier
          </button>
          {credit && <span className="text-[var(--text-sec)]">Flyer : {credit}</span>}
        </div>
      )}
      <FlyerViewer evenement={evenement} open={ouvert} onClose={() => setOuvert(false)} />
    </div>
  );
}
