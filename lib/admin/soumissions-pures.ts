/** Soumissions du formulaire : types et petites règles pures (testées à part). */

export const STATUTS_SOUMISSION = ["nouveau", "lu", "traite", "archive"] as const;
export type StatutSoumission = (typeof STATUTS_SOUMISSION)[number];

export const LIBELLES_SOUMISSION: Record<StatutSoumission, string> = {
  nouveau: "Nouvelle",
  lu: "Lue",
  traite: "Traitée",
  archive: "Archivée",
};

export interface SoumissionAdmin {
  id: string;
  created_at: string;
  nom: string;
  email: string;
  telephone: string | null;
  evenement: string;
  date_evenement: string;
  lieu: string;
  details: string | null;
  flyer_path: string;
  statut: StatutSoumission;
  /** URL signée du flyer (bucket privé), générée côté serveur ; null si indisponible. */
  flyer_url: string | null;
}

export function statutSoumissionValide(v: unknown): v is StatutSoumission {
  return typeof v === "string" && (STATUTS_SOUMISSION as readonly string[]).includes(v);
}

/** Nombre de soumissions à lire (statut « nouveau »). */
export function compterNouvelles(liste: Pick<SoumissionAdmin, "statut">[]): number {
  return liste.filter((s) => s.statut === "nouveau").length;
}

export function libelleNouvelles(n: number): string {
  return n === 0 ? "Aucune nouvelle soumission" : n === 1 ? "1 nouvelle soumission" : `${n} nouvelles soumissions`;
}

/** Lecture tolérante de la réponse de soumissions_admin() : ignore les lignes mal formées. */
export function lireListeSoumissions(brut: unknown): Omit<SoumissionAdmin, "flyer_url">[] {
  if (!Array.isArray(brut)) return [];
  return brut.filter(
    (x): x is Omit<SoumissionAdmin, "flyer_url"> =>
      typeof x === "object" && x !== null && typeof (x as { id?: unknown }).id === "string" && statutSoumissionValide((x as { statut?: unknown }).statut),
  );
}
