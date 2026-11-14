/** Récaps vidéo : types et petites règles pures (testées à part). */

export const STATUTS_RECAP = ["a_valider", "publie", "ecarte"] as const;
export type StatutRecap = (typeof STATUTS_RECAP)[number];

export const LIBELLES_RECAP: Record<StatutRecap, string> = {
  a_valider: "À valider",
  publie: "Publiée",
  ecarte: "Écartée",
};

export const ACTIONS_RECAP: Record<StatutRecap, string> = {
  a_valider: "Remettre à valider",
  publie: "Publier",
  ecarte: "Écarter",
};

export interface RecapAdmin {
  id: string;
  created_at: string;
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
  statut: StatutRecap;
  ordre: number;
}

export function statutRecapValide(v: unknown): v is StatutRecap {
  return typeof v === "string" && (STATUTS_RECAP as readonly string[]).includes(v);
}

/** Nombre de récaps en attente de validation (statut « a_valider »). */
export function compterAValider(liste: Pick<RecapAdmin, "statut">[]): number {
  return liste.filter((r) => r.statut === "a_valider").length;
}

export function libelleAValider(n: number): string {
  return n === 0 ? "Aucune vidéo à valider" : n === 1 ? "1 vidéo à valider" : `${n} vidéos à valider`;
}

function texte(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

/** Lecture tolérante de la réponse de recaps_admin() : ignore les lignes mal formées. */
export function lireListeRecaps(brut: unknown): RecapAdmin[] {
  if (!Array.isArray(brut)) return [];
  const sortie: RecapAdmin[] = [];
  for (const x of brut) {
    if (typeof x !== "object" || x === null) continue;
    const r = x as Record<string, unknown>;
    const id = texte(r.id);
    const titre = texte(r.titre);
    const post_url = texte(r.post_url);
    if (!id || !titre || !post_url || !statutRecapValide(r.statut)) continue;
    sortie.push({
      id,
      created_at: texte(r.created_at) ?? "",
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
      statut: r.statut,
      ordre: typeof r.ordre === "number" ? r.ordre : 0,
    });
  }
  return sortie;
}
