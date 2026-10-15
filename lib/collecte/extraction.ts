// Propose des lignes de menu à partir de texte OCR ou de HTML. Ne décide jamais :
// une ligne ambiguë reste « à vérifier », jamais inventée.

import { CATEGORIES_EXTRACTION, type Devise, type Ligne, type LigneTexte } from "./types.ts";

const DEVISE_HTG = /\b(?:HTG|gourdes?|gdes?|gde)\b/i;
const DEVISE_USD = /(?:\$\s*US\b|\bUSD\b|\bUS\$\b|\$)/i;
const PRIX =
  /(?:(?:HTG|USD|US\$|\$\s*US|\$|gourdes?|gdes?)\s*)?(\d{1,3}(?:[\s\u00a0\u202f.]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*(?:HTG|USD|US\$|\$\s*US|\$|gourdes?|gdes?))?/i;

const MOTS_SECTION = [
  [/entr[eé]es?|appetizers?|starters?/i, "Entrées"],
  [/plats?|mains?|main\s*courses?|grillades?/i, "Plats"],
  [/desserts?|sweets?/i, "Desserts"],
  [/boissons?|drinks?|jus|softs?/i, "Boissons"],
  [/cocktails?|bar\b|vins?/i, "Cocktails"],
] as const;

export function dateIsoHaiti(maintenant = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Port-au-Prince" }).format(maintenant);
}

/** Parse une date de photo Maps (« Nov 2020 », « 15 oct. 2026 ») → AAAA-MM-JJ (1er du mois si besoin). */
export function parserDatePhoto(texte: string | null | undefined): { iso: string | null; brut: string | null } {
  if (!texte) return { iso: null, brut: null };
  const t = texte.trim();
  if (!t) return { iso: null, brut: null };
  const mois: Record<string, string> = {
    jan: "01", january: "01", janvier: "01",
    feb: "02", february: "02", fevrier: "02", février: "02",
    mar: "03", march: "03", mars: "03",
    apr: "04", april: "04", avril: "04",
    may: "05", mai: "05",
    jun: "06", june: "06", juin: "06",
    jul: "07", july: "07", juillet: "07",
    aug: "08", august: "08", aout: "08", août: "08",
    sep: "09", sept: "09", september: "09", septembre: "09",
    oct: "10", october: "10", octobre: "10",
    nov: "11", november: "11", novembre: "11",
    dec: "12", december: "12", decembre: "12", décembre: "12",
  };
  let m = t.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3] ?? "01"}`, brut: t };
  m = t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (m) return { iso: `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`, brut: t };
  m = t.match(/^([A-Za-zÀ-ÿ.]+)\s+(\d{4})$/);
  if (m) {
    const cle = m[1].toLowerCase().replace(/\./g, "");
    const mm = mois[cle] ?? mois[cle.slice(0, 3)];
    if (mm) return { iso: `${m[2]}-${mm}-01`, brut: t };
  }
  m = t.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\.?\s+(\d{4})$/);
  if (m) {
    const cle = m[2].toLowerCase().replace(/\./g, "");
    const mm = mois[cle] ?? mois[cle.slice(0, 3)];
    if (mm) return { iso: `${m[3]}-${mm}-${m[1].padStart(2, "0")}`, brut: t };
  }
  return { iso: null, brut: t };
}

/** Photo de carte de plus de 12 mois → à revérifier. */
export function aReverifier(datePhotoIso: string | null, maintenant = new Date()): boolean {
  if (!datePhotoIso) return true;
  const [y, m, d] = datePhotoIso.split("-").map(Number);
  const photo = new Date(Date.UTC(y, m - 1, d));
  const limite = new Date(maintenant);
  limite.setMonth(limite.getMonth() - 12);
  return photo.getTime() < limite.getTime();
}

export function detecterDevise(texte: string): Devise | null {
  const htg = DEVISE_HTG.test(texte);
  const usd = DEVISE_USD.test(texte);
  if (htg && !usd) return "HTG";
  if (usd && !htg) return "USD";
  return null;
}

export function parserPrix(texte: string): { prix: number | null; devise: Devise | null; reste: string } {
  const m = texte.match(PRIX);
  if (!m || m.index === undefined) return { prix: null, devise: null, reste: texte.trim() };
  const brut = m[1].replace(/[\s\u00a0\u202f]/g, "");
  let normalise = brut;
  if (/^\d{1,3}\.\d{3}$/.test(brut)) normalise = brut.replace(".", "");
  else if (/^\d+,\d{1,2}$/.test(brut)) normalise = brut.replace(",", ".");
  else if (/^\d+\.\d{3,}$/.test(brut)) normalise = brut.replace(/\./g, "");
  const prix = Number(normalise);
  if (!Number.isFinite(prix) || prix < 0) return { prix: null, devise: null, reste: texte.trim() };
  const contexte = texte.slice(Math.max(0, m.index - 8), m.index + m[0].length + 8);
  const devise = detecterDevise(contexte) ?? detecterDevise(texte);
  const reste = (texte.slice(0, m.index) + texte.slice(m.index + m[0].length))
    .replace(/[\s·•\-–—|]+/g, " ")
    .trim();
  return { prix, devise, reste };
}

export function detecterCategorie(texte: string): { categorie: string; estSection: boolean } {
  const t = texte.trim();
  if (!t) return { categorie: "Autre", estSection: false };
  const sansPrix = !PRIX.test(t);
  for (const [re, cat] of MOTS_SECTION) {
    if (re.test(t) && (sansPrix || t.length < 40)) {
      return { categorie: cat, estSection: sansPrix && t.length < 40 };
    }
  }
  return { categorie: "Autre", estSection: false };
}

function idLigne(source: string, i: number): string {
  return `${source}-l${String(i + 1).padStart(3, "0")}`;
}

export interface OptionsExtraction {
  sourceId: string;
  sourceUrl?: string | null;
  dateReleve?: string | null;
  aReverifier?: boolean;
  maintenant?: Date;
}

/** Transforme des lignes de texte en propositions. Ne crée jamais de prix inventé. */
export function extraireLignes(lignes: LigneTexte[], options: OptionsExtraction): Ligne[] {
  const date = options.dateReleve ?? dateIsoHaiti(options.maintenant);
  let sectionCourante: string | null = null;
  let categorieCourante = "Autre";
  const sortie: Ligne[] = [];
  let i = 0;

  for (const l of lignes) {
    const texte = l.texte.replace(/\s+/g, " ").trim();
    if (!texte || texte.length < 2) continue;

    const section = detecterCategorie(texte);
    if (section.estSection) {
      sectionCourante = texte;
      categorieCourante = section.categorie;
      continue;
    }

    const { prix, devise, reste } = parserPrix(texte);
    const avertissements: string[] = [];
    if (options.aReverifier) avertissements.push("Source de plus de 12 mois — à revérifier");
    if (prix === null) avertissements.push("Prix illisible ou absent");
    if (prix !== null && devise === null) avertissements.push("Devise ambiguë ou absente");
    if (!reste) avertissements.push("Nom du plat illisible");
    if (!reste && prix === null) continue;

    const confianceOcr = l.confiance === null ? 0.85 : Math.max(0, Math.min(1, l.confiance / 100));
    let confiance = confianceOcr;
    if (prix === null || !reste) confiance *= 0.4;
    else if (devise === null) confiance *= 0.7;
    if (options.aReverifier) confiance *= 0.6;

    const catDetectee = detecterCategorie(reste);
    const categorie =
      catDetectee.categorie !== "Autre" && !catDetectee.estSection
        ? catDetectee.categorie
        : categorieCourante;

    sortie.push({
      id: idLigne(options.sourceId, i++),
      source: options.sourceId,
      nom: reste || "(nom à lire)",
      description: null,
      prix,
      devise,
      categorie: CATEGORIES_EXTRACTION.includes(categorie as never) ? categorie : "Autre",
      section: sectionCourante,
      disponible: true,
      confiance: Math.round(confiance * 100) / 100,
      texte_brut: texte,
      avertissements,
      date_releve: date,
      valide_du: null,
      valide_au: null,
      source_url: options.sourceUrl ?? null,
      statut: "à vérifier",
      verifie_le: null,
    });
  }
  return sortie;
}

/** Relie deux lignes OCR (nom seul + prix seul) quand elles se suivent. */
export function fusionnerNomPuisPrix(lignes: Ligne[]): Ligne[] {
  const sortie: Ligne[] = [];
  for (let i = 0; i < lignes.length; i++) {
    const a = lignes[i];
    const b = lignes[i + 1];
    if (
      b &&
      a.prix === null &&
      a.nom &&
      a.nom !== "(nom à lire)" &&
      b.prix !== null &&
      (b.nom === "(nom à lire)" || !b.nom || b.nom.length < 3)
    ) {
      sortie.push({
        ...a,
        prix: b.prix,
        devise: b.devise ?? a.devise,
        confiance: Math.min(a.confiance, b.confiance),
        texte_brut: `${a.texte_brut} | ${b.texte_brut}`,
        avertissements: [
          ...new Set([
            ...a.avertissements.filter((x) => x !== "Prix illisible ou absent"),
            ...b.avertissements.filter((x) => x !== "Nom du plat illisible"),
            "Nom et prix réunis depuis deux lignes OCR",
          ]),
        ],
      });
      i++;
    } else {
      sortie.push(a);
    }
  }
  return sortie;
}
