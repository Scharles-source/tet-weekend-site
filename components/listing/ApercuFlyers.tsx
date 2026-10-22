"use client";

import { CarteEvenement, ZoneFlyer } from "@/components/listing/CarteEvenement";
import type { EvenementPublic } from "@/lib/listing/types";

export function ApercuFlyers() {
  const portrait = evenement("Aperçu portrait", "/apercu-flyer/portrait.png", 480, 600);
  const carre = evenement("Aperçu carré", "/apercu-flyer/carre.png", 480, 480);
  const paysage = evenement("Aperçu paysage", "/apercu-flyer/paysage.png", 640, 360);
  const sans = { ...portrait, titre: "Sans flyer", flyer: null };
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">Aperçu des flyers</h1>
        <p className="text-sm text-[var(--text-sec)]">Images locales, hors base de production.</p>
      </header>
      <section id="sans-flyer">
        <h2 className="mb-3 font-bold">Sans flyer</h2>
        <div className="w-[390px] max-w-full"><CarteEvenement evenement={sans} /></div>
      </section>
      <section id="cartes-desktop" className="space-y-4">
        <h2 className="font-bold">Cartes desktop</h2>
        <CarteEvenement evenement={portrait} />
        <CarteEvenement evenement={carre} />
        <CarteEvenement evenement={paysage} />
      </section>
      <section id="cartes-mobile" className="space-y-4">
        <h2 className="font-bold">Cartes 390 px</h2>
        <div className="w-[390px] max-w-full space-y-4">
          <CarteEvenement evenement={portrait} />
          <CarteEvenement evenement={carre} />
          <CarteEvenement evenement={paysage} />
        </div>
      </section>
      <section id="page-evenement">
        <h2 className="mb-3 font-bold">Page événement</h2>
        <ZoneFlyer evenement={portrait} />
        <h3 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{portrait.titre}</h3>
      </section>
    </div>
  );
}

function evenement(titre: string, url: string, width: number, height: number): EvenementPublic {
  return {
    id: titre,
    slug: "apercu",
    titre,
    date_debut: "2026-10-24T21:00:00.000Z",
    date_fin: null,
    ville: "Pétion-Ville",
    description: null,
    prix: null,
    source: "instagram",
    source_url: "https://instagram.com/p/apercu",
    source_account: "@apercu",
    categorie: "bals",
    fuseau: "America/Port-au-Prince",
    lieu: { id: "l", slug: "yanvalou", nom: "Yanvalou", ville: "Pétion-Ville", pays: "Haïti", adresse: null, type: null, description: null, instagram: null, facebook: null, site_web: null },
    artistes: [],
    flyer: { publicUrl: url, cardUrl: null, width, height, mimeType: "image/png", alt: `Flyer — ${titre}`, credit: "@apercu" },
  };
}
