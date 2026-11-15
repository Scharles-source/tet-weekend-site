import { dateLocale } from "./dates.ts";
import { FUSEAU_DEFAUT } from "./schema.ts";

/**
 * Un jour du bandeau de dates de l'accueil : le jour calendaire, son nom
 * anglais court, son numéro dans le mois, et combien d'événements à venir
 * y tombent.
 */
export interface JourEvenements {
  /** Jour calendaire « AAAA-MM-JJ » — la clé qui regroupe les événements. */
  cle: string;
  /** Nom anglais court du jour de semaine (« Sat »). */
  nom: string;
  /** Numéro du jour dans le mois (15). */
  numero: number;
  /** Nombre d'événements à venir ce jour-là. */
  compte: number;
  /** Vrai pour le jour actuel dans le fuseau par défaut du site. */
  aujourdhui: boolean;
}

const NOMS_JOURS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Clé du jour calendaire d'un instant dans un fuseau (« AAAA-MM-JJ »).
 * Même convention que le reste du listing : le jour d'un événement est son
 * jour local, dans son propre fuseau (dateLocale, comme finEffective ou
 * estReveillon) — jamais le jour UTC de l'instant.
 */
export function cleJour(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  const d = dateLocale(iso, fuseau);
  const mois = String(d.mois).padStart(2, "0");
  const jour = String(d.jour).padStart(2, "0");
  return `${d.annee}-${mois}-${jour}`;
}

/** Clé du jour actuel dans le fuseau par défaut du site — celui de « ce soir » (periode.ts). */
export function cleJourActuel(maintenant = new Date()): string {
  return cleJour(maintenant.toISOString(), FUSEAU_DEFAUT);
}

/** Nom anglais court du jour de semaine d'une clé « AAAA-MM-JJ » (fait calendaire, indépendant de tout fuseau). */
export function nomJour(cle: string): string {
  const [annee, mois, jour] = cle.split("-").map(Number);
  return NOMS_JOURS[new Date(Date.UTC(annee, mois - 1, jour)).getUTCDay()] ?? "";
}

/**
 * Les jours qui ont au moins un événement à venir, par ordre chronologique,
 * avec le compte exact de chaque jour. Calculé côté serveur sur la liste
 * complète : le bandeau de dates de l'accueil est juste dès le premier
 * affichage, avant même le chargement de /api/annuaire côté client.
 */
export function joursAvecEvenements(
  evenements: { date_debut: string; fuseau?: string }[],
  maintenant = new Date(),
): JourEvenements[] {
  const compte = new Map<string, number>();
  for (const e of evenements) {
    const cle = cleJour(e.date_debut, e.fuseau ?? FUSEAU_DEFAUT);
    compte.set(cle, (compte.get(cle) ?? 0) + 1);
  }
  const actuel = cleJourActuel(maintenant);
  return [...compte.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([cle, n]) => ({
      cle,
      nom: nomJour(cle),
      numero: Number(cle.slice(8, 10)),
      compte: n,
      aujourdhui: cle === actuel,
    }));
}
