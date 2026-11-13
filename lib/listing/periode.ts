import { dansLeWeekend, instantDepuisSaisie, saisieDepuisInstant } from "./dates.ts";
import { FUSEAU_DEFAUT } from "./schema.ts";

export type Periode = "ce-soir" | "demain" | "ce-weekend" | "tout";

/** Journée complète (00:00 → 23:59:59.999) dans le fuseau, `decalage` jours après aujourd'hui. */
export function intervalleJour(
  decalage = 0,
  maintenant = new Date(),
  fuseau: string = FUSEAU_DEFAUT,
): { debut: Date; fin: Date } {
  const aujourdhui = saisieDepuisInstant(maintenant.toISOString(), fuseau).slice(0, 10);
  const jour = new Date(Date.parse(`${aujourdhui}T00:00:00Z`) + decalage * 86_400_000);
  const ymd = jour.toISOString().slice(0, 10);
  return {
    debut: new Date(instantDepuisSaisie(`${ymd}T00:00`, fuseau)),
    fin: new Date(Date.parse(instantDepuisSaisie(`${ymd}T23:59`, fuseau)) + 59_999),
  };
}

/** L'événement tombe-t-il dans la période demandée (ce soir, demain, ce week-end) ? */
export function dansLaPeriode(
  iso: string,
  periode: Periode,
  maintenant = new Date(),
  fuseau: string = FUSEAU_DEFAUT,
): boolean {
  if (periode === "tout") return true;
  if (periode === "ce-weekend") return dansLeWeekend(iso, maintenant, fuseau);
  const { debut, fin } = intervalleJour(periode === "demain" ? 1 : 0, maintenant, fuseau);
  const t = Date.parse(iso);
  return t >= debut.getTime() && t <= fin.getTime();
}
