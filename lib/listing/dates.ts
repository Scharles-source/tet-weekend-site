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
  return new Intl.DateTimeFormat("en-US", {
    timeZone: fuseau,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Fin effective d'un événement : sa date de fin quand elle existe, sinon la
 * fin de son jour de début dans son propre fuseau. Une soirée sans heure de
 * fin annoncée reste donc visible — et « en cours » — jusqu'à la fin de sa
 * journée au lieu de disparaître dès l'heure de début passée (audit du
 * 13 nov. 2026 : des soirées commencées à 16 h/17 h étaient invisibles à
 * 20 h 30).
 */
export function finEffective(evenement: { date_debut: string; date_fin: string | null; fuseau?: string }): number {
  if (evenement.date_fin) {
    const fin = Date.parse(evenement.date_fin);
    if (Number.isFinite(fin)) return fin;
  }
  if (!Number.isFinite(Date.parse(evenement.date_debut))) return Number.NaN;
  const fuseau = evenement.fuseau ?? FUSEAU_DEFAUT;
  try {
    const jour = saisieDepuisInstant(evenement.date_debut, fuseau).slice(0, 10);
    return Date.parse(instantDepuisSaisie(`${jour}T23:59`, fuseau)) + 59_999;
  } catch {
    return Number.NaN;
  }
}

/** Terminé quand la fin effective (voir finEffective) est passée. */
export function estTermine(
  evenement: { date_debut: string; date_fin: string | null; fuseau?: string },
  maintenant = Date.now(),
): boolean {
  const fin = finEffective(evenement);
  return Number.isFinite(fin) && fin < maintenant;
}

/** Commencé mais pas terminé : l'événement est en train de se dérouler. */
export function estEnCours(
  evenement: { date_debut: string; date_fin: string | null; fuseau?: string },
  maintenant = Date.now(),
): boolean {
  const debut = Date.parse(evenement.date_debut);
  return Number.isFinite(debut) && debut <= maintenant && !estTermine(evenement, maintenant);
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
  Sun: "Sun",
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
};
const MOIS_COURT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Heure au format américain : « 11:00 PM », « 9 PM » si l'heure est ronde. */
function heureAmPm(hour: number, minute: number): string {
  const suffixe = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${h12} ${suffixe}` : `${h12}:${String(minute).padStart(2, "0")} ${suffixe}`;
}

/** Badge de carte : « Fri Oct 23 · 11:00 PM ». */
export function formaterBadge(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  const p = parties(new Date(iso), fuseau);
  return `${JOUR_COURT[p.weekday] ?? ""} ${MOIS_COURT[p.month - 1]} ${p.day} · ${heureAmPm(p.hour, p.minute)}`;
}

/** Kicker de bannière : « SAT NOV 14 2026 · 10:00 PM ». */
export function formaterKicker(iso: string, fuseau: string = FUSEAU_DEFAUT): string {
  const p = parties(new Date(iso), fuseau);
  const jour = (JOUR_COURT[p.weekday] ?? "").toUpperCase();
  const mois = (MOIS_COURT[p.month - 1] ?? "").toUpperCase();
  return `${jour} ${mois} ${p.day} ${p.year} · ${heureAmPm(p.hour, p.minute)}`;
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
