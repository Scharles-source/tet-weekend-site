import { estEnCours, estTermine } from "./dates.ts";

export interface CandidatBanniere {
  id: string;
  date_debut: string;
  date_fin: string | null;
  fuseau?: string | null;
  sponsored_from: string | null;
  sponsored_to: string | null;
  vues?: number | null;
  partages?: number | null;
}

export interface PanneauBanniere<T extends CandidatBanniere> {
  evenement: T;
  sponsorise: boolean;
}

export function estSponsorise(evenement: CandidatBanniere, maintenant = Date.now()): boolean {
  if (!evenement.sponsored_from || !evenement.sponsored_to) return false;
  const debut = Date.parse(evenement.sponsored_from);
  const fin = Date.parse(evenement.sponsored_to);
  return Number.isFinite(debut) && Number.isFinite(fin) && debut <= maintenant && maintenant <= fin;
}

/**
 * Au plus 5 : sponsorisés actifs par date, puis le trending automatique (règle de Smith, 15 nov. 2026).
 * Entrent dans le trending, dans cet ordre : les événements en cours (« Happening now », même définition
 * que le badge : estEnCours), puis les plus partagés (« Invite friends »), puis les plus ouverts
 * (vues des fiches) ; à égalité, le plus proche dans le temps d'abord. Tant qu'aucun partage n'est
 * enregistré, l'ordre retombe naturellement sur en cours puis vues.
 */
export function choisirBanniere<T extends CandidatBanniere>(
  evenements: T[],
  maintenant = Date.now(),
): PanneauBanniere<T>[] {
  const aVenir = evenements.filter(
    (e) => !estTermine({ date_debut: e.date_debut, date_fin: e.date_fin, fuseau: e.fuseau ?? undefined }, maintenant),
  );
  const sponsorises = aVenir
    .filter((e) => estSponsorise(e, maintenant))
    .sort((a, b) => Date.parse(a.date_debut) - Date.parse(b.date_debut));
  const deja = new Set(sponsorises.map((e) => e.id));
  const enCours = (e: T) =>
    estEnCours({ date_debut: e.date_debut, date_fin: e.date_fin, fuseau: e.fuseau ?? undefined }, maintenant) ? 1 : 0;
  const trending = aVenir
    .filter((e) => !deja.has(e.id))
    .sort((a, b) => {
      const ecartCours = enCours(b) - enCours(a);
      if (ecartCours !== 0) return ecartCours;
      const ecartPartages = (b.partages ?? 0) - (a.partages ?? 0);
      if (ecartPartages !== 0) return ecartPartages;
      const ecartVues = (b.vues ?? 0) - (a.vues ?? 0);
      if (ecartVues !== 0) return ecartVues;
      return Date.parse(a.date_debut) - Date.parse(b.date_debut);
    });
  return [...sponsorises.map((evenement) => ({ evenement, sponsorise: true })), ...trending.map((evenement) => ({ evenement, sponsorise: false }))].slice(0, 5);
}
