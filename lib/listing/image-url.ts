/**
 * Flyers allégés : les flyers sont stockés tels qu'envoyés (jusqu'à 10 Mo). Pour l'affichage, on les fait passer
 * par l'optimiseur d'images du site (/_next/image) qui les réduit à la bonne largeur et les sert en WebP/AVIF.
 * Les largeurs doivent faire partie de la liste de Next : 64, 128, 256, 384, 640, 828, 1080.
 */
export type LargeurFlyer = 64 | 128 | 256 | 384 | 640 | 828 | 1080;

/** Seules les images du stockage public Supabase passent par l'optimiseur ; tout autre lien reste intact. */
export function flyerAllege(url: string | null | undefined, largeur: LargeurFlyer, qualite = 70): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(".supabase.co") || !u.pathname.startsWith("/storage/v1/object/public/")) return url;
  } catch {
    return url;
  }
  return `/_next/image?url=${encodeURIComponent(url)}&w=${largeur}&q=${qualite}`;
}
