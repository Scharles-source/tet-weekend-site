"use client";

import Link from "next/link";
import { BanniereAccueil, type Panneau } from "@/components/listing/BanniereAccueil";
import { CarteEvenementCompacte, LigneEvenement } from "@/components/listing/CarteEvenement";
import { dansLeWeekend } from "@/lib/listing/dates";
import { CATEGORIES } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

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
  const weekend = evenements.filter((e) => dansLeWeekend(e.date_debut));

  return (
    <div>
      {/* Héros + À la une : empilés sur mobile, côte à côte sur desktop */}
      <div className="lg:grid lg:grid-cols-[400px_1fr] lg:items-center lg:gap-9">
        <div className="mb-6 lg:mb-0">
          <header>
            <h1 className="font-[family-name:var(--font-display)] text-[34px] leading-[1.08] font-black text-[#191410] lg:text-[52px] lg:leading-[1.06]">
              Les événements haïtiens, <span className="text-[#E02B20]">partout</span>.
            </h1>
            <p className="mt-3 text-[14px] text-[#6E6252] lg:mt-4 lg:text-[15.5px]">Haïti · Montréal · Miami · New York · Boston · Paris</p>
          </header>
          <ul className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
            <li>
              <a href="#ce-weekend" className="inline-flex whitespace-nowrap rounded-full bg-[#E02B20] px-4 py-2.5 text-[13px] font-semibold text-white no-underline">
                Ce week-end
              </a>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="inline-flex whitespace-nowrap rounded-full border border-[#EFE5D2] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#4A4136] no-underline">
                  {c.nom}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 hidden max-w-[340px] text-[14.5px] leading-relaxed text-[#6E6252] lg:block">
            Bals, concerts, soirées kompa et festivals de la communauté haïtienne — en Haïti comme dans la diaspora, réunis au même endroit.
          </p>
        </div>
        <BanniereAccueil panneaux={panneaux} email={email} auto={auto} />
      </div>

      {/* Ce week-end */}
      <section id="ce-weekend" className="mt-10 lg:mt-[52px]">
        <EnteteSection titre="Ce week-end" href="/evenements" />
        {weekend.length === 0 ? (
          <p className="text-sm text-[#8A7B66]">Rien de publié pour ce week-end.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {weekend.map((e) => (
              <CarteEvenementCompacte key={e.id} evenement={e} />
            ))}
          </div>
        )}
      </section>

      {/* À venir + Organisateurs */}
      <div className="mt-10 lg:mt-[52px] lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-5">
        <section>
          <EnteteSection titre="À venir" href="/evenements" />
          {evenements.length === 0 ? (
            <p className="text-sm text-[#8A7B66]">Aucun événement à venir pour le moment.</p>
          ) : (
            <div className="space-y-2.5">
              {evenements.map((e) => (
                <LigneEvenement key={e.id} evenement={e} />
              ))}
            </div>
          )}
        </section>
        <BlocOrganisateurs email={email} />
      </div>
    </div>
  );
}

function EnteteSection({ titre, href }: { titre: string; href: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 lg:mb-5">
      <h2 className="font-[family-name:var(--font-display)] text-[21px] font-black text-[#191410] lg:text-[27px]">{titre}</h2>
      <Link href={href} className="text-sm font-semibold text-[#E02B20] no-underline lg:text-[15px]">Tout voir</Link>
    </div>
  );
}

function BlocOrganisateurs({ email }: { email: string }) {
  return (
    <section className="mt-10 lg:mt-0">
      <h2 className="mb-4 hidden font-[family-name:var(--font-display)] text-[27px] font-black text-[#191410] lg:mb-5 lg:block">Organisateurs</h2>
      <div
        className="rounded-[22px] p-[30px] text-white shadow-[0_16px_34px_rgba(224,43,32,.28)]"
        style={{ background: "linear-gradient(140deg, #E02B20 0%, #C21810 100%)" }}
      >
        <h3 className="font-[family-name:var(--font-display)] text-[25px] leading-[1.25] font-black">Tu organises un événement ?</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[#FFE3E0]">
          Mets ton événement en avant devant toute la communauté, en Haïti comme dans la diaspora — bannière « À la une », badge sponsorisé et public ciblé.
        </p>
        <a
          href={`mailto:${email}?subject=Devenir%20partenaire`}
          className="mt-[22px] inline-flex min-h-12 items-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#C21810] no-underline"
        >
          Devenir partenaire
        </a>
      </div>
    </section>
  );
}
