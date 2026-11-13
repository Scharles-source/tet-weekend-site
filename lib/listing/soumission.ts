/** Formulaire « Add an event » : validation pure (testée à part) des champs envoyés par les organisateurs. */

export const EMAIL_CONTACT = "contact@tetweekend.com";
export const TAILLE_MAX_FLYER = 5 * 1024 * 1024;
export const TYPES_FLYER = ["image/jpeg", "image/png", "image/webp"] as const;

export interface Soumission {
  nom: string;
  email: string;
  telephone: string;
  evenement: string;
  date: string;
  lieu: string;
  details: string;
}

export type Champs = Record<keyof Soumission, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function net(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** Retourne la soumission nettoyée, ou la liste des champs en erreur. */
export function validerSoumission(brut: Record<string, unknown>): { ok: true; valeur: Soumission } | { ok: false; erreurs: Partial<Record<keyof Soumission, string>> } {
  const valeur: Soumission = {
    nom: net(brut.nom, 120),
    email: net(brut.email, 160),
    telephone: net(brut.telephone, 40),
    evenement: net(brut.evenement, 160),
    date: net(brut.date, 80),
    lieu: net(brut.lieu, 200),
    details: typeof brut.details === "string" ? brut.details.replace(/\r/g, "").trim().slice(0, 2000) : "",
  };
  const erreurs: Partial<Record<keyof Soumission, string>> = {};
  if (valeur.nom.length < 2) erreurs.nom = "Enter your name.";
  if (!EMAIL.test(valeur.email)) erreurs.email = "Enter a valid email address.";
  if (valeur.evenement.length < 3) erreurs.evenement = "Enter the name of the event.";
  if (!valeur.date) erreurs.date = "Enter the date and time.";
  if (valeur.lieu.length < 3) erreurs.lieu = "Enter the venue and city.";
  return Object.keys(erreurs).length > 0 ? { ok: false, erreurs } : { ok: true, valeur };
}

export function flyerValide(f: { type: string; size: number }): string | null {
  if (!(TYPES_FLYER as readonly string[]).includes(f.type)) return "The flyer must be a JPG, PNG or WebP image.";
  if (f.size <= 0) return "The flyer file is empty.";
  if (f.size > TAILLE_MAX_FLYER) return "The flyer is too large (5 MB maximum).";
  return null;
}

export function echapperHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
