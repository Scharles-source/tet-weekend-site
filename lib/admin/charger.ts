import { clientServeur } from "./supabase.ts";
import type { CategorieMenu, DeviseMenu, StatutRestaurant } from "./schema.ts";

export interface ArticleAdmin {
  id: string;
  restaurant_id: string;
  categorie: CategorieMenu;
  nom: string;
  description: string | null;
  prix: number;
  devise: DeviseMenu;
  disponible: boolean;
  ordre: number;
  source_url: string | null;
  date_releve: string | null;
  valide_du: string | null;
  valide_au: string | null;
  a_verifier: boolean;
}

export interface RestaurantAdmin {
  id: string;
  slug: string;
  nom: string;
  zones: string[];
  statut: StatutRestaurant;
  date_dernier_releve: string | null;
  motif_retrait: string | null;
  articles: ArticleAdmin[];
}

function nombre(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function chargerRestaurants(): Promise<RestaurantAdmin[]> {
  const supabase = await clientServeur();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      `id, slug, nom, zones, statut, date_dernier_releve, motif_retrait,
       menu_items (id, restaurant_id, categorie, nom, description, prix, devise, disponible, ordre, source_url, date_releve, valide_du, valide_au, a_verifier)`
    )
    .order("nom", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => {
    const articles = ((r.menu_items ?? []) as ArticleAdmin[]).map((a) => ({
      ...a,
      prix: nombre(a.prix),
      a_verifier: Boolean(a.a_verifier),
      disponible: a.disponible !== false,
    }));
    articles.sort((a, b) => a.categorie.localeCompare(b.categorie, "fr") || a.ordre - b.ordre || a.nom.localeCompare(b.nom, "fr"));
    return {
      id: r.id,
      slug: r.slug,
      nom: r.nom,
      zones: r.zones ?? [],
      statut: r.statut,
      date_dernier_releve: r.date_dernier_releve,
      motif_retrait: r.motif_retrait,
      articles,
    };
  });
}
