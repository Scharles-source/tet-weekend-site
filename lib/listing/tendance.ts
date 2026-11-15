/** Nombre minimal d'événements ayant au moins une vue pour montrer « Trending now » : un « top 3 » presque vide ne prouve rien. */
export const MIN_TENDANCES = 3;

interface Source {
  id: string;
  date_debut: string;
  vues?: number | null;
}

/**
 * Les événements les plus vus, du plus au moins vu (à égalité : le plus proche dans le temps d'abord).
 * Liste vide tant que moins de MIN_TENDANCES événements ont été vus : on ne fabrique pas de classement.
 */
export function tendances<T extends Source>(evenements: T[], max = 6): T[] {
  const vus = evenements.filter((e) => typeof e.vues === "number" && e.vues >= 1);
  if (vus.length < MIN_TENDANCES) return [];
  return [...vus]
    .sort((a, b) => (b.vues ?? 0) - (a.vues ?? 0) || Date.parse(a.date_debut) - Date.parse(b.date_debut))
    .slice(0, max);
}
