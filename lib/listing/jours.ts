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
const MOIS_COURTS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

/** Un groupe du fil de l'accueil : un jour, et ses événements dans l'ordre où la liste triée les a donnés. */
export interface GroupeJour<T> {
  jour: JourEvenements;
  evenements: T[];
}

/**
 * Regroupe des événements par jour calendaire (celui de chaque événement,
 * dans son fuseau), groupes en ordre chronologique. L'ordre à l'intérieur
 * d'un groupe est celui de la liste d'entrée : le fil trie d'abord (radial
 * en mode « Near me », chronologique en mode « All »), puis regroupe — le
 * regroupement ne réordonne jamais à l'intérieur d'un jour.
 */
export function grouperParJour<T extends { date_debut: string; fuseau?: string }>(
  evenements: T[],
  maintenant = new Date(),
): GroupeJour<T>[] {
  const parCle = new Map<string, T[]>();
  for (const e of evenements) {
    const cle = cleJour(e.date_debut, e.fuseau ?? FUSEAU_DEFAUT);
    const liste = parCle.get(cle);
    if (liste) liste.push(e);
    else parCle.set(cle, [e]);
  }
  return joursAvecEvenements(evenements, maintenant).map((jour) => ({
    jour,
    evenements: parCle.get(jour.cle) ?? [],
  }));
}

/** Clé du lendemain du jour actuel (fuseau par défaut), pour le libellé « Tomorrow ». */
function cleDemain(maintenant: Date): string {
  const [annee, mois, numero] = cleJourActuel(maintenant).split("-").map(Number);
  const d = new Date(Date.UTC(annee, (mois ?? 1) - 1, (numero ?? 1) + 1));
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const jj = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${jj}`;
}

/**
 * Libellé d'un en-tête de groupe du fil : « Tonight » pour aujourd'hui,
 * « Tomorrow » pour demain, sinon le jour et la date (« Sat, Nov 22 »).
 */
export function libelleGroupeJour(jour: JourEvenements, maintenant = new Date()): string {
  if (jour.aujourdhui) return "Tonight";
  if (jour.cle === cleDemain(maintenant)) return "Tomorrow";
  const mois = MOIS_COURTS[Number(jour.cle.slice(5, 7)) - 1] ?? "";
  return `${jour.nom}, ${mois} ${jour.numero}`;
}
