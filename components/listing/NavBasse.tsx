"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MapPin, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";

const GAUCHE = [
  { href: "/", label: "Accueil", icone: Home, exact: true },
  { href: "/villes", label: "Villes", icone: MapPin, exact: false },
] as const;
const DROITE = [{ href: "/evenements", label: "Agenda", icone: CalendarDays, exact: false }] as const;

const PLUS = [
  { href: "/lieux", label: "Lieux" },
  { href: "/artistes", label: "Artistes" },
  { href: "/categories", label: "Catégories" },
  { href: "/decembre", label: "Décembre" },
];

export function NavBasse({ email }: { email?: string }) {
  const pathname = usePathname();
  const [plus, setPlus] = useState(false);
  const plusActif = PLUS.some((l) => pathname.startsWith(l.href));
  const lien = (e: { href: string; label: string; icone: typeof Home; exact: boolean }) => {
    const actif = e.exact ? pathname === e.href : pathname.startsWith(e.href);
    const Icone = e.icone;
    return (
      <li key={e.label}>
        <Link href={e.href} aria-current={actif ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-bold no-underline ${actif ? "text-[var(--accent-texte)]" : "text-[var(--nuit-muet)]"}`}>
          <Icone size={22} aria-hidden />
          {e.label}
        </Link>
      </li>
    );
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:hidden" aria-label="Navigation">
      {plus && (
        <div className="pointer-events-auto mb-2 ml-auto w-56 rounded-[24px] border border-[var(--nuit-ligne)] bg-[rgba(27,22,19,0.96)] px-4 py-2 shadow-[0_12px_32px_rgba(0,0,0,.5)] backdrop-blur-xl">
          {PLUS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setPlus(false)} className="block py-3 text-sm font-semibold text-[var(--nuit-texte)] no-underline">
              {l.label}
            </Link>
          ))}
          {email && (
            <a href={`mailto:${email}?subject=Proposer%20mon%20%C3%A9v%C3%A9nement`} className="block border-t border-[var(--nuit-ligne)] py-3 text-sm font-bold text-[var(--accent-texte)] no-underline">
              Proposer mon événement
            </a>
          )}
        </div>
      )}
      <ul className="pointer-events-auto grid grid-cols-5 rounded-full border border-[var(--nuit-ligne)] bg-[rgba(27,22,19,0.96)] shadow-[0_12px_30px_rgba(0,0,0,.5)] backdrop-blur-xl">
        {GAUCHE.map(lien)}
        <li className="flex items-center justify-center">
          <Link href="/recherche" aria-label="Rechercher" className="-mt-7 flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-[var(--nuit-fond)] bg-[var(--accent)] text-white shadow-[0_8px_20px_rgba(166,52,70,.45)] no-underline">
            <Search size={24} strokeWidth={2.4} aria-hidden />
          </Link>
        </li>
        {DROITE.map(lien)}
        <li>
          <button type="button" aria-expanded={plus} onClick={() => setPlus((v) => !v)} className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${plus || plusActif ? "text-[var(--accent-texte)]" : "text-[var(--nuit-muet)]"}`}>
            <MoreHorizontal size={22} aria-hidden />
            Plus
          </button>
        </li>
      </ul>
    </nav>
  );
}
