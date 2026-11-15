/**
 * Couleurs tirées du flyer lui-même : le bloc date posé sur un flyer prend
 * la couleur vive dominante de l'image, et un texte choisi pour rester
 * lisible dessus (blanc ou encre quasi noire, selon la luminance du fond).
 * Fonctions pures : l'échantillonnage des pixels (canvas) vit dans le
 * composant BlocDate, la décision de couleur vit ici et se teste.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Luminance relative (formule WCAG) d'une couleur, entre 0 (noir) et 1 (blanc). */
export function luminanceRelative({ r, g, b }: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Texte lisible sur un fond donné : encre quasi noire quand le fond est
 * assez clair pour que le noir y contraste mieux que le blanc (seuil =
 * point d'équilibre des ratios de contraste WCAG, ≈ 0,18), blanc sinon.
 */
export function couleurTexteSur(fond: Rgb): "#FFFFFF" | "#17171B" {
  return luminanceRelative(fond) > 0.18 ? "#17171B" : "#FFFFFF";
}

/**
 * Couleur dominante « vive » d'un échantillon de pixels RGBA (les données
 * d'un petit canvas) : les teintes sont regroupées en 12 secteurs, chaque
 * pixel pèse d'autant plus qu'il est saturé, et le secteur gagnant donne
 * la moyenne de ses pixels. Une image sans couleur exploitable (niveaux
 * de gris, photo très pâle) retombe sur la moyenne simple de l'ensemble.
 * Null quand l'échantillon n'a aucun pixel opaque.
 */
export function couleurDominante(pixels: Uint8ClampedArray | readonly number[]): Rgb | null {
  const SECTEURS = 12;
  const sommes = new Float64Array(SECTEURS * 3);
  const poids = new Float64Array(SECTEURS);
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let total = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    totalR += r;
    totalG += g;
    totalB += b;
    total++;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < 0.25 || max === min) continue;
    let teinte: number;
    if (max === r) teinte = ((g - b) / (max - min)) % 6;
    else if (max === g) teinte = (b - r) / (max - min) + 2;
    else teinte = (r - g) / (max - min) + 4;
    teinte *= 60;
    if (teinte < 0) teinte += 360;
    const secteur = Math.min(SECTEURS - 1, Math.floor(teinte / (360 / SECTEURS)));
    sommes[secteur * 3] += r * saturation;
    sommes[secteur * 3 + 1] += g * saturation;
    sommes[secteur * 3 + 2] += b * saturation;
    poids[secteur] += saturation;
  }
  if (total === 0) return null;
  let meilleur = -1;
  let meilleurPoids = 0;
  for (let s = 0; s < SECTEURS; s++) {
    if (poids[s] > meilleurPoids) {
      meilleurPoids = poids[s];
      meilleur = s;
    }
  }
  if (meilleur >= 0) {
    return {
      r: Math.round(sommes[meilleur * 3] / meilleurPoids),
      g: Math.round(sommes[meilleur * 3 + 1] / meilleurPoids),
      b: Math.round(sommes[meilleur * 3 + 2] / meilleurPoids),
    };
  }
  return { r: Math.round(totalR / total), g: Math.round(totalG / total), b: Math.round(totalB / total) };
}

/**
 * Fond et texte du bloc date : la couleur du flyer quand on la connaît ;
 * sinon (image illisible, canvas bloqué, pas de flyer) un fond sombre
 * translucide et un texte blanc — le bloc ne disparaît jamais.
 */
export function styleBlocDate(rgb: Rgb | null): { background: string; color: string } {
  if (!rgb) return { background: "rgba(18,18,22,0.85)", color: "#FFFFFF" };
  return { background: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, color: couleurTexteSur(rgb) };
}
