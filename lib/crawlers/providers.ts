import { assertUrlPublique } from "../listing/flyer-import.ts";
import type { ScanResult, WatchPlatform, WatchSource } from "./types.ts";

export type {
  CrawlProvider,
  RawMedia,
  RawPost,
  ScanResult,
  WatchPlatform,
  WatchSource,
} from "./types.ts";

export const MESSAGE_INSTAGRAM =
  "Voie Instagram non configurée : utilise Importer une URL ou ajoute le flyer manuellement.";
export const MESSAGE_FACEBOOK =
  "Voie Facebook non configurée : colle l'URL publique de l'événement ou ajoute le flyer manuellement. Aucun mur de connexion n'est lu.";
export const MESSAGE_EVENTBRITE =
  "Clé Eventbrite absente : le scan API est bloqué. Importe l'URL publique de l'événement.";

type Chercher = (url: string, init?: RequestInit) => Promise<Response>;

export interface OptionsFournisseur {
  env?: Record<string, string | undefined>;
  fetch?: Chercher;
  attendre?: (ms: number) => Promise<void>;
  resoudre?: (hote: string) => Promise<string[]>;
}

const DELAI_MS = 1500;

function bloque(motif: string): ScanResult {
  return { posts: [], blockedReason: motif };
}

export function fournisseurPour(platform: WatchPlatform, options: OptionsFournisseur = {}) {
  const env = options.env ?? process.env;
  const chercher = options.fetch ?? fetch;
  const attendre = options.attendre ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  return {
    platform,
    scan(source: WatchSource) {
      return scanner(platform, source, env, chercher, attendre, options.resoudre);
    },
    fetchPost(url: string) {
      return lirePost(url, env, chercher, attendre, options.resoudre);
    },
  };
}

async function scanner(
  platform: WatchPlatform,
  source: WatchSource,
  env: Record<string, string | undefined>,
  chercher: Chercher,
  attendre: (ms: number) => Promise<void>,
  resoudre?: (hote: string) => Promise<string[]>,
): Promise<ScanResult> {
  if (platform === "instagram") return bloque(MESSAGE_INSTAGRAM);
  if (platform === "facebook") return bloque(MESSAGE_FACEBOOK);
  if (platform === "eventbrite") {
    if (!env.EVENTBRITE_API_TOKEN) return bloque(MESSAGE_EVENTBRITE);
    return lireEventbrite(source.profileUrl ?? "", env.EVENTBRITE_API_TOKEN, chercher);
  }
  if (platform === "manual") {
    if (!source.profileUrl) return bloque("URL de la source manquante.");
    const lu = await lirePagePublique(source.profileUrl, chercher, attendre, resoudre);
    if (lu.blockedReason) return lu;
    return { posts: lu.posts.slice(0, source.maxPostsPerScan) };
  }
  if (!source.profileUrl) return bloque("URL de la source manquante.");
  if (platform === "rss") return lireRss(source.profileUrl, source.maxPostsPerScan, chercher, resoudre);
  return lireSite(source.profileUrl, source.maxPostsPerScan, chercher, attendre, resoudre);
}

export async function importerUrlPublique(
  url: string,
  options: OptionsFournisseur = {},
): Promise<{ type: "post"; post: ScanResult["posts"][number] } | { type: "assistee"; motif: string } | { type: "bloque"; motif: string }> {
  let hote = "";
  try {
    hote = new URL(url).hostname.toLowerCase();
  } catch {
    return { type: "bloque", motif: "URL invalide." };
  }
  if (hote.endsWith("instagram.com")) return { type: "assistee", motif: MESSAGE_INSTAGRAM };
  if (hote.endsWith("facebook.com") || hote === "fb.com" || hote.endsWith("fb.watch")) {
    return { type: "assistee", motif: MESSAGE_FACEBOOK };
  }
  if (hote.endsWith("eventbrite.com")) {
    const token = (options.env ?? process.env).EVENTBRITE_API_TOKEN;
    if (!token) return { type: "assistee", motif: MESSAGE_EVENTBRITE };
    const resultat = await lireEventbrite(url, token, options.fetch ?? fetch);
    if (resultat.blockedReason) return { type: "assistee", motif: resultat.blockedReason };
    const post = resultat.posts[0];
    if (!post) return { type: "assistee", motif: "Événement Eventbrite introuvable par l'API." };
    return { type: "post", post };
  }
  const lu = await lirePagePublique(url, options.fetch ?? fetch, options.attendre ?? (async () => {}), options.resoudre);
  if (lu.blockedReason) return { type: "assistee", motif: `${lu.blockedReason} Le candidat reste à compléter à la main.` };
  const post = lu.posts[0];
  if (!post) return { type: "assistee", motif: "Page publique sans texte exploitable. Complète le candidat à la main." };
  return { type: "post", post };
}

async function lirePost(
  url: string,
  env: Record<string, string | undefined>,
  chercher: Chercher,
  attendre: (ms: number) => Promise<void>,
  resoudre?: (hote: string) => Promise<string[]>,
) {
  const lu = await importerUrlPublique(url, { env, fetch: chercher, attendre, resoudre });
  if (lu.type !== "post") return null;
  return lu.post;
}

function mur(status: number, html: string): string | null {
  if (status === 401 || status === 403) return `Accès refusé (HTTP ${status}). Aucun contournement.`;
  if (status === 429) return "Trop de requêtes (HTTP 429). Le scan s'arrête.";
  const tete = html.slice(0, 4000).toLowerCase();
  if (tete.includes("captcha") || tete.includes("cf-challenge") || tete.includes("just a moment")) {
    return "CAPTCHA ou contrôle anti-bot. Aucun contournement.";
  }
  return null;
}

export function cheminInterditParRobots(robots: string, pathname: string): boolean {
  const lignes = robots.split(/\r?\n/).map((l) => l.split("#")[0]?.trim().toLowerCase() ?? "");
  let dansEtoile = false;
  const interdits: string[] = [];
  for (const ligne of lignes) {
    if (ligne.startsWith("user-agent:")) {
      dansEtoile = ligne.slice("user-agent:".length).trim() === "*";
      continue;
    }
    if (dansEtoile && ligne.startsWith("disallow:")) interdits.push(ligne.slice("disallow:".length).trim());
  }
  return interdits.some((regle) => regle !== "" && (pathname === regle || pathname.startsWith(regle)));
}

async function lireSite(
  url: string,
  max: number,
  chercher: Chercher,
  attendre: (ms: number) => Promise<void>,
  resoudre?: (hote: string) => Promise<string[]>,
): Promise<ScanResult> {
  const page = await lirePagePublique(url, chercher, attendre, resoudre);
  if (page.blockedReason) return page;
  return { posts: page.posts.slice(0, max) };
}

async function lirePagePublique(
  url: string,
  chercher: Chercher,
  attendre: (ms: number) => Promise<void>,
  resoudre?: (hote: string) => Promise<string[]>,
): Promise<ScanResult> {
  let cible: URL;
  try {
    cible = await assertUrlPublique(url, resoudre);
  } catch (e) {
    return bloque((e as Error).message);
  }
  const robotsUrl = `${cible.origin}/robots.txt`;
  const robots = await chercher(robotsUrl, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  if (robots.status === 401 || robots.status === 403 || robots.status === 429) {
    return bloque(mur(robots.status, "") ?? "robots.txt inaccessible.");
  }
  if (robots.status >= 300 && robots.status < 400) return bloque("Redirection inattendue sur robots.txt.");
  if (robots.ok) {
    const texte = await robots.text();
    if (cheminInterditParRobots(texte, cible.pathname)) {
      return bloque("robots.txt interdit cette page. Le scan s'arrête.");
    }
  }
  await attendre(DELAI_MS);
  let reponse: Response;
  try {
    reponse = await chercher(cible.toString(), { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  } catch {
    return bloque("La page publique n'a pas répondu.");
  }
  if (reponse.status >= 300 && reponse.status < 400) return bloque("Redirection non suivie. Aucun contournement.");
  const html = reponse.ok ? (await reponse.text()).slice(0, 100_000) : "";
  const motif = mur(reponse.status, html);
  if (motif) return bloque(motif);
  if (!reponse.ok) return bloque(`La page a répondu ${reponse.status}.`);
  const titre = /<title[^>]*>([^<]{1,180})<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  const desc = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,500})/i.exec(html)?.[1]?.trim() ?? "";
  const caption = [titre, desc].filter(Boolean).join("\n").slice(0, 4000);
  return { posts: [{ url: cible.toString(), caption: caption || null, media: [] }] };
}

async function lireRss(
  url: string,
  max: number,
  chercher: Chercher,
  resoudre?: (hote: string) => Promise<string[]>,
): Promise<ScanResult> {
  let cible: URL;
  try {
    cible = await assertUrlPublique(url, resoudre);
  } catch (e) {
    return bloque((e as Error).message);
  }
  const reponse = await chercher(cible.toString(), { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  if (reponse.status >= 300 && reponse.status < 400) return bloque("Redirection non suivie sur le flux.");
  const xml = reponse.ok ? await reponse.text() : "";
  const motif = mur(reponse.status, xml);
  if (motif) return bloque(motif);
  if (!reponse.ok) return bloque(`Le flux a répondu ${reponse.status}.`);
  const items = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) ?? [];
  const posts = items.slice(0, max).flatMap((item) => {
    const title = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(item)?.[1]?.trim() ?? "";
    const link =
      /<link[^>]*>([^<]+)<\/link>/i.exec(item)?.[1]?.trim() ??
      /<link[^>]+href=["']([^"']+)["']/i.exec(item)?.[1]?.trim() ??
      "";
    if (!link.startsWith("http")) return [];
    const desc = /<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(item)?.[1] ?? "";
    const caption = `${title}\n${desc.replace(/<[^>]+>/g, " ")}`.replace(/\s+/g, " ").trim().slice(0, 4000);
    return [{ url: link, caption, media: [] }];
  });
  return { posts };
}

async function lireEventbrite(url: string, token: string, chercher: Chercher): Promise<ScanResult> {
  const id = /eventbrite\.com\/e\/[^/]*?(\d{6,})/i.exec(url)?.[1];
  if (!id) return bloque("URL Eventbrite sans identifiant d'événement. Importe une URL d'événement précise.");
  const reponse = await chercher(`https://www.eventbriteapi.com/v3/events/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (reponse.status === 401 || reponse.status === 403) return bloque("Clé Eventbrite refusée. Le scan s'arrête.");
  if (reponse.status === 429) return bloque("Eventbrite limite les appels (HTTP 429).");
  if (!reponse.ok) return bloque(`L'API Eventbrite a répondu ${reponse.status}.`);
  const json = (await reponse.json()) as { name?: { text?: string }; url?: string; summary?: string; start?: { utc?: string } };
  return {
    posts: [
      {
        externalId: id,
        url: json.url || url,
        caption: [json.name?.text, json.summary].filter(Boolean).join("\n"),
        postedAt: json.start?.utc ?? null,
        media: [],
      },
    ],
  };
}
