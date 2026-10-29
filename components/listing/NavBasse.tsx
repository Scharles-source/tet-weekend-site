"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MapPin, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";

const ENTREES = [
  { href: "/", label: "Accueil", icone: Home, exact: true, action: false },
  { href: "/evenements", label: "Événements", icone: CalendarDays, exact: false, action: false },
  { href: "/evenements?recherche=1", label: "Recherche", icone: Search, exact: false, action: true },
  { href: "/villes", label: "Villes", icone: MapPin, exact: false, action: false },
] as const;

const PLUS = [
  { href: "/lieux", label: "Lieux" },
  { href: "/artistes", label: "Artistes" },
  { href: "/categories", label: "Catégories" },
];

export function NavBasse() {
  const pathname = usePathname();
  const [plus, setPlus] = useState(false);
  const plusActif = PLUS.some((l) => pathname.startsWith(l.href));

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:hidden" aria-label="Navigation">
      {plus && (
        <div className="pointer-events-auto mb-2 rounded-[24px] border border-[#EFE5D2]/70 bg-white/85 px-4 py-2 shadow-[0_12px_32px_rgba(28,23,16,.16)] backdrop-blur-xl">
          {PLUS.map((lien) => (
            <Link key={lien.href} href={lien.href} onClick={() => setPlus(false)} className="block py-2 text-sm font-semibold text-[#191410] no-underline">
              {lien.label}
            </Link>
          ))}
        </div>
      )}
      <ul className="pointer-events-auto grid grid-cols-5 overflow-hidden rounded-full border border-[#EFE5D2]/70 bg-white/75 shadow-[0_12px_32px_rgba(28,23,16,.18)] backdrop-blur-xl">
        {ENTREES.map((entree) => {
          const actif = !entree.action && (entree.exact ? pathname === entree.href : pathname.startsWith(entree.href));
          const Icone = entree.icone;
          return (
            <li key={entree.label}>
              <Link href={entree.href} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold no-underline ${actif ? "text-[#E02B20]" : "text-[#9A8B74]"}`}>
                <Icone size={20} aria-hidden />
                {entree.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-expanded={plus}
            className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${plus || plusActif ? "text-[#E02B20]" : "text-[#9A8B74]"}`}
            onClick={() => setPlus((v) => !v)}
          >
            <MoreHorizontal size={20} aria-hidden />
            Plus
          </button>
        </li>
      </ul>
    </nav>
  );
}
