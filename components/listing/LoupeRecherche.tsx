"use client";

import Link from "next/link";
import { Search } from "lucide-react";

/**
 * Loupe de recherche (pages publiques, rendue par BarreOutilsMorph) :
 * bouton rond en bas à droite qui remplace la barre d'outils du bas dès
 * que le visiteur défile. La visibilité est pilotée par la prop
 * `visible` — fondu + échelle (~250 ms), coupés si le téléphone demande
 * moins d'animations.
 */
export function LoupeRecherche({ visible }: { visible: boolean }) {
  return (
    <Link
      href="/recherche"
      aria-label="Search"
      aria-hidden={!visible}
      className={`fixed right-4 bottom-[calc(16px_+_env(safe-area-inset-bottom,0px))] z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--accent)] text-[#1C1305] shadow-[0_10px_24px_rgba(23,23,28,0.3)] transition-[opacity,transform,visibility] duration-250 motion-reduce:transition-none md:right-6 md:bottom-6 ${
        visible ? "visible scale-100 opacity-100" : "invisible scale-75 pointer-events-none opacity-0"
      }`}
    >
      <Search size={24} strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
