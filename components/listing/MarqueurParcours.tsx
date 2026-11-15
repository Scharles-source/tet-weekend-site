"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Marqueur de parcours (session) : mémorise la page précédente et la page
 * actuelle du visiteur, dans sessionStorage (« tw_trajet »). Il permet au
 * bouton retour des fiches de savoir si la visite a commencé à l'intérieur
 * du site (auquel cas l'historique ramène quelque part) ou si le visiteur
 * est arrivé directement sur la fiche par un lien partagé (auquel cas le
 * bouton doit mener à la page parente, pas « revenir » hors du site).
 * Posé en dernier dans le Gabarit : ses effets passent après ceux des
 * pages, qui peuvent donc lire le trajet « d'avant cette page ».
 */
export function MarqueurParcours() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const brut = sessionStorage.getItem("tw_trajet");
      const actuel = brut ? (JSON.parse(brut) as { actuel?: string | null }).actuel : null;
      if (actuel !== pathname) {
        sessionStorage.setItem("tw_trajet", JSON.stringify({ precedent: actuel ?? null, actuel: pathname }));
      }
    } catch {
      /* stockage indisponible (navigation privée stricte) : le bouton retour retombera sur sa page parente */
    }
  }, [pathname]);
  return null;
}
