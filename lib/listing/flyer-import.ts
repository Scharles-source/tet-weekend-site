import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { inspecterImage, type ImageLue } from "./image.ts";
import { SaisieInvalide } from "./erreurs.ts";

const DELAI_MS = 10_000;
const MAX_REDIRECTIONS = 3;

type Resoudre = (hote: string) => Promise<string[]>;
type Chercher = (url: string, init: RequestInit) => Promise<Response>;

export function ipInterdite(ip: string): boolean {
  let n = ip.trim().toLowerCase();
  if (n.startsWith("[") && n.endsWith("]")) n = n.slice(1, -1);
  if (n.startsWith("::ffff:")) n = n.slice(7);
  if (n === "::1" || n === "0:0:0:0:0:0:0:1" || n === "0.0.0.0") return true;
  if (n.includes(":")) {
    const tete = n.split(":")[0] ?? "";
    const valeur = Number.parseInt(tete || "0", 16);
    if (tete.startsWith("fc") || tete.startsWith("fd")) return true;
    if ((valeur & 0xffc0) === 0xfe80) return true;
    return false;
  }
  const parties = n.split(".");
  if (parties.length !== 4) return true;
  const nombres = parties.map((p) => Number(p));
  if (nombres.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return true;
  const [a, b] = nombres;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

export async function assertUrlPublique(brut: string, resoudre: Resoudre = resoudreHote): Promise<URL> {
  let url: URL;
  try {
    url = new URL(brut.trim());
  } catch {
    throw new SaisieInvalide("URL d'image invalide.");
  }
  if (url.username || url.password) throw new SaisieInvalide("URL d'image invalide.");
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SaisieInvalide("Seules les URL http et https publiques sont acceptées.");
  }
  const hote = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hote || hote === "localhost" || hote.endsWith(".localhost") || hote.endsWith(".local") || hote.endsWith(".internal")) {
    throw new SaisieInvalide("Hôte local ou privé refusé.");
  }
  const ips = isIP(hote) ? [hote] : await resoudre(hote);
  if (ips.length === 0 || ips.some((ip) => ipInterdite(ip))) {
    throw new SaisieInvalide("Hôte local ou privé refusé.");
  }
  return url;
}

export async function importerImageDepuisUrl(
  brut: string,
  deps?: { fetch?: Chercher; resoudre?: Resoudre },
): Promise<ImageLue & { octets: Uint8Array }> {
  const chercher = deps?.fetch ?? fetch;
  const resoudre = deps?.resoudre ?? resoudreHote;
  const signal = AbortSignal.timeout(DELAI_MS);
  let courant = (await assertUrlPublique(brut, resoudre)).toString();
  for (let redirection = 0; redirection <= MAX_REDIRECTIONS; redirection++) {
    let reponse: Response;
    try {
      reponse = await chercher(courant, {
        method: "GET",
        redirect: "manual",
        signal,
        headers: { Accept: "image/jpeg,image/png,image/webp" },
      });
    } catch (e) {
      if (e instanceof Error && e.name === "TimeoutError") {
        throw new SaisieInvalide("Le téléchargement a dépassé 10 secondes.");
      }
      throw new SaisieInvalide("Impossible de télécharger l'image.");
    }
    if (reponse.status >= 300 && reponse.status < 400) {
      if (redirection === MAX_REDIRECTIONS) throw new SaisieInvalide("Trop de redirections.");
      const lieu = reponse.headers.get("location");
      if (!lieu) throw new SaisieInvalide("Redirection sans destination.");
      courant = (await assertUrlPublique(new URL(lieu, courant).toString(), resoudre)).toString();
      continue;
    }
    if (!reponse.ok) throw new SaisieInvalide("L'image distante a répondu une erreur.");
    const longueur = Number(reponse.headers.get("content-length") ?? "0");
    if (Number.isFinite(longueur) && longueur > 10 * 1024 * 1024) {
      throw new SaisieInvalide("Le flyer dépasse 10 Mo.");
    }
    const octets = await lirePlafond(reponse);
    const mime = reponse.headers.get("content-type");
    const image = inspecterImage(octets, mime);
    return { ...image, octets };
  }
  throw new SaisieInvalide("Trop de redirections.");
}

async function lirePlafond(reponse: Response): Promise<Uint8Array> {
  const flux = reponse.body;
  if (!flux) throw new SaisieInvalide("Réponse vide.");
  const lecteur = flux.getReader();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await lecteur.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > 10 * 1024 * 1024) {
      await lecteur.cancel();
      throw new SaisieInvalide("Le flyer dépasse 10 Mo.");
    }
    morceaux.push(value);
  }
  const sortie = new Uint8Array(total);
  let offset = 0;
  for (const morceau of morceaux) {
    sortie.set(morceau, offset);
    offset += morceau.byteLength;
  }
  return sortie;
}

async function resoudreHote(hote: string): Promise<string[]> {
  try {
    const adresses = await lookup(hote, { all: true, verbatim: true });
    return adresses.map((a) => a.address);
  } catch {
    throw new SaisieInvalide("Impossible de résoudre l'hôte.");
  }
}
