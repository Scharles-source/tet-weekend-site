import type { Metadata } from "next";
import { AccueilPublic } from "@/components/listing/AccueilPublic";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { choisirBanniere } from "@/lib/listing/banniere";
import { chargerAnnuaire, emailContact } from "@/lib/listing/data";
import { dansLeWeekend, estTermine } from "@/lib/listing/dates";
import { dansLaPeriode } from "@/lib/listing/periode";
import type { EvenementPublic } from "@/lib/listing/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Tèt Weekend — Haitian Events";
  // Site basculé en anglais le 13 nov. 2026 (décision de Smith) : meta en
  // anglais, longueur que Google ne tronque pas.
  const description =
    "Haitian events this weekend and coming up: bals, concerts and kompa parties in Haiti and across the diaspora. Tèt Weekend does not sell tickets.";
  // Image de partage : le flyer d'un événement à venir plutôt que le logo.
  let image: string | null = null;
  let imageAlt = "Tèt Weekend";
  try {
    const charge = await chargerAnnuaire();
    if (charge.ok) {
      const avecFlyer = charge.annuaire.evenements
        .filter((e) => !estTermine(e))
        .find((e) => e.flyer?.publicUrl);
      if (avecFlyer?.flyer) {
        image = avecFlyer.flyer.publicUrl;
        imageAlt = avecFlyer.flyer.alt;
      }
    }
  } catch {
    /* repli sur le logo ci-dessous */
  }
  const images = image
    ? [{ url: image, alt: imageAlt }]
    : [{ url: "/partage-tw.png", width: 1200, height: 630, alt: "Tèt Weekend" }];
  return {
    title,
    description,
    alternates: { canonical: "https://www.tetweekend.com" },
    openGraph: {
      title,
      description,
      url: "https://www.tetweekend.com",
      siteName: "Tèt Weekend",
      locale: "en_US",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image ?? "/partage-tw.png"],
    },
  };
}

export default async function Accueil() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit large>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const aVenir = charge.annuaire.evenements.filter((e) => !estTermine(e));
  // Premier jeu rendu côté serveur (correctif audit 13 nov. 2026) : ce soir,
  // ce weekend et les prochains à venir, plafonné à 40 — l'HTML initial ne
  // transporte plus les ~150 événements (508 Ko mesurés). La liste complète
  // arrive par /api/annuaire seulement quand un filtre est activé.
  const prioritaires = new Set(
    aVenir
      .filter((e) => dansLaPeriode(e.date_debut, "ce-soir") || dansLeWeekend(e.date_debut))
      .map((e) => e.id),
  );
  const initiaux: EvenementPublic[] = [];
  for (const e of aVenir) {
    if (prioritaires.has(e.id) || initiaux.length < 40) initiaux.push(e);
  }
  const compte = new Map<string, number>();
  for (const e of aVenir) if (e.ville) compte.set(e.ville, (compte.get(e.ville) ?? 0) + 1);
  const comptesVilles = [...compte.entries()].sort((a, b) => b[1] - a[1]);
  const email = await emailContact();
  return (
    <Gabarit large>
      <AccueilPublic evenements={initiaux} comptesVilles={comptesVilles} total={aVenir.length} panneaux={choisirBanniere(aVenir)} email={email} />
    </Gabarit>
  );
}
