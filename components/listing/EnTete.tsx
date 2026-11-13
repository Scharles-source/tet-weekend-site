"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Logo } from "@/components/listing/Logo";

const LIENS = [
  { href: "/", label: "Home", exact: true },
  { href: "/evenements", label: "Events", exact: false },
  { href: "/recherche", label: "Search", exact: false, recherche: true },
  { href: "/villes", label: "Cities", exact: false },
  { href: "/lieux", label: "Venues", exact: false },
  { href: "/artistes", label: "Artists", exact: false },
  { href: "/categories", label: "Categories", exact: false },
] as const;

export function EnTete({ large = false, email }: { large?: boolean; email?: string }) {
  const pathname = usePathname();
  const largeur = large ? "max-w-[1240px]" : "max-w-3xl";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--nuit-ligne)] bg-[var(--nuit-fond)]">
      <div className={`mx-auto flex h-16 w-full ${largeur} items-center justify-between gap-4 px-[var(--page-px)]`}>
        <Logo />
        {/* Mobile : proposer un événement (la recherche vit dans la barre du bas) */}
        <Link
          href="/ajouter-evenement"
          className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[14px] font-extrabold text-white shadow-[0_4px_12px_rgba(166,52,70,.35)] no-underline md:hidden"
        >
          <Plus size={17} strokeWidth={2.8} aria-hidden />
          Add an event
        </Link>
        {/* Desktop : navigation horizontale */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {LIENS.map((lien) => {
            const actif = !("recherche" in lien && lien.recherche) && (lien.exact ? pathname === lien.href : pathname.startsWith(lien.href));
            return (
              <Link
                key={lien.label}
                href={lien.href}
                className={`flex items-center gap-1.5 text-[15px] font-semibold no-underline ${actif ? "text-[var(--accent-texte)]" : "text-[var(--nuit-texte2)]"}`}
              >
                {"recherche" in lien && lien.recherche ? <Search size={16} aria-hidden /> : null}
                {lien.label}
              </Link>
            );
          })}
          <Link
            href="/ajouter-evenement"
            className="flex items-center gap-1.5 rounded-full border-2 border-[var(--accent)] px-5 py-2 text-[14px] font-bold text-[var(--accent-texte)] no-underline"
          >
            <Plus size={16} strokeWidth={2.8} aria-hidden />
            Add an event
          </Link>
          {email ? (
            <a
              href={`mailto:${email}?subject=Become%20a%20partner`}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(166,52,70,.3)] no-underline"
            >
              Become a partner
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
