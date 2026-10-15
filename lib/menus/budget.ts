import type { Devise } from "./types.ts";

export interface LigneBudget {
  prix: number;
  devise: Devise;
  quantite: number;
}

export interface ParametresBudget {
  lignes: LigneBudget[];
  personnes: number;
  /** Devise dans laquelle le sous-total est calculé (devise du restaurant). */
  devise: Devise;
  /** HTG pour 1 USD. Null ou ≤ 0 = taux inconnu. */
  taux: number | null;
  taxePct: number | null;
  taxeIncluse: boolean | null;
  servicePct: number | null;
  serviceInclus: boolean | null;
  pourboirePct: number;
}

/** Montant exprimé dans les deux devises ; null quand la conversion est impossible (taux inconnu). */
export interface MontantDouble {
  htg: number | null;
  usd: number | null;
}

export type ResultatBudget =
  | {
      ok: true;
      devise: Devise;
      sousTotal: number;
      taxe: number;
      service: number;
      pourboire: number;
      total: MontantDouble;
      parPersonne: MontantDouble;
      taxeAjoutee: boolean;
      serviceAjoute: boolean;
    }
  | { ok: false; raison: "taux_manquant" };

/** Taux applicable : saisi par l'utilisateur, sinon celui du restaurant, sinon le taux global. */
export function tauxApplicable(...candidats: (number | null | undefined)[]): number | null {
  for (const t of candidats) {
    if (typeof t === "number" && Number.isFinite(t) && t > 0) return t;
  }
  return null;
}

export function enCentimes(montant: number): number {
  return Math.round(montant * 100);
}

/** Convertit un prix en centimes de la devise cible. Null si conversion impossible. */
export function convertirEnCentimes(prix: number, de: Devise, vers: Devise, taux: number | null): number | null {
  if (de === vers) return enCentimes(prix);
  if (taux === null || taux <= 0) return null;
  return de === "USD" ? Math.round(prix * taux * 100) : Math.round((prix / taux) * 100);
}

function pourcentage(baseCentimes: number, pct: number): number {
  return Math.round((baseCentimes * pct) / 100);
}

export function calculerBudget(p: ParametresBudget): ResultatBudget {
  const taux = tauxApplicable(p.taux);
  let sousTotalC = 0;
  for (const l of p.lignes) {
    if (l.quantite <= 0) continue;
    const c = convertirEnCentimes(l.prix, l.devise, p.devise, taux);
    if (c === null) return { ok: false, raison: "taux_manquant" };
    sousTotalC += c * l.quantite;
  }

  const taxeAjoutee = p.taxePct !== null && p.taxePct > 0 && p.taxeIncluse === false;
  const serviceAjoute = p.servicePct !== null && p.servicePct > 0 && p.serviceInclus === false;
  const taxeC = taxeAjoutee ? pourcentage(sousTotalC, p.taxePct as number) : 0;
  const serviceC = serviceAjoute ? pourcentage(sousTotalC, p.servicePct as number) : 0;
  const avantPourboireC = sousTotalC + taxeC + serviceC;
  const pourboireC = p.pourboirePct > 0 ? pourcentage(avantPourboireC, p.pourboirePct) : 0;
  const totalC = avantPourboireC + pourboireC;
  const personnes = Math.max(1, Math.floor(p.personnes));
  const parPersonneC = Math.round(totalC / personnes);

  const autre: Devise = p.devise === "HTG" ? "USD" : "HTG";
  const versAutre = (c: number) => convertirEnCentimes(c / 100, p.devise, autre, taux);
  const double = (c: number): MontantDouble => {
    const conv = versAutre(c);
    const cents = { [p.devise]: c, [autre]: conv } as Record<Devise, number | null>;
    return {
      htg: cents.HTG === null ? null : cents.HTG / 100,
      usd: cents.USD === null ? null : cents.USD / 100,
    };
  };

  return {
    ok: true,
    devise: p.devise,
    sousTotal: sousTotalC / 100,
    taxe: taxeC / 100,
    service: serviceC / 100,
    pourboire: pourboireC / 100,
    total: double(totalC),
    parPersonne: double(parPersonneC),
    taxeAjoutee,
    serviceAjoute,
  };
}
