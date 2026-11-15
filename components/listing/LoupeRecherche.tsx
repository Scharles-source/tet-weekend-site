"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/**
 * Loupe de recherche flottante (accueil seulement) : dès que le visiteur
 * défile (~140 px), la recherche devient un bouton rond en bas à droite,
 * au-dessus de la barre de navigation basse ; en haut de page, elle
 * disparaît. Petite animation (fondu + échelle), coupée si le téléphone
 * demande moins d'animations. La barre du bas garde son propre bouton.
 */
export function LoupeRecherche() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const maj = () => setVisible(window.scrollY > 140);
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    return () => window.removeEventListener("scroll", maj);
  }, []);

  return (
    <Link
      href="/recherche"
      aria-label="Search"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-3 bottom-[calc(88px_+_env(safe-area-inset-bottom,0px))] z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--accent)] text-[#1C1305] shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-200 motion-reduce:transition-none md:right-6 md:bottom-6 ${
        visible ? "scale-100 opacity-100" : "pointer-events-none scale-[0.8] opacity-0"
      }`}
    >
      <Search size={24} strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
