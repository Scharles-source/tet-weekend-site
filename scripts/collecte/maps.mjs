#!/usr/bin/env node
// Bot 2 — Google Maps (mode ASSISTÉ).
// Ouvre chaque fiche dans Edge (fenêtre visible). Smith clique sur l'onglet Menu,
// enregistre les photos + dates, puis les passe à ocr.mjs.
// Aucune connexion Google, aucun contournement anti-bot.
// Au premier blocage visible : arrêter (Ctrl+C) — les restants passent en collecte manuelle.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ecrireCollecte, lireCollecte, option, sleep } from "./_io.mjs";

const args = process.argv.slice(2);
const unSeul = option(args, "--slug");
const delaiMs = Number(option(args, "--delai-ms") ?? "4000");
const sansPause = args.includes("--sans-pause");
const marquerManuel = args.includes("--marquer-manuel");

const { collecterVide } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { RESTAURANTS, restaurantParSlug } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/sources.ts")).href
);

function urlMaps(recherche) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recherche)}`;
}

function ouvrirEdge(url) {
  const edge =
    process.env.EDGE_PATH ??
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  return new Promise((resolve, reject) => {
    const p = spawn(edge, [`--new-window`, url], { detached: true, stdio: "ignore" });
    p.on("error", reject);
    p.unref();
    resolve();
  });
}

function question(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

const liste = unSeul
  ? [restaurantParSlug(unSeul)].filter(Boolean)
  : RESTAURANTS;

if (liste.length === 0) {
  console.error(unSeul ? `Slug inconnu : ${unSeul}` : "Aucun restaurant");
  process.exit(1);
}

console.log(`
Bot Maps (assisté) — ${liste.length} restaurant(s)
────────────────────────────────────────────────
Pour chaque restaurant :
  1. Edge ouvre la recherche Google Maps.
  2. Ouvrez la fiche du restaurant.
  3. Si un onglet « Menu » existe : enregistrez TOUTES les photos de carte
     (clic droit → Enregistrer l'image) dans data/collecte/<slug>/sources/
     et notez la date affichée sous chaque photo (ex. « nov. 2020 »).
  4. Si un lien de menu apparaît, copiez-le.
  5. Revenez ici et validez.

Ensuite, pour chaque photo :
  npm run collecte:ocr -- --slug <slug> --image <fichier> --type maps-photo --date-photo "Nov 2020" --source-url "<url Maps>"

Une photo de plus de 12 mois est marquée « à revérifier » automatiquement.
Pas d'onglet Menu → collecte manuelle.
Au premier CAPTCHA / blocage : Ctrl+C — ne contournez rien.
`);

const rl = sansPause ? null : createInterface({ input: process.stdin, output: process.stdout });

for (const r of liste) {
  const url = urlMaps(r.recherche_maps);
  console.log(`\n→ ${r.nom} (${r.slug})\n  ${url}`);
  try {
    await ouvrirEdge(url);
  } catch (e) {
    console.error(`Impossible d'ouvrir Edge : ${e.message}`);
    console.error(`Ouvrez manuellement : ${url}`);
  }

  let collecte = (await lireCollecte(r.slug)) ?? collecterVide(r.slug, r.nom);
  collecte.site_maps = collecte.site_maps ?? url;

  if (rl) {
    const rep = (
      await question(
        rl,
        "Menu trouvé ? [o]ui photos à OCR / [n]on (manuel) / [l]ien menu collé / [q]uitter > "
      )
    )
      .trim()
      .toLowerCase();

    if (rep === "q") {
      console.log("Arrêt. Restaurants non traités : à reprendre plus tard.");
      break;
    }
    if (rep === "n" || marquerManuel) {
      collecte.collecte_manuelle = [
        ...new Set([...(collecte.collecte_manuelle ?? []), "pas de menu sur Maps → collecte manuelle"]),
      ];
      console.log("  noté : collecte manuelle");
    } else if (rep === "l") {
      const lien = (await question(rl, "Collez l'URL du menu : ")).trim();
      if (lien) {
        collecte.site_maps = lien;
        console.log(
          `  lien noté. Extraire via : npm run collecte:sites -- --slug ${r.slug}` +
            ` (ou ajoutez le site dans lib/collecte/sources.ts)`
        );
        console.log(
          `  Astuce temporaire : enregistrez une capture et npm run collecte:ocr -- --slug ${r.slug} --image … --source-url "${lien}"`
        );
      }
    } else {
      const cats = (await question(rl, "Catégories visibles (séparées par |) ou Entrée : ")).trim();
      if (cats) {
        collecte.categories_maps = cats.split("|").map((s) => s.trim()).filter(Boolean);
      }
      const dateEx = (await question(rl, "Exemple de date photo vue (ex. Nov 2020) ou Entrée : ")).trim();
      if (dateEx) {
        collecte.collecte_manuelle = collecte.collecte_manuelle.filter(
          (x) => !/pas de menu sur Maps/.test(x)
        );
        console.log(
          `  Enregistrez les images puis :\n  npm run collecte:ocr -- --slug ${r.slug} --image data/collecte/${r.slug}/sources/photo.jpg --type maps-photo --date-photo "${dateEx}"`
        );
      } else {
        console.log(
          `  Enregistrez les images puis lancez collecte:ocr avec --type maps-photo et --date-photo.`
        );
      }
    }
  } else if (marquerManuel) {
    collecte.collecte_manuelle = [
      ...new Set([...(collecte.collecte_manuelle ?? []), "pas de menu sur Maps → collecte manuelle"]),
    ];
  }

  collecte.historique = {
    ...collecte.historique,
    ...(collecte.etat === "pas_commence" ? {} : {}),
  };
  // Ne change pas l'état tant qu'aucune source n'est ajoutée (ocr le fera).
  await ecrireCollecte({ ...collecte, site_maps: collecte.site_maps });
  await sleep(delaiMs);
}

if (rl) rl.close();
console.log("\nTerminé (mode assisté). Pensez à régénérer ETAT.md : npm run collecte:etat");
