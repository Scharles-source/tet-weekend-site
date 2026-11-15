"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Affiche } from "@/components/listing/Affiche";
import { PastilleLieu, usePosition } from "@/components/listing/PositionFil";
import { cleJour, type JourEvenements } from "@/lib/listing/jours";
import { pointDeReference, trierParDistance, zoneDePosition } from "@/lib/listing/proximite";
import { tendances } from "@/lib/listing/tendance";
import { libelleVues } from "@/lib/listing/preuve";
import { flyerAllege } from "@/lib/listing/image-url";
import type { EvenementPublic } from "@/lib/listing/types";

type Mode = "proche" | "tout";

const SEG_ON = "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--nuit-carte2)] px-4 text-sm font-bold text-white";
const SEG_OFF = "flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[var(--nuit-muet)]";

export function AccueilPublic({
  evenements: evenementsInitiaux,
  comptesVilles,
  jours,
}: {
  evenements: EvenementPublic[];
  /** Comptes par ville sur la liste complète (la pastille de lieu reste exacte même si seul un premier jeu est rendu). */
  comptesVilles?: [string, number][];
  /** Jours qui ont au moins un événement à venir, comptes exacts sur la liste complète (calculés côté serveur). */
  jours: JourEvenements[];
}) {
  // L'accueil reçoit un premier jeu (ce soir, ce weekend, les prochains). La
  // liste complète n'est chargée — par /api/annuaire — que si le jour choisi
  // n'est pas entièrement couvert par ce premier jeu (correctif poids,
  // audit 13 nov. 2026).
  const [tous, setTous] = useState<EvenementPublic[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const listeBase = tous ?? evenementsInitiaux;
  const { position, choisie, choisir } = usePosition(listeBase);
  const point = useMemo(() => pointDeReference(position), [position]);

  const villes = useMemo(() => {
    if (comptesVilles) return comptesVilles;
    const compte = new Map<string, number>();
    for (const e of listeBase) if (e.ville) compte.set(e.ville, (compte.get(e.ville) ?? 0) + 1);
    return [...compte.entries()].sort((a, b) => b[1] - a[1]);
  }, [comptesVilles, listeBase]);

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

  // « Trending now » : les plus vus, seulement avec de vraies vues (voir lib/listing/tendance.ts).
  const enVogue = useMemo(() => tendances(listeBase), [listeBase]);

  // Le deuxième segment dit « All of Haiti » tant que le visiteur est en
  // Haïti (ou pas encore situé : le site y est ancré par défaut) ; ailleurs,
  // il dit simplement « All events ».
  const enHaiti = !position || position.pays === "HT" || zoneDePosition(position) === "haiti";
  const libelleTout = enHaiti ? "All of Haiti" : "All events";

  return (
    <div>
      <header className="max-w-[640px]">
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[40px] leading-[1.02] font-black tracking-tight text-balance text-[var(--nuit-texte)] lg:text-[60px]">
          Partying <span className="text-[var(--accent-texte)]">in Haiti</span>
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-[var(--nuit-muet)] lg:text-[17px]">What&apos;s on, and what&apos;s close to you.</p>
      </header>

      <PastilleLieu position={position} evenements={listeBase} villes={villes.map(([nom]) => nom)} choisie={choisie} onChoisir={choisir} />

      {/* Bandeau de dates : seuls les jours qui ont des événements. */}
      {jours.length > 0 && (
        <div className="no-scrollbar -mx-[var(--page-px)] mt-5 flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Choose a day">
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
      <div className="mt-4 flex rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-1" role="group" aria-label="Near me or everywhere">
        <button type="button" aria-pressed={mode === "proche"} onClick={() => setMode("proche")} className={mode === "proche" ? SEG_ON : SEG_OFF}>
          {mode === "proche" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
          Near me
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

      {enVogue.length > 0 && (
        <Rangee titre="Trending now" sousTitre="The most viewed events right now." href="/evenements">
          {enVogue.map((e, i) => (
            <PetiteAffiche key={e.id} evenement={e} rang={i + 1} />
          ))}
        </Rangee>
      )}

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

function Rangee({ titre, sousTitre, href, children }: { titre: string; sousTitre?: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 lg:mt-12">
      <EnteteSection titre={titre} href={href} />
      {sousTitre && <p className="-mt-2 mb-3.5 text-[13.5px] text-[var(--nuit-muet)] lg:mb-5">{sousTitre}</p>}
      <div className="no-scrollbar -mx-[var(--page-px)] flex snap-x gap-3 overflow-x-auto px-[var(--page-px)] lg:gap-5">{children}</div>
    </section>
  );
}

function EnteteSection({ titre, href }: { titre: string; href: string }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3 lg:mb-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[var(--nuit-texte)] lg:text-[30px]">{titre}</h2>
      <Link href={href} className="flex min-h-11 items-center text-sm font-bold text-[var(--accent-texte)] no-underline lg:text-[15px]">See all</Link>
    </div>
  );
}

/** Petite affiche de la rangée « Trending now » : flyer rogné, rang, titre, vues. */
function PetiteAffiche({ evenement, rang }: { evenement: EvenementPublic; rang: number }) {
  const url = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;
  const vues = libelleVues(evenement.vues);
  return (
    <Link
      href={`/evenements/${evenement.slug}`}
      className="relative block h-[230px] w-[160px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-[#17171C] text-white no-underline shadow-[0_6px_16px_rgba(0,0,0,0.4)] lg:h-[270px] lg:w-[190px]"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flyerAllege(url, 384)} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" decoding="async" />
      ) : (
        <span className="absolute inset-0" style={{ background: "linear-gradient(160deg,#5C1A26 0%,#38121C 100%)" }} />
      )}
      <span className="absolute inset-x-0 bottom-0 h-[130px]" style={{ background: "linear-gradient(180deg, rgba(14,14,17,0), rgba(14,14,17,0.9))" }} />
      <span className="absolute top-2 left-2.5 font-[family-name:var(--font-display)] text-[34px] leading-none font-black" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.55)" }}>
        {rang}
      </span>
      <span className="absolute inset-x-2.5 bottom-2.5 block">
        <span className="line-clamp-2 block font-[family-name:var(--font-display)] text-[15px] leading-tight font-black">{evenement.titre}</span>
        {evenement.ville && <span className="mt-0.5 block truncate text-[12px] opacity-90">{evenement.ville}</span>}
        {vues && <span className="mt-1 block text-[12px] font-semibold text-[#E9A13B]">{vues}</span>}
      </span>
    </Link>
  );
}
