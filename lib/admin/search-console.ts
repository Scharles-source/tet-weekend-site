import { createSign } from "node:crypto";
import {
  cheminPage,
  construireSerie,
  libelleAppareilSeo,
  libellePaysSeo,
  totauxSeo,
  type DonneesSeo,
  type LigneSeo,
  type PeriodeSeo,
  type RapportSeo,
} from "./search-console-pures.ts";

/**
 * Rapport SEO de l'Accueil admin, lu en direct dans Google Search Console.
 *
 * Connexion (compte de service, lecture seule) — variables d'environnement Vercel :
 * - GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON : le JSON complet du compte de service, ou
 * - GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL + GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY.
 * - GOOGLE_SEARCH_CONSOLE_PROPERTY_URL (optionnel) : la propriété Search Console,
 *   par défaut l'URL-prefix https://www.tetweekend.com/.
 * Le compte de service doit être ajouté comme utilisateur de la propriété dans
 * Search Console (Paramètres → Utilisateurs et autorisations).
 */

const PROPRIETE_DEFAUT = "https://www.tetweekend.com/";
const PORTEE = "https://www.googleapis.com/auth/webmasters.readonly";

interface Identifiants {
  email: string;
  clePrivee: string;
  propriete: string;
}

type LectureIdentifiants = { ok: true; identifiants: Identifiants } | { ok: false; raison: "absent" | "invalide" };

function lireIdentifiants(): LectureIdentifiants {
  const propriete = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY_URL?.trim() || PROPRIETE_DEFAUT;
  const json = process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return { ok: true, identifiants: { email: parsed.client_email, clePrivee: parsed.private_key, propriete } };
      }
      return { ok: false, raison: "invalide" };
    } catch {
      return { ok: false, raison: "invalide" };
    }
  }
  const email = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();
  const clePrivee = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email && !clePrivee) return { ok: false, raison: "absent" };
  if (!email || !clePrivee) return { ok: false, raison: "invalide" };
  return { ok: true, identifiants: { email, clePrivee, propriete } };
}

function base64url(entree: string | Buffer): string {
  return Buffer.from(entree).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Jeton OAuth2 obtenu par un JWT signé avec la clé du compte de service (aucune dépendance externe). */
async function jetonAcces({ email, clePrivee }: Identifiants): Promise<string> {
  const maintenant = Math.floor(Date.now() / 1000);
  const enTete = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const revendications = base64url(
    JSON.stringify({ iss: email, scope: PORTEE, aud: "https://oauth2.googleapis.com/token", iat: maintenant, exp: maintenant + 3600 }),
  );
  let signature: string;
  try {
    signature = base64url(createSign("RSA-SHA256").update(`${enTete}.${revendications}`).sign(clePrivee));
  } catch {
    throw new Error("La clé privée du compte de service est illisible. Vérifiez la variable d'environnement dans Vercel.");
  }
  const reponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${enTete}.${revendications}.${signature}`,
    }),
    cache: "no-store",
  });
  if (!reponse.ok) {
    throw new Error("Google a refusé les identifiants du compte de service. Vérifiez l'e-mail et la clé privée dans Vercel.");
  }
  const corps = (await reponse.json()) as { access_token?: string };
  if (!corps.access_token) throw new Error("Google n'a pas renvoyé de jeton d'accès.");
  return corps.access_token;
}

interface LigneApi {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

async function requeteAnalytics(jeton: string, propriete: string, debut: string, fin: string, dimensions: string[], limite: number): Promise<LigneApi[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propriete)}/searchAnalytics/query`;
  const reponse = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: debut, endDate: fin, dimensions, rowLimit: limite, dataState: "final" }),
    cache: "no-store",
  });
  if (reponse.status === 403) {
    throw new Error("Accès refusé : le compte de service n'est pas utilisateur de cette propriété Search Console. Ajoutez-le dans Search Console → Paramètres → Utilisateurs et autorisations.");
  }
  if (reponse.status === 404) {
    throw new Error("Propriété Search Console introuvable. Vérifiez GOOGLE_SEARCH_CONSOLE_PROPERTY_URL dans Vercel.");
  }
  if (!reponse.ok) throw new Error(`Google Search Console a répondu ${reponse.status}. Réessayez dans un moment.`);
  const corps = (await reponse.json()) as { rows?: LigneApi[] };
  return corps.rows ?? [];
}

function versLignes(lignes: LigneApi[], transformer?: (cle: string) => string): LigneSeo[] {
  return lignes
    .map((l) => ({
      nom: transformer ? transformer(l.keys?.[0] ?? "") : (l.keys?.[0] ?? ""),
      clics: l.clicks ?? 0,
      impressions: l.impressions ?? 0,
      ctr: l.ctr ?? 0,
      position: l.position ?? 0,
    }))
    .sort((a, b) => b.clics - a.clics || b.impressions - a.impressions);
}

function isoJour(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Charge le rapport. Ne jette jamais : l'état (non configuré / erreur) fait partie du retour, pour l'afficher dans l'admin. */
export async function chargerRapportSeo(periode: PeriodeSeo): Promise<RapportSeo> {
  const lecture = lireIdentifiants();
  if (!lecture.ok) {
    if (lecture.raison === "absent") return { statut: "non_configure" };
    return { statut: "erreur", message: "La configuration Search Console est incomplète ou illisible. Vérifiez les variables d'environnement dans Vercel." };
  }
  try {
    const { identifiants } = lecture;
    // Search Console publie ses données finales avec 2 à 3 jours de décalage : on s'arrête à J-3.
    const finDate = new Date();
    finDate.setUTCDate(finDate.getUTCDate() - 3);
    const debutDate = new Date(finDate);
    debutDate.setUTCDate(debutDate.getUTCDate() - (periode - 1));
    const debut = isoJour(debutDate);
    const fin = isoJour(finDate);

    const jeton = await jetonAcces(identifiants);
    const [parJour, requetes, pages, pays, appareils] = await Promise.all([
      requeteAnalytics(jeton, identifiants.propriete, debut, fin, ["date"], 100),
      requeteAnalytics(jeton, identifiants.propriete, debut, fin, ["query"], 8),
      requeteAnalytics(jeton, identifiants.propriete, debut, fin, ["page"], 6),
      requeteAnalytics(jeton, identifiants.propriete, debut, fin, ["country"], 6),
      requeteAnalytics(jeton, identifiants.propriete, debut, fin, ["device"], 3),
    ]);

    const mesures = parJour.map((l) => ({ clics: l.clicks ?? 0, impressions: l.impressions ?? 0, position: l.position ?? 0 }));
    const totaux = totauxSeo(mesures);
    const carte = new Map(parJour.map((l) => [l.keys?.[0] ?? "", { clics: l.clicks ?? 0, impressions: l.impressions ?? 0 }]));

    const donnees: DonneesSeo = {
      periode,
      debut,
      fin,
      ...totaux,
      serie: construireSerie(debut, fin, carte),
      requetes: versLignes(requetes),
      pages: versLignes(pages, cheminPage),
      pays: versLignes(pays, libellePaysSeo),
      appareils: versLignes(appareils, libelleAppareilSeo),
    };
    return { statut: "ok", donnees };
  } catch (e) {
    return { statut: "erreur", message: (e as Error).message || "Lecture Search Console impossible pour le moment." };
  }
}
