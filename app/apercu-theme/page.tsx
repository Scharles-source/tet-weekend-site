import { notFound } from "next/navigation";
import { SectionEvenements } from "@/components/admin/SectionEvenements";
import { AccueilPublic } from "@/components/listing/AccueilPublic";
import { BanniereVide } from "@/components/listing/BanniereAccueil";
import { Gabarit } from "@/components/listing/Gabarit";
import type { EvenementPublic } from "@/lib/listing/types";

export const dynamic = "force-dynamic";

const EMAIL = "smithcharles8484@gmail.com";

export default function ApercuTheme() {
  if (process.env.NODE_ENV === "production") notFound();
  const sponsor = fictif("bal-fictif", "Bal fictif", "2026-10-24T02:00:00.000Z", true);
  const tendance = fictif("soiree-fictive", "Soirée fictive", "2026-10-25T01:00:00.000Z", false);
  const suite = fictif("concert-fictif", "Concert fictif", "2026-12-20T02:00:00.000Z", false);
  return (
    <>
      <Gabarit>
        <AccueilPublic
          evenements={[sponsor, tendance, suite]}
          panneaux={[
            { evenement: sponsor, sponsorise: true },
            { evenement: tendance, sponsorise: false },
          ]}
          email={EMAIL}
          auto={false}
        />
        <div className="mt-8">
          <BanniereVide email={EMAIL} />
        </div>
      </Gabarit>
      <div id="admin-sponsoring" className="bg-[#0A0A0C] px-4 py-8 text-[#F5F2ED]">
        <SectionEvenements lieux={[]} artistes={[]} evenements={[]} />
      </div>
    </>
  );
}

function fictif(slug: string, titre: string, date: string, flyer: boolean): EvenementPublic {
  return {
    id: slug,
    slug,
    titre,
    date_debut: date,
    date_fin: null,
    ville: "Pétion-Ville",
    description: null,
    prix: flyer ? "30 $ US" : null,
    source: "manuel",
    source_url: null,
    source_account: null,
    categorie: "bals",
    fuseau: "America/Port-au-Prince",
    lieu: { id: "l", slug: "yanvalou", nom: "Yanvalou", ville: "Pétion-Ville", pays: null, adresse: null, type: null, description: null, instagram: null, facebook: null, site_web: null },
    artistes: [{ id: "a", slug: "dj-fictif", nom: "DJ fictif", type: "DJ", ville_base: null, bio: null, instagram: null, facebook: null, site_web: null }],
    flyer: flyer
      ? { publicUrl: "/apercu-flyer/portrait.png", cardUrl: null, width: 480, height: 600, mimeType: "image/png", alt: titre, credit: null }
      : null,
    sponsored_from: flyer ? "2026-10-01T00:00:00.000Z" : null,
    sponsored_to: flyer ? "2026-12-01T00:00:00.000Z" : null,
    vues: null,
  };
}
