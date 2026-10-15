#!/usr/bin/env node
// Crée data/collecte/<slug>/ pour les 24 restaurants (+ optionnel test).

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DIR_COLLECTE, assurerDossier, ecrireCollecte, lireCollecte, option } from "./_io.mjs";

const args = process.argv.slice(2);
const avecTest = args.includes("--avec-test");
const slugSeul = option(args, "--slug");

const { collecterVide } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { RESTAURANTS } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/sources.ts")).href
);

const testResto = {
  slug: "test-collecte-menu",
  nom: "Test Collecte Menu (fictif)",
  site: null,
  site_note: "Restaurant fictif pour tests E2E — ne pas publier.",
  pistes: ["Données TEST uniquement."],
};

let aCreer;
if (slugSeul === "test-collecte-menu") aCreer = [testResto];
else if (slugSeul) {
  aCreer = RESTAURANTS.filter((r) => r.slug === slugSeul);
  if (aCreer.length === 0) {
    console.error(`Slug inconnu : ${slugSeul}`);
    process.exit(1);
  }
} else {
  aCreer = avecTest ? [...RESTAURANTS, testResto] : [...RESTAURANTS];
}

for (const r of aCreer) {
  const existant = await lireCollecte(r.slug);
  if (existant) {
    console.log(`· ${r.slug} déjà présent`);
    continue;
  }
  const c = collecterVide(r.slug, r.nom);
  if (r.site_note) c.collecte_manuelle = [r.site_note];
  const dir = await assurerDossier(r.slug);
  if (r.pistes?.length || r.site || r.site_note) {
    await writeFile(
      join(dir, "PISTES.md"),
      [
        `# Pistes — ${r.nom}`,
        ``,
        r.site
          ? `- Site connu : ${r.site.url} (${r.site.origine})`
          : `- Pas de site connu dans la fouille Instagram du 15 oct. 2026.`,
        r.site_note ? `- Note : ${r.site_note}` : "",
        ``,
        ...(r.pistes?.length
          ? ["## Instagram (ne pas refaire la fouille)", ...r.pistes.map((p) => `- ${p}`)]
          : []),
        ``,
      ]
        .filter((l) => l !== "")
        .join("\n"),
      "utf8"
    );
  }
  await ecrireCollecte(c);
  console.log(`✓ ${r.slug}`);
}

console.log(`\nDossier : ${DIR_COLLECTE}`);
console.log(`Ensuite : npm run collecte:sites  |  npm run collecte:maps  |  npm run collecte:etat`);
