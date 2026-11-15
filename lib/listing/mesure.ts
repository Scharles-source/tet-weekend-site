/** Aides pures de la mesure d'audience (testées à part). Rien n'est stocké ici. */

export const SOURCES = ["instagram", "whatsapp", "facebook", "google", "tiktok", "x", "youtube", "direct", "autre"] as const;
export type Source = (typeof SOURCES)[number];

const MARQUEURS: Record<string, Source> = {
  ig: "instagram",
  insta: "instagram",
  instagram: "instagram",
  wa: "whatsapp",
  whatsapp: "whatsapp",
  fb: "facebook",
  facebook: "facebook",
  tt: "tiktok",
  tiktok: "tiktok",
  yt: "youtube",
  youtube: "youtube",
  x: "x",
  tw: "x",
  twitter: "x",
};

function sourceDepuisHote(hote: string): Source {
  const h = hote.toLowerCase();
  if (h.includes("instagram.com")) return "instagram";
  if (h.includes("whatsapp.com") || h === "wa.me") return "whatsapp";
  if (h.includes("facebook.com") || h === "fb.com" || h.endsWith(".fb.com") || h === "l.messenger.com" || h.includes("messenger.com")) return "facebook";
  if (/(^|\.)google\.[a-z.]+$/.test(h)) return "google";
  if (h.includes("tiktok.com")) return "tiktok";
  if (h === "t.co" || h.includes("twitter.com") || h === "x.com") return "x";
  if (h.includes("youtube.com") || h === "youtu.be") return "youtube";
  return "autre";
}

/**
 * D'où vient le visiteur : marqueur `?s=` du lien (le plus fiable), sinon `utm_source`
 * du lien, sinon site d'origine, sinon navigateur intégré d'une application
 * (Instagram, Facebook, TikTok), sinon accès direct.
 */
export function sourceDepuis(entrees: { marqueur?: string | null; utmSource?: string | null; referrer?: string | null; ua?: string | null; hoteLocal?: string | null }): Source {
  const marqueur = entrees.marqueur?.trim().toLowerCase();
  if (marqueur) return MARQUEURS[marqueur] ?? "autre";
  const utm = entrees.utmSource?.trim().toLowerCase();
  if (utm) return MARQUEURS[utm] ?? ((SOURCES as readonly string[]).includes(utm) ? (utm as Source) : "autre");
  const referrer = entrees.referrer?.trim();
  if (referrer) {
    try {
      const hote = new URL(referrer).hostname;
      if (hote && hote !== entrees.hoteLocal) return sourceDepuisHote(hote);
    } catch {
      /* référent illisible : on regarde le navigateur */
    }
  }
  const ua = entrees.ua ?? "";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "tiktok";
  return "direct";
}

export type Etiquette = { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null };

const MOTIF_ETIQUETTE = /^[\p{L}\p{N} _.\-+@]+$/u;

function champEtiquette(brut: string | null, max: number): string | null {
  const v = brut?.trim().toLowerCase().slice(0, max) ?? "";
  return v && MOTIF_ETIQUETTE.test(v) ? v : null;
}

/**
 * L'étiquette d'un lien partagé : les paramètres `utm_*` de l'adresse, nettoyés.
 * C'est elle qui dit, visite par visite, quel partage a amené le visiteur
 * (ex. utm_source=whatsapp&utm_campaign=floride-14nov) — là où la source seule
 * ne donne que le canal. Lue une fois à l'arrivée, gardée pour la session.
 */
export function etiquetteDepuis(params: URLSearchParams): Etiquette {
  return {
    utmSource: champEtiquette(params.get("utm_source"), 60),
    utmMedium: champEtiquette(params.get("utm_medium"), 60),
    utmCampaign: champEtiquette(params.get("utm_campaign"), 80),
  };
}

/** Le site d'origine complet, gardé seulement s'il est extérieur au site (300 caractères max). */
export function referrerExterne(referrer: string | null, hoteLocal: string | null): string | null {
  const brut = referrer?.trim();
  if (!brut) return null;
  try {
    const u = new URL(brut);
    if (!u.hostname || u.hostname === hoteLocal) return null;
    return brut.slice(0, 300);
  } catch {
    return null;
  }
}

/** Adresse d'une fiche : /evenements/<slug>, sans sous-page. */
export function slugEvenement(chemin: string): string | null {
  const m = /^\/evenements\/([a-z0-9-]{1,120})\/?$/.exec(chemin);
  return m ? m[1] : null;
}

export function appareilDepuis(ecranTactile: boolean): "mobile" | "ordinateur" {
  return ecranTactile ? "mobile" : "ordinateur";
}

/**
 * La détection des robots vit en un seul endroit : la fonction SQL `ua_est_robot`
 * (migration 20261113230000). La route /api/mesure transmet le user-agent à la base,
 * qui marque les visites et les battements de présence des robots pour les écarter
 * des statistiques. Rien à décider côté client ou côté route.
 */
