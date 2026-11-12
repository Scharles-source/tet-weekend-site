"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Affiche } from "@/components/listing/Affiche";
import { BanniereAccueil, type Panneau } from "@/components/listing/BanniereAccueil";
import { LigneEvenement } from "@/components/listing/CarteEvenement";
import { dansLeWeekend } from "@/lib/listing/dates";
import { dansLaPeriode, type Periode } from "@/lib/listing/periode";
import { CATEGORIES } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const PERIODES: { valeur: Periode; label: string }[] = [
  { valeur: "tout", label: "Tout" },
  { valeur: "ce-soir", label: "Ce soir" },
  { valeur: "demain", label: "Demain" },
  { valeur: "ce-weekend", label: "Ce week-end" },
];

const PUCE_ON = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl bg-[var(--nuit-texte)] px-4 text-sm font-extrabold text-[#191410]";
const PUCE_OFF = "inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-xl border border-[#6B5B4D] px-4 text-sm font-semibold text-[var(--nuit-texte)]";
const ZONE_ON = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--accent)] px-[18px] text-sm font-bold text-white";
const ZONE_OFF = "inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-[18px] text-sm font-semibold text-[var(--nuit-texte)]";

export function AccueilPublic({
  evenements,
  panneaux,
  email,
}: {
  evenements: EvenementPublic[];
  panneaux: Panneau[];
  email: string;
  auto?: boolean;
}) {
  const [periode, setPeriode] = useState<Periode>("tout");
  const [ville, setVille] = useState<string | null>(null);

  const villes = useMemo(() => {
    const compte = new Map<string, number>();
    for (const e of evenements) if (e.ville) compte.set(e.ville, (compte.get(e.ville) ?? 0) + 1);
    return [...compte.entries()].sort((a, b) => b[1] - a[1]).map(([nom]) => nom);
  }, [evenements]);

  const filtres = periode !== "tout" || ville !== null;
  const resultats = useMemo(
    () => evenements.filter((e) => dansLaPeriode(e.date_debut, periode) && (ville === null || e.ville === ville)),
    [evenements, periode, ville],
  );
  const ceSoir = useMemo(() => evenements.filter((e) => dansLaPeriode(e.date_debut, "ce-soir")), [evenements]);
  const weekend = evenements.filter((e) => dansLeWeekend(e.date_debut));

  return (
    <div>
      <header className="max-w-[640px]">
        <p className="text-xs font-bold tracking-[0.16em] text-[var(--or)] uppercase">Haïti · diaspora</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[40px] leading-[1.02] font-black tracking-tight text-balance text-[var(--nuit-texte)] lg:text-[60px]">
          Kote fèt la ? <span className="text-[var(--accent-texte)]">Trouve ta soirée.</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--nuit-muet)] lg:text-[17px]">
          Bals, concerts, soirées kompa et festivals, au même endroit. Ici, pas de billets à acheter : on te dit où, quand et avec qui.
        </p>
      </header>

      {/* Zone + moment */}
      <div className="no-scrollbar -mx-[var(--page-px)] mt-5 flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Choisir une ville">
        <button type="button" className={ville === null ? ZONE_ON : ZONE_OFF} aria-pressed={ville === null} onClick={() => setVille(null)}>
          Toutes les villes
        </button>
        {villes.map((nom) => (
          <button key={nom} type="button" className={ville === nom ? ZONE_ON : ZONE_OFF} aria-pressed={ville === nom} onClick={() => setVille(nom)}>
            {nom}
          </button>
        ))}
      </div>
      <div className="no-scrollbar -mx-[var(--page-px)] mt-3 flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Choisir un moment">
        {PERIODES.map((p) => (
          <button key={p.valeur} type="button" className={periode === p.valeur ? PUCE_ON : PUCE_OFF} aria-pressed={periode === p.valeur} onClick={() => setPeriode(p.valeur)}>
            {p.label}
          </button>
        ))}
      </div>

      {filtres ? (
        <section className="mt-7" aria-live="polite">
          <p className="mb-4 text-[13px] font-bold tracking-[0.12em] text-[var(--nuit-muet)] uppercase">
            {resultats.length} événement{resultats.length > 1 ? "s" : ""}
          </p>
          {resultats.length === 0 ? (
            <p className="rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-5 text-[15px] text-[var(--nuit-texte2)]">
              Rien de publié pour ce choix pour l&apos;instant. Essaie un autre moment ou une autre ville.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {resultats.map((e) => (
                <Affiche key={e.id} evenement={e} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {ceSoir.length > 0 && (
            <Rangee titre="Ce soir" href="/evenements">
              {ceSoir.map((e) => (
                <Affiche key={e.id} evenement={e} className="w-[236px] shrink-0 snap-start lg:w-[260px]" />
              ))}
            </Rangee>
          )}

          <section className="mt-8 lg:mt-12">
            <BanniereAccueil panneaux={panneaux} email={email} />
          </section>

          <section className="mt-9 lg:mt-12">
            <h2 className="mb-3.5 font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[var(--nuit-texte)]">Ton style de soirée</h2>
            <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/categories/${c.slug}`} className="flex min-h-16 items-center rounded-[18px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 text-[14.5px] font-bold text-[var(--nuit-texte)] no-underline">
                    {c.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="ce-weekend" className="mt-9 lg:mt-12">
            <EnteteSection titre="Ce week-end" href="/evenements" />
            {weekend.length === 0 ? (
              <p className="text-sm text-[var(--nuit-muet)]">Rien de publié pour ce week-end.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
                {weekend.map((e) => (
                  <Affiche key={e.id} evenement={e} />
                ))}
              </div>
            )}
          </section>

          <div className="mt-9 lg:mt-12 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8">
            <section>
              <EnteteSection titre="À venir" href="/evenements" />
              {evenements.length === 0 ? (
                <p className="text-sm text-[var(--nuit-muet)]">Aucun événement à venir pour le moment.</p>
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
        </>
      )}

      {filtres && <BlocOrganisateurs email={email} className="mt-10" />}
    </div>
  );
}

function Rangee({ titre, href, children }: { titre: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 lg:mt-12">
      <EnteteSection titre={titre} href={href} />
      <div className="no-scrollbar -mx-[var(--page-px)] flex snap-x gap-3 overflow-x-auto px-[var(--page-px)] lg:gap-5">{children}</div>
    </section>
  );
}

function EnteteSection({ titre, href }: { titre: string; href: string }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3 lg:mb-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[var(--nuit-texte)] lg:text-[30px]">{titre}</h2>
      <Link href={href} className="flex min-h-11 items-center text-sm font-bold text-[var(--accent-texte)] no-underline lg:text-[15px]">Tout voir</Link>
    </div>
  );
}

function BlocOrganisateurs({ email, className = "" }: { email: string; className?: string }) {
  return (
    <section className={`mt-9 lg:mt-0 ${className}`}>
      <div className="rounded-[24px] bg-[#FBF7EF] p-[22px] text-[#191410]">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] leading-[1.05] font-black tracking-tight">Tu organises une soirée ?</h2>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#4A4136]">
          Fais apparaître ton événement devant toute la communauté, en Haïti comme dans la diaspora.
        </p>
        <a
          href={`mailto:${email}?subject=Proposer%20mon%20%C3%A9v%C3%A9nement`}
          className="mt-4 flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--accent)] px-6 text-[15px] font-extrabold text-white no-underline"
        >
          Proposer mon événement
        </a>
      </div>
    </section>
  );
}
