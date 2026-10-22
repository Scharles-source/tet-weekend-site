import type { EvenementPublic } from "./types.ts";

/** Faits seulement. Pas d'offre schema.org tant que le prix n'est pas un nombre séparé de la devise. */
export function jsonLdEvenement(e: EvenementPublic, url: string): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.titre,
    startDate: e.date_debut,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage: "fr",
    url,
  };
  if (e.date_fin) data.endDate = e.date_fin;
  if (e.description) data.description = e.description;
  if (e.flyer?.publicUrl) data.image = e.flyer.publicUrl;
  const nomLieu = e.lieu?.nom ?? e.ville;
  if (nomLieu) {
    const adresse: Record<string, string> = { "@type": "PostalAddress" };
    if (e.lieu?.adresse) adresse.streetAddress = e.lieu.adresse;
    const localite = e.ville ?? e.lieu?.ville;
    if (localite) adresse.addressLocality = localite;
    if (e.lieu?.pays) adresse.addressCountry = e.lieu.pays;
    data.location = { "@type": "Place", name: nomLieu, address: adresse };
  }
  if (e.artistes.length > 0) {
    data.performer = e.artistes.map((a) => ({
      "@type": a.type === "groupe" ? "PerformingGroup" : "Person",
      name: a.nom,
      url: `https://www.tetweekend.com/artistes/${a.slug}`,
    }));
  }
  return data;
}
