/**
 * Faits énoncés dans la description d'un événement (correctif SEO,
 * 13 nov. 2026). La collecte écrit deux lignes factuelles dans la
 * description — « Artistes : … » et « Lieu : … » — présentes dans la
 * grande majorité des fiches, alors que les tables liées (venues,
 * event_artists) sont rarement remplies. Ces fonctions LISENT ces lignes
 * telles quelles pour alimenter le schéma Event et la meta description :
 * rien n'est inventé, une ligne absente ou ambiguë ne produit rien.
 */

function ligne(description: string | null, etiquette: string): string | null {
  if (!description) return null;
  const motif = new RegExp(`(?:^|\\n|\\s/\\s|\\|\\s*)${etiquette}\\s*:\\s*([^/\\n|]+)`, "i");
  const trouve = description.match(motif);
  if (!trouve) return null;
  const valeur = trouve[1].trim().replace(/\.\s*$/, "").trim();
  return valeur || null;
}

/** Nom du lieu tel qu'énoncé (« Lieu : Karibe Hotel, Juvénat 7, Pétion-Ville »). */
export function lieuDepuisDescription(description: string | null): string | null {
  const valeur = ligne(description, "Lieu");
  if (!valeur || valeur.length > 160) return null;
  if (/confirmer|inconnu|non indiqué|à venir/i.test(valeur)) return null;
  return valeur;
}

const ARTISTES_GENERIQUES = new Set([
  "animation",
  "dj",
  "jazz",
  "musique",
  "concert",
  "soiree",
  "soirée",
  "spectacle",
  "danse",
  "live",
]);

/** Artistes énoncés (« Artistes : Arly Larivière & Nu-Look »), hors termes génériques seuls. */
export function artistesDepuisDescription(description: string | null): string[] {
  const valeur = ligne(description, "Artistes?");
  if (!valeur) return [];
  return valeur
    .split(/\s*[,;]\s*|\s+et\s+|\s*&\s*/)
    .map((n) => n.replace(/\s*\([^)]*\)\s*$/, "").trim().replace(/\.\s*$/, "").trim())
    .filter((n) => n.length >= 2 && n.length <= 80)
    .filter((n) => !ARTISTES_GENERIQUES.has(n.toLocaleLowerCase("fr")))
    .slice(0, 6);
}
