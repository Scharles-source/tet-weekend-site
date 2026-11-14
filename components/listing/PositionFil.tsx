"use client";

import { useEffect, useMemo, useState } from "react";
import { etiquettePosition, nombreProches, pointExact, POSITION_DEFAUT, positionDepuisVille, positionDetecteeFiable, type Position } from "@/lib/listing/proximite";
import type { EvenementPublic } from "@/lib/listing/types";

const CLE_VILLE = "tw_ville_choisie";
const CLE_CACHE = "tw_position";

/** Position du visiteur : la ville qu'il a choisie, sinon celle détectée par son réseau (approximative, jamais enregistrée). */
export function usePosition(evenements: EvenementPublic[]) {
  const [detectee, setDetectee] = useState<Position | null>(null);
  const [detectionFaite, setDetectionFaite] = useState(false);
  const [choisie, setChoisie] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const c = window.localStorage.getItem(CLE_VILLE);
        if (c && !annule) setChoisie(c);
      } catch {
        /* stockage indisponible : pas de ville mémorisée */
      }
      try {
        const cache = window.sessionStorage.getItem(CLE_CACHE);
        if (cache) {
          if (!annule) {
            setDetectee(JSON.parse(cache) as Position);
            setDetectionFaite(true);
          }
          return;
        }
      } catch {
        /* on interroge le serveur */
      }
      try {
        const r = await fetch("/api/lieu", { cache: "no-store" });
        if (!r.ok) return;
        const p = (await r.json()) as Position;
        try {
          window.sessionStorage.setItem(CLE_CACHE, JSON.stringify(p));
        } catch {
          /* ignoré */
        }
        if (!annule) setDetectee(p);
      } catch {
        /* hors ligne ou bloqué : la position par défaut (Haïti) prend le relais */
      } finally {
        if (!annule) setDetectionFaite(true);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  const villesCatalogue = useMemo(() => {
    const noms = new Set<string>();
    for (const e of evenements) {
      if (e.ville) noms.add(e.ville);
      if (e.lieu?.ville) noms.add(e.lieu.ville);
    }
    return [...noms];
  }, [evenements]);

  const position = useMemo<Position | null>(() => {
    if (choisie) return positionDepuisVille(choisie, evenements);
    if (detectee && (detectee.ville || detectee.pays || pointExact(detectee))) {
      // Ville détectée hors catalogue = approximation du réseau : on garde la zone et le pays.
      const fiable = positionDetecteeFiable(detectee, villesCatalogue);
      if (fiable.ville || fiable.region || fiable.pays) return fiable;
    }
    // Rien d'utilisable : le point de référence par défaut est le cœur du catalogue (Haïti).
    return detectionFaite ? POSITION_DEFAUT : null;
  }, [choisie, detectee, evenements, villesCatalogue, detectionFaite]);

  function choisir(nom: string | null) {
    setChoisie(nom);
    try {
      if (nom) window.localStorage.setItem(CLE_VILLE, nom);
      else window.localStorage.removeItem(CLE_VILLE);
    } catch {
      /* ignoré */
    }
  }

  return { position, choisie, choisir };
}

/** Pastille « Showing events near … · Change » : dit pourquoi le fil est dans cet ordre et laisse changer de ville. */
export function PastilleLieu({
  position,
  evenements,
  villes,
  choisie,
  onChoisir,
}: {
  position: Position | null;
  evenements: EvenementPublic[];
  villes: string[];
  choisie: string | null;
  onChoisir: (nom: string | null) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  if (!position) return null;
  const nom = etiquettePosition(position);
  const proches = nombreProches(evenements, position);
  const texte = proches > 0 ? `Showing events near ${nom} first` : `Nothing listed near ${nom} yet. Showing everything.`;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13.5px] text-[var(--nuit-texte2)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-texte)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span role="status">{texte}</span>
        <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} className="min-h-8 font-extrabold text-[var(--accent-texte)] underline underline-offset-2">
          Change
        </button>
      </div>
      {ouvert && (
        <div className="no-scrollbar -mx-[var(--page-px)] mt-2 flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Choose your city">
          <button
            type="button"
            aria-pressed={choisie === null}
            onClick={() => {
              onChoisir(null);
              setOuvert(false);
            }}
            className={`inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-bold ${choisie === null ? "bg-[var(--accent)] text-white" : "border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] text-[var(--nuit-texte)]"}`}
          >
            My location
          </button>
          {villes.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={choisie === v}
              onClick={() => {
                onChoisir(v);
                setOuvert(false);
              }}
              className={`inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold ${choisie === v ? "bg-[var(--accent)] text-white" : "border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] text-[var(--nuit-texte)]"}`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
