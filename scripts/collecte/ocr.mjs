#!/usr/bin/env node
// OCR local (Tesseract) → extraction proposée dans data/collecte/<slug>/collecte.json
// L'OCR propose, jamais ne décide. Toutes les lignes partent en « à vérifier ».

import { spawn } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { assurerDossier, ecrireCollecte, lireCollecte, option } from "./_io.mjs";

const args = process.argv.slice(2);
const slug = option(args, "--slug");
const image = option(args, "--image");
const texteFichier = option(args, "--texte");
const sourceUrl = option(args, "--source-url") ?? null;
const datePhoto = option(args, "--date-photo") ?? null;
const typeSource = option(args, "--type") ?? "manuel";

if (!slug || (!image && !texteFichier)) {
  console.error(
    "Usage : node scripts/collecte/ocr.mjs --slug <slug> (--image fichier.png|.jpg|.webp | --texte fichier.txt) [--source-url URL] [--date-photo AAAA-MM-JJ|texte] [--type manuel|maps-photo|site-image]"
  );
  process.exit(1);
}

const { aReverifier, dateIsoHaiti, extraireLignes, fusionnerNomPuisPrix, parserDatePhoto } =
  await import(pathToFileURL(join(process.cwd(), "lib/collecte/extraction.ts")).href);
const { ajouterSource, collecterVide, remplacerLignesSource } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { restaurantParSlug } = await import(pathToFileURL(join(process.cwd(), "lib/collecte/sources.ts")).href);

function trouverTesseract() {
  const candidats = [
    process.env.TESSERACT_PATH,
    "tesseract",
    "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
    "/usr/bin/tesseract",
    "/opt/homebrew/bin/tesseract",
  ].filter(Boolean);
  return candidats;
}

async function ocrSysteme(cheminImage) {
  const essais = trouverTesseract();
  let dernier = "";
  for (const bin of essais) {
    try {
      const texte = await new Promise((resolve, reject) => {
        const p = spawn(bin, [cheminImage, "stdout", "-l", "fra+eng", "--psm", "6"], {
          windowsHide: true,
        });
        let out = "";
        let err = "";
        p.stdout.on("data", (d) => (out += d));
        p.stderr.on("data", (d) => (err += d));
        p.on("error", reject);
        p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(err || `code ${code}`))));
      });
      return { texte, moteur: bin };
    } catch (e) {
      dernier = e.message;
    }
  }
  throw new Error(
    `Tesseract introuvable ou en échec (${dernier}). ` +
      `Installez-le (winget install UB-Mannheim.TesseractOCR) ou passez --texte pour un fichier déjà lu. ` +
      `Variable TESSERACT_PATH pour forcer le chemin.`
  );
}

async function ocrTesseractJs(cheminImage) {
  // Repli : tesseract.js (WASM). Les données de langue sont téléchargées au premier lancement.
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra+eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(cheminImage);
    return { texte: text, moteur: "tesseract.js" };
  } finally {
    await worker.terminate();
  }
}

async function lireTexteImage(chemin) {
  try {
    return await ocrSysteme(chemin);
  } catch (eSysteme) {
    console.warn(`⚠ OCR système : ${eSysteme.message}`);
    console.warn("→ tentative tesseract.js (npm)…");
    try {
      return await ocrTesseractJs(chemin);
    } catch (eJs) {
      throw new Error(`${eSysteme.message}\nRepli tesseract.js : ${eJs.message}`);
    }
  }
}

const resto = restaurantParSlug(slug);
const dir = await assurerDossier(slug);
let collecte = (await lireCollecte(slug)) ?? collecterVide(slug, resto?.nom ?? slug);

const photo = parserDatePhoto(datePhoto);
// Fraîcheur 12 mois : photos Maps (date absente ou ancienne). Une saisie manuelle / page site sans date n'est pas « carte de 2020 ».
const aRev =
  typeSource === "maps-photo"
    ? aReverifier(photo.iso)
    : photo.iso
      ? aReverifier(photo.iso)
      : false;
const id = `src-${Date.now().toString(36)}`;
let fichierRel = null;
let lignesTexte;

if (texteFichier) {
  const brut = await readFile(texteFichier, "utf8");
  const dest = join(dir, "sources", `${id}.txt`);
  await mkdir(join(dir, "sources"), { recursive: true });
  await writeFile(dest, brut, "utf8");
  fichierRel = `sources/${id}.txt`;
  lignesTexte = brut
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((texte) => ({ texte, confiance: null }));
} else {
  const ext = extname(image).toLowerCase() || ".png";
  const destName = `${id}${ext}`;
  const dest = join(dir, "sources", destName);
  await copyFile(image, dest);
  fichierRel = `sources/${destName}`;
  const { texte, moteur } = await lireTexteImage(dest);
  await writeFile(join(dir, "sources", `${id}.ocr.txt`), texte, "utf8");
  console.log(`OCR (${moteur}) : ${texte.split(/\n/).filter((l) => l.trim()).length} ligne(s) brutes`);
  lignesTexte = texte
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((texteLigne) => ({ texte: texteLigne, confiance: 75 }));
}

let lignes = fusionnerNomPuisPrix(
  extraireLignes(lignesTexte, {
    sourceId: id,
    sourceUrl,
    dateReleve: dateIsoHaiti(),
    aReverifier: aRev,
  })
);

const source = {
  id,
  type: typeSource,
  fichier: fichierRel,
  url: sourceUrl,
  recupere_le: dateIsoHaiti(),
  date_photo: photo.iso,
  date_photo_texte: photo.brut,
  a_reverifier: aRev,
  ocr_fait_le: dateIsoHaiti(),
  note: aRev ? "Photo / source > 12 mois ou sans date — à revérifier" : null,
};

collecte = ajouterSource(collecte, source);
collecte = remplacerLignesSource(collecte, id, lignes);
await ecrireCollecte(collecte);

console.log(
  `✓ ${slug} : ${lignes.length} ligne(s) proposées (toutes « à vérifier »). ` +
    `Relire : npm run collecte:relire -- --slug ${slug}`
);
if (aRev) console.warn("⚠ Source marquée à revérifier (fraîcheur > 12 mois ou date inconnue).");
