// Helpers partagés : lecture/écriture des dossiers data/collecte/<slug>/

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DIR_COLLECTE = join(RACINE, "data", "collecte");

export function cheminRestaurant(slug) {
  return join(DIR_COLLECTE, slug);
}

export async function assurerDossier(slug) {
  const d = cheminRestaurant(slug);
  await mkdir(join(d, "sources"), { recursive: true });
  return d;
}

export async function lireCollecte(slug) {
  const p = join(cheminRestaurant(slug), "collecte.json");
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

export async function ecrireCollecte(collecte) {
  const d = await assurerDossier(collecte.slug);
  const p = join(d, "collecte.json");
  await writeFile(p, JSON.stringify(collecte, null, 2) + "\n", "utf8");
  return p;
}

export async function listerSlugs() {
  try {
    const entries = await readdir(DIR_COLLECTE, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

export function option(args, nom) {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const USER_AGENT = "TetWeekend-CollecteMenus/1.0 (+https://tetweekend.com; contact: menus)";

/** Fetch poli avec user-agent identifié. */
export async function fetchPoli(url, { timeoutMs = 25000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/pdf,image/*,*/*;q=0.8",
        "Accept-Language": "fr,en;q=0.8",
      },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    return { res, buf, texte: buf.toString("utf8") };
  } finally {
    clearTimeout(t);
  }
}
