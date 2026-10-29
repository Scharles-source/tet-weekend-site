"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Logo } from "@/components/listing/Logo";

const LIENS = [
  { href: "/", label: "Accueil", exact: true },
  { href: "/evenements", label: "Événements", exact: false },
  { href: "/evenements?recherche=1", label: "Recherche", exact: false, recherche: true },
  { href: "/villes", label: "Villes", exact: false },
  { href: "/lieux", label: "Lieux", exact: false },
  { href: "/artistes", label: "Artistes", exact: false },
  { href: "/categories", label: "Catégories", exact: false },
] as const;

export function EnTete({ large = false, email }: { large?: boolean; email?: string }) {
  const pathname = usePathname();
  const largeur = large ? "max-w-[1240px]" : "max-w-3xl";

  return (
    <header className="sticky top-0 z-40 border-b border-[#EFE5D2] bg-[#FBF7EF]">
      <div className={`mx-auto flex h-16 w-full ${largeur} items-center justify-between gap-4 px-[var(--page-px)]`}>
        <Logo />
        {/* Mobile : accès direct à la recherche (la navigation vit dans la barre du bas) */}
        <Link
          href="/evenements?recherche=1"
          aria-label="Rechercher un événement"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E02B20] text-white shadow-[0_4px_12px_rgba(224,43,32,.35)] no-underline md:hidden"
        >
          <Search size={18} aria-hidden />
        </Link>
        {/* Desktop : navigation horizontale */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {LIENS.map((lien) => {
            const actif = !("recherche" in lien && lien.recherche) && (lien.exact ? pathname === lien.href : pathname.startsWith(lien.href));
            return (
              <Link
                key={lien.label}
                href={lien.href}
                className={`flex items-center gap-1.5 text-[15px] font-semibold no-underline ${actif ? "text-[#E02B20]" : "text-[#4A4136]"}`}
              >
                {"recherche" in lien && lien.recherche ? <Search size={16} aria-hidden /> : null}
                {lien.label}
              </Link>
            );
          })}
          {email ? (
            <a
              href={`mailto:${email}?subject=Devenir%20partenaire`}
              className="rounded-full bg-[#E02B20] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(224,43,32,.3)] no-underline"
            >
              Devenir partenaire
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
