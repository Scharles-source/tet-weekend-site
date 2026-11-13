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
  const motif = new RegExp(`(?:^|\\n|\\s/\\s|\\|\\s*)(?:${etiquette})\\s*:\\s*([^/\\n|]+)`, "i");
  const trouve = description.match(motif);
  if (!trouve) return null;
  const valeur = trouve[1].trim().replace(/\.\s*$/, "").trim();
  return valeur || null;
}

const MOTS_FR = [" le ", " la ", " les ", " des ", " une ", " avec ", " soirée", " entrée", " billets", " présente", " dès ", " au ", " aux ", " du ", " en haïti"];
const MOTS_EN = [" the ", " and ", " with ", " party", " doors", " tickets", " featuring", " presented", " free ", " night", " live ", " at "];

/**
 * Langue d'un événement d'après ses textes (titre + description), pour le
 * schéma : depuis la bascule du site en anglais (13 nov. 2026), chaque
 * événement garde la langue de son flyer — le `inLanguage` du JSON-LD
 * suit donc la langue réelle de la fiche, pas celle de l'interface.
 * Heuristique simple par mots-outils ; égalité ou silence = français
 * (cas majoritaire de la collecte).
 */
export function langueEvenement(titre: string, description: string | null): "fr" | "en" {
  const texte = ` ${`${titre} ${description ?? ""}`.toLowerCase()} `;
  const score = (mots: string[]) => mots.reduce((n, m) => n + (texte.includes(m) ? 1 : 0), 0);
  return score(MOTS_EN) > score(MOTS_FR) ? "en" : "fr";
}

/** Nom du lieu tel qu'énoncé (« Lieu : Karibe Hotel, Juvénat 7, Pétion-Ville » ou « Venue: … »). */
export function lieuDepuisDescription(description: string | null): string | null {
  const valeur = ligne(description, "Lieu|Venue|Location");
  if (!valeur || valeur.length > 160) return null;
  if (/confirmer|inconnu|non indiqué|à venir|to be announced|tba/i.test(valeur)) return null;
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
  "music",
  "live music",
  "show",
]);

/** Artistes énoncés (« Artistes : Arly Larivière & Nu-Look » ou « Artists: … »), hors termes génériques seuls. */
export function artistesDepuisDescription(description: string | null): string[] {
  const valeur = ligne(description, "Artistes?|Artists?|Lineup");
  if (!valeur) return [];
  return valeur
    .split(/\s*[,;]\s*|\s+et\s+|\s*&\s*/)
    .map((n) => n.replace(/\s*\([^)]*\)\s*$/, "").trim().replace(/\.\s*$/, "").trim())
    .filter((n) => n.length >= 2 && n.length <= 80)
    .filter((n) => !ARTISTES_GENERIQUES.has(n.toLocaleLowerCase("fr")))
    .slice(0, 6);
}
