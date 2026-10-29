export const FREQUENCES = [
  { minutes: 0, libelle: "Manuel" },
  { minutes: 360, libelle: "Toutes les 6 h" },
  { minutes: 720, libelle: "Toutes les 12 h" },
  { minutes: 1440, libelle: "Tous les jours" },
  { minutes: 2880, libelle: "Tous les 2 jours" },
] as const;

export const PLATEFORMES_SOURCE = ["instagram", "facebook", "eventbrite", "website", "rss", "manual"] as const;
export const TYPES_SOURCE = ["lieu", "artiste", "promoteur", "media", "organisateur", "autre"] as const;

export interface VueSource {
  id: string;
  platform: string;
  handle: string | null;
  profileUrl: string | null;
  displayName: string | null;
  sourceType: string;
  city: string | null;
  country: string | null;
  active: boolean;
  notes: string | null;
  candidats: number;
}

export interface VueCandidat {
  id: string;
  platform: string;
  sourcePostUrl: string;
  compte: string | null;
  caption: string | null;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  venueName: string | null;
  venueId: string | null;
  city: string | null;
  artistsText: string | null;
  priceText: string | null;
  isFree: boolean | null;
  category: string | null;
  description: string | null;
  flyerUrl: string | null;
  status: string;
  confidence: Record<string, { niveau?: string }>;
  duplicateOfEventId: string | null;
  duplicateOfCandidateId: string | null;
  rejectionReason: string | null;
}

export interface VueCollecte {
  email: string | null;
  aValider: number;
  sources: VueSource[];
  candidats: VueCandidat[];
  lieux: { id: string; nom: string; ville: string | null }[];
}

export function libelleConfiance(niveau: string | undefined): string {
  if (niveau === "high") return "Trouvé";
  if (niveau === "medium" || niveau === "low") return "À vérifier";
  return "Manquant";
}
