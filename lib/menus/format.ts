import { convertirEnCentimes } from "./budget.ts";
import type { Devise, MenuItem, Restaurant } from "./types.ts";

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

/** Jours écoulés depuis le relevé (dates calendaires, sans dépendre du fuseau horaire). */
export function joursDepuis(isoDate: string, maintenant: Date = new Date()): number {
  const [a, m, j] = isoDate.slice(0, 10).split("-").map(Number);
  const releve = Date.UTC(a, m - 1, j);
  const aujourdhui = Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  return Math.max(0, Math.round((aujourdhui - releve) / 86_400_000));
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

/** Min–max des plats (catégorie Plats) dans la devise du restaurant. Null si aucun plat convertible. */
export function fourchettePlats(restaurant: Restaurant, items: MenuItem[], tauxGlobal: number | null): Fourchette | null {
  const plats = items.filter((i) => i.categorie === "Plats");
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
