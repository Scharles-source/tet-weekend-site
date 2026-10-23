export const FREQUENCES = [
  { minutes: 0, libelle: "Manuel" },
  { minutes: 360, libelle: "Toutes les 6 h" },
  { minutes: 720, libelle: "Toutes les 12 h" },
  { minutes: 1440, libelle: "Tous les jours" },
  { minutes: 2880, libelle: "Tous les 2 jours" },
] as const;

export const PLATEFORMES_SOURCE = ["instagram", "facebook", "eventbrite", "website", "rss", "manual"] as const;
export const TYPES_SOURCE = ["lieu", "artiste", "promoteur", "media", "organisateur", "autre"] as const;

export const LIMITES_VISIBLES = [
  "Instagram est désactivé : importe une URL ou téléverse le flyer. Aucun mot de passe, aucun contournement.",
  "Facebook est désactivé sans voie officielle. Le mur de connexion n'est pas lu.",
  "Eventbrite utilise l'API officielle seulement si une clé est présente sur le runner. Sinon le scan est bloqué.",
  "Les sites et les flux RSS sont lus s'ils sont publics, en respectant robots.txt, avec un délai entre les requêtes.",
  "Aucun scan ne publie un événement. Tout passe par la file À valider.",
  "Aucun worker n'est hébergé. Le runner est en ligne seulement pendant npm run events:runner sur ta machine.",
];

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
  scanFrequencyMinutes: number;
  maxPostsPerScan: number;
  lastScannedAt: string | null;
  lastSuccessAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  notes: string | null;
  candidats: number;
}

export interface VueLog {
  id: string;
  level: string;
  message: string;
  createdAt: string;
}

export interface VueJob {
  id: string;
  jobType: string;
  sourceId: string | null;
  sourceNom: string | null;
  inputUrl: string | null;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  counts: { scanned?: number; newCandidates?: number; duplicates?: number; ignored?: number; errors?: number };
  errorMessage: string | null;
  config: Record<string, unknown>;
  logs: VueLog[];
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
  globalEnabled: boolean;
  schedulerEnabled: boolean;
  runnerEnLigne: boolean;
  heartbeatAt: string | null;
  comptes: { queued: number; running: number; blocked: number; failed: number };
  aValider: number;
  sources: VueSource[];
  jobs: VueJob[];
  candidats: VueCandidat[];
  lieux: { id: string; nom: string; ville: string | null }[];
}

export function libelleConfiance(niveau: string | undefined): string {
  if (niveau === "high") return "Trouvé";
  if (niveau === "medium" || niveau === "low") return "À vérifier";
  return "Manquant";
}

export function libelleStatutJob(statut: string): string {
  const noms: Record<string, string> = {
    queued: "En file",
    running: "En cours",
    paused: "En pause",
    succeeded: "Terminé",
    failed: "Échec",
    cancelled: "Annulé",
    blocked: "Bloqué",
  };
  return noms[statut] ?? statut;
}

export function frequenceLibelle(minutes: number): string {
  return FREQUENCES.find((f) => f.minutes === minutes)?.libelle ?? `${minutes} min`;
}
