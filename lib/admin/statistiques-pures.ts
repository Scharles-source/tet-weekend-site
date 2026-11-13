export type Periode = "aujourdhui" | "7j" | "30j" | "tout";
export const PERIODES: { id: Periode; label: string }[] = [
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "7j", label: "7 jours" },
  { id: "30j", label: "30 jours" },
  { id: "tout", label: "Depuis le début" },
];

export interface StatsEvenement {
  id: string;
  titre: string;
  ville: string | null;
  date_debut: string;
  statut: string;
  vues: number;
  flyers: number;
  agendas: number;
  interets: number;
}

/** Réponse de la fonction SQL installations_admin (voir la migration 20261113200000). */
export interface InstallationsApp {
  installations: number;
  nouvelles_aujourdhui: number;
  nouvelles_7j: number;
  ouvertures_aujourdhui: number;
  android: number;
  ios: number;
}

/** Réponse de la fonction SQL statistiques_admin (voir la migration 20261113000000). */
export interface Statistiques {
  /** Installations de la web app (absent tant que la migration « installations_app » n'est pas appliquée). */
  app?: InstallationsApp | null;
  periode: Periode;
  heure_actuelle: number;
  en_ligne: { total: number; mobile: number; ordinateur: number };
  visiteurs: number;
  pages_vues: number;
  visiteurs_hier_meme_heure: number;
  pages_vues_hier_meme_heure: number;
  jy_vais: number;
  jy_vais_hier_meme_heure: number;
  actions: { agenda: number; flyer: number };
  serie_type: "heure" | "jour";
  serie: { x: string; n: number }[];
  serie_precedente: number[] | null;
  sources: { nom: string; n: number }[];
  pays: { code: string; n: number }[];
  villes: { nom: string; pays: string | null; n: number }[];
  localisation: { haiti: number; diaspora: number; inconnu: number };
  appareils: { mobile: number; ordinateur: number };
  evenements: StatsEvenement[];
}

export function periodeValide(valeur: string | undefined): Periode {
  return PERIODES.some((p) => p.id === valeur) ? (valeur as Periode) : "aujourdhui";
}

const SOURCES: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  google: "Google",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  direct: "Direct",
  autre: "Autre site",
};
export const libelleSource = (nom: string): string => SOURCES[nom] ?? nom;

export function libellePays(code: string): string {
  if (code === "??") return "Inconnu";
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Écart avec hier à la même heure, en texte court. Rien si hier est à zéro (un pourcentage n'aurait pas de sens). */
export function evolution(actuel: number, hier: number): string | null {
  if (hier <= 0) return null;
  const pct = Math.round(((actuel - hier) / hier) * 100);
  if (pct === 0) return "= hier";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)} %`;
}

export function pourcent(partie: number, total: number): number {
  return total > 0 ? Math.round((partie / total) * 100) : 0;
}
