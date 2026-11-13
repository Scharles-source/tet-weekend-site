import { artistesDepuisDescription, langueEvenement, lieuDepuisDescription } from "./faits.ts";
import { slugifier } from "./slug.ts";
import { nomVilleCanonique } from "./villes.ts";
import type { EvenementPublic } from "./types.ts";

function memeVille(a: string, b: string): boolean {
  try {
    return slugifier(a) === slugifier(b);
  } catch {
    return false;
  }
}

/**
 * Découpe le lieu énoncé en nom + adresse : « Karibe Hotel, Juvénat 7,
 * Pétion-Ville » → nom « Karibe Hotel », adresse « Juvénat 7 ». Le dernier
 * segment est retiré quand c'est la ville elle-même ; le tiret cadratin
 * (« Punch Line Irving — Dallas ») joue le même rôle que la virgule.
 */
function decouperLieu(texte: string, ville: string | null): { nom: string; rue: string | null } {
  const parties = texte
    .split(/\s+—\s+|,\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parties.length <= 1) return { nom: texte, rue: null };
  const reste = [...parties.slice(1)];
  if (ville && reste.length > 0 && memeVille(reste[reste.length - 1], ville)) reste.pop();
  return { nom: parties[0], rue: reste.length > 0 ? reste.join(", ") : null };
}

/** Faits seulement. Pas d'offre schema.org tant que le prix n'est pas un nombre séparé de la devise. */
export function jsonLdEvenement(e: EvenementPublic, url: string): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.titre,
    startDate: e.date_debut,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage: langueEvenement(e.titre, e.description),
    url,
  };
  if (e.date_fin) data.endDate = e.date_fin;
  if (e.description) data.description = e.description;
  if (e.flyer?.publicUrl) data.image = e.flyer.publicUrl;
  const ville = e.ville ? nomVilleCanonique(e.ville) : (e.lieu?.ville ?? null);
  if (e.lieu) {
    const adresse: Record<string, string> = { "@type": "PostalAddress" };
    if (e.lieu.adresse) adresse.streetAddress = e.lieu.adresse;
    if (ville) adresse.addressLocality = ville;
    if (e.lieu.pays) adresse.addressCountry = e.lieu.pays;
    data.location = { "@type": "Place", name: e.lieu.nom, address: adresse };
  } else {
    const lieuTexte = lieuDepuisDescription(e.description);
    if (lieuTexte) {
      const { nom, rue } = decouperLieu(lieuTexte, ville);
      const adresse: Record<string, string> = { "@type": "PostalAddress" };
      if (rue) adresse.streetAddress = rue;
      if (ville) adresse.addressLocality = ville;
      data.location = { "@type": "Place", name: nom, address: adresse };
    } else if (ville) {
      data.location = {
        "@type": "Place",
        name: ville,
        address: { "@type": "PostalAddress", addressLocality: ville },
      };
    }
  }
  if (e.artistes.length > 0) {
    data.performer = e.artistes.map((a) => ({
      "@type": a.type === "groupe" ? "PerformingGroup" : "Person",
      name: a.nom,
      url: `https://www.tetweekend.com/artistes/${a.slug}`,
    }));
  } else {
    const noms = artistesDepuisDescription(e.description);
    if (noms.length > 0) {
      data.performer = noms.map((nom) => ({ "@type": "PerformingGroup", name: nom }));
    }
  }
  return data;
}
