"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Plus,
  Radar,
  Radio,
  Search,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { BTN_DANGER_PLEIN, BTN_SECONDAIRE } from "@/components/admin/styles";

export type SectionAdmin = "evenements" | "collecte" | "lieux" | "artistes" | "categories" | "comptes";

const ENTREES: { id: SectionAdmin; label: string; icon: LucideIcon; href: string }[] = [
  { id: "evenements", label: "Événements", icon: CalendarDays, href: "/admin" },
  { id: "collecte", label: "Collecte", icon: Radar, href: "/admin/collecte-evenements" },
  { id: "lieux", label: "Lieux", icon: MapPin, href: "/admin?section=lieux" },
  { id: "artistes", label: "Artistes & DJ", icon: Users, href: "/admin?section=artistes" },
  { id: "categories", label: "Catégories", icon: Tag, href: "/admin?section=categories" },
  { id: "comptes", label: "Comptes suivis", icon: Radio, href: "/admin?section=comptes" },
];

export function Coquille({
  actif,
  email,
  titre,
  recherche,
  onRecherche,
  onNouveau,
  sale = false,
  children,
}: {
  actif: SectionAdmin;
  email: string | null;
  titre: string;
  recherche?: string;
  onRecherche?: (valeur: string) => void;
  onNouveau?: () => void;
  sale?: boolean;
  children: React.ReactNode;
}) {
  const [suite, setSuite] = useState<string | null>(null);

  function aller(href: string) {
    if (sale) {
      setSuite(href);
      return;
    }
    window.location.assign(href);
  }

  return (
    <div className="min-h-dvh bg-[#FBF7EF] text-[#191410]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r-[1.5px] border-[#EFE5D2] bg-white lg:flex">
        <div className="px-5 pt-5 pb-4">
          <Marque />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {ENTREES.map((entree) => (
            <EntreeNav key={entree.id} entree={entree} actif={actif === entree.id} onAller={aller} />
          ))}
        </nav>
        <div className="space-y-2 border-t-[1.5px] border-[#EFE5D2] p-3">
          <Link href="/" target="_blank" className={`${BTN_SECONDAIRE} w-full no-underline`}>
            <ExternalLink size={16} aria-hidden />
            Voir le site
          </Link>
          {email && <p className="truncate px-1 text-[12px] text-[#8A7B66]">{email}</p>}
          <Deconnexion />
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b-[1.5px] border-[#EFE5D2] bg-[#FBF7EF]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
            <Marque />
            {onNouveau && (
              <button type="button" aria-label="Nouvel événement" onClick={onNouveau} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E02B20] text-white">
                <Plus size={20} aria-hidden />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
            <h1 className="font-[family-name:var(--font-display)] text-[24px] font-extrabold text-[#191410]">{titre}</h1>
            <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              {onRecherche && (
                <label className="relative min-w-0 flex-1 sm:w-72">
                  <span className="sr-only">Recherche</span>
                  <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8A7B66]" />
                  <input
                    value={recherche ?? ""}
                    onChange={(e) => onRecherche(e.target.value)}
                    placeholder="Rechercher"
                    className="min-h-11 w-full rounded-[14px] border-[1.5px] border-[#EFE5D2] bg-white pr-3 pl-9 text-[14px] text-[#191410] outline-none"
                  />
                </label>
              )}
              {onNouveau && (
                <button type="button" onClick={onNouveau} className="hidden min-h-11 items-center gap-1 rounded-[14px] bg-[#E02B20] px-4 font-[family-name:var(--font-display)] text-[14px] font-bold text-white lg:inline-flex">
                  <Plus size={16} aria-hidden />
                  Nouvel événement
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {ENTREES.map((entree) => (
              <button
                key={entree.id}
                type="button"
                onClick={() => aller(entree.href)}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-full border-[1.5px] px-3 text-[13px] font-semibold ${actif === entree.id ? "border-[#191410] bg-[#191410] text-white" : "border-[#EFE5D2] bg-white text-[#4A4136]"}`}
              >
                {entree.label}
              </button>
            ))}
          </div>
        </header>
        <div className="px-4 py-5 lg:px-8">{children}</div>
      </div>

      {suite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191410]/40 p-4" role="dialog" aria-modal="true" aria-labelledby="quitter-titre">
          <div className="w-full max-w-md rounded-[20px] bg-white p-5 shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
            <h2 id="quitter-titre" className="font-[family-name:var(--font-display)] text-[18px] font-extrabold">Quitter sans enregistrer ?</h2>
            <p className="mt-2 text-[14px] text-[#4A4136]">Les modifications de cet événement ne sont pas enregistrées.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN_SECONDAIRE} onClick={() => setSuite(null)}>Annuler</button>
              <button type="button" className={BTN_DANGER_PLEIN} onClick={() => window.location.assign(suite)}>Quitter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EntreeNav({
  entree,
  actif,
  onAller,
}: {
  entree: (typeof ENTREES)[number];
  actif: boolean;
  onAller: (href: string) => void;
}) {
  const Icone = entree.icon;
  return (
    <button
      type="button"
      onClick={() => onAller(entree.href)}
      className={`relative flex h-11 items-center gap-2 rounded-xl px-3 text-left text-[14px] font-semibold ${actif ? "bg-[#FDECEA] text-[#B91C1C]" : "text-[#4A4136] hover:bg-[#FBF7EF]"}`}
    >
      {actif && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-[#E02B20]" aria-hidden />}
      <Icone size={18} aria-hidden />
      {entree.label}
    </button>
  );
}

function Marque() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-[family-name:var(--font-archivo-black)] text-[26px] leading-none">
        <span className="text-[#191410]">T</span>
        <span className="text-[#E02B20]">W</span>
      </span>
      <span className="leading-[1.05]">
        <span className="block font-[family-name:var(--font-display)] text-[13px] font-extrabold text-[#191410]">tèt</span>
        <span className="block font-[family-name:var(--font-display)] text-[12px] font-black tracking-[0.08em] text-[#E02B20]">WEEKEND</span>
        <span className="mt-0.5 block text-[11px] font-semibold tracking-[0.14em] text-[#8A7B66] uppercase">Admin</span>
      </span>
    </div>
  );
}

export function titreSection(section: SectionAdmin): string {
  return ENTREES.find((e) => e.id === section)?.label ?? "Événements";
}
