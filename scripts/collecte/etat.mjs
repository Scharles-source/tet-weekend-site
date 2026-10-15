#!/usr/bin/env node
// Régénère data/collecte/ETAT.md à partir de tous les collecte.json.

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DIR_COLLECTE, lireCollecte, listerSlugs } from "./_io.mjs";

const { genererEtatMd } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { collecterVide } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { RESTAURANTS } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/sources.ts")).href
);

const slugsDisque = new Set(await listerSlugs());
const collectes = [];

for (const r of RESTAURANTS) {
  const c = (await lireCollecte(r.slug)) ?? collecterVide(r.slug, r.nom);
  collectes.push(c);
  slugsDisque.delete(r.slug);
}
for (const s of [...slugsDisque].sort()) {
  if (s.startsWith("export") || s === "_") continue;
  const c = await lireCollecte(s);
  if (c) collectes.push(c);
}

const md = genererEtatMd(collectes);
const dest = join(DIR_COLLECTE, "ETAT.md");
await writeFile(dest, md, "utf8");
console.log(`✓ ${dest}`);
console.log(md.split("\n").slice(-12).join("\n"));
