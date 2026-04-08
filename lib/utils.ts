/** Force HTTP → HTTPS on flyer URLs from Firestore (mirrors app httpOnlyFlyerUrl()) */
export function httpOnlyFlyerUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}

/** Sanitize video URLs from Firestore (mirrors app sanitizeFirestoreVideoUrl()) */
export function sanitizeFirestoreVideoUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}

/** Format a price value: free if falsy or 0, else "$XX" or raw string */
export function formatPrice(price?: number | string | null): string {
  if (!price || price === 0 || price === "0" || price === "free") return "Gratuit";
  if (typeof price === "number") return `$${price}`;
  return String(price);
}

/** Format a date string or ISO to a readable label */
export function formatEventDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

/** Get first image URL from mediaStack or fallback to flyerUrl */
export function getEventThumbnail(
  mediaStack?: Array<{ kind: string; url: string }> | null,
  flyerUrl?: string | null
): string | null {
  if (mediaStack && mediaStack.length > 0) {
    const img = mediaStack.find((m) => m.kind === "image");
    if (img) return httpOnlyFlyerUrl(img.url);
  }
  return httpOnlyFlyerUrl(flyerUrl);
}

/** Map a category string to a display emoji */
export function categoryEmoji(category?: string): string {
  const map: Record<string, string> = {
    konpa: "🎶",
    compas: "🎶",
    rasin: "🥁",
    rara: "🎺",
    festival: "🎉",
    rap: "🎤",
    mizik: "🎵",
    gospel: "🙏",
    dance: "💃",
    sport: "⚽",
  };
  if (!category) return "🎵";
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return "🎵";
}
