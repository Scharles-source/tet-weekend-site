import type { MetadataRoute } from "next";
import { lireAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { CATEGORIES } from "@/lib/listing/schema";
import { slugVille, villesDe } from "@/lib/listing/villes";

const SITE = "https://www.tetweekend.com";

/** lastmod seulement quand la date de modification est connue — jamais de date inventée. */
function avecLastmod<T extends object>(entree: T, modifieLe: string | null | undefined): T & { lastModified?: Date } {
  if (!modifieLe) return entree;
  const date = new Date(modifieLe);
  return Number.isNaN(date.getTime()) ? entree : { ...entree, lastModified: date };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/evenements`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/decembre`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/reveillon`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/lieux`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/artistes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/villes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/categories`, changeFrequency: "weekly", priority: 0.5 },
    ...CATEGORIES.map((c) => ({ url: `${SITE}/categories/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
  try {
    const annuaire = await lireAnnuaire();
    const aVenir = annuaire.evenements.filter((e) => !estTermine(e));
    // Villes : seulement celles qui ont au moins un événement à venir.
    // Les pages villes sans rien à venir (ou les variantes dupliquées d'un
    // même nom) diluaient le sitemap en contenu mince (correctif SEO,
    // 13 nov. 2026). La page reste joignable par la navigation du site.
    const villes = villesDe({ lieux: [], evenements: aVenir });
    const modifParVille = new Map<string, string>();
    for (const e of aVenir) {
      if (!e.ville || !e.modifie_le) continue;
      const slug = slugVille(e.ville);
      const actuel = modifParVille.get(slug);
      if (!actuel || e.modifie_le > actuel) modifParVille.set(slug, e.modifie_le);
    }
    return [
      ...fixes,
      ...annuaire.lieux.map((l) =>
        avecLastmod({ url: `${SITE}/lieux/${l.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }, l.modifie_le),
      ),
      ...annuaire.artistes.map((a) =>
        avecLastmod({ url: `${SITE}/artistes/${a.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }, a.modifie_le),
      ),
      ...villes.map((v) =>
        avecLastmod({ url: `${SITE}/villes/${v.slug}`, changeFrequency: "daily" as const, priority: 0.7 }, modifParVille.get(v.slug)),
      ),
      ...aVenir.map((e) =>
        avecLastmod({ url: `${SITE}/evenements/${e.slug}`, changeFrequency: "daily" as const, priority: 0.8 }, e.modifie_le),
      ),
    ];
  } catch {
    return fixes;
  }
}
