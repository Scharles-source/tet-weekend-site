import { FUSEAU_DEFAUT } from "./schema.ts";

const JOURS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parties(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const brut = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );
  let hour = Number(brut.hour);
  if (hour === 24) hour = 0;
  return {
    weekday: brut.weekday,
    year: Number(brut.year),
    month: Number(brut.month),
    day: Number(brut.day),
    hour,
    minute: Number(brut.minute),
    second: Number(brut.second),
  };
}

function decalageMs(instant: Date, timeZone: string): number {
  const p = parties(instant, timeZone);
  const murCommeUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return murCommeUtc - instant.getTime();
}

/** Heure murale « AAAA-MM-JJTHH:mm » dans `fuseau` → instant ISO UTC. */
export function instantDepuisSaisie(local: string, fuseau: string = FUSEAU_DEFAUT): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new Error(`Date invalide : ${local}`);
  const [, ys, ms, ds, hs, mins] = m;
  const murUtc = new Date(Date.UTC(Number(ys), Number(ms) - 1, Number(ds), Number(hs), Number(mins), 0));
  const une = murUtc.getTime() - decalageMs(murUtc, fuseau);
  const deux = murUtc.getTime() - decalageMs(new Date(une), fuseau);
  return new Date(deux).toISOString();
}

/** Instant ISO → valeur pour un champ datetime-local, dans `fuseau`. */
export function saisieDepuisInstant(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  const p = parties(new Date(iso), fuseau);
  const mois = String(p.month).padStart(2, "0");
  const jour = String(p.day).padStart(2, "0");
  const heure = String(p.hour).padStart(2, "0");
  const minute = String(p.minute).padStart(2, "0");
  return `${p.year}-${mois}-${jour}T${heure}:${minute}`;
}

export function formaterQuand(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: fuseau,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Terminé quand la fin (ou le début, s'il n'y a pas de fin) est passée. */
export function estTermine(
  evenement: { date_debut: string; date_fin: string | null },
  maintenant = Date.now(),
): boolean {
  const fin = Date.parse(evenement.date_fin ?? evenement.date_debut);
  return Number.isFinite(fin) && fin < maintenant;
}

/**
 * Vendredi 00:00 → dimanche 23:59:59.999 dans le fuseau.
 * Du lundi au jeudi, c'est le weekend qui vient. Vendredi, samedi et dimanche, c'est le weekend en cours.
 */
export function intervalleWeekend(maintenant = new Date(), fuseau: string = FUSEAU_DEFAUT): { debut: Date; fin: Date } {
  const p = parties(maintenant, fuseau);
  const dow = JOURS[p.weekday] ?? 0;
  const deltaVendredi = dow === 0 ? -2 : 5 - dow;
  const ancre = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const vendredi = new Date(ancre.getTime() + deltaVendredi * 86_400_000);
  const dimanche = new Date(vendredi.getTime() + 2 * 86_400_000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    debut: new Date(instantDepuisSaisie(`${ymd(vendredi)}T00:00`, fuseau)),
    fin: new Date(Date.parse(instantDepuisSaisie(`${ymd(dimanche)}T23:59`, fuseau)) + 59_999),
  };
}

export function dansLeWeekend(
  iso: string,
  maintenant = new Date(),
  fuseau: string = FUSEAU_DEFAUT,
): boolean {
  const { debut, fin } = intervalleWeekend(maintenant, fuseau);
  const t = Date.parse(iso);
  return t >= debut.getTime() && t <= fin.getTime();
}

const JOUR_COURT: Record<string, string> = {
  Sun: "dim.",
  Mon: "lun.",
  Tue: "mar.",
  Wed: "mer.",
  Thu: "jeu.",
  Fri: "ven.",
  Sat: "sam.",
};
const MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Badge de carte : « ven. 23 oct. · 23h00 ». */
export function formaterBadge(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  const p = parties(new Date(iso), fuseau);
  const heure = String(p.hour).padStart(2, "0");
  const minute = String(p.minute).padStart(2, "0");
  return `${JOUR_COURT[p.weekday] ?? ""} ${p.day} ${MOIS_COURT[p.month - 1]} · ${heure}h${minute}`;
}

/** Kicker de bannière : « SAM. 14 NOV. 2026 · 22H00 ». */
export function formaterKicker(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  const p = parties(new Date(iso), fuseau);
  const jour = (JOUR_COURT[p.weekday] ?? "").replace(".", "").toUpperCase();
  const mois = (MOIS_COURT[p.month - 1] ?? "").toUpperCase();
  const heure = String(p.hour).padStart(2, "0");
  const minute = String(p.minute).padStart(2, "0");
  return `${jour}. ${p.day} ${mois} ${p.year} · ${heure}H${minute}`;
}

export function formaterPastille(iso: string, fuseau: string = FUSEAU_DEFAUT): { jour: string; mois: string } {
  const p = parties(new Date(iso), fuseau);
  return { jour: String(p.day), mois: MOIS_COURT[p.month - 1] ?? "" };
}

export function formatIcs(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Date locale (dans le fuseau de l'événement) décomposée — pour les filtres par période. */
export function dateLocale(iso: string, fuseau: string = FUSEAU_DEFAUT): { annee: number; mois: number; jour: number } {
  const morceaux = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(iso));
  const lire = (type: string) => Number(morceaux.find((m) => m.type === type)?.value ?? 0);
  return { annee: lire("year"), mois: lire("month"), jour: lire("day") };
}

/** L'événement tombe-t-il en décembre de l'année donnée (dans son propre fuseau) ? */
export function estEnDecembre(e: { date_debut: string; fuseau: string }, annee: number): boolean {
  const d = dateLocale(e.date_debut, e.fuseau);
  return d.mois === 12 && d.annee === annee;
}

/** Réveillon : 31 décembre de l'année donnée ou 1er janvier de l'année suivante (fuseau de l'événement). */
export function estReveillon(e: { date_debut: string; fuseau: string }, annee: number): boolean {
  const d = dateLocale(e.date_debut, e.fuseau);
  return (d.mois === 12 && d.jour === 31 && d.annee === annee) || (d.mois === 1 && d.jour === 1 && d.annee === annee + 1);
}
