#!/usr/bin/env node
// Bot 1 — Sites des restaurants (pages propres).
// Navigation polie, respect robots.txt, arrêt immédiat au premier anti-bot.
// Aucune écriture Supabase. Pas d'Instagram.

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  DIR_COLLECTE,
  assurerDossier,
  ecrireCollecte,
  fetchPoli,
  lireCollecte,
  option,
  sleep,
  USER_AGENT,
} from "./_io.mjs";

const args = process.argv.slice(2);
const unSeul = option(args, "--slug");
const delaiMs = Number(option(args, "--delai-ms") ?? "2500");
const dryRun = args.includes("--dry-run");

const { dateIsoHaiti, extraireLignes, fusionnerNomPuisPrix } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/extraction.ts")).href
);
const { ajouterSource, collecterVide, remplacerLignesSource } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/etat.ts")).href
);
const { detecterAntiBot, htmlVersLignes, liensMenu, liensPdf, parseRobotsTxt, urlAutorisee } =
  await import(pathToFileURL(join(process.cwd(), "lib/collecte/html.ts")).href);
const { RESTAURANTS, restaurantParSlug } = await import(
  pathToFileURL(join(process.cwd(), "lib/collecte/sources.ts")).href
);

const robotsCache = new Map();
let arretAntiBot = false;

async function robotsPour(origine) {
  if (robotsCache.has(origine)) return robotsCache.get(origine);
  try {
    const { res, texte } = await fetchPoli(new URL("/robots.txt", origine).href, { timeoutMs: 10000 });
    const r = res.ok ? parseRobotsTxt(texte) : { disallow: [] };
    robotsCache.set(origine, r);
    return r;
  } catch {
    const r = { disallow: [] };
    robotsCache.set(origine, r);
    return r;
  }
}

async function telechargerPage(url) {
  const { res, buf, texte } = await fetchPoli(url);
  const anti = detecterAntiBot(texte, res.status);
  if (anti) {
    arretAntiBot = true;
    throw new Error(`ANTI-BOT (${anti}) sur ${url} — arrêt immédiat, aucun contournement.`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return { buf, texte, contentType: res.headers.get("content-type") ?? "" };
}

async function traiterRestaurant(r) {
  const notes = [];
  if (!r.site?.url) {
    notes.push("pas de site connu → collecte manuelle");
    if (r.site_note) notes.push(r.site_note);
    return { notes, pages: 0, articles: 0 };
  }

  const siteUrl = r.site.url.replace(/\/+$/, "");
  const origine = new URL(siteUrl).origin;
  const robots = await robotsPour(origine);
  if (!urlAutorisee(siteUrl, robots.disallow)) {
    notes.push(`robots.txt refuse ${siteUrl} → collecte manuelle`);
    return { notes, pages: 0, articles: 0 };
  }

  console.log(`→ ${r.slug} : ${siteUrl} (${r.site.origine})`);
  if (dryRun) return { notes: ["dry-run"], pages: 0, articles: 0 };

  let collecte = (await lireCollecte(r.slug)) ?? collecterVide(r.slug, r.nom);
  const dir = await assurerDossier(r.slug);

  const accueil = await telechargerPage(siteUrl);
  await sleep(delaiMs);
  const menus = liensMenu(accueil.texte, siteUrl);
  const pdfs = liensPdf(accueil.texte, siteUrl);
  const cibles = [
    ...menus.map((m) => ({ url: m.href, label: m.texte })),
    ...pdfs.map((u) => ({ url: u, label: "pdf" })),
  ];
  // Si aucun lien menu : tenter d'extraire la page d'accueil elle-même
  if (cibles.length === 0) cibles.push({ url: siteUrl, label: "accueil" });

  let pages = 0;
  let articles = 0;
  for (const c of cibles.slice(0, 5)) {
    if (arretAntiBot) break;
    if (!urlAutorisee(c.url, robots.disallow)) {
      notes.push(`robots.txt refuse ${c.url}`);
      continue;
    }
    await sleep(delaiMs);
    let page;
    try {
      page = await telechargerPage(c.url);
    } catch (e) {
      if (arretAntiBot) throw e;
      notes.push(String(e.message));
      continue;
    }

    const id = `site-${Date.now().toString(36)}-${pages}`;
    const estPdf = /\.pdf(\?|#|$)/i.test(c.url) || /pdf/i.test(page.contentType);
    if (estPdf) {
      const fichier = `sources/${id}.pdf`;
      await writeFile(join(dir, fichier), page.buf);
      collecte = ajouterSource(collecte, {
        id,
        type: "site-pdf",
        fichier,
        url: c.url,
        recupere_le: dateIsoHaiti(),
        date_photo: null,
        date_photo_texte: null,
        a_reverifier: false,
        ocr_fait_le: null,
        note: "PDF téléchargé — lancer OCR (conversion image) ou saisie manuelle",
      });
      notes.push(`PDF enregistré : ${fichier} (OCR séparé)`);
      pages++;
      continue;
    }

    const fichier = `sources/${id}.html`;
    await writeFile(join(dir, fichier), page.texte, "utf8");
    const lignesTexte = htmlVersLignes(page.texte);
    const lignes = fusionnerNomPuisPrix(
      extraireLignes(lignesTexte, {
        sourceId: id,
        sourceUrl: c.url,
        dateReleve: dateIsoHaiti(),
      })
    );
    collecte = ajouterSource(collecte, {
      id,
      type: "site-page",
      fichier,
      url: c.url,
      recupere_le: dateIsoHaiti(),
      date_photo: null,
      date_photo_texte: null,
      a_reverifier: false,
      ocr_fait_le: dateIsoHaiti(),
      note: c.label === "accueil" && menus.length === 0 ? "Aucun lien menu détecté — page d'accueil analysée" : null,
    });
    collecte = remplacerLignesSource(collecte, id, lignes);
    pages++;
    articles += lignes.length;
  }

  if (pages === 0 || articles === 0) {
    notes.push("pas de menu sur le site → collecte manuelle");
  }
  collecte = {
    ...collecte,
    collecte_manuelle: [...new Set([...(collecte.collecte_manuelle ?? []), ...notes.filter((n) => /manuelle|refuse|ANTI/.test(n))])],
  };
  await ecrireCollecte(collecte);
  return { notes, pages, articles };
}

const liste = unSeul
  ? [restaurantParSlug(unSeul)].filter(Boolean)
  : RESTAURANTS;

if (unSeul && liste.length === 0) {
  console.error(`Slug inconnu : ${unSeul}`);
  process.exit(1);
}

console.log(`Bot sites — ${liste.length} restaurant(s), délai ${delaiMs} ms, UA : ${USER_AGENT}`);
console.log(`Dossier : ${DIR_COLLECTE}`);

for (const r of liste) {
  if (arretAntiBot) {
    const c = (await lireCollecte(r.slug)) ?? collecterVide(r.slug, r.nom);
    c.collecte_manuelle = [
      ...new Set([...(c.collecte_manuelle ?? []), "bascule manuelle : anti-bot détecté précédemment"]),
    ];
    if (!dryRun) await ecrireCollecte(c);
    console.warn(`⏭ ${r.slug} → collecte manuelle (anti-bot)`);
    continue;
  }
  try {
    const { notes, pages, articles } = await traiterRestaurant(r);
    console.log(
      `✓ ${r.slug} : ${pages} page(s), ${articles} article(s) proposés` +
        (notes.length ? ` — ${notes.join(" ; ")}` : "")
    );
  } catch (e) {
    console.error(`✗ ${r.slug} : ${e.message}`);
    if (arretAntiBot) {
      console.error("Arrêt du bot. Les restaurants restants passent en collecte manuelle.");
    }
  }
  await sleep(delaiMs);
}

console.log(arretAntiBot ? "Terminé avec arrêt anti-bot." : "Terminé.");
