"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Affiche } from "@/components/listing/Affiche";
import { BanniereAccueil, type Panneau } from "@/components/listing/BanniereAccueil";
import { usePosition } from "@/components/listing/PositionFil";
import { grouperParJour, libelleGroupeJour, type JourEvenements } from "@/lib/listing/jours";
import { etiquettePosition, pointDeReference, trierParDistance, zoneDePosition } from "@/lib/listing/proximite";
import type { EvenementPublic } from "@/lib/listing/types";

type Mode = "proche" | "tout";

/** Morceaux du fil infini : le fil révèle les événements par paquets de 18, au fil du défilement. */
const TAILLE_MORCEAU = 18;

const SEG_ON = "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--nuit-texte)] px-4 text-sm font-bold text-[var(--encre)]";
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
  // Le fil montre TOUT, groupé par jour (fil infini, demande de Smith,
  // 15 nov. 2026). Le premier jeu vient du serveur ; la liste complète
  // arrive par /api/annuaire dès le montage — même mécanique que l'ancien
  // correctif de poids (audit 13 nov. 2026) : l'HTML initial reste léger,
  // et /api/annuaire sert déjà la liste complète en version allégée.
  const [tous, setTous] = useState<EvenementPublic[] | null>(null);
  const [chargement, setChargement] = useState(true);
  const listeBase = tous ?? evenementsInitiaux;
  const { position } = usePosition(listeBase);
  const point = useMemo(() => pointDeReference(position), [position]);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const r = await fetch("/api/annuaire");
        if (!r.ok) throw new Error("annuaire indisponible");
        const d = (await r.json()) as { evenements: EvenementPublic[] };
        if (!annule) setTous(d.evenements);
      } catch {
        /* le premier jeu reste affiché, au mieux */
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  // « Near me » par défaut, comme la maquette validée ; « All » = tout le
  // catalogue, en ordre chronologique.
  const [mode, setMode] = useState<Mode>("proche");

  // Mode « Near me » : le tri radial existant (distance croissante depuis
  // le point du visiteur). Mode « All » : ordre chronologique. Le
  // regroupement par jour conserve ensuite l'ordre du tri dans chaque jour.
  const evenements = useMemo(() => {
    if (mode === "proche") return trierParDistance(listeBase, point);
    return [...listeBase].sort((a, b) => Date.parse(a.date_debut) - Date.parse(b.date_debut));
  }, [listeBase, mode, point]);

  const groupes = useMemo(() => grouperParJour(evenements), [evenements]);

  // Révélation progressive : un premier morceau rendu tout de suite, les
  // suivants s'ajoutent quand la sentinelle de fin de fil entre à l'écran.
  // Changer de mode repart du premier morceau (dans le clic, pas un effet).
  const [nombreAffiches, setNombreAffiches] = useState(TAILLE_MORCEAU);
  function changerMode(m: Mode) {
    setMode(m);
    setNombreAffiches(TAILLE_MORCEAU);
  }

  const groupesVisibles = useMemo(() => {
    let restant = nombreAffiches;
    const resultat: { jour: JourEvenements; evenements: EvenementPublic[] }[] = [];
    for (const g of groupes) {
      if (restant <= 0) break;
      const pris = g.evenements.slice(0, restant);
      if (pris.length > 0) resultat.push({ jour: g.jour, evenements: pris });
      restant -= pris.length;
    }
    return resultat;
  }, [groupes, nombreAffiches]);

  const total = evenements.length;
  const affiches = groupesVisibles.reduce((n, g) => n + g.evenements.length, 0);
  const reste = total - affiches;

  // Retour d'une fiche événement : retrouver le fil où on l'avait laissé.
  // Pendant la consultation, le nombre de morceaux révélés et la position
  // de défilement sont persistés (sessionStorage). Au remontage du fil, si
  // la page précédente de la session est une fiche (le marqueur de parcours
  // « tw_trajet », posé par le Gabarit, n'a pas encore été mis à jour pour
  // cette page), on restaure les deux. Une visite fraîche de l'accueil —
  // arrivée d'ailleurs que d'une fiche — repart du haut, comme avant.
  const scrollARestaurer = useRef<number | null>(null);
  const nombreARestaurer = useRef(0);

  // Déclaré AVANT l'effet de persistance : au montage, la lecture des
  // valeurs sauvegardées doit précéder leur réécriture par l'état initial.
  useEffect(() => {
    let trajet: { actuel?: string | null } | null = null;
    try {
      trajet = JSON.parse(sessionStorage.getItem("tw_trajet") ?? "null") as { actuel?: string | null } | null;
    } catch {
      /* marqueur illisible : pas de restauration */
    }
    if (!trajet?.actuel?.startsWith("/evenements/")) return;
    let n = 0;
    let y = 0;
    try {
      n = Number(sessionStorage.getItem("tw_fil_nombre"));
      y = Number(sessionStorage.getItem("tw_fil_scroll"));
    } catch {
      /* stockage indisponible */
    }
    const raf = requestAnimationFrame(() => {
      if (Number.isFinite(n) && n > TAILLE_MORCEAU) {
        nombreARestaurer.current = n;
        setNombreAffiches(n);
      }
      if (Number.isFinite(y) && y > 0) scrollARestaurer.current = y;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("tw_fil_nombre", String(nombreAffiches));
    } catch {
      /* stockage indisponible : pas de restauration, le fil repart du haut */
    }
  }, [nombreAffiches]);

  useEffect(() => {
    let enAttente = false;
    const surDefilement = () => {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(() => {
        enAttente = false;
        try {
          sessionStorage.setItem("tw_fil_scroll", String(window.scrollY));
        } catch {
          /* stockage indisponible */
        }
      });
    };
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  // Le défilement n'est appliqué que lorsque les morceaux restaurés sont
  // effectivement rendus (les cartes ont une hauteur fixe, flyer ou non :
  // la position retombe juste dès que le contenu est là).
  useEffect(() => {
    const y = scrollARestaurer.current;
    if (y === null) return;
    if (affiches >= Math.min(nombreARestaurer.current, total)) {
      scrollARestaurer.current = null;
      window.scrollTo(0, y);
    }
  }, [groupesVisibles, affiches, total]);

  const sentinelle = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelle.current;
    if (!el || reste <= 0) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) setNombreAffiches((n) => n + TAILLE_MORCEAU);
      },
      { rootMargin: "800px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reste, groupesVisibles]);

  // Bandeau de dates = navigateur de jours : la case active suit le groupe
  // visible à l'écran (scrollspy), et toucher une case fait défiler le fil
  // jusqu'au groupe du jour.
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);
  const jourActif = jourChoisi ?? jours.find((j) => j.aujourdhui)?.cle ?? jours[0]?.cle ?? null;
  const sections = useRef(new Map<string, HTMLElement>());
  const cibleDefilement = useRef<string | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) {
            const cle = (e.target as HTMLElement).dataset.jour;
            if (cle) setJourChoisi(cle);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const el of sections.current.values()) obs.observe(el);
    return () => obs.disconnect();
  }, [groupesVisibles]);

  // Après un toucher de case dont le groupe n'était pas encore rendu, le
  // défilement a lieu dès que le groupe apparaît.
  useEffect(() => {
    const cle = cibleDefilement.current;
    if (!cle) return;
    const el = sections.current.get(cle);
    if (el) {
      cibleDefilement.current = null;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [groupesVisibles]);

  function allerAuJour(cle: string) {
    setJourChoisi(cle);
    cibleDefilement.current = cle;
    // Révéler le groupe entier s'il est au-delà du morceau déjà affiché.
    let cumul = 0;
    for (const g of groupes) {
      cumul += g.evenements.length;
      if (g.jour.cle === cle) break;
    }
    if (nombreAffiches < cumul) {
      setNombreAffiches(cumul);
    } else {
      const el = sections.current.get(cle);
      if (el) {
        cibleDefilement.current = null;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

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
          global, fixe, mesure 65 px bordure comprise) : le visiteur navigue
          dans le fil par jour, sans remonter en haut de la page. */}
      <div className="sticky top-[65px] z-30 -mx-[var(--page-px)] mt-5 border-b border-[var(--nuit-ligne)] bg-[rgba(250,250,247,0.92)] px-[var(--page-px)] pt-3 pb-3 backdrop-blur-lg">
      {/* Bandeau de dates : seuls les jours qui ont des événements. Chaque
          case fait défiler le fil jusqu'au groupe de ce jour. */}
      {jours.length > 0 && (
        <div className="no-scrollbar -mx-[var(--page-px)] flex gap-2 overflow-x-auto px-[var(--page-px)]" role="group" aria-label="Choose a day">
          {jours.map((j) => {
            const actif = j.cle === jourActif;
            return (
              <button
                key={j.cle}
                type="button"
                aria-pressed={actif}
                onClick={() => allerAuJour(j.cle)}
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
      <div className={`${jours.length > 0 ? "mt-3" : ""} flex rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte2)] p-1`} role="group" aria-label="Near me or everywhere">
        <button type="button" aria-pressed={mode === "proche"} onClick={() => changerMode("proche")} className={mode === "proche" ? SEG_ON : SEG_OFF}>
          {mode === "proche" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
          {libelleProche}
        </button>
        <button type="button" aria-pressed={mode === "tout"} onClick={() => changerMode("tout")} className={mode === "tout" ? SEG_ON : SEG_OFF}>
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

      {/* Le fil infini : tous les événements à venir, groupés par jour. */}
      <section className="mt-9 lg:mt-12">
        <div className="mb-3.5 flex items-baseline justify-between gap-3 lg:mb-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[var(--nuit-texte)] lg:text-[30px]">
            {mode === "proche" ? "Near you" : libelleTout}
          </h2>
          <span className="shrink-0 text-[13px] font-semibold text-[var(--nuit-muet)]">
            {total} event{total > 1 ? "s" : ""}
            {chargement ? " · loading…" : ""}
          </span>
        </div>
        {groupes.length === 0 ? (
          <p className="text-sm text-[var(--nuit-muet)]">No upcoming events for the moment.</p>
        ) : (
          <>
            {groupesVisibles.map((g) => (
              <section
                key={g.jour.cle}
                id={`jour-${g.jour.cle}`}
                data-jour={g.jour.cle}
                ref={(el) => {
                  if (el) sections.current.set(g.jour.cle, el);
                  else sections.current.delete(g.jour.cle);
                }}
                className="mt-8 scroll-mt-[218px] first:mt-0"
                aria-label={libelleGroupeJour(g.jour)}
              >
                <div className="mb-3.5 flex items-baseline justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-[19px] font-black tracking-tight text-[var(--nuit-texte)] lg:text-[22px]">
                    {libelleGroupeJour(g.jour)}
                  </h3>
                  <span className="shrink-0 text-[13px] font-semibold text-[var(--nuit-muet)]">
                    {g.jour.compte} event{g.jour.compte > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                  {g.evenements.map((e) => (
                    <Affiche key={e.id} evenement={e} large />
                  ))}
                </div>
              </section>
            ))}
            <div ref={sentinelle} aria-hidden="true" />
            {reste > 0 && (
              <p className="mt-6 text-center text-[13px] font-semibold text-[var(--nuit-muet)]">Loading more events…</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
