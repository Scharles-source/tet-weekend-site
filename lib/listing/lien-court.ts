/** Lien de partage court : https://www.tetweekend.com/e/<8 caractères>, qui redirige vers la fiche complète. */
export const LONGUEUR_CODE = 8;

export function codeCourt(id: string): string {
  return id.replace(/-/g, "").slice(0, LONGUEUR_CODE).toLowerCase();
}

export function estCodeCourt(v: string): boolean {
  return /^[0-9a-f]{8}$/.test(v);
}

export function lienCourt(id: string): string {
  return `https://www.tetweekend.com/e/${codeCourt(id)}`;
}
