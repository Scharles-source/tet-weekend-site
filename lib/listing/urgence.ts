import { saisieDepuisInstant } from "./dates.ts";
import { intervalleJour } from "./periode.ts";

export interface Urgence {
  texte: string;
  /** Vrai quand ça commence très bientôt (dans les heures qui viennent ou déjà en cours). */
  urgent: boolean;
}

function heureLocale(iso: string, fuseau: string): string {
  const [h, m] = saisieDepuisInstant(iso, fuseau).slice(11, 16).split(":");
  const H = Number(h); const suffixe = H >= 12 ? "PM" : "AM"; const h12 = H % 12 === 0 ? 12 : H % 12; return m === "00" ? `${h12} ${suffixe}` : `${h12}:${m} ${suffixe}`;
}

/** Libellé d'urgence honnête, calculé uniquement à partir de la date de l'événement. */
export function urgenceDe(
  e: { date_debut: string; date_fin: string | null; fuseau: string },
  maintenant = new Date(),
): Urgence | null {
  const debut = Date.parse(e.date_debut);
  const t = maintenant.getTime();
  if (t >= debut) {
    const fin = e.date_fin ? Date.parse(e.date_fin) : null;
    return fin !== null && t < fin ? { texte: "Happening now", urgent: true } : null;
  }
  const minutes = Math.round((debut - t) / 60_000);
  if (minutes < 60) return { texte: `In ${Math.max(1, minutes)} min`, urgent: true };
  if (minutes < 6 * 60) return { texte: `In ${Math.floor(minutes / 60)} h`, urgent: true };
  const aujourdhui = intervalleJour(0, maintenant, e.fuseau);
  if (debut <= aujourdhui.fin.getTime()) {
    const soir = Number(saisieDepuisInstant(e.date_debut, e.fuseau).slice(11, 13)) >= 18;
    return { texte: `${soir ? "Tonight" : "Today"} · ${heureLocale(e.date_debut, e.fuseau)}`, urgent: true };
  }
  const demain = intervalleJour(1, maintenant, e.fuseau);
  if (debut <= demain.fin.getTime()) return { texte: `Tomorrow · ${heureLocale(e.date_debut, e.fuseau)}`, urgent: false };
  return null;
}

const QUARANTE_HUIT_HEURES = 48 * 3_600_000;

/** « Nouveau » : ajouté il y a moins de 48 h et pas encore passé. */
export function estNouveau(e: { ajoute_le?: string | null; date_debut: string }, maintenant = new Date()): boolean {
  if (!e.ajoute_le) return false;
  const ajout = Date.parse(e.ajoute_le);
  const t = maintenant.getTime();
  return Number.isFinite(ajout) && ajout <= t && t - ajout < QUARANTE_HUIT_HEURES && Date.parse(e.date_debut) > t;
}
