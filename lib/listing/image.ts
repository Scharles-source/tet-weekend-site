import { SaisieInvalide } from "./erreurs.ts";

export const MAX_OCTETS_FLYER = 10 * 1024 * 1024;

export const MIMES_FLYER = ["image/jpeg", "image/png", "image/webp"] as const;
export type MimeFlyer = (typeof MIMES_FLYER)[number];

export interface ImageLue {
  mime: MimeFlyer;
  width: number;
  height: number;
}

export function inspecterImage(octets: Uint8Array, mimeDeclare?: string | null): ImageLue {
  if (octets.byteLength === 0) throw new SaisieInvalide("Le fichier est vide.");
  if (octets.byteLength > MAX_OCTETS_FLYER) throw new SaisieInvalide("Le flyer dépasse 10 Mo.");
  if (ressembleASvg(octets)) throw new SaisieInvalide("Le SVG n'est pas accepté. Formats : JPEG, PNG, WebP.");
  const mimeMagie = mimeParMagie(octets);
  const declare = normaliserMime(mimeDeclare);
  if (declare && declare !== mimeMagie && mimeMagie === null) {
    throw new SaisieInvalide("Formats acceptés : JPEG, PNG, WebP.");
  }
  if (declare && mimeMagie && declare !== mimeMagie) {
    throw new SaisieInvalide("Le type annoncé ne correspond pas au fichier.");
  }
  const mime = mimeMagie ?? declare;
  if (!mime || !(MIMES_FLYER as readonly string[]).includes(mime)) {
    throw new SaisieInvalide("Formats acceptés : JPEG, PNG, WebP.");
  }
  const taille = dimensions(octets, mime);
  if (!taille) throw new SaisieInvalide("Impossible de lire les dimensions du flyer.");
  return { mime, width: taille.width, height: taille.height };
}

export function extensionPourMime(mime: MimeFlyer): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function normaliserMime(mime?: string | null): MimeFlyer | null {
  if (!mime) return null;
  const base = mime.split(";")[0]?.trim().toLowerCase();
  if (base === "image/jpg") return "image/jpeg";
  if ((MIMES_FLYER as readonly string[]).includes(base)) return base as MimeFlyer;
  return null;
}

function ressembleASvg(octets: Uint8Array): boolean {
  const debut = new TextDecoder("utf-8", { fatal: false }).decode(octets.subarray(0, 256)).trim().toLowerCase();
  return debut.startsWith("<svg") || debut.startsWith("<?xml") || debut.includes("<svg");
}

function mimeParMagie(octets: Uint8Array): MimeFlyer | null {
  if (octets.length >= 3 && octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) return "image/jpeg";
  if (
    octets.length >= 8 &&
    octets[0] === 0x89 &&
    octets[1] === 0x50 &&
    octets[2] === 0x4e &&
    octets[3] === 0x47 &&
    octets[4] === 0x0d &&
    octets[5] === 0x0a &&
    octets[6] === 0x1a &&
    octets[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    octets.length >= 12 &&
    ascii(octets, 0, 4) === "RIFF" &&
    ascii(octets, 8, 4) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function ascii(octets: Uint8Array, debut: number, longueur: number): string {
  return String.fromCharCode(...octets.subarray(debut, debut + longueur));
}

function dimensions(octets: Uint8Array, mime: MimeFlyer): { width: number; height: number } | null {
  if (mime === "image/png") return dimensionsPng(octets);
  if (mime === "image/webp") return dimensionsWebp(octets);
  return dimensionsJpeg(octets);
}

function dimensionsPng(octets: Uint8Array): { width: number; height: number } | null {
  if (octets.length < 24 || ascii(octets, 12, 4) !== "IHDR") return null;
  const width = lireUint32(octets, 16);
  const height = lireUint32(octets, 20);
  if (width < 1 || height < 1) return null;
  return { width, height };
}

function lireUint32(octets: Uint8Array, offset: number): number {
  return (((octets[offset] << 24) | (octets[offset + 1] << 16) | (octets[offset + 2] << 8) | octets[offset + 3]) >>> 0);
}

function dimensionsJpeg(octets: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 8 < octets.length) {
    if (octets[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marqueur = octets[i + 1];
    if (marqueur === 0xd8 || marqueur === 0xd9) {
      i += 2;
      continue;
    }
    const longueur = (octets[i + 2] << 8) | octets[i + 3];
    if (longueur < 2) return null;
    const sof = marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc;
    if (sof && i + 8 < octets.length) {
      const height = (octets[i + 5] << 8) | octets[i + 6];
      const width = (octets[i + 7] << 8) | octets[i + 8];
      if (width < 1 || height < 1) return null;
      return { width, height };
    }
    i += 2 + longueur;
  }
  return null;
}

function dimensionsWebp(octets: Uint8Array): { width: number; height: number } | null {
  if (octets.length < 30) return null;
  const type = ascii(octets, 12, 4);
  if (type === "VP8X" && octets.length >= 30) {
    const width = 1 + (octets[24] | (octets[25] << 8) | (octets[26] << 16));
    const height = 1 + (octets[27] | (octets[28] << 8) | (octets[29] << 16));
    if (width < 1 || height < 1) return null;
    return { width, height };
  }
  if (type === "VP8 " && octets.length >= 30) {
    const debut = 20;
    if (octets[debut + 3] !== 0x9d || octets[debut + 4] !== 0x01 || octets[debut + 5] !== 0x2a) return null;
    const width = (octets[debut + 6] | (octets[debut + 7] << 8)) & 0x3fff;
    const height = (octets[debut + 8] | (octets[debut + 9] << 8)) & 0x3fff;
    if (width < 1 || height < 1) return null;
    return { width, height };
  }
  if (type === "VP8L" && octets.length >= 25 && octets[20] === 0x2f) {
    const bits = octets[21] | (octets[22] << 8) | (octets[23] << 16) | (octets[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    if (width < 1 || height < 1) return null;
    return { width, height };
  }
  return null;
}
