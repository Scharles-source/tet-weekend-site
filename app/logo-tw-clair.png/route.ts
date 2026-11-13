import sharp from "sharp";
import { GET as logoSombre } from "../logo-tw.png/route";

export const dynamic = "force-static";

/**
 * Logo pour fond clair, calculé à partir du logo officiel détouré (fond sombre) :
 * les pixels neutres (le « Tèt » blanc) passent à l'encre, le cuivre de « WEEKEND » est assombri.
 */
export async function GET() {
  const source = Buffer.from(await (await logoSombre()).arrayBuffer());
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const encre = [25, 20, 16];
  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const saturation = (max - min) / Math.max(max, 1);
    const neutre = Math.min(1, Math.max(0, (0.35 - saturation) / 0.2));
    for (let c = 0; c < 3; c++) {
      const cuivre = data[i + c] * 0.82;
      data[i + c] = Math.round(cuivre * (1 - neutre) + encre[c] * neutre);
    }
  }
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colors: 64 })
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
