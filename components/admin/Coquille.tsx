"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookUser,
  ChartColumn,
  CalendarDays,
  ExternalLink,
  House,
  Inbox,
  MapPin,
  Plus,
  Radio,
  Search,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { BTN_DANGER_PLEIN, BTN_SECONDAIRE } from "@/components/admin/styles";

export type SectionAdmin = "accueil" | "evenements" | "soumissions" | "statistiques" | "lieux" | "artistes" | "categories" | "comptes";

type Entree = { id: SectionAdmin; label: string; icon: LucideIcon; href: string };

const ENTREES: Entree[] = [
  { id: "accueil", label: "Accueil", icon: House, href: "/admin" },
  { id: "evenements", label: "Événements", icon: CalendarDays, href: "/admin?section=evenements" },
  { id: "soumissions", label: "Soumissions", icon: Inbox, href: "/admin?section=soumissions" },
  { id: "statistiques", label: "Statistiques", icon: ChartColumn, href: "/admin?section=statistiques" },
  { id: "lieux", label: "Lieux", icon: MapPin, href: "/admin?section=lieux" },
  { id: "artistes", label: "Artistes & DJ", icon: Users, href: "/admin?section=artistes" },
  { id: "categories", label: "Catégories", icon: Tag, href: "/admin?section=categories" },
  { id: "comptes", label: "Comptes suivis", icon: Radio, href: "/admin?section=comptes" },
];

const ANNUAIRE: SectionAdmin[] = ["lieux", "artistes", "categories", "comptes"];

const ONGLETS: { id: string; label: string; icon: LucideIcon; href: string; groupe: SectionAdmin[] }[] = [
  { id: "accueil", label: "Accueil", icon: House, href: "/admin", groupe: ["accueil"] },
  { id: "evenements", label: "Événements", icon: CalendarDays, href: "/admin?section=evenements", groupe: ["evenements"] },
  { id: "soumissions", label: "Soumissions", icon: Inbox, href: "/admin?section=soumissions", groupe: ["soumissions"] },
  { id: "statistiques", label: "Stats", icon: ChartColumn, href: "/admin?section=statistiques", groupe: ["statistiques"] },
  { id: "annuaire", label: "Annuaire", icon: BookUser, href: "/admin?section=lieux", groupe: ANNUAIRE },
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
    <div className="min-h-dvh bg-[#F3F4F7] text-[#12161F]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#E3E6EC] bg-white lg:flex">
        <div className="px-5 pt-5 pb-4">
          <Marque />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {ENTREES.map((entree) => (
            <EntreeNav key={entree.id} entree={entree} actif={actif === entree.id} onAller={aller} />
          ))}
        </nav>
        <div className="space-y-2 border-t border-[#E3E6EC] p-3">
          <Link href="/" target="_blank" className={`${BTN_SECONDAIRE} w-full no-underline`}>
            <ExternalLink size={16} aria-hidden />
            Voir le site
          </Link>
          {email && <p className="truncate px-1 text-[12px] text-[#5B6472]">{email}</p>}
          <Deconnexion />
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-[#E3E6EC] bg-[#F3F4F7]/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-3 lg:px-8">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-[#5B6472] uppercase lg:hidden">Tèt Weekend · Admin</p>
              <h1 className="font-[family-name:var(--font-display)] text-[24px] leading-tight font-extrabold tracking-tight text-[#12161F]">{titre}</h1>
            </div>
            <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              {onRecherche && (
                <label className="relative min-w-0 flex-1 sm:w-72">
                  <span className="sr-only">Recherche</span>
                  <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#5B6472]" />
                  <input
                    value={recherche ?? ""}
                    onChange={(e) => onRecherche(e.target.value)}
                    placeholder="Rechercher"
                    className="min-h-11 w-full rounded-[12px] border border-[#D5D9E1] bg-white pr-3 pl-9 text-[14px] text-[#12161F] outline-none"
                  />
                </label>
              )}
              {onNouveau && (
                <button type="button" onClick={onNouveau} className="hidden min-h-11 items-center gap-1 rounded-[12px] bg-[#12161F] px-4 font-[family-name:var(--font-display)] text-[14px] font-bold text-white lg:inline-flex">
                  <Plus size={16} aria-hidden />
                  Nouvel événement
                </button>
              )}
            </div>
          </div>
          {ANNUAIRE.includes(actif) && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
              {ENTREES.filter((e) => ANNUAIRE.includes(e.id)).map((entree) => (
                <button
                  key={entree.id}
                  type="button"
                  onClick={() => aller(entree.href)}
                  className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold ${actif === entree.id ? "border-[#12161F] bg-[#12161F] text-white" : "border-[#D5D9E1] bg-white text-[#12161F]"}`}
                >
                  {entree.label}
                </button>
              ))}
            </div>
          )}
        </header>
        <div className="px-4 py-5 pb-28 lg:px-8 lg:pb-8">{children}</div>
      </div>

      {onNouveau && (
        <button
          type="button"
          onClick={onNouveau}
          className="fixed right-4 bottom-[84px] z-30 inline-flex h-[52px] items-center gap-2 rounded-full bg-[#12161F] px-5 text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(18,22,31,0.28)] lg:hidden"
        >
          <Plus size={18} aria-hidden />
          Nouvel événement
        </button>
      )}

      <nav aria-label="Navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#E3E6EC] bg-white pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        {ONGLETS.map((onglet) => {
          const Icone = onglet.icon;
          const on = onglet.groupe.includes(actif);
          return (
            <button
              key={onglet.id}
              type="button"
              onClick={() => aller(onglet.href)}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${on ? "text-[#1D3FD8]" : "text-[#5B6472]"}`}
            >
              <Icone size={22} aria-hidden />
              {onglet.label}
            </button>
          );
        })}
      </nav>

      {suite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12161F]/40 p-4" role="dialog" aria-modal="true" aria-labelledby="quitter-titre">
          <div className="w-full max-w-md rounded-[20px] bg-white p-5 shadow-[0_3px_14px_rgba(18,22,31,0.08)]">
            <h2 id="quitter-titre" className="font-[family-name:var(--font-display)] text-[18px] font-extrabold">Quitter sans enregistrer ?</h2>
            <p className="mt-2 text-[14px] text-[#3C4452]">Les modifications de cet événement ne sont pas enregistrées.</p>
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

function EntreeNav({ entree, actif, onAller }: { entree: Entree; actif: boolean; onAller: (href: string) => void }) {
  const Icone = entree.icon;
  return (
    <button
      type="button"
      onClick={() => onAller(entree.href)}
      aria-current={actif ? "page" : undefined}
      className={`flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-left text-[14px] font-semibold ${actif ? "bg-[#E7ECFF] text-[#1D3FD8]" : "text-[#3C4452] hover:bg-[#F3F4F7]"}`}
    >
      <Icone size={18} aria-hidden />
      {entree.label}
    </button>
  );
}

function Marque() {
  return (
    <div className="leading-tight">
      <span className="block font-[family-name:var(--font-display)] text-[17px] font-extrabold text-[#12161F]">Tèt Weekend</span>
      <span className="block text-[11px] font-semibold tracking-[0.14em] text-[#5B6472] uppercase">Admin</span>
    </div>
  );
}

export function titreSection(section: SectionAdmin): string {
  if (section === "accueil") return "Accueil";
  return ENTREES.find((e) => e.id === section)?.label ?? "Événements";
}
