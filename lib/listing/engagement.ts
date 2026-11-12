/** Seuils sous lesquels on n'affiche aucun chiffre : de petits nombres font paraître le site vide. */
export const SEUIL_INTERET = 10;
export const SEUIL_VUES = 50;

export function libelleInteret(total: number | null | undefined): string | null {
  if (!total || total < SEUIL_INTERET) return null;
  return `${total} personnes y vont`;
}

export function estTresConsulte(vues: number | null | undefined): boolean {
  return typeof vues === "number" && vues >= SEUIL_VUES;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const estUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
