import sharp from "sharp";
import { GET as logoSombre } from "../app/logo-tw.png/route";

/** Images de marque (icônes, image de partage) calculées à partir du logo officiel détouré. */
const FOND_SOMBRE = { r: 25, g: 20, b: 16, alpha: 1 };

async function logo(largeur: number) {
  const source = Buffer.from(await (await logoSombre()).arrayBuffer());
  return sharp(source).resize({ width: largeur, kernel: "lanczos3" }).png().toBuffer();
}

/** Icône carrée : fond sombre, logo centré (blanc + cuivre). */
export async function icone(taille: number) {
  const marge = Math.round(taille * 0.12);
  const l = await logo(taille - marge * 2);
  return sharp({ create: { width: taille, height: taille, channels: 4, background: FOND_SOMBRE } })
    .composite([{ input: l, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Image de partage 1200×630 : fond sombre, logo centré. */
export async function imagePartage() {
  const l = await logo(760);
  return sharp({ create: { width: 1200, height: 630, channels: 4, background: FOND_SOMBRE } })
    .composite([{ input: l, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export function reponsePng(png: Buffer) {
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
