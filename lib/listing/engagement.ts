/** Une vue par visiteur et par jour : le chiffre « vu aujourd'hui » n'apparaît qu'à partir de ce seuil. */
export const SEUIL_VUES_JOUR = 20;
/** Vues cumulées : seuil du badge « Hot right now » et de la ligne « views ». */
export const SEUIL_VUES = 50;
/** Villes comptant au moins ce nombre d'événements à venir pour mériter un classement « n°1 ». */
export const MIN_EVENEMENTS_CLASSEMENT = 3;

/** Le nombre de « I'm in » est montré dès le premier (décision de Smith, 13 nov. 2026). */
export function libelleInteret(total: number | null | undefined): string | null {
  if (!total || total < 1) return null;
  return `${total} in`;
}

export function estTresConsulte(vues: number | null | undefined): boolean {
  return typeof vues === "number" && vues >= SEUIL_VUES;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const estUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
