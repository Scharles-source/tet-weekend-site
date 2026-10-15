#!/usr/bin/env node
// Import des fiches restaurants et des menus (CSV ou JSON) dans Supabase — format documenté dans le README.
//
//   node --env-file=.env.import scripts/import-menus.mjs \
//     [--restaurants data/exemple-restaurants.csv] [--menu data/exemple-menu.csv] [--remplacer-menu] [--dry-run]
//
// Variables : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.
// La clé service_role ne doit JAMAIS être exposée côté client ni commitée.

import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const CATEGORIES = ["Entrées", "Plats", "Desserts", "Boissons", "Cocktails"];
const DEVISES = ["HTG", "USD"];
const ZONES = ["Pétion-Ville", "Delmas"];
const STATUTS = ["brouillon", "publie", "retire"];

const COLONNES_RESTAURANT = {
  slug: "slug", nom: "texte", zones: "zones", quartier: "texte", adresse: "texte", point_repere: "texte",
  latitude: "nombre", longitude: "nombre", whatsapp: "texte", telephone: "texte", instagram: "instagram",
  horaires: "texte", jours_fermeture: "texte", heure_limite_cuisine: "texte", type_cuisine: "texte", ambiance: "texte",
  devise: "devise", taux_htg_usd: "nombre", taxe_pct: "nombre", taxe_incluse: "booleen", service_pct: "nombre",
  service_inclus: "booleen", parking_garde: "booleen", groupe_electrogene: "booleen", climatisation: "booleen",
  terrasse: "booleen", modes_paiement: "liste", photo_carte_url: "texte", date_dernier_releve: "date",
  releve_par: "texte", statut: "statut", retrait_demande_le: "date", motif_retrait: "texte",
};

const COLONNES_MENU = ["restaurant_slug", "categorie", "nom", "description", "prix", "devise", "disponible", "ordre"];

// ───────────── Arguments ─────────────
const args = process.argv.slice(2);
const option = (nom) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
};
const fichierRestaurants = option("--restaurants");
const fichierMenu = option("--menu");
const remplacerMenu = args.includes("--remplacer-menu");
const dryRun = args.includes("--dry-run");

if (!fichierRestaurants && !fichierMenu) {
  console.error("Usage : node scripts/import-menus.mjs [--restaurants fichier.csv|json] [--menu fichier.csv|json] [--remplacer-menu] [--dry-run]");
  process.exit(1);
}

// ───────────── Lecture CSV / JSON ─────────────
function parserCsv(texte) {
  texte = texte.replace(/^\uFEFF/, "");
  const premiereLigne = texte.split(/\r?\n/, 1)[0];
  const sep = (premiereLigne.match(/;/g) ?? []).length > (premiereLigne.match(/,/g) ?? []).length ? ";" : ",";
  const lignes = [];
  let ligne = [], champ = "", guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === sep) { ligne.push(champ); champ = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      ligne.push(champ); champ = "";
      if (ligne.some((v) => v.trim() !== "")) lignes.push(ligne);
      ligne = [];
    } else champ += c;
  }
  ligne.push(champ);
  if (ligne.some((v) => v.trim() !== "")) lignes.push(ligne);
  const [entete, ...donnees] = lignes;
  const cles = entete.map((c) => c.trim());
  return donnees.map((l) => Object.fromEntries(cles.map((c, i) => [c, l[i] ?? ""])));
}

async function lireFichier(chemin) {
  const texte = await readFile(chemin, "utf8");
  if (extname(chemin).toLowerCase() === ".json") {
    const json = JSON.parse(texte);
    if (!Array.isArray(json)) throw new Error(`${chemin} : un tableau d'objets est attendu.`);
    return json;
  }
  return parserCsv(texte);
}

// ───────────── Conversion des valeurs ─────────────
const VIDE = Symbol("vide");

function brut(v) {
  if (v === null || v === undefined) return VIDE;
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (t === "") return VIDE;
  if (t.toUpperCase() === "NULL") return null;
  return t;
}

function nombre(v) {
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`nombre invalide « ${v} »`);
  return n;
}

function booleen(v) {
  if (typeof v === "boolean") return v;
  const t = String(v).toLowerCase();
  if (["oui", "o", "true", "vrai", "1", "yes"].includes(t)) return true;
  if (["non", "n", "false", "faux", "0", "no"].includes(t)) return false;
  throw new Error(`booléen invalide « ${v} » (oui / non)`);
}

function date(v) {
  const t = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  throw new Error(`date invalide « ${v} » (AAAA-MM-JJ ou JJ/MM/AAAA)`);
}

const liste = (v) => (Array.isArray(v) ? v : String(v).split("|")).map((s) => String(s).trim()).filter(Boolean);

function convertir(type, v) {
  switch (type) {
    case "texte": return String(v);
    case "nombre": return nombre(v);
    case "booleen": return booleen(v);
    case "date": return date(v);
    case "liste": return liste(v);
    case "instagram": return String(v).replace(/^@/, "");
    case "slug": {
      const s = String(v);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) throw new Error(`slug invalide « ${s} » (minuscules, chiffres, tirets)`);
      return s;
    }
    case "zones": {
      const z = liste(v);
      if (z.length === 0 || z.some((x) => !ZONES.includes(x))) throw new Error(`zones invalides « ${v} » (${ZONES.join(" | ")})`);
      return z;
    }
    case "devise": {
      const d = String(v).toUpperCase();
      if (!DEVISES.includes(d)) throw new Error(`devise invalide « ${v} » (HTG ou USD)`);
      return d;
    }
    case "statut": {
      if (!STATUTS.includes(String(v))) throw new Error(`statut invalide « ${v} » (${STATUTS.join(", ")})`);
      return String(v);
    }
    default: throw new Error(`type inconnu ${type}`);
  }
}

function lireRestaurant(ligne, n) {
  const sortie = {};
  for (const [cle, valeur] of Object.entries(ligne)) {
    const type = COLONNES_RESTAURANT[cle];
    if (!type) throw new Error(`ligne ${n} : colonne inconnue « ${cle} »`);
    const b = brut(valeur);
    if (b === VIDE) continue;
    try {
      sortie[cle] = b === null ? null : convertir(type, b);
    } catch (e) {
      throw new Error(`ligne ${n}, colonne ${cle} : ${e.message}`);
    }
  }
  if (!sortie.slug) throw new Error(`ligne ${n} : slug obligatoire`);
  if (sortie.statut === "retire" && !sortie.retrait_demande_le) {
    sortie.retrait_demande_le = new Date().toISOString().slice(0, 10);
  }
  return sortie;
}

function lireArticle(ligne, n) {
  for (const cle of Object.keys(ligne)) {
    if (!COLONNES_MENU.includes(cle)) throw new Error(`ligne ${n} : colonne inconnue « ${cle} »`);
  }
  const champ = (cle) => {
    const b = brut(ligne[cle]);
    return b === VIDE ? null : b;
  };
  const slug = champ("restaurant_slug");
  const categorie = champ("categorie");
  const nom = champ("nom");
  const prix = champ("prix");
  const devise = champ("devise");
  if (!slug || !nom || prix === null || !devise || !categorie) {
    throw new Error(`ligne ${n} : restaurant_slug, categorie, nom, prix et devise sont obligatoires`);
  }
  if (!CATEGORIES.includes(categorie)) throw new Error(`ligne ${n} : catégorie « ${categorie} » invalide (${CATEGORIES.join(", ")})`);
  try {
    const p = nombre(prix);
    if (p < 0) throw new Error("prix négatif");
    const disponible = champ("disponible");
    const ordre = champ("ordre");
    return {
      slug,
      article: {
        categorie,
        nom: String(nom),
        description: champ("description"),
        prix: p,
        devise: convertir("devise", devise),
        disponible: disponible === null ? true : booleen(disponible),
        ordre: ordre === null ? n : Math.trunc(nombre(ordre)),
      },
    };
  } catch (e) {
    throw new Error(`ligne ${n} : ${e.message}`);
  }
}

// ───────────── Supabase REST ─────────────
function configuration() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    console.error("Variables manquantes : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  return { url: url.replace(/\/+$/, ""), cle };
}

async function api(methode, chemin, corps, prefer) {
  const { url, cle } = configuration();
  const res = await fetch(`${url}/rest/v1/${chemin}`, {
    method: methode,
    headers: {
      apikey: cle,
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const texte = await res.text();
  if (!res.ok) throw new Error(`${methode} ${chemin} → ${res.status} ${texte}`);
  return texte ? JSON.parse(texte) : null;
}

// ───────────── Programme ─────────────
const restaurants = fichierRestaurants
  ? (await lireFichier(fichierRestaurants)).map((l, i) => lireRestaurant(l, i + 2))
  : [];
const articles = fichierMenu ? (await lireFichier(fichierMenu)).map((l, i) => lireArticle(l, i + 2)) : [];

const parRestaurant = new Map();
for (const { slug, article } of articles) {
  if (!parRestaurant.has(slug)) parRestaurant.set(slug, []);
  const menu = parRestaurant.get(slug);
  if (menu.some((a) => a.categorie === article.categorie && a.nom === article.nom)) {
    throw new Error(`Doublon dans le menu de ${slug} : ${article.categorie} / ${article.nom}`);
  }
  menu.push(article);
}

console.log(`Fichier valide : ${restaurants.length} fiche(s) restaurant, ${articles.length} article(s) pour ${parRestaurant.size} restaurant(s).`);
if (dryRun) {
  console.log("--dry-run : aucune écriture.");
  process.exit(0);
}

for (const r of restaurants) {
  await api("POST", "restaurants?on_conflict=slug", [r], "resolution=merge-duplicates,return=minimal");
  console.log(`✓ fiche ${r.slug}${r.statut ? ` (statut : ${r.statut})` : ""}`);
}

if (parRestaurant.size > 0) {
  const slugs = [...parRestaurant.keys()];
  const trouves = await api("GET", `restaurants?select=id,slug&slug=in.(${slugs.map(encodeURIComponent).join(",")})`);
  const ids = new Map(trouves.map((r) => [r.slug, r.id]));
  const inconnus = slugs.filter((s) => !ids.has(s));
  if (inconnus.length > 0) throw new Error(`Restaurant(s) inconnu(s) : ${inconnus.join(", ")} — importez d'abord leur fiche.`);

  for (const [slug, menu] of parRestaurant) {
    const id = ids.get(slug);
    if (remplacerMenu) await api("DELETE", `menu_items?restaurant_id=eq.${id}`, undefined, "return=minimal");
    await api(
      "POST",
      "menu_items?on_conflict=restaurant_id,categorie,nom",
      menu.map((a) => ({ ...a, restaurant_id: id })),
      "resolution=merge-duplicates,return=minimal"
    );
    console.log(`✓ menu ${slug} : ${menu.length} article(s)${remplacerMenu ? " (menu remplacé)" : ""}`);
  }
}

// Règle de publication : publié ET au moins un article. On signale les fiches publiées encore vides.
const publies = await api("GET", "restaurants?select=slug,menu_items(count)&statut=eq.publie");
const vides = publies.filter((r) => (r.menu_items?.[0]?.count ?? 0) === 0).map((r) => r.slug);
if (vides.length > 0) {
  console.warn(`⚠ Publiés sans menu (invisibles dans le répertoire) : ${vides.join(", ")}`);
}
console.log("Import terminé.");
