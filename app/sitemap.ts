import type { MetadataRoute } from "next";
import { lireAnnuaire } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";
import { evenementDuMarche, MARCHES } from "@/lib/listing/marches";
import { CATEGORIES } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";
import { slugVille, villesDe } from "@/lib/listing/villes";

const SITE = "https://www.tetweekend.com";

/** lastmod seulement quand la date de modification est connue — jamais de date inventée. */
function avecLastmod<T extends object>(entree: T, modifieLe: string | null | undefined): T & { lastModified?: Date } {
  if (!modifieLe) return entree;
  const date = new Date(modifieLe);
  return Number.isNaN(date.getTime()) ? entree : { ...entree, lastModified: date };
}

/** Modification la plus récente d'un ensemble d'événements (null si aucune date connue). */
function derniereModif(evenements: EvenementPublic[]): string | null {
  let max: string | null = null;
  for (const e of evenements) {
    if (e.modifie_le && (!max || e.modifie_le > max)) max = e.modifie_le;
  }
  return max;
}

/** Image de sitemap : seulement une URL absolue http(s), publiquement joignable. */
function imageAbsolue(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
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
    // Pages marchés en anglais (13 nov. 2026, Montréal ajoutée le 15 nov.) :
    // New York, Floride, Massachusetts, Montréal, Haïti — les requêtes de la diaspora.
    ...MARCHES.map((m) => ({ url: `${SITE}/haitian-events/${m.slug}`, changeFrequency: "daily" as const, priority: 0.9 })),
  ];
  try {
    const annuaire = await lireAnnuaire();
    const aVenir = annuaire.evenements.filter((e) => !estTermine(e));
    // Pages fixes, marchés et catégories : lastmod = modification la plus
    // récente des événements à venir qu'elles rassemblent (globale pour
    // l'accueil et les pages de saison, par marché et par catégorie sinon).
    const modifGlobale = derniereModif(aVenir);
    const fixesAvecDates: MetadataRoute.Sitemap = [
      avecLastmod({ url: SITE, changeFrequency: "daily", priority: 1 }, modifGlobale),
      avecLastmod({ url: `${SITE}/evenements`, changeFrequency: "daily", priority: 0.8 }, modifGlobale),
      avecLastmod({ url: `${SITE}/decembre`, changeFrequency: "daily", priority: 0.9 }, modifGlobale),
      avecLastmod({ url: `${SITE}/reveillon`, changeFrequency: "daily", priority: 0.9 }, modifGlobale),
      { url: `${SITE}/lieux`, changeFrequency: "weekly", priority: 0.6 },
      { url: `${SITE}/artistes`, changeFrequency: "weekly", priority: 0.6 },
      { url: `${SITE}/villes`, changeFrequency: "weekly", priority: 0.6 },
      { url: `${SITE}/categories`, changeFrequency: "weekly", priority: 0.5 },
      ...CATEGORIES.map((c) =>
        avecLastmod(
          { url: `${SITE}/categories/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 },
          derniereModif(aVenir.filter((e) => e.categorie === c.slug)),
        ),
      ),
      ...MARCHES.map((m) =>
        avecLastmod(
          { url: `${SITE}/haitian-events/${m.slug}`, changeFrequency: "daily" as const, priority: 0.9 },
          derniereModif(aVenir.filter((e) => evenementDuMarche(e, m))),
        ),
      ),
    ];
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
      ...fixesAvecDates,
      ...annuaire.lieux.map((l) =>
        avecLastmod({ url: `${SITE}/lieux/${l.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }, l.modifie_le),
      ),
      ...annuaire.artistes.map((a) =>
        avecLastmod({ url: `${SITE}/artistes/${a.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }, a.modifie_le),
      ),
      ...villes.map((v) =>
        avecLastmod({ url: `${SITE}/villes/${v.slug}`, changeFrequency: "daily" as const, priority: 0.7 }, modifParVille.get(v.slug)),
      ),
      // Événements : le flyer public part dans le sitemap images (Google
      // Images est une porte d'entrée réelle pour des affiches d'événements).
      ...aVenir.map((e) => {
        const entree = avecLastmod(
          { url: `${SITE}/evenements/${e.slug}`, changeFrequency: "daily" as const, priority: 0.8 },
          e.modifie_le,
        );
        const image = imageAbsolue(e.flyer?.publicUrl);
        return image ? { ...entree, images: [image] } : entree;
      }),
    ];
  } catch {
    return fixes;
  }
}
