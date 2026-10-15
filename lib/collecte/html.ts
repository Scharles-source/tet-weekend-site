// Extraction de texte et de liens menu depuis une page HTML (sites restaurants).
// Pas de rendu JS : pages statiques / HTML servi. Pas de contournement anti-bot.

import type { LigneTexte } from "./types.ts";

const MOTS_MENU =
  /\b(menu|carte|food|manger|eat|dine|notre-carte|notre_carte|la-carte|la_carte|dining)\b/i;

const SIGNES_ANTIBOT =
  /captcha|recaptcha|hcaptcha|cf-challenge|challenge-platform|access denied|verify you are human|are you a robot|attention required|just a moment\.\.\.|checking your browser/i;

export function detecterAntiBot(html: string, statutHttp?: number): string | null {
  if (statutHttp === 403 || statutHttp === 429 || statutHttp === 503) {
    return `HTTP ${statutHttp}`;
  }
  if (SIGNES_ANTIBOT.test(html)) return "page de vérification / CAPTCHA détectée";
  return null;
}

export function extraireLiens(html: string, baseUrl: string): { href: string; texte: string }[] {
  const liens: { href: string; texte: string }[] = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const href = new URL(m[1], baseUrl).href;
      const texte = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      liens.push({ href, texte });
    } catch {
      /* URL invalide */
    }
  }
  return liens;
}

export function liensMenu(html: string, baseUrl: string): { href: string; texte: string }[] {
  const vus = new Set<string>();
  const sortie: { href: string; texte: string }[] = [];
  for (const l of extraireLiens(html, baseUrl)) {
    const cible = `${l.href} ${l.texte}`;
    if (!MOTS_MENU.test(cible)) continue;
    if (vus.has(l.href)) continue;
    vus.add(l.href);
    sortie.push(l);
  }
  return sortie;
}

export function liensPdf(html: string, baseUrl: string): string[] {
  const vus = new Set<string>();
  for (const l of extraireLiens(html, baseUrl)) {
    if (/\.pdf(\?|#|$)/i.test(l.href) || /menu|carte/i.test(l.texte) && /\.pdf/i.test(l.href)) {
      vus.add(l.href);
    }
  }
  // Liens directs dans href / src
  const re = /(?:href|src)\s*=\s*["']([^"']+\.pdf[^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      vus.add(new URL(m[1], baseUrl).href);
    } catch {
      /* ignore */
    }
  }
  return [...vus];
}

/** HTML → lignes de texte visibles (script/style retirés). */
export function htmlVersLignes(html: string): LigneTexte[] {
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  t = t.replace(/<\/(p|div|li|tr|h[1-6]|br|section|article)>/gi, "\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<[^>]+>/g, " ");
  t = t
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"');
  return t
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 2)
    .map((texte) => ({ texte, confiance: null }));
}

export function parseRobotsTxt(texte: string): { disallow: string[] } {
  const disallow: string[] = [];
  let applicable = false;
  for (const ligne of texte.split(/\r?\n/)) {
    const l = ligne.trim();
    if (!l || l.startsWith("#")) continue;
    const ua = l.match(/^user-agent:\s*(.+)$/i);
    if (ua) {
      const v = ua[1].trim();
      applicable = v === "*" || v.toLowerCase().includes("tetweekend") || v.toLowerCase().includes("tet-weekend");
      continue;
    }
    if (!applicable) continue;
    const d = l.match(/^disallow:\s*(.*)$/i);
    if (d) {
      const path = d[1].trim();
      if (path) disallow.push(path);
    }
  }
  return { disallow };
}

export function urlAutorisee(url: string, disallow: string[]): boolean {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return false;
  }
  for (const d of disallow) {
    if (d === "/") return false;
    if (path.startsWith(d)) return false;
  }
  return true;
}
