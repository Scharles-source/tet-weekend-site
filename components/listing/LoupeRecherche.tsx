"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/**
 * Loupe de recherche (toutes les pages publiques, rendue par le Gabarit) :
 * depuis le retrait de la barre d'outils du bas, la recherche vit dans ce
 * bouton rond permanent en bas à droite. Petite animation d'entrée
 * (fondu + échelle à l'apparition), coupée si le téléphone demande moins
 * d'animations.
 */
export function LoupeRecherche() {
  const [entree, setEntree] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntree(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <Link
      href="/recherche"
      aria-label="Search"
      className={`fixed right-4 bottom-[calc(16px_+_env(safe-area-inset-bottom,0px))] z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--accent)] text-[#1C1305] shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-200 motion-reduce:transition-none md:right-6 md:bottom-6 ${
        entree ? "scale-100 opacity-100" : "scale-[0.8] opacity-0"
      }`}
    >
      <Search size={24} strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
