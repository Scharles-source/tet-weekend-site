#!/usr/bin/env node
// Relecture humaine des lignes « à vérifier ».
// Modes :
//   --liste              affiche les lignes à vérifier
//   --tout-verifier      marque toutes les lignes COMPLÈTES comme vérifiées (après contrôle humain)
//   --id <id> --set …    corrige une ligne
//   --rejeter <id>       rejette une ligne
// Aucune ligne incomplète (prix/devise/nom) ne peut passer en « vérifié ».

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ecrireCollecte, lireCollecte, option } from "./_io.mjs";

const args = process.argv.slice(2);
const slug = option(args, "--slug");
const liste = args.includes("--liste");
const toutVerifier = args.includes("--tout-verifier");
const id = option(args, "--id");
const rejeter = option(args, "--rejeter");

if (!slug) {
  console.error(
    "Usage :\n" +
      "  npm run collecte:relire -- --slug <slug> --liste\n" +
      "  npm run collecte:relire -- --slug <slug> --id <id> --nom \"…\" --prix 12.5 --devise USD --categorie Plats\n" +
      "  npm run collecte:relire -- --slug <slug> --tout-verifier\n" +
      "  npm run collecte:relire -- --slug <slug> --rejeter <id>"
  );
  process.exit(1);
}

const { dateIsoHaiti } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/extraction.ts")).href
);
const { recalculerEtat } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { CATEGORIES_IMPORT } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/types.ts")).href
);

const collecte = await lireCollecte(slug);
if (!collecte) {
  console.error(`Pas de collecte pour ${slug}. Lancez d'abord sites/maps/ocr.`);
  process.exit(1);
}

function afficher(l) {
  const prix = l.prix === null ? "?" : `${l.prix} ${l.devise ?? "?"}`;
  console.log(
    `  [${l.statut}] ${l.id}  ${l.categorie} · ${l.nom} · ${prix}  conf=${l.confiance}` +
      (l.avertissements?.length ? `\n           ⚠ ${l.avertissements.join(" ; ")}` : "") +
      `\n           brut: ${l.texte_brut}`
  );
}

if (liste) {
  const a = collecte.lignes.filter((l) => l.statut === "à vérifier");
  console.log(`${slug} : ${a.length} ligne(s) à vérifier / ${collecte.lignes.length} total`);
  a.forEach(afficher);
  process.exit(0);
}

if (rejeter) {
  const i = collecte.lignes.findIndex((l) => l.id === rejeter);
  if (i < 0) {
    console.error(`Ligne inconnue : ${rejeter}`);
    process.exit(1);
  }
  collecte.lignes[i] = { ...collecte.lignes[i], statut: "rejeté", verifie_le: dateIsoHaiti() };
  await ecrireCollecte(recalculerEtat(collecte));
  console.log(`✓ ${rejeter} rejeté`);
  process.exit(0);
}

function patchDepuisArgs(ligne) {
  const out = { ...ligne };
  const nom = option(args, "--nom");
  const prix = option(args, "--prix");
  const devise = option(args, "--devise");
  const categorie = option(args, "--categorie");
  const description = option(args, "--description");
  const sourceUrl = option(args, "--source-url");
  const dateReleve = option(args, "--date-releve");
  const valideDu = option(args, "--valide-du");
  const valideAu = option(args, "--valide-au");
  const disponible = option(args, "--disponible");
  if (nom !== undefined) out.nom = nom;
  if (prix !== undefined) out.prix = Number(prix);
  if (devise !== undefined) out.devise = devise.toUpperCase();
  if (categorie !== undefined) out.categorie = categorie;
  if (description !== undefined) out.description = description || null;
  if (sourceUrl !== undefined) out.source_url = sourceUrl || null;
  if (dateReleve !== undefined) out.date_releve = dateReleve || null;
  if (valideDu !== undefined) out.valide_du = valideDu || null;
  if (valideAu !== undefined) out.valide_au = valideAu || null;
  if (disponible !== undefined) out.disponible = ["oui", "true", "1"].includes(disponible.toLowerCase());
  return out;
}

function complete(l) {
  return (
    l.nom &&
    l.nom !== "(nom à lire)" &&
    l.prix !== null &&
    Number.isFinite(l.prix) &&
    (l.devise === "HTG" || l.devise === "USD") &&
    CATEGORIES_IMPORT.includes(l.categorie)
  );
}

if (id) {
  const i = collecte.lignes.findIndex((l) => l.id === id);
  if (i < 0) {
    console.error(`Ligne inconnue : ${id}`);
    process.exit(1);
  }
  let l = patchDepuisArgs(collecte.lignes[i]);
  if (!complete(l)) {
    console.error(
      "Ligne incomplète : il faut nom, prix, devise (HTG|USD) et une catégorie d'import " +
        `(${CATEGORIES_IMPORT.join(", ")}). « Autre » doit être reclassée.`
    );
    process.exit(1);
  }
  l = {
    ...l,
    statut: "vérifié",
    verifie_le: dateIsoHaiti(),
    avertissements: l.avertissements.filter((a) => !/illisible|absent|ambiguë/i.test(a)),
  };
  collecte.lignes[i] = l;
  await ecrireCollecte(recalculerEtat(collecte));
  console.log(`✓ ${id} vérifié`);
  process.exit(0);
}

if (toutVerifier) {
  let ok = 0;
  let skip = 0;
  collecte.lignes = collecte.lignes.map((l) => {
    if (l.statut !== "à vérifier") return l;
    if (!complete(l)) {
      skip++;
      return l;
    }
    ok++;
    return { ...l, statut: "vérifié", verifie_le: dateIsoHaiti() };
  });
  await ecrireCollecte(recalculerEtat(collecte));
  console.log(`✓ ${ok} ligne(s) passée(s) en vérifié ; ${skip} incomplète(s) laissée(s) à vérifier.`);
  if (skip) {
    console.log("Complétez-les avec --id … --nom … --prix … --devise … --categorie …");
    process.exit(1);
  }
  process.exit(0);
}

console.error("Précisez --liste, --id, --tout-verifier ou --rejeter.");
process.exit(1);
