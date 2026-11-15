"use client";

import { useEffect, useRef, useState } from "react";
import { LoupeRecherche } from "@/components/listing/LoupeRecherche";
import { NavBasse } from "@/components/listing/NavBasse";

const SEUIL_HAUT = 60; // tout en haut : la barre est toujours présente
const SEUIL_LOUPE = 120; // passé ce point, défiler vers le bas bascule en loupe
const ZONE_MORTE = 8; // px : les micro-mouvements ne changent pas de direction (anti-scintillement)

/**
 * Barre d'outils du bas (rendue par le Gabarit, toutes pages publiques) :
 * la navigation est présente en haut de page ; quand le visiteur défile
 * vers le bas (au-delà de 120 px), elle se change en loupe de recherche ;
 * dès qu'il défile vers le haut, la barre réapparaît, quelle que soit la
 * position — pas besoin de revenir tout en haut. Au montage, la position
 * décide : barre si scrollY ≤ 120, loupe sinon (rechargement en milieu
 * de page).
 */
export function BarreOutilsMorph({ email }: { email?: string }) {
  const [defile, setDefile] = useState(false);
  const dernierY = useRef(0);

  useEffect(() => {
    let initialise = false;
    const maj = () => {
      const y = window.scrollY;
      if (!initialise) {
        initialise = true;
        dernierY.current = y;
        setDefile(y > SEUIL_LOUPE);
        return;
      }
      if (y <= SEUIL_HAUT) {
        setDefile(false);
        dernierY.current = y;
        return;
      }
      const ecart = y - dernierY.current;
      if (Math.abs(ecart) <= ZONE_MORTE) return;
      if (ecart > 0) {
        if (y > SEUIL_LOUPE) setDefile(true);
      } else {
        setDefile(false);
      }
      dernierY.current = y;
    };
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    return () => window.removeEventListener("scroll", maj);
  }, []);

  return (
    <>
      <NavBasse email={email} masquee={defile} />
      <LoupeRecherche visible={defile} />
    </>
  );
}
