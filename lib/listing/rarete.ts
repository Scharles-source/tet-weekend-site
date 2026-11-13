/** Signaux de rareté que les organisateurs écrivent eux-mêmes (titre, description, prix). Rien n'est inventé : pas de texte, pas de badge. */
const MOTIFS: { badge: string; motif: RegExp }[] = [
  { badge: "Sold out last year", motif: /sold[\s-]*out\s+(?:last\s+(?:year|edition)|in\s+20\d\d)|(?:last\s+year'?s?\s+(?:edition|party|event)\s+(?:was\s+)?(?:sold[\s-]*out|full))|(?:complet\s+l['’]an\s+dernier|l['’][ée]dition\s+(?:de\s+l['’]an\s+dernier|pass[ée]e)\s+(?:[ée]tait\s+)?compl[èe]te)/i },
  { badge: "Early bird", motif: /early[\s-]*bird|pr[ée]vente|pre[\s-]*sale|presale|tarif\s+(?:early|pr[ée]coce)/i },
  { badge: "Limited tickets", motif: /limited\s+(?:tickets|capacity|seating|spots|availability)|selling\s+fast|last\s+tickets|few\s+tickets\s+left|places?\s+limit[ée]es?|billets?\s+limit[ée]s?|derni[èe]res?\s+places?|derniers?\s+billets?|presque\s+complet/i },
];

export function signauxRarete(e: { titre: string; description?: string | null; prix?: string | null }): string[] {
  const texte = [e.titre, e.description ?? "", e.prix ?? ""].join(" \n ");
  const trouves: string[] = [];
  for (const { badge, motif } of MOTIFS) {
    if (motif.test(texte)) trouves.push(badge);
  }
  return trouves.slice(0, 2);
}
