"use client";

import { useEffect, useState } from "react";
import { LoupeRecherche } from "@/components/listing/LoupeRecherche";
import { NavBasse } from "@/components/listing/NavBasse";

/**
 * Barre d'outils du bas (rendue par le Gabarit, toutes pages publiques) :
 * en haut de la page, la barre de navigation est présente ; dès que le
 * visiteur défile (> 120 px), elle se change en loupe de recherche —
 * et la barre revient quand on remonte en haut. Le seuil est lu dès le
 * montage : un rechargement en milieu de page montre directement la loupe.
 */
export function BarreOutilsMorph({ email }: { email?: string }) {
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    const maj = () => setDefile(window.scrollY > 120);
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
