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
 * D'où vient le visiteur : marqueur `?s=` du lien (le plus fiable), sinon site d'origine,
 * sinon navigateur intégré d'une application (Instagram, Facebook, TikTok), sinon accès direct.
 */
export function sourceDepuis(entrees: { marqueur?: string | null; referrer?: string | null; ua?: string | null; hoteLocal?: string | null }): Source {
  const marqueur = entrees.marqueur?.trim().toLowerCase();
  if (marqueur) return MARQUEURS[marqueur] ?? "autre";
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
