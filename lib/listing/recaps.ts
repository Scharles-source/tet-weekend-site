/** Récaps vidéo (aftermovies) : types et règles pures, sans dépendance au réseau. */

export interface RecapPublic {
  id: string;
  titre: string;
  lieu_nom: string | null;
  compte_source: string | null;
  plateforme: string;
  post_url: string;
  post_id: string | null;
  video_url: string | null;
  vignette_url: string | null;
  evenement_label: string | null;
  evenement_date: string | null;
}

function texte(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

/** Lecture tolérante de la réponse de recaps_publics() : ignore les lignes mal formées. */
export function lireRecapsPublics(brut: unknown): RecapPublic[] {
  if (!Array.isArray(brut)) return [];
  const sortie: RecapPublic[] = [];
  for (const x of brut) {
    if (typeof x !== "object" || x === null) continue;
    const r = x as Record<string, unknown>;
    const id = texte(r.id);
    const titre = texte(r.titre);
    const post_url = texte(r.post_url);
    if (!id || !titre || !post_url) continue;
    sortie.push({
      id,
      titre,
      lieu_nom: texte(r.lieu_nom),
      compte_source: texte(r.compte_source),
      plateforme: texte(r.plateforme) ?? "autre",
      post_url,
      post_id: texte(r.post_id),
      video_url: texte(r.video_url),
      vignette_url: texte(r.vignette_url),
      evenement_label: texte(r.evenement_label),
      evenement_date: texte(r.evenement_date),
    });
  }
  return sortie;
}

/**
 * URL du lecteur intégré, chargée seulement au clic : Instagram (reel) ou YouTube.
 * Sans identifiant de post exploitable, null — la lightbox retombe sur le lien du post.
 */
export function urlEmbedRecap(r: Pick<RecapPublic, "plateforme" | "post_id">): string | null {
  if (!r.post_id) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(r.post_id)) return null;
  if (r.plateforme === "instagram") return `https://www.instagram.com/reel/${r.post_id}/embed`;
  if (r.plateforme === "youtube") return `https://www.youtube-nocookie.com/embed/${r.post_id}?autoplay=1&rel=0`;
  return null;
}

/** Nom lisible de la plateforme, pour le lien « Voir sur … » de la lightbox. */
export function nomPlateformeRecap(plateforme: string): string {
  if (plateforme === "instagram") return "Instagram";
  if (plateforme === "youtube") return "YouTube";
  return "le post d'origine";
}
