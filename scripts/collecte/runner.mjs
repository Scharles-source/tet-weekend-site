#!/usr/bin/env node
// Runner local : poll Supabase toutes les 10 s, exécute les CLI de collecte.
// Utilise SUPABASE_SERVICE_ROLE_KEY en local uniquement — JAMAIS sur Vercel / navigateur.
// N'écrit jamais dans restaurants / menu_items / settings.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIR_COLLECTE, cheminRestaurant, sleep } from "./_io.mjs";

const VERSION = "collecte-runner/1.0";
const POLL_MS = 10_000;
const HEARTBEAT_MS = 30_000;
const LOG_FLUSH_MS = 1_500;
const LOG_MAX = 80_000;

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Charge .env.import puis .env.local sans écraser les variables déjà définies. */
function chargerEnvLocal() {
  for (const nom of [".env.import", ".env.local"]) {
    const p = join(RACINE, nom);
    if (!existsSync(p)) continue;
    for (const ligne of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = ligne.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const cle = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[cle] === undefined) process.env[cle] = val;
    }
  }
}
chargerEnvLocal();

function config() {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    console.error(
      "Variables requises (local) : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Exemple : node --env-file=.env.import scripts/collecte/runner.mjs\n" +
        "Ne jamais mettre service_role dans Vercel."
    );
    process.exit(1);
  }
  return { url, cle };
}

async function api(methode, chemin, corps, prefer) {
  const { url, cle } = config();
  const res = await fetch(`${url}/rest/v1/${chemin}`, {
    method: methode,
    headers: {
      apikey: cle,
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
      Prefer: prefer ?? "return=representation",
    },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const texte = await res.text();
  if (!res.ok) throw new Error(`${methode} ${chemin} → ${res.status} ${texte}`);
  return texte ? JSON.parse(texte) : null;
}

async function heartbeat() {
  await api(
    "PATCH",
    "collecte_runner?id=eq.1",
    { dernier_heartbeat: new Date().toISOString(), version: VERSION },
    "return=minimal"
  );
}

async function prendreJob() {
  const jobs = await api(
    "GET",
    "collecte_jobs?statut=eq.en_attente&order=created_at.asc&limit=1",
    undefined,
    "return=representation"
  );
  if (!jobs?.length) return null;
  const job = jobs[0];
  const maj = await api(
    "PATCH",
    `collecte_jobs?id=eq.${job.id}&statut=eq.en_attente`,
    { statut: "en_cours", started_at: new Date().toISOString(), log: "" },
    "return=representation"
  );
  // Un autre runner a peut-être pris le job.
  return maj?.[0] ?? null;
}

async function patchJob(id, champs) {
  await api("PATCH", `collecte_jobs?id=eq.${id}`, champs, "return=minimal");
}

function tronquerLog(s) {
  if (s.length <= LOG_MAX) return s;
  return s.slice(s.length - LOG_MAX);
}

async function etatLocal(slug) {
  if (!slug || slug === "_global") return null;
  try {
    const j = JSON.parse(await readFile(join(cheminRestaurant(slug), "collecte.json"), "utf8"));
    return j.etat ?? null;
  } catch {
    return null;
  }
}

async function syncEtat(slug, jobId) {
  if (!slug || slug === "_global") return;
  const etat = (await etatLocal(slug)) ?? "pas_commence";
  await api(
    "POST",
    "collecte_etat?on_conflict=slug",
    [{ slug, etat, dernier_job_id: jobId, mis_a_jour_le: new Date().toISOString() }],
    "resolution=merge-duplicates,return=minimal"
  );
}

async function fichierOcrDefaut(slug) {
  const dir = join(cheminRestaurant(slug), "sources");
  let fichiers;
  try {
    fichiers = await readdir(dir);
  } catch {
    return null;
  }
  const images = fichiers.filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f)).sort();
  const textes = fichiers.filter((f) => /\.txt$/i.test(f) && !f.endsWith(".ocr.txt")).sort();
  if (images.length) return { image: join(dir, images[images.length - 1]) };
  if (textes.length) return { texte: join(dir, textes[textes.length - 1]) };
  return null;
}

function construireCommande(job) {
  const node = process.execPath;
  const disable = "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON";
  const params = job.params ?? {};
  const slug = job.slug;

  switch (job.action) {
    case "sites":
      return {
        cmd: node,
        args: [disable, "scripts/collecte/sites.mjs", "--slug", slug],
        humain: false,
      };
    case "maps":
      return {
        cmd: node,
        args: [disable, "scripts/collecte/maps.mjs", "--slug", slug],
        humain: true,
      };
    case "ocr": {
      const args = [disable, "scripts/collecte/ocr.mjs", "--slug", slug];
      return { cmd: node, args, humain: false, ocr: true, params };
    }
    case "export":
      return {
        cmd: node,
        args: [
          disable,
          "scripts/collecte/exporter.mjs",
          "--slug",
          slug,
          "--out",
          join(DIR_COLLECTE, `export-${slug}.csv`),
        ],
        humain: false,
      };
    case "etat":
      return {
        cmd: node,
        args: [disable, "scripts/collecte/etat.mjs"],
        humain: false,
      };
    default:
      throw new Error(`Action inconnue : ${job.action}`);
  }
}

async function executer(job) {
  let spec = construireCommande(job);
  if (spec.ocr) {
    let image = spec.params.image;
    let texte = spec.params.texte;
    if (!image && !texte) {
      const auto = await fichierOcrDefaut(job.slug);
      if (auto?.image) image = auto.image;
      else if (auto?.texte) texte = auto.texte;
    }
    if (!image && !texte) {
      throw new Error(
        "OCR : aucun fichier. Placez une image ou un .txt dans data/collecte/<slug>/sources/ " +
          "ou passez params.image / params.texte."
      );
    }
    if (image) spec.args.push("--image", image);
    if (texte) spec.args.push("--texte", texte);
    if (spec.params["source-url"] || spec.params.source_url) {
      spec.args.push("--source-url", spec.params["source-url"] ?? spec.params.source_url);
    }
    if (spec.params["date-photo"] || spec.params.date_photo) {
      spec.args.push("--date-photo", spec.params["date-photo"] ?? spec.params.date_photo);
    }
    if (spec.params.type) spec.args.push("--type", spec.params.type);
  }

  if (spec.humain) {
    await patchJob(job.id, { statut: "en_attente_action_humaine" });
  }

  let log = `[${new Date().toISOString()}] ${VERSION} · ${job.action} ${job.slug}\n$ ${spec.cmd} ${spec.args.join(" ")}\n\n`;
  await patchJob(job.id, { log: tronquerLog(log) });

  let dirty = false;
  const flush = setInterval(() => {
    if (!dirty) return;
    dirty = false;
    patchJob(job.id, { log: tronquerLog(log) }).catch(() => {});
  }, LOG_FLUSH_MS);

  const code = await new Promise((resolve, reject) => {
    const enfant = spawn(spec.cmd, spec.args, {
      cwd: RACINE,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false,
    });
    const append = (buf) => {
      log += buf.toString();
      dirty = true;
      process.stdout.write(buf);
    };
    enfant.stdout.on("data", append);
    enfant.stderr.on("data", append);
    enfant.on("error", reject);
    enfant.on("close", resolve);
  });

  clearInterval(flush);
  log += `\n[${new Date().toISOString()}] exit ${code}\n`;
  await patchJob(job.id, {
    log: tronquerLog(log),
    statut: code === 0 ? "termine" : "erreur",
    finished_at: new Date().toISOString(),
  });
  await syncEtat(job.slug, job.id);
  return code;
}

console.log(`${VERSION} — dossier ${DIR_COLLECTE}`);
console.log("Ctrl+C pour arrêter. Les jobs en_attente restent en file.");

await heartbeat();
let dernierHb = Date.now();

for (;;) {
  try {
    if (Date.now() - dernierHb >= HEARTBEAT_MS) {
      await heartbeat();
      dernierHb = Date.now();
    }
    const job = await prendreJob();
    if (job) {
      console.log(`→ job ${job.id} ${job.action} ${job.slug}`);
      try {
        const code = await executer(job);
        console.log(`✓ ${job.id} exit ${code}`);
      } catch (e) {
        const msg = String(e.message ?? e);
        console.error(`✗ ${job.id} : ${msg}`);
        await patchJob(job.id, {
          statut: "erreur",
          finished_at: new Date().toISOString(),
          log: tronquerLog(`[erreur runner] ${msg}\n`),
        });
        await syncEtat(job.slug, job.id).catch(() => {});
      }
    }
  } catch (e) {
    console.error(`boucle : ${e.message}`);
  }
  await sleep(POLL_MS);
}
