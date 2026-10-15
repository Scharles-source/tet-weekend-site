#!/usr/bin/env node
// Export CSV/JSON au format de scripts/import-menus.mjs.
// Refuse toute ligne non « vérifié ». N'écrit JAMAIS dans Supabase.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DIR_COLLECTE, lireCollecte, listerSlugs, option } from "./_io.mjs";

const args = process.argv.slice(2);
const slug = option(args, "--slug");
const tous = args.includes("--tous");
const format = option(args, "--format") ?? "csv";
const sortie = option(args, "--out");

if (!slug && !tous) {
  console.error(
    "Usage : npm run collecte:exporter -- (--slug <slug> | --tous) [--format csv|json] [--out fichier]"
  );
  process.exit(1);
}

const { construireExport, ErreurExport, versCsv, versJson } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/export.ts")).href
);

const slugs = tous ? await listerSlugs() : [slug];
const toutesLignes = [];
const erreurs = [];

for (const s of slugs) {
  const c = await lireCollecte(s);
  if (!c) {
    erreurs.push(`${s} : pas de collecte.json`);
    continue;
  }
  try {
    const { lignes, ignorees } = construireExport(c);
    toutesLignes.push(...lignes);
    console.log(`✓ ${s} : ${lignes.length} ligne(s) exportées` + (ignorees ? ` (${ignorees} rejetée(s) ignorées)` : ""));
  } catch (e) {
    if (e instanceof ErreurExport || e?.name === "ErreurExport") erreurs.push(e.message);
    else erreurs.push(`${s} : ${e.message}`);
  }
}

if (erreurs.length) {
  console.error("\nExport refusé (relecture obligatoire) :\n" + erreurs.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}

if (toutesLignes.length === 0) {
  console.error("Aucune ligne à exporter.");
  process.exit(1);
}

const contenu = format === "json" ? versJson(toutesLignes) : versCsv(toutesLignes);
const dest =
  sortie ??
  join(DIR_COLLECTE, `export-menus-${new Date().toISOString().slice(0, 10)}.${format === "json" ? "json" : "csv"}`);
await mkdir(join(dest, ".."), { recursive: true });
await writeFile(dest, contenu, "utf8");
console.log(`\nFichier : ${dest}`);
console.log(`Import (manuel, par Smith) :`);
console.log(`  node --env-file=.env.import scripts/import-menus.mjs --menu ${dest} --completer-seulement --dry-run`);
console.log(`  node --env-file=.env.import scripts/import-menus.mjs --menu ${dest} --completer-seulement`);
