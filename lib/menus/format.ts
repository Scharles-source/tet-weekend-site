import { convertirEnCentimes } from "./budget.ts";
import { CATEGORIES, CATEGORIES_DATEES, type Categorie, type Devise, type MenuItem, type Restaurant } from "./types.ts";

const ESPACE_INSECABLE = /[\u202f\u00a0]/g;

/** HTG : centimes affichés seulement s'ils existent (4 428 / 4 427,50). USD : toujours au cent. */
export function formatMontant(montant: number, devise: Devise): string {
  const centimes = Math.round(montant * 100);
  const entier = centimes % 100 === 0;
  const decimales = devise === "USD" ? 2 : entier ? 0 : 2;
  const nombre = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
    .format(centimes / 100)
    .replace(ESPACE_INSECABLE, " ");
  return devise === "USD" ? `${nombre} $ US` : `${nombre} HTG`;
}

export function formatTaux(taux: number): string {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(taux).replace(ESPACE_INSECABLE, " ");
  return `1 $ US = ${n} HTG`;
}

export function formatDate(iso: string): string {
  const [a, m, j] = iso.slice(0, 10).split("-");
  return `${j}/${m}/${a}`;
}

export const SEUIL_FRAICHEUR_JOURS = 30;

export interface Fraicheur {
  verifiee: boolean;
  libelle: string;
  /** Toujours présente si la date du relevé est connue. */
  dateReleve: string | null;
}

/** Date du jour (AAAA-MM-JJ) à l'heure d'Haïti, quel que soit le fuseau du serveur. */
export function dateIsoHaiti(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port-au-Prince",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(maintenant);
}

function joursEntre(debutIso: string, finIso: string): number {
  const utc = (iso: string) => {
    const [a, m, j] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(a, m - 1, j);
  };
  return Math.round((utc(finIso) - utc(debutIso)) / 86_400_000);
}

/** Jours calendaires écoulés depuis le relevé (jour d'Haïti). */
export function joursDepuis(isoDate: string, maintenant: Date = new Date()): number {
  return Math.max(0, joursEntre(isoDate, dateIsoHaiti(maintenant)));
}

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « 15 oct. 2026 » */
export function formatDateCourte(iso: string): string {
  const [a, m, j] = iso.slice(0, 10).split("-").map(Number);
  return `${j} ${MOIS[m - 1]} ${a}`;
}

/** « 12–18 oct. 2026 », « 30 sept. – 7 oct. 2026 », « 15 oct. 2026 ». */
export function formatPeriode(du: string, au: string): string {
  if (du === au) return formatDateCourte(du);
  const [a1, m1, j1] = du.split("-").map(Number);
  const [a2, m2] = au.split("-").map(Number);
  if (a1 === a2 && m1 === m2) return `${j1}–${formatDateCourte(au)}`;
  if (a1 === a2) return `${j1} ${MOIS[m1 - 1]} – ${formatDateCourte(au)}`;
  return `${formatDateCourte(du)} – ${formatDateCourte(au)}`;
}

export function fraicheur(dateReleve: string | null, maintenant: Date = new Date()): Fraicheur {
  if (!dateReleve) {
    return { verifiee: false, libelle: "Prix en cours de vérification · date du relevé non renseignée", dateReleve: null };
  }
  const jours = joursDepuis(dateReleve, maintenant);
  const date = formatDate(dateReleve);
  if (jours > SEUIL_FRAICHEUR_JOURS) {
    return { verifiee: false, libelle: `Prix en cours de vérification · dernier relevé le ${date}`, dateReleve: date };
  }
  const quand = jours === 0 ? "aujourd'hui" : `il y a ${jours} jour${jours > 1 ? "s" : ""}`;
  return { verifiee: true, libelle: `Carte vérifiée ${quand} · relevé du ${date}`, dateReleve: date };
}

export interface Fourchette {
  min: number;
  max: number;
  devise: Devise;
}

const CATEGORIES_REPAS: Categorie[] = ["Carte", ...CATEGORIES_DATEES];

/**
 * Min–max des plats dans la devise du restaurant : catégorie Plats si elle existe, sinon Carte + menus datés
 * (jamais les promotions, souvent des lots). Null si aucun plat convertible.
 */
export function fourchettePlats(restaurant: Restaurant, items: MenuItem[], tauxGlobal: number | null): Fourchette | null {
  const platsCarte = items.filter((i) => i.categorie === "Plats");
  const plats = platsCarte.length > 0 ? platsCarte : items.filter((i) => CATEGORIES_REPAS.includes(i.categorie));
  const disponibles = plats.filter((i) => i.disponible);
  const base = disponibles.length > 0 ? disponibles : plats;
  if (base.length === 0) return null;
  const devise: Devise = restaurant.devise ?? base[0].devise;
  const taux = restaurant.taux_htg_usd ?? tauxGlobal;
  const prix = base
    .map((i) => convertirEnCentimes(i.prix, i.devise, devise, taux))
    .filter((c): c is number => c !== null);
  if (prix.length === 0) return null;
  return { min: Math.min(...prix) / 100, max: Math.max(...prix) / 100, devise };
}

export interface EtatArticle {
  /** « Valable 12–18 oct. 2026 » ou « Relevé le 15 oct. 2026 » ; null si aucune date. */
  date: string | null;
  /** Relevé de plus de 30 jours, ou marqué à vérifier : le prix reste affiché avec « prix à confirmer ». */
  aConfirmer: boolean;
}

export function etatArticle(item: MenuItem, maintenant: Date = new Date()): EtatArticle {
  const du = item.valide_du ?? item.valide_au;
  const au = item.valide_au ?? item.valide_du;
  const date =
    du && au
      ? `Valable ${formatPeriode(du, au)}`
      : item.date_releve
        ? `Relevé le ${formatDateCourte(item.date_releve)}`
        : null;
  const ancien = item.date_releve !== null && joursDepuis(item.date_releve, maintenant) > SEUIL_FRAICHEUR_JOURS;
  return { date, aConfirmer: item.a_verifier || ancien };
}

/** Période commune à tous les articles d'une catégorie (pour l'afficher dans le titre), sinon null. */
export function periodeCommune(items: MenuItem[]): string | null {
  const periodes = new Set(
    items.map((i) => (i.valide_du && i.valide_au ? formatPeriode(i.valide_du, i.valide_au) : null))
  );
  if (periodes.size !== 1) return null;
  return [...periodes][0];
}

/**
 * Article d'un menu daté (menu du jour, de la semaine, spécial) valable aujourd'hui :
 * période annoncée couvrant aujourd'hui ; à défaut, menu du jour relevé aujourd'hui,
 * ou spécial / menu de la semaine relevé il y a 30 jours au plus. Jamais un article « à vérifier ».
 */
export function estEnCours(item: MenuItem, maintenant: Date = new Date()): boolean {
  if (!CATEGORIES_DATEES.includes(item.categorie) || !item.disponible || item.a_verifier) return false;
  const aujourdhui = dateIsoHaiti(maintenant);
  if (item.valide_du || item.valide_au) {
    return (!item.valide_du || item.valide_du <= aujourdhui) && (!item.valide_au || aujourdhui <= item.valide_au);
  }
  if (!item.date_releve) return false;
  if (item.categorie === "Menu du jour") return item.date_releve === aujourdhui;
  return joursDepuis(item.date_releve, maintenant) <= SEUIL_FRAICHEUR_JOURS;
}

/** Offres en cours, dans l'ordre menu du jour → menu de la semaine → spécial, puis les plus récentes d'abord. */
export function offresEnCours(items: MenuItem[], maintenant: Date = new Date()): MenuItem[] {
  return items
    .filter((i) => estEnCours(i, maintenant))
    .sort(
      (a, b) =>
        CATEGORIES.indexOf(a.categorie) - CATEGORIES.indexOf(b.categorie) ||
        (b.date_releve ?? "").localeCompare(a.date_releve ?? "") ||
        a.ordre - b.ordre
    );
}

/** Article mis d'office dans le plateau : l'offre en cours, sinon le premier plat disponible du menu (hors promotions). */
export function articlePreRempli(items: MenuItem[], maintenant: Date = new Date()): MenuItem | null {
  const offre = offresEnCours(items, maintenant)[0];
  if (offre) return offre;
  const tries = [...items].sort(
    (a, b) => CATEGORIES.indexOf(a.categorie) - CATEGORIES.indexOf(b.categorie) || a.ordre - b.ordre
  );
  return tries.find((i) => i.disponible && i.categorie !== "Promotions") ?? null;
}

/** Prix minimal d'un plat converti en HTG ; null si conversion impossible (taux inconnu). */
export function prixMinHtg(f: Fourchette, taux: number | null): number | null {
  const c = convertirEnCentimes(f.min, f.devise, "HTG", taux);
  return c === null ? null : c / 100;
}

export function chiffresSeulement(numero: string): string {
  return numero.replace(/\D/g, "");
}

export const MESSAGE_WHATSAPP = "Bonjour, je viens de Tèt Weekend, j'ai une question sur votre menu.";

export function lienWhatsapp(numero: string, message: string = MESSAGE_WHATSAPP): string {
  return `https://wa.me/${chiffresSeulement(numero)}?text=${encodeURIComponent(message)}`;
}

export function lienTelephone(numero: string): string {
  const n = numero.trim().startsWith("+") ? `+${chiffresSeulement(numero)}` : chiffresSeulement(numero);
  return `tel:${n}`;
}

export function lienItineraire(r: Pick<Restaurant, "latitude" | "longitude" | "adresse" | "nom" | "quartier">): string | null {
  const base = "https://www.google.com/maps/dir/?api=1&destination=";
  if (r.latitude !== null && r.longitude !== null) return `${base}${r.latitude},${r.longitude}`;
  if (r.adresse) return `${base}${encodeURIComponent([r.nom, r.adresse, r.quartier, "Haïti"].filter(Boolean).join(", "))}`;
  return null;
}
