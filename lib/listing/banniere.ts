import { estTermine } from "./dates.ts";

export interface CandidatBanniere {
  id: string;
  date_debut: string;
  date_fin: string | null;
  sponsored_from: string | null;
  sponsored_to: string | null;
  vues?: number | null;
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

/** Au plus 5 : sponsorisés actifs par date, puis trending (vues, sinon date la plus proche). */
export function choisirBanniere<T extends CandidatBanniere>(
  evenements: T[],
  maintenant = Date.now(),
): PanneauBanniere<T>[] {
  const aVenir = evenements.filter((e) => !estTermine(e, maintenant));
  const sponsorises = aVenir
    .filter((e) => estSponsorise(e, maintenant))
    .sort((a, b) => Date.parse(a.date_debut) - Date.parse(b.date_debut));
  const deja = new Set(sponsorises.map((e) => e.id));
  const trending = aVenir
    .filter((e) => !deja.has(e.id))
    .sort((a, b) => {
      const va = a.vues;
      const vb = b.vues;
      if (va != null || vb != null) {
        const ecart = (vb ?? 0) - (va ?? 0);
        if (ecart !== 0) return ecart;
      }
      return Date.parse(a.date_debut) - Date.parse(b.date_debut);
    });
  return [...sponsorises.map((evenement) => ({ evenement, sponsorise: true })), ...trending.map((evenement) => ({ evenement, sponsorise: false }))].slice(0, 5);
}
