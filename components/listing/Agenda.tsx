"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saisieDepuisInstant } from "@/lib/listing/dates";
import { intervalleJour } from "@/lib/listing/periode";
import { estGratuit } from "@/lib/listing/recherche";
import { CATEGORIES, FUSEAU_DEFAUT } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const PUCE = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm";
const ON = "bg-[var(--accent)] font-bold text-white";
const OFF = "border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] font-semibold text-[var(--nuit-texte2)]";

const ymd = (iso: string, fuseau: string) => saisieDepuisInstant(iso, fuseau).slice(0, 10);
const heure = (iso: string, fuseau: string) => {
  const [h, m] = saisieDepuisInstant(iso, fuseau).slice(11, 16).split(":").map(Number);
  const suffixe = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffixe}` : `${h12}:${String(m).padStart(2, "0")} ${suffixe}`;
};

export function Agenda({ evenements, maintenantIso, villes }: { evenements: EvenementPublic[]; maintenantIso: string; villes: string[] }) {
  const [jour, setJour] = useState<string | null>(null);
  const [ville, setVille] = useState<string | null>(null);
  const [categorie, setCategorie] = useState<string | null>(null);
  const [gratuit, setGratuit] = useState(false);

  const maintenant = useMemo(() => new Date(maintenantIso), [maintenantIso]);
  const aujourdhui = ymd(maintenantIso, FUSEAU_DEFAUT);

  const filtres = useMemo(
    () => evenements.filter((e) => (!ville || e.ville === ville) && (!categorie || e.categorie === categorie) && (!gratuit || estGratuit(e.prix))),
    [evenements, ville, categorie, gratuit],
  );
  const cle = (e: EvenementPublic) => {
    const k = ymd(e.date_debut, e.fuseau);
    return k < aujourdhui ? aujourdhui : k;
  };
  const parJour = useMemo(() => {
    const m = new Map<string, EvenementPublic[]>();
    for (const e of filtres) m.set(cle(e), [...(m.get(cle(e)) ?? []), e]);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres, aujourdhui]);

  const bande = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = intervalleJour(i, maintenant).debut;
        const iso = d.toISOString();
        return {
          cle: ymd(iso, FUSEAU_DEFAUT),
          sem: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: FUSEAU_DEFAUT }).format(d).replace(".", ""),
          num: new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: FUSEAU_DEFAUT }).format(d),
        };
      }),
    [maintenant],
  );

  const groupes = [...parJour.entries()]
    .filter(([k]) => !jour || k === jour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, items]) => ({
      cle: k,
      titre: new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${k}T12:00:00Z`)),
      items: [...items].sort((a, b) => a.date_debut.localeCompare(b.date_debut)),
    }));

  return (
    <div>
      <div className="no-scrollbar -mx-[var(--page-px)] flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Pick a day">
        <button type="button" aria-pressed={jour === null} onClick={() => setJour(null)} className={`flex min-h-20 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold ${jour === null ? "bg-[var(--creme)] text-[var(--encre)]" : "border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] text-[var(--nuit-texte2)]"}`}>
          <span className="uppercase tracking-wider">All</span>
        </button>
        {bande.map((j) => {
          const actif = jour === j.cle;
          const a = parJour.has(j.cle);
          return (
            <button key={j.cle} type="button" aria-pressed={actif} onClick={() => setJour(actif ? null : j.cle)} className={`flex min-h-20 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl ${actif ? "bg-[var(--creme)] text-[var(--encre)]" : "border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] text-[var(--nuit-texte2)]"}`}>
              <span className="text-xs font-bold uppercase tracking-wider">{j.sem}</span>
              <span className="font-[family-name:var(--font-display)] text-[22px] leading-none font-black">{j.num}</span>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${a ? "bg-[var(--accent)]" : "bg-transparent"}`} />
              <span className="sr-only">{a ? "has events" : "no events"}</span>
            </button>
          );
        })}
      </div>

      <div className="no-scrollbar -mx-[var(--page-px)] mt-3.5 flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Filters">
        <select aria-label="City" value={ville ?? ""} onChange={(e) => setVille(e.target.value || null)} className={`${PUCE} ${ville ? ON : OFF}`}>
          <option value="">All cities</option>
          {villes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select aria-label="Category" value={categorie ?? ""} onChange={(e) => setCategorie(e.target.value || null)} className={`${PUCE} ${categorie ? ON : OFF}`}>
          <option value="">All categories</option>
          {CATEGORIES.map((k) => (
            <option key={k.slug} value={k.slug}>{k.nom}</option>
          ))}
        </select>
        <button type="button" aria-pressed={gratuit} onClick={() => setGratuit((v) => !v)} className={`${PUCE} ${gratuit ? ON : OFF}`}>Free</button>
      </div>

      {groupes.length === 0 ? (
        <p role="status" className="mt-6 rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-5 text-[15px] text-[var(--nuit-texte2)]">
          No events match these filters. Try another day or remove a filter.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {groupes.map((g) => (
            <section key={g.cle}>
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-black capitalize text-[var(--nuit-texte)]">{g.titre}</h2>
                <span className="text-[13px] text-[var(--nuit-muet)]">{g.items.length} event{g.items.length > 1 ? "s" : ""}</span>
              </div>
              <ul className="space-y-2.5">
                {g.items.map((e) => (
                  <li key={e.id} className="flex items-stretch gap-3">
                    <span className="w-16 shrink-0 pt-3 text-right font-[family-name:var(--font-display)] text-[17px] leading-none font-black text-[var(--nuit-texte)]">{heure(e.date_debut, e.fuseau)}</span>
                    <Link href={`/evenements/${e.slug}`} className="flex min-w-0 flex-1 gap-3 rounded-[18px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-2.5 text-inherit no-underline">
                      {e.flyer ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.flyer.cardUrl || e.flyer.publicUrl} alt="" aria-hidden className="h-20 w-16 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span aria-hidden className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--nuit-carte2)] font-[family-name:var(--font-display)] text-2xl font-black text-[var(--nuit-muet)]">{e.titre.charAt(0).toUpperCase()}</span>
                      )}
                      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                        <span className="text-[11.5px] font-bold tracking-widest text-[var(--accent-texte)] uppercase">{CATEGORIES.find((k) => k.slug === e.categorie)?.nom ?? ""}</span>
                        <span className="text-base leading-tight font-bold text-[var(--nuit-texte)]">{e.titre}</span>
                        <span className="truncate text-[13px] text-[var(--nuit-muet)]">{[e.lieu?.nom, e.ville].filter(Boolean).join(" · ")}</span>
                        {e.prix && <span className="text-[13px] font-semibold text-[var(--or)]">{e.prix}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
