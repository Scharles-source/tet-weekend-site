// Export au format exact de scripts/import-menus.mjs.
// Seules les lignes au statut « vérifié » partent à l'export — jamais une extraction non relue.

import {
  CATEGORIES_IMPORT,
  CATEGORIES_IMPORT_DATEES,
  type Collecte,
  type Ligne,
} from "./types.ts";

export const COLONNES_EXPORT = [
  "restaurant_slug",
  "categorie",
  "nom",
  "description",
  "prix",
  "devise",
  "disponible",
  "ordre",
  "source_url",
  "date_releve",
  "valide_du",
  "valide_au",
  "a_verifier",
] as const;

export type LigneExport = {
  restaurant_slug: string;
  categorie: string;
  nom: string;
  description: string;
  prix: number;
  devise: "HTG" | "USD";
  disponible: string;
  ordre: number;
  source_url: string;
  date_releve: string;
  valide_du: string;
  valide_au: string;
  a_verifier: string;
};

export class ErreurExport extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurExport";
  }
}

function echapperCsv(v: string | number): string {
  const s = String(v);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Vérifie qu'une ligne relue est exportable (pas de champ inventé / manquant). */
export function validerLigneVerifiee(ligne: Ligne, slug: string): string[] {
  const erreurs: string[] = [];
  if (ligne.statut !== "vérifié") erreurs.push(`${ligne.id} : statut ≠ vérifié`);
  if (!ligne.nom || ligne.nom === "(nom à lire)") erreurs.push(`${ligne.id} : nom manquant`);
  if (ligne.prix === null || ligne.prix < 0) erreurs.push(`${ligne.id} : prix manquant`);
  if (ligne.devise !== "HTG" && ligne.devise !== "USD") erreurs.push(`${ligne.id} : devise manquante`);
  if (!CATEGORIES_IMPORT.includes(ligne.categorie as never)) {
    erreurs.push(
      `${ligne.id} : catégorie « ${ligne.categorie} » invalide pour l'import (reclasser « Autre » à la relecture)`
    );
  }
  if (CATEGORIES_IMPORT_DATEES.includes(ligne.categorie) && !ligne.date_releve) {
    erreurs.push(`${ligne.id} : date_releve obligatoire pour « ${ligne.categorie} »`);
  }
  if (ligne.source_url && !/^https:\/\//.test(ligne.source_url)) {
    erreurs.push(`${ligne.id} : source_url doit commencer par https://`);
  }
  if (!slug) erreurs.push("slug restaurant manquant");
  return erreurs;
}

/** Construit les lignes d'export. Refuse tout dossier qui contient encore des « à vérifier » exportables. */
export function construireExport(
  collecte: Collecte,
  options: { inclureRejetes?: boolean } = {}
): { lignes: LigneExport[]; ignorees: number } {
  const verifiees = collecte.lignes.filter((l) => l.statut === "vérifié");
  const aVerifier = collecte.lignes.filter((l) => l.statut === "à vérifier");
  if (aVerifier.length > 0) {
    throw new ErreurExport(
      `${collecte.slug} : ${aVerifier.length} ligne(s) encore « à vérifier ». ` +
        `Corrigez-les (npm run collecte:relire -- --slug ${collecte.slug}) puis relancez l'export. ` +
        `Aucune extraction non relue ne part à l'import.`
    );
  }
  if (verifiees.length === 0) {
    throw new ErreurExport(
      `${collecte.slug} : aucune ligne « vérifié ». Rien à exporter.`
    );
  }

  const erreurs = verifiees.flatMap((l) => validerLigneVerifiee(l, collecte.slug));
  if (erreurs.length > 0) throw new ErreurExport(erreurs.join("\n"));

  const ignorees = options.inclureRejetes
    ? 0
    : collecte.lignes.filter((l) => l.statut === "rejeté").length;

  const lignes: LigneExport[] = verifiees.map((l, i) => ({
    restaurant_slug: collecte.slug,
    categorie: l.categorie,
    nom: l.nom,
    description: l.description ?? "",
    prix: l.prix as number,
    devise: l.devise as "HTG" | "USD",
    disponible: l.disponible ? "oui" : "non",
    ordre: i + 1,
    source_url: l.source_url ?? "",
    date_releve: l.date_releve ?? "",
    valide_du: l.valide_du ?? "",
    valide_au: l.valide_au ?? "",
    a_verifier: "non",
  }));

  return { lignes, ignorees };
}

export function versCsv(lignes: LigneExport[]): string {
  const entete = COLONNES_EXPORT.join(",");
  const corps = lignes.map((l) =>
    COLONNES_EXPORT.map((c) => echapperCsv(l[c] as string | number)).join(",")
  );
  return [entete, ...corps].join("\n") + "\n";
}

export function versJson(lignes: LigneExport[]): string {
  return JSON.stringify(lignes, null, 2) + "\n";
}
