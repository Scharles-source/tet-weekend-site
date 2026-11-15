"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Affiche } from "@/components/listing/Affiche";
import { BanniereAccueil, type Panneau } from "@/components/listing/BanniereAccueil";
import { usePosition } from "@/components/listing/PositionFil";
import { cleJour, type JourEvenements } from "@/lib/listing/jours";
import { etiquettePosition, pointDeReference, trierParDistance, zoneDePosition } from "@/lib/listing/proximite";
import type { EvenementPublic } from "@/lib/listing/types";

type Mode = "proche" | "tout";

const SEG_ON = "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--nuit-carte2)] px-4 text-sm font-bold text-white";
const SEG_OFF = "flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[var(--nuit-muet)]";

export function AccueilPublic({
  evenements: evenementsInitiaux,
  jours,
  panneaux,
  email,
}: {
  evenements: EvenementPublic[];
  /** Jours qui ont au moins un événement à venir, comptes exacts sur la liste complète (calculés côté serveur). */
  jours: JourEvenements[];
  /** Panneaux du carrousel vedette en haut de l'accueil (sponsorisés, puis trending). */
  panneaux: Panneau[];
  email: string;
}) {
  // L'accueil reçoit un premier jeu (ce soir, ce weekend, les prochains). La
  // liste complète n'est chargée — par /api/annuaire — que si le jour choisi
  // n'est pas entièrement couvert par ce premier jeu (correctif poids,
  // audit 13 nov. 2026).
  const [tous, setTous] = useState<EvenementPublic[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const listeBase = tous ?? evenementsInitiaux;
  const { position } = usePosition(listeBase);
  const point = useMemo(() => pointDeReference(position), [position]);

  // Jour affiché : aujourd'hui s'il a des événements, sinon le premier jour
  // du bandeau (qui ne liste que des jours avec événements). Le choix du
  // visiteur, quand il touche une autre case, prime ensuite.
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);
  const jourDefaut = jours.find((j) => j.aujourdhui)?.cle ?? jours[0]?.cle ?? null;
  const jourActif = jourChoisi ?? jourDefaut;
  const jour = jours.find((j) => j.cle === jourActif) ?? null;

  // « Near me » par défaut, comme la maquette validée ; « All » = tout le
  // catalogue du jour, en ordre chronologique.
  const [mode, setMode] = useState<Mode>("proche");

  // Couverture du jour affiché : le compte exact vient du serveur (liste
  // complète) ; si le premier jeu en contient moins, on charge tout.
  const compteCharge = useMemo(
    () => (jour ? listeBase.filter((e) => cleJour(e.date_debut, e.fuseau) === jour.cle).length : 0),
    [listeBase, jour],
  );
  const manque = jour !== null && tous === null && compteCharge < jour.compte;

  useEffect(() => {
    if (!manque) return;
    let annule = false;
    (async () => {
      setChargement(true);
      try {
        const r = await fetch("/api/annuaire");
        if (!r.ok) throw new Error("annuaire indisponible");
        const d = (await r.json()) as { evenements: EvenementPublic[] };
        if (!annule) setTous(d.evenements);
      } catch {
        /* le premier jeu reste affiché, filtré au mieux */
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [manque]);

  // Mode « Near me » : le tri radial existant (distance croissante depuis le
  // point du visiteur). Mode « All » : ordre chronologique, sans distance.
  const evenements = useMemo(() => {
    if (mode === "proche") return trierParDistance(listeBase, point);
    return [...listeBase].sort((a, b) => Date.parse(a.date_debut) - Date.parse(b.date_debut));
  }, [listeBase, mode, point]);

  const duJour = useMemo(
    () => (jour ? evenements.filter((e) => cleJour(e.date_debut, e.fuseau) === jour.cle) : []),
    [evenements, jour],
  );

  // Le deuxième segment dit « All of Haiti » tant que le visiteur est en
  // Haïti (ou pas encore situé : le site y est ancré par défaut) ; ailleurs,
  // il dit simplement « All events ».
  const enHaiti = !position || position.pays === "HT" || zoneDePosition(position) === "haiti";
  const libelleTout = enHaiti ? "All of Haiti" : "All events";
  // Le segment « près de moi » nomme le lieu de référence (etiquettePosition).
  const nomLieu = position ? etiquettePosition(position) : null;
  const libelleProche = nomLieu ? `Near me · ${nomLieu}` : "Near me";

  return (
    <div>
      <header className="max-w-[640px]">
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[40px] leading-[1.02] font-black tracking-tight text-balance text-[var(--nuit-texte)] lg:text-[60px]">
          Partying <span className="text-[var(--accent-texte)]">in Haiti</span>
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-[var(--nuit-muet)] lg:text-[17px]">What&apos;s on, and what&apos;s close to you.</p>
      </header>

      {/* Dates + portée, collées sous l'en-tête dès que la page défile (l'en-tête
          global, fixe, mesure 65 px bordure comprise) : le visiteur peut changer
          de jour à tout moment, sans remonter en haut de la page. */}
      <div className="sticky top-[65px] z-30 -mx-[var(--page-px)] mt-5 border-b border-[var(--nuit-ligne)] bg-[rgba(38,38,44,0.92)] px-[var(--page-px)] pt-3 pb-3 backdrop-blur-lg">
      {/* Bandeau de dates : seuls les jours qui ont des événements. */}
      {jours.length > 0 && (
        <div className="no-scrollbar -mx-[var(--page-px)] flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Choose a day">
          {jours.map((j) => {
            const actif = j.cle === jourActif;
            return (
              <button
                key={j.cle}
                type="button"
                aria-pressed={actif}
                onClick={() => setJourChoisi(j.cle)}
                className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 ${
                  actif
                    ? "bg-[var(--nuit-texte)] text-[var(--encre)]"
                    : "cursor-pointer border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] text-[var(--nuit-texte)]"
                }`}
              >
                <span className={`text-[10px] font-bold tracking-[0.12em] uppercase ${actif ? "text-[var(--encre2)]" : "text-[var(--nuit-muet)]"}`}>
                  {j.aujourdhui ? "Tonight" : j.nom}
                </span>
                <span className="mt-1 text-[19px] leading-none font-extrabold">{j.numero}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Près de moi, ou tout le catalogue. */}
      <div className={`${jours.length > 0 ? "mt-3" : ""} flex rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-1`} role="group" aria-label="Near me or everywhere">
        <button type="button" aria-pressed={mode === "proche"} onClick={() => setMode("proche")} className={mode === "proche" ? SEG_ON : SEG_OFF}>
          {mode === "proche" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
          {libelleProche}
        </button>
        <button type="button" aria-pressed={mode === "tout"} onClick={() => setMode("tout")} className={mode === "tout" ? SEG_ON : SEG_OFF}>
          {mode === "tout" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
          {libelleTout}
        </button>
      </div>
      </div>

      {/* Carrousel vedette : sponsorisés et trending, en grand format (la
          bannière porte ses propres étiquettes FEATURED / TRENDING). */}
      <section className="mt-8 lg:mt-12">
        <BanniereAccueil panneaux={panneaux} email={email} />
      </section>

      {/* Le jour choisi, et lui seul. */}
      <section className="mt-9 lg:mt-12" aria-live="polite">
        {jour ? (
          <>
            <div className="mb-3.5 flex items-baseline justify-between gap-3 lg:mb-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[var(--nuit-texte)] lg:text-[30px]">
                {jour.nom} {jour.numero} · {mode === "proche" ? "Near you" : libelleTout}
              </h2>
              <span className="shrink-0 text-[13px] font-semibold text-[var(--nuit-muet)]">
                {jour.compte} event{jour.compte > 1 ? "s" : ""}
                {chargement ? " · loading…" : ""}
              </span>
            </div>
            {duJour.length === 0 ? (
              <p className="rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-5 text-[15px] text-[var(--nuit-texte2)]">
                Nothing published for this day yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {duJour.map((e) => (
                  <Affiche key={e.id} evenement={e} large />
                ))}
              </div>
            )}
            <p className="mt-5">
              <Link href="/evenements" className="text-sm font-bold text-[var(--accent-texte)] no-underline">
                See all events
              </Link>
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--nuit-muet)]">No upcoming events for the moment.</p>
        )}
      </section>
    </div>
  );
}
