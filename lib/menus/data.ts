import type { MenuItem, Reglages, Restaurant } from "./types.ts";

export class ConfigurationSupabaseManquante extends Error {
  constructor(manquantes: string[]) {
    super(
      `Configuration Supabase manquante : ${manquantes.join(", ")}. ` +
        "Ajoutez ces variables d'environnement (Vercel ou .env.local) puis redéployez."
    );
    this.name = "ConfigurationSupabaseManquante";
  }
}

export class ErreurDonnees extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurDonnees";
  }
}

const REVALIDATION_SECONDES = 300;

const COLONNES_RESTAURANT = [
  "id", "slug", "nom", "zones", "quartier", "adresse", "point_repere", "latitude", "longitude",
  "whatsapp", "telephone", "instagram", "horaires", "jours_fermeture", "heure_limite_cuisine",
  "type_cuisine", "ambiance", "devise", "taux_htg_usd", "taxe_pct", "taxe_incluse", "service_pct", "service_inclus",
  "parking_garde", "groupe_electrogene", "climatisation", "terrasse", "modes_paiement",
  "photo_carte_url", "date_dernier_releve",
].join(",");

const COLONNES_MENU = "id,restaurant_id,categorie,nom,description,prix,devise,disponible,ordre";

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const manquantes = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !cle && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter((v): v is string => Boolean(v));
  if (manquantes.length > 0) throw new ConfigurationSupabaseManquante(manquantes);
  return { url: (url as string).replace(/\/+$/, ""), cle: cle as string };
}

async function lire<T>(chemin: string): Promise<T> {
  const { url, cle } = configuration();
  let res: Response;
  try {
    res = await fetch(`${url}/rest/v1/${chemin}`, {
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, Accept: "application/json" },
      next: { revalidate: REVALIDATION_SECONDES, tags: ["menus-public"] },
    });
  } catch {
    throw new ErreurDonnees("Impossible de joindre la base de données. Réessayez dans un instant.");
  }
  if (!res.ok) {
    throw new ErreurDonnees(`La base de données a répondu ${res.status}. Réessayez dans un instant.`);
  }
  return (await res.json()) as T;
}

const nombreOuNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function normaliserRestaurant(r: Restaurant): Restaurant {
  return {
    ...r,
    latitude: nombreOuNull(r.latitude),
    longitude: nombreOuNull(r.longitude),
    taux_htg_usd: nombreOuNull(r.taux_htg_usd),
    taxe_pct: nombreOuNull(r.taxe_pct),
    service_pct: nombreOuNull(r.service_pct),
  };
}

function normaliserItem(i: MenuItem): MenuItem {
  return { ...i, prix: Number(i.prix), ordre: Number(i.ordre) };
}

export async function lireReglages(): Promise<Reglages> {
  const lignes = await lire<{ cle: string; valeur: string | null }[]>("settings?select=cle,valeur");
  const valeur = (cle: string) => {
    const v = lignes.find((l) => l.cle === cle)?.valeur?.trim();
    return v ? v : null;
  };
  const taux = nombreOuNull(valeur("taux_htg_usd"));
  return {
    tauxGlobal: taux !== null && taux > 0 ? taux : null,
    contactEmail: valeur("contact_email"),
    contactWhatsapp: valeur("contact_whatsapp"),
  };
}

/** Répertoire public : statut publié (RLS) ET au moins un article au menu. */
export async function lireRepertoire(): Promise<{ restaurants: Restaurant[]; items: MenuItem[]; reglages: Reglages }> {
  const [restaurants, items, reglages] = await Promise.all([
    lire<Restaurant[]>(`restaurants?select=${COLONNES_RESTAURANT}&statut=eq.publie&order=nom.asc`),
    lire<MenuItem[]>(`menu_items?select=${COLONNES_MENU}`),
    lireReglages(),
  ]);
  const avecMenu = new Set(items.map((i) => i.restaurant_id));
  return {
    restaurants: restaurants.filter((r) => avecMenu.has(r.id)).map(normaliserRestaurant),
    items: items.map(normaliserItem),
    reglages,
  };
}

export async function lireRestaurant(
  slug: string
): Promise<{ restaurant: Restaurant; items: MenuItem[]; reglages: Reglages } | null> {
  const [trouves, reglages] = await Promise.all([
    lire<Restaurant[]>(
      `restaurants?select=${COLONNES_RESTAURANT}&statut=eq.publie&slug=eq.${encodeURIComponent(slug)}&limit=1`
    ),
    lireReglages(),
  ]);
  const restaurant = trouves[0];
  if (!restaurant) return null;
  const items = await lire<MenuItem[]>(
    `menu_items?select=${COLONNES_MENU}&restaurant_id=eq.${restaurant.id}&order=ordre.asc,nom.asc`
  );
  return { restaurant: normaliserRestaurant(restaurant), items: items.map(normaliserItem), reglages };
}
