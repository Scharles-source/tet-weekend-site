// Mise à jour de l'état de collecte d'un restaurant et génération du récap ETAT.md.

import {
  ETATS,
  LIBELLES_ETAT,
  type Collecte,
  type EtatCollecte,
  type Ligne,
  type Source,
} from "./types.ts";
import { dateIsoHaiti } from "./extraction.ts";

const RANG: Record<EtatCollecte, number> = {
  pas_commence: 0,
  image_recue: 1,
  extraction_proposee: 2,
  verifie: 3,
  publie: 4,
};

export function dossierCollecte(racine: string, slug: string): string {
  return `${racine.replace(/[/\\]+$/, "")}/${slug}`;
}

export function collecterVide(slug: string, nom: string): Collecte {
  return {
    slug,
    nom,
    etat: "pas_commence",
    historique: {},
    site_maps: null,
    categories_maps: [],
    collecte_manuelle: [],
    sources: [],
    lignes: [],
  };
}

/** Recalcule l'état à partir des sources et des lignes (jamais de régression sauf si vide). */
export function recalculerEtat(c: Collecte, maintenant = new Date()): Collecte {
  const date = dateIsoHaiti(maintenant);
  let etat: EtatCollecte = "pas_commence";
  if (c.sources.length > 0) etat = "image_recue";
  if (c.lignes.length > 0) etat = "extraction_proposee";
  if (c.lignes.length > 0 && c.lignes.every((l) => l.statut !== "à vérifier")) {
    etat = "verifie";
  }
  // « publié » n'est posé que manuellement (après import Supabase).
  if (c.etat === "publie" && RANG[etat] >= RANG.verifie) etat = "publie";

  const historique = { ...c.historique };
  if (etat !== "pas_commence" && !historique[etat]) historique[etat] = date;
  for (const e of ETATS) {
    if (RANG[e] <= RANG[etat] && e !== "pas_commence" && !historique[e]) {
      historique[e] = date;
    }
  }
  return { ...c, etat, historique };
}

export function ajouterSource(c: Collecte, source: Source, maintenant = new Date()): Collecte {
  const sources = [...c.sources.filter((s) => s.id !== source.id), source];
  return recalculerEtat({ ...c, sources }, maintenant);
}

export function remplacerLignesSource(
  c: Collecte,
  sourceId: string,
  nouvelles: Ligne[],
  maintenant = new Date()
): Collecte {
  const lignes = [...c.lignes.filter((l) => l.source !== sourceId), ...nouvelles];
  return recalculerEtat({ ...c, lignes }, maintenant);
}

export function marquerPublie(c: Collecte, maintenant = new Date()): Collecte {
  if (c.etat !== "verifie" && c.etat !== "publie") {
    throw new Error(`${c.slug} : passer en « vérifié » avant « publié ».`);
  }
  const date = dateIsoHaiti(maintenant);
  return {
    ...c,
    etat: "publie",
    historique: { ...c.historique, publie: date },
  };
}

export function genererEtatMd(
  collectes: Collecte[],
  options: { genereLe?: string } = {}
): string {
  const date = options.genereLe ?? dateIsoHaiti();
  const lignes = [
    `# État de la collecte des menus`,
    ``,
    `Généré le ${date} (heure d'Haïti). Aucune publication automatique — l'import Supabase reste manuel.`,
    ``,
    `| Restaurant | État | Sources | Lignes (vérifiées / à vérifier / rejetées) | Dernier relevé |`,
    `|---|---|---:|---:|---|`,
  ];
  const tries = [...collectes].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  for (const c of tries) {
    const v = c.lignes.filter((l) => l.statut === "vérifié").length;
    const a = c.lignes.filter((l) => l.statut === "à vérifier").length;
    const r = c.lignes.filter((l) => l.statut === "rejeté").length;
    const dernier =
      c.historique.publie ??
      c.historique.verifie ??
      c.historique.extraction_proposee ??
      c.historique.image_recue ??
      "—";
    const note =
      c.collecte_manuelle.length > 0
        ? ` · manuelle : ${c.collecte_manuelle.join("; ")}`
        : "";
    lignes.push(
      `| ${c.nom} (\`${c.slug}\`) | ${LIBELLES_ETAT[c.etat]}${note} | ${c.sources.length} | ${v} / ${a} / ${r} | ${dernier} |`
    );
  }
  const comptes = ETATS.map(
    (e) => `- ${LIBELLES_ETAT[e]} : ${collectes.filter((c) => c.etat === e).length}`
  );
  lignes.push(``, `## Totaux`, ``, ...comptes, ``);
  return lignes.join("\n");
}
