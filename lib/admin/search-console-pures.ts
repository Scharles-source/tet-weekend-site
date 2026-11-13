/** Fonctions pures du rapport SEO (Google Search Console) : aucun accès réseau, testables. */

export type PeriodeSeo = 7 | 28 | 90;

export const PERIODES_SEO: { jours: PeriodeSeo; label: string }[] = [
  { jours: 7, label: "7 jours" },
  { jours: 28, label: "28 jours" },
  { jours: 90, label: "3 mois" },
];

export function periodeSeoValide(valeur: string | undefined): PeriodeSeo {
  if (valeur === "7") return 7;
  if (valeur === "90") return 90;
  return 28;
}

/** Une ligne du rapport : une requête, une page, un pays ou un appareil. */
export interface LigneSeo {
  nom: string;
  clics: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface JourSeo {
  date: string;
  libelle: string;
  clics: number;
  impressions: number;
}

export interface DonneesSeo {
  periode: PeriodeSeo;
  debut: string;
  fin: string;
  clics: number;
  impressions: number;
  ctr: number;
  position: number;
  serie: JourSeo[];
  requetes: LigneSeo[];
  pages: LigneSeo[];
  pays: LigneSeo[];
  appareils: LigneSeo[];
}

export type RapportSeo =
  | { statut: "ok"; donnees: DonneesSeo }
  | { statut: "non_configure" }
  | { statut: "erreur"; message: string };

export interface MesureSeo {
  clics: number;
  impressions: number;
  position: number;
}

/** Totaux d'une série de mesures. La position moyenne est pondérée par les impressions, comme dans Search Console. */
export function totauxSeo(lignes: MesureSeo[]): { clics: number; impressions: number; ctr: number; position: number } {
  const clics = lignes.reduce((s, l) => s + (l.clics || 0), 0);
  const impressions = lignes.reduce((s, l) => s + (l.impressions || 0), 0);
  const position = impressions > 0 ? lignes.reduce((s, l) => s + (l.position || 0) * (l.impressions || 0), 0) / impressions : 0;
  return { clics, impressions, ctr: impressions > 0 ? clics / impressions : 0, position };
}

/** Série journalière complète : Search Console omet les jours sans données, on les remet à zéro pour le graphique. */
export function construireSerie(debut: string, fin: string, parJour: Map<string, { clics: number; impressions: number }>): JourSeo[] {
  const serie: JourSeo[] = [];
  const courant = new Date(`${debut}T12:00:00Z`);
  const limite = new Date(`${fin}T12:00:00Z`);
  while (courant <= limite) {
    const date = courant.toISOString().slice(0, 10);
    const valeurs = parJour.get(date) ?? { clics: 0, impressions: 0 };
    serie.push({ date, libelle: libelleDateCourte(date), clics: valeurs.clics, impressions: valeurs.impressions });
    courant.setUTCDate(courant.getUTCDate() + 1);
  }
  return serie;
}

export function libelleDateCourte(dateIso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })
      .format(new Date(`${dateIso}T12:00:00Z`))
      .replace(".", "");
  } catch {
    return dateIso;
  }
}

export function libelleDateLongue(dateIso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateIso}T12:00:00Z`));
  } catch {
    return dateIso;
  }
}

/** Chemin affichable d'une page Search Console (l'URL complète reste en infobulle côté interface). */
export function cheminPage(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return url;
  }
}

const PAYS_ALPHA3: Record<string, string> = {
  HTI: "Haïti",
  USA: "États-Unis",
  CAN: "Canada",
  FRA: "France",
  DOM: "République dominicaine",
  GLP: "Guadeloupe",
  MTQ: "Martinique",
  GUF: "Guyane",
  CUB: "Cuba",
  JAM: "Jamaïque",
  BHS: "Bahamas",
  TTO: "Trinité-et-Tobago",
  BRB: "Barbade",
  MEX: "Mexique",
  PAN: "Panama",
  CRI: "Costa Rica",
  COL: "Colombie",
  VEN: "Venezuela",
  PER: "Pérou",
  BRA: "Brésil",
  ARG: "Argentine",
  CHL: "Chili",
  GBR: "Royaume-Uni",
  IRL: "Irlande",
  ESP: "Espagne",
  PRT: "Portugal",
  ITA: "Italie",
  DEU: "Allemagne",
  BEL: "Belgique",
  NLD: "Pays-Bas",
  CHE: "Suisse",
  AUT: "Autriche",
  DNK: "Danemark",
  NOR: "Norvège",
  SWE: "Suède",
  FIN: "Finlande",
  POL: "Pologne",
  GRC: "Grèce",
  TUR: "Turquie",
  ISR: "Israël",
  ARE: "Émirats arabes unis",
  JPN: "Japon",
  AUS: "Australie",
  NZL: "Nouvelle-Zélande",
  SEN: "Sénégal",
  CIV: "Côte d'Ivoire",
  CMR: "Cameroun",
  COD: "RD Congo",
  MDG: "Madagascar",
  BEN: "Bénin",
  MUS: "Maurice",
  REU: "La Réunion",
};

/** Search Console renvoie les pays en code alpha-3 (HTI, USA…) : on les traduit pour l'affichage. */
export function libellePaysSeo(code: string): string {
  return PAYS_ALPHA3[code.toUpperCase()] ?? code.toUpperCase();
}

const APPAREILS: Record<string, string> = {
  DESKTOP: "Ordinateur",
  MOBILE: "Téléphone",
  TABLET: "Tablette",
};

export function libelleAppareilSeo(code: string): string {
  return APPAREILS[code.toUpperCase()] ?? code;
}

export function formaterCtr(ctr: number): string {
  return `${(ctr * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function formaterPosition(position: number): string {
  return position > 0 ? position.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "–";
}
