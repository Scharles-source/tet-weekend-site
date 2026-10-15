import type { Metadata } from "next";
import Repertoire, { type CarteRestaurant } from "@/components/menus/Repertoire";
import { Gabarit, MessageErreurDonnees } from "@/components/menus/Gabarit";
import { lireRepertoire } from "@/lib/menus/data";
import { etatArticle, fourchettePlats, fraicheur, offresEnCours, prixMinHtg } from "@/lib/menus/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tèt Weekend — Menus & Budgets à Pétion-Ville et Delmas",
  description:
    "Consultez le menu et les prix des restaurants de Pétion-Ville et Delmas, et calculez votre budget avant de sortir.",
};

export default async function AccueilMenus() {
  let donnees: Awaited<ReturnType<typeof lireRepertoire>>;
  try {
    donnees = await lireRepertoire();
  } catch (e) {
    return (
      <Gabarit>
        <Entete />
        <MessageErreurDonnees erreur={e} />
      </Gabarit>
    );
  }

  const { restaurants, items, reglages } = donnees;
  const maintenant = new Date();
  const cartes: CarteRestaurant[] = restaurants.map((r) => {
    const menu = items.filter((i) => i.restaurant_id === r.id);
    const f = fourchettePlats(r, menu, reglages.tauxGlobal);
    const offres = offresEnCours(menu, maintenant);
    return {
      slug: r.slug,
      nom: r.nom,
      zones: r.zones,
      quartier: r.quartier,
      typeCuisine: r.type_cuisine,
      nbArticles: menu.length,
      offres: offres.slice(0, 2).map((o) => ({
        id: o.id,
        categorie: o.categorie,
        nom: o.nom,
        prix: o.prix,
        devise: o.devise,
        date: etatArticle(o, maintenant).date,
      })),
      autresOffres: Math.max(0, offres.length - 2),
      fourchette: f,
      prixMinHtg: f ? prixMinHtg(f, r.taux_htg_usd ?? reglages.tauxGlobal) : null,
      fraicheur: fraicheur(r.date_dernier_releve, maintenant),
    };
  });

  return (
    <Gabarit>
      <Entete />
      <Repertoire cartes={cartes} />
    </Gabarit>
  );
}

function Entete() {
  return (
    <header className="mb-6">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-[clamp(26px,6vw,40px)] font-extrabold leading-tight tracking-tight">
        Menus &amp; Budgets
      </h1>
      <p className="text-[15px] text-[var(--text-sec)]">
        Le menu et les prix des restaurants de Pétion-Ville et Delmas, avant de sortir. Calculez votre budget depuis
        votre téléphone, sans compte.
      </p>
    </header>
  );
}
