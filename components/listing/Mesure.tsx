"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { appareilDepuis, etiquetteDepuis, referrerExterne, slugEvenement, sourceDepuis, type Etiquette } from "@/lib/listing/mesure";

const CLE_VISITEUR = "tw_visiteur";
const CLE_EXCLURE = "tw_exclure";
const CLE_SOURCE = "tw_source";
const CLE_ETIQUETTE = "tw_etiquette";
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

type EtatMesure = "ok" | "exclu" | "bloque";

/**
 * « Ne pas me suivre » : aucune mesure (« bloque »). Appareil exclu (le tien : ?exclure=1) :
 * la visite part quand même, marquée « exclu », pour que la base l'écarte des chiffres —
 * et que l'exclusion soit vérifiable dans l'admin. Tout le reste (présence, actions, app)
 * reste réservé aux navigateurs « ok ».
 */
function etatMesure(): EtatMesure {
  const params = new URLSearchParams(window.location.search);
  if (params.get("exclure") === "1") ecrire("local", CLE_EXCLURE, "1");
  if (params.get("exclure") === "0") ecrire("local", CLE_EXCLURE, null);
  if (navigator.doNotTrack === "1") return "bloque";
  if (lire("local", CLE_EXCLURE) === "1") return "exclu";
  return "ok";
}

function source(): string {
  const memo = lire("session", CLE_SOURCE);
  if (memo) return memo;
  const params = new URLSearchParams(window.location.search);
  const trouve = sourceDepuis({ marqueur: params.get("s"), utmSource: etiquetteDepuis(params).utmSource, referrer: document.referrer, ua: navigator.userAgent, hoteLocal: window.location.hostname });
  ecrire("session", CLE_SOURCE, trouve);
  return trouve;
}

type EtiquetteSession = Etiquette & { referrer: string | null };

/** L'étiquette du lien d'arrivée (utm_* + site d'origine), lue une fois et gardée pour la session. */
function etiquette(): EtiquetteSession {
  const memo = lire("session", CLE_ETIQUETTE);
  if (memo) {
    try {
      return JSON.parse(memo) as EtiquetteSession;
    } catch {
      /* mémo illisible : on relit l'adresse */
    }
  }
  const params = new URLSearchParams(window.location.search);
  const lu: EtiquetteSession = { ...etiquetteDepuis(params), referrer: referrerExterne(document.referrer, window.location.hostname) };
  ecrire("session", CLE_ETIQUETTE, JSON.stringify(lu));
  return lu;
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

function plateforme(): "android" | "ios" | "autre" {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "autre";
}

function appInstallee(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** Mesure d'audience anonyme du site public : pages vues, présence en ligne, clics flyer et agenda. */
export function Mesure() {
  const chemin = usePathname();
  const etat = useRef<EtatMesure | null>(null);

  useEffect(() => {
    if (etat.current === null) etat.current = etatMesure();
    if (etat.current === "bloque") return;
    const et = etiquette();
    envoyer({
      type: "vue",
      chemin,
      slug: slugEvenement(chemin),
      source: source(),
      ua: navigator.userAgent,
      ...(et.utmSource ? { utm_source: et.utmSource } : {}),
      ...(et.utmMedium ? { utm_medium: et.utmMedium } : {}),
      ...(et.utmCampaign ? { utm_campaign: et.utmCampaign } : {}),
      ...(et.referrer ? { referrer: et.referrer } : {}),
      ...(etat.current === "exclu" ? { exclu: true } : {}),
    });
  }, [chemin]);

  // Web app : ouverture depuis l'écran d'accueil (une fois par jour) et installation signalée par le navigateur.
  useEffect(() => {
    if (etat.current === null) etat.current = etatMesure();
    if (etat.current !== "ok") return;
    if (appInstallee()) {
      const jour = new Date().toISOString().slice(0, 10);
      if (lire("local", "tw_app_ouverte") !== jour) {
        ecrire("local", "tw_app_ouverte", jour);
        envoyer({ type: "app", evenement: "ouverture", plateforme: plateforme() });
      }
    }
    const installee = () => envoyer({ type: "app", evenement: "installation", plateforme: plateforme() });
    window.addEventListener("appinstalled", installee);
    return () => window.removeEventListener("appinstalled", installee);
  }, []);

  useEffect(() => {
    if (etat.current === null) etat.current = etatMesure();
    if (etat.current !== "ok") return;
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
