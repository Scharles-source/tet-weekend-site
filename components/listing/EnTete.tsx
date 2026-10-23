"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/listing/Logo";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/evenements", label: "Événements" },
  { href: "/villes", label: "Villes" },
  { href: "/lieux", label: "Lieux" },
  { href: "/artistes", label: "Artistes" },
  { href: "/categories", label: "Catégories" },
];

export function EnTete() {
  const pathname = usePathname();
  const [cheminOuvert, setCheminOuvert] = useState<string | null>(null);
  const ouvert = cheminOuvert === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-[#EFE5D2] bg-[#FBF7EF]">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-[var(--page-px)]">
        <Logo />
        <button
          type="button"
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={ouvert}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#191410]"
          onClick={() => setCheminOuvert(ouvert ? null : pathname)}
        >
          {ouvert ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </div>
      {ouvert && (
        <nav className="border-t border-[#EFE5D2] bg-[#FBF7EF] px-[var(--page-px)] py-2">
          {LIENS.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              onClick={() => setCheminOuvert(null)}
              className={`block py-3 text-[15px] font-semibold no-underline ${pathname === lien.href ? "text-[#E02B20]" : "text-[#191410]"}`}
            >
              {lien.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
