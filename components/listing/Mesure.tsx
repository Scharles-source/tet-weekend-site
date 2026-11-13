"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { appareilDepuis, slugEvenement, sourceDepuis } from "@/lib/listing/mesure";

const CLE_VISITEUR = "tw_visiteur";
const CLE_EXCLURE = "tw_exclure";
const CLE_SOURCE = "tw_source";
const PING_MS = 60_000;

function lire(stockage: "local" | "session", cle: string): string | null {
  try {
    return (stockage === "local" ? window.localStorage : window.sessionStorage).getItem(cle);
  } catch {
    return null;
  }
}
function ecrire(stockage: "local" | "session", cle: string, valeur: string | null) {
  try {
    const s = stockage === "local" ? window.localStorage : window.sessionStorage;
    if (valeur === null) s.removeItem(cle);
    else s.setItem(cle, valeur);
  } catch {
    /* navigation privée : on continue sans mémoire locale */
  }
}

function visiteur(): string {
  let v = lire("local", CLE_VISITEUR);
  if (!v) {
    v = crypto.randomUUID();
    ecrire("local", CLE_VISITEUR, v);
  }
  return v;
}

/** Ni mesure si le navigateur demande « Ne pas me suivre », ni pour un appareil exclu (le tien : ?exclure=1). */
function mesureAutorisee(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("exclure") === "1") ecrire("local", CLE_EXCLURE, "1");
  if (params.get("exclure") === "0") ecrire("local", CLE_EXCLURE, null);
  if (lire("local", CLE_EXCLURE) === "1") return false;
  return navigator.doNotTrack !== "1";
}

function source(): string {
  const memo = lire("session", CLE_SOURCE);
  if (memo) return memo;
  const params = new URLSearchParams(window.location.search);
  const trouve = sourceDepuis({ marqueur: params.get("s"), referrer: document.referrer, ua: navigator.userAgent, hoteLocal: window.location.hostname });
  ecrire("session", CLE_SOURCE, trouve);
  return trouve;
}

function appareil(): "mobile" | "ordinateur" {
  return appareilDepuis(window.matchMedia("(pointer: coarse)").matches);
}

function envoyer(corps: Record<string, unknown>) {
  const donnees = JSON.stringify({ visiteur: visiteur(), appareil: appareil(), ...corps });
  try {
    void fetch("/api/mesure", { method: "POST", headers: { "Content-Type": "application/json" }, body: donnees, keepalive: true }).catch(() => undefined);
  } catch {
    /* hors ligne : on ne fait rien */
  }
}

/** Fiche de l'événement concerné par un clic : l'adresse de la page, sinon la carte cliquée. */
function slugDuClic(cible: Element): string | null {
  const direct = slugEvenement(window.location.pathname);
  if (direct) return direct;
  const lien = cible.closest("article")?.querySelector<HTMLAnchorElement>('a[href^="/evenements/"]');
  return lien ? slugEvenement(lien.getAttribute("href") ?? "") : null;
}

/** Mesure d'audience anonyme du site public : pages vues, présence en ligne, clics flyer et agenda. */
export function Mesure() {
  const chemin = usePathname();
  const autorise = useRef<boolean | null>(null);

  useEffect(() => {
    if (autorise.current === null) autorise.current = mesureAutorisee();
    if (!autorise.current) return;
    envoyer({ type: "vue", chemin, slug: slugEvenement(chemin), source: source() });
  }, [chemin]);

  useEffect(() => {
    if (autorise.current === null) autorise.current = mesureAutorisee();
    if (!autorise.current) return;
    const ping = () => {
      if (document.visibilityState === "visible") envoyer({ type: "ping" });
    };
    const minuteur = window.setInterval(ping, PING_MS);
    document.addEventListener("visibilitychange", ping);

    const clic = (ev: MouseEvent) => {
      const cible = (ev.target as Element | null)?.closest("a, button");
      if (!cible) return;
      const href = cible.getAttribute("href") ?? "";
      const libelle = (cible.getAttribute("aria-label") ?? cible.textContent ?? "").toLowerCase();
      let action: "agenda" | "flyer" | null = null;
      if (href.startsWith("https://calendar.google.com/") || href.endsWith("/calendrier")) action = "agenda";
      else if (libelle.includes("flyer") && /voir|ouvrir|agrandir/.test(libelle)) action = "flyer";
      if (!action) return;
      const slug = slugDuClic(cible);
      if (slug) envoyer({ type: "action", action, slug });
    };
    document.addEventListener("click", clic);

    return () => {
      window.clearInterval(minuteur);
      document.removeEventListener("visibilitychange", ping);
      document.removeEventListener("click", clic);
    };
  }, []);

  return null;
}
