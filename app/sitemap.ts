import type { MetadataRoute } from "next";
import { lireAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { CATEGORIES } from "@/lib/listing/schema";
import { villesDe } from "@/lib/listing/villes";

const SITE = "https://www.tetweekend.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/evenements`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/lieux`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/artistes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/villes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/categories`, changeFrequency: "weekly", priority: 0.5 },
    ...CATEGORIES.map((c) => ({ url: `${SITE}/categories/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
  try {
    const annuaire = await lireAnnuaire();
    const aVenir = annuaire.evenements.filter((e) => !estTermine(e));
    return [
      ...fixes,
      ...annuaire.lieux.map((l) => ({ url: `${SITE}/lieux/${l.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...annuaire.artistes.map((a) => ({ url: `${SITE}/artistes/${a.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...villesDe(annuaire).map((v) => ({ url: `${SITE}/villes/${v.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
      ...aVenir.map((e) => ({ url: `${SITE}/evenements/${e.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ];
  } catch {
    return fixes;
  }
}
