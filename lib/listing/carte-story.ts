/** Textes de la carte « story » (1080×1920) : fonctions pures, testées. */

export function dateCarte(iso: string, fuseau: string): { jour: string; heure: string } {
  const d = new Date(iso);
  const jour = new Intl.DateTimeFormat("en-US", { timeZone: fuseau, weekday: "short", month: "short", day: "numeric" }).format(d).replace(",", "");
  const heure = new Intl.DateTimeFormat("en-US", { timeZone: fuseau, hour: "numeric", minute: "2-digit" }).format(d).replace(":00", "");
  return { jour: jour.toUpperCase(), heure: heure.toUpperCase() };
}

/** Taille de police du titre selon sa longueur, pour qu'il tienne sur la carte sans flyer. */
export function taillePolice(titre: string): number {
  const n = titre.length;
  if (n <= 18) return 120;
  if (n <= 32) return 96;
  if (n <= 52) return 76;
  return 62;
}

export function lieuCarte(nomLieu: string | null | undefined, ville: string | null | undefined): string {
  return [nomLieu, ville].filter(Boolean).join(" · ");
}

/** Seuls PNG et JPEG sont intégrés à l'image ; tout le reste retombe sur la carte typographique. */
export function typeImageOk(contentType: string | null): boolean {
  const t = (contentType ?? "").split(";")[0].trim().toLowerCase();
  return t === "image/jpeg" || t === "image/png";
}
