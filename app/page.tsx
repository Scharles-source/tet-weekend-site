import type { Metadata } from "next";
import { AccueilPublic } from "@/components/listing/AccueilPublic";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { choisirBanniere } from "@/lib/listing/banniere";
import { chargerAnnuaire, emailContact } from "@/lib/listing/data";
import { estTermine } from "@/lib/listing/dates";

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
    : [{ url: "/logotetweekend.png", width: 2000, height: 2000, alt: "Tèt Weekend" }];
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
      images: [image ?? "/logotetweekend.png"],
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
  const email = await emailContact();
  return (
    <Gabarit large>
      <AccueilPublic evenements={aVenir} panneaux={choisirBanniere(aVenir)} email={email} />
    </Gabarit>
  );
}
