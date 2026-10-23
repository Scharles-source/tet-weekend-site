"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BanniereAccueil, type Panneau } from "@/components/listing/BanniereAccueil";
import { CarteEvenement, LigneEvenement } from "@/components/listing/CarteEvenement";
import { dansLeWeekend } from "@/lib/listing/dates";
import { CATEGORIES } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const RECHERCHE = "min-h-11 w-full rounded-[14px] border border-[#EFE5D2] bg-white px-3 text-[15px] text-[#191410] outline-none placeholder:text-[#8A7B66]";

export function AccueilPublic({
  evenements,
  panneaux,
  email,
  auto = true,
}: {
  evenements: EvenementPublic[];
  panneaux: Panneau[];
  email: string;
  auto?: boolean;
}) {
  const [recherche, setRecherche] = useState("");
  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return evenements;
    return evenements.filter((e) => {
      const texte = [e.titre, e.ville, e.lieu?.nom, ...e.artistes.map((a) => a.nom)].filter(Boolean).join(" ").toLowerCase();
      return texte.includes(q);
    });
  }, [evenements, recherche]);
  const weekend = filtres.filter((e) => dansLeWeekend(e.date_debut));
  const tetes = filtres.slice(0, 2);
  const suite = filtres.slice(2);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-[27px] font-black leading-tight text-[#191410]">
          Les événements haïtiens, <span className="text-[#E02B20]">partout</span>.
        </h1>
        <p className="mt-2 text-[13.5px] text-[#6E6252]">Haïti · Montréal · Miami · New York · Boston · Paris</p>
      </header>
      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Nom de l'événement, du DJ, de la ville…"
        className={RECHERCHE}
      />
      <BanniereAccueil panneaux={panneaux} email={email} auto={auto} />
      <ul className="flex gap-2 overflow-x-auto pb-1">
        <li>
          <a href="#ce-weekend" className="inline-flex whitespace-nowrap rounded-full bg-[#E02B20] px-3 py-2 text-[12.5px] font-semibold text-white no-underline">
            Ce week-end
          </a>
        </li>
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link href={`/categories/${c.slug}`} className="inline-flex whitespace-nowrap rounded-full border border-[#EFE5D2] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#4A4136] no-underline">
              {c.nom}
            </Link>
          </li>
        ))}
      </ul>
      <section id="ce-weekend" className="space-y-3">
        <EnteteSection titre="Ce week-end" href="/evenements" />
        {weekend.length === 0 ? (
          <p className="text-sm text-[#8A7B66]">Rien de publié pour ce week-end.</p>
        ) : (
          weekend.map((e) => <CarteEvenement key={e.id} evenement={e} />)
        )}
      </section>
      <section className="space-y-3">
        <EnteteSection titre="À venir" href="/evenements" />
        {filtres.length === 0 ? (
          <p className="text-sm text-[#8A7B66]">Aucun événement à venir pour le moment.</p>
        ) : (
          <>
            {tetes.map((e) => <CarteEvenement key={e.id} evenement={e} />)}
            {suite.map((e) => <LigneEvenement key={e.id} evenement={e} />)}
          </>
        )}
      </section>
    </div>
  );
}

function EnteteSection({ titre, href }: { titre: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-[family-name:var(--font-display)] text-[19px] font-black text-[#191410]">{titre}</h2>
      <Link href={href} className="text-sm font-semibold text-[#E02B20] no-underline">Tout voir</Link>
    </div>
  );
}
