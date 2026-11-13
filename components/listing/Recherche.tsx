"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { LigneEvenement } from "@/components/listing/CarteEvenement";
import type { Periode } from "@/lib/listing/periode";
import { CRITERES_VIDES, nombreFiltres, rechercher, type Criteres, type Donnees, type Portee } from "@/lib/listing/recherche";
import { CATEGORIES } from "@/lib/listing/schema";

const PORTEES: { valeur: Portee; label: string }[] = [
  { valeur: "tout", label: "All" },
  { valeur: "evenements", label: "Events" },
  { valeur: "artistes", label: "Artists" },
  { valeur: "lieux", label: "Venues" },
];
const PERIODES: { valeur: Periode; label: string }[] = [
  { valeur: "tout", label: "All" },
  { valeur: "ce-soir", label: "Tonight" },
  { valeur: "demain", label: "Tomorrow" },
  { valeur: "ce-weekend", label: "This weekend" },
];

const ON = "bg-[var(--nuit-texte)] text-[var(--encre)] font-extrabold";
const OFF = "border border-[#6B5B4D] text-[var(--nuit-texte)] font-semibold";
const PUCE = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-4 text-sm";

export function Recherche({ donnees, villes }: { donnees: Donnees; villes: string[] }) {
  const [c, setC] = useState<Criteres>(CRITERES_VIDES);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    champ.current?.focus();
  }, []);

  const maj = (partiel: Partial<Criteres>) => setC((prev) => ({ ...prev, ...partiel }));
  const nbFiltres = nombreFiltres(c);
  const actif = c.q.trim() !== "" || nbFiltres > 0;
  const res = useMemo(() => rechercher(donnees, c), [donnees, c]);
  const total = res.evenements.length + res.artistes.length + res.lieux.length;

  const populaires = useMemo(
    () => [
      { label: "Tonight", criteres: { periode: "ce-soir" as Periode } },
      { label: "Free this weekend", criteres: { gratuit: true, periode: "ce-weekend" as Periode } },
      ...CATEGORIES.slice(0, 3).map((k) => ({ label: k.nom, criteres: { categorie: k.slug as string } })),
      ...villes.slice(0, 3).map((v) => ({ label: v, criteres: { ville: v } })),
    ],
    [villes],
  );

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl border-2 border-[var(--accent)] bg-[var(--nuit-carte)] pr-2 pl-3.5">
          <Search size={20} aria-hidden className="shrink-0 text-[var(--accent-texte)]" />
          <input
            ref={champ}
            type="search"
            value={c.q}
            onChange={(e) => maj({ q: e.target.value })}
            placeholder="Event, DJ, venue or city"
            aria-label="Search"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--nuit-texte)] outline-none placeholder:text-[var(--nuit-muet)]"
          />
          {c.q && (
            <button type="button" aria-label="Clear search" className="flex h-11 w-11 items-center justify-center text-[var(--nuit-muet)]" onClick={() => maj({ q: "" })}>
              <X size={18} aria-hidden />
            </button>
          )}
        </label>
      </div>

      <div className="no-scrollbar -mx-[var(--page-px)] mt-3.5 flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="What I am looking for">
        {PORTEES.map((p) => (
          <button key={p.valeur} type="button" aria-pressed={c.portee === p.valeur} className={`${PUCE} ${c.portee === p.valeur ? ON : OFF}`} onClick={() => maj({ portee: p.valeur })}>
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={filtresOuverts}
          className={`${PUCE} gap-2 ${nbFiltres > 0 ? "bg-[var(--accent)] font-bold text-white" : OFF}`}
          onClick={() => setFiltresOuverts((v) => !v)}
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filtres{nbFiltres > 0 ? ` · ${nbFiltres}` : ""}
        </button>
      </div>

      {filtresOuverts && (
        <div className="mt-3 space-y-4 rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-4">
          <Groupe titre="Category">
            <Puce actif={c.categorie === null} onClick={() => maj({ categorie: null })}>All</Puce>
            {CATEGORIES.map((k) => (
              <Puce key={k.slug} actif={c.categorie === k.slug} onClick={() => maj({ categorie: k.slug })}>{k.nom}</Puce>
            ))}
          </Groupe>
          {villes.length > 0 && (
            <Groupe titre="City">
              <Puce actif={c.ville === null} onClick={() => maj({ ville: null })}>All</Puce>
              {villes.map((v) => (
                <Puce key={v} actif={c.ville === v} onClick={() => maj({ ville: v })}>{v}</Puce>
              ))}
            </Groupe>
          )}
          <Groupe titre="When">
            {PERIODES.map((p) => (
              <Puce key={p.valeur} actif={c.periode === p.valeur} onClick={() => maj({ periode: p.valeur })}>{p.label}</Puce>
            ))}
          </Groupe>
          <Groupe titre="Price">
            <Puce actif={!c.gratuit} onClick={() => maj({ gratuit: false })}>Tous</Puce>
            <Puce actif={c.gratuit} onClick={() => maj({ gratuit: true })}>Free</Puce>
          </Groupe>
        </div>
      )}

      {nbFiltres > 0 && (
        <p className="mt-3 text-[13px] text-[var(--nuit-muet)]">
          {[c.categorie && CATEGORIES.find((k) => k.slug === c.categorie)?.nom, c.ville, c.periode !== "tout" && PERIODES.find((p) => p.valeur === c.periode)?.label, c.gratuit && "Free"]
            .filter(Boolean)
            .join(" · ")}
          .{" "}
          <button type="button" className="min-h-11 font-bold text-[var(--accent-texte)]" onClick={() => setC({ ...CRITERES_VIDES, q: c.q, portee: c.portee })}>
            Clear all
          </button>
        </p>
      )}

      {!actif ? (
        <section className="mt-6">
          <p className="mb-2.5 text-xs font-bold tracking-[0.14em] text-[var(--nuit-muet)] uppercase">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {populaires.map((p) => (
              <button key={p.label} type="button" className="min-h-11 rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 text-sm font-semibold text-[var(--nuit-texte)]" onClick={() => maj(p.criteres)}>
                {p.label}
              </button>
            ))}
          </div>
        </section>
      ) : total === 0 ? (
        <p className="mt-6 rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-5 text-[15px] text-[var(--nuit-texte2)]" role="status">
          No matches. Try fewer words, or remove a filter.
        </p>
      ) : (
        <div className="mt-6 space-y-8" aria-live="polite">
          {res.evenements.length > 0 && (
            <Section titre="Events" nombre={res.evenements.length}>
              <div className="space-y-2.5">
                {res.evenements.map((e) => (
                  <LigneEvenement key={e.id} evenement={e} />
                ))}
              </div>
            </Section>
          )}
          {res.artistes.length > 0 && (
            <Section titre="Artists" nombre={res.artistes.length}>
              <ul className="flex flex-wrap gap-2">
                {res.artistes.map((a) => (
                  <li key={a.id}>
                    <Link href={`/artistes/${a.slug}`} className="flex min-h-12 items-center rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 text-sm font-semibold text-[var(--nuit-texte)] no-underline">
                      {a.nom}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {res.lieux.length > 0 && (
            <Section titre="Venues" nombre={res.lieux.length}>
              <ul className="space-y-2.5">
                {res.lieux.map((l) => (
                  <li key={l.id}>
                    <Link href={`/lieux/${l.slug}`} className="block rounded-[18px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-3.5 text-inherit no-underline">
                      <span className="block text-[15px] font-bold text-[var(--nuit-texte)]">{l.nom}</span>
                      <span className="block text-[13px] text-[var(--nuit-muet)]">{[l.type, l.ville].filter(Boolean).join(" · ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-[0.12em] text-[var(--nuit-muet)] uppercase">{titre}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Puce({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={actif} className={`${PUCE} ${actif ? ON : OFF}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Section({ titre, nombre, children }: { titre: string; nombre: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-black text-[var(--nuit-texte)]">
        {titre} <span className="text-base font-bold text-[var(--nuit-muet)]">{nombre}</span>
      </h2>
      {children}
    </section>
  );
}
