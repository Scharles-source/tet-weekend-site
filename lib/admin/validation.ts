import { CATEGORIES_MENU, DEVISES, STATUTS, type CategorieMenu, type DeviseMenu, type StatutRestaurant } from "./schema.ts";

export class SaisieInvalide extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaisieInvalide";
  }
}

export function statutValide(v: string): StatutRestaurant {
  if ((STATUTS as readonly string[]).includes(v)) return v as StatutRestaurant;
  throw new SaisieInvalide(
    `Statut invalide « ${v} ». Valeurs acceptées : brouillon, publie, retire (sans accent).`
  );
}

function vide(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

export function texteOuNull(v: unknown): string | null {
  if (vide(v)) return null;
  return String(v).trim();
}

export function dateOuNull(v: unknown, champ: string): string | null {
  const t = texteOuNull(v);
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    throw new SaisieInvalide(`${champ} : date AAAA-MM-JJ attendue, reçu « ${t} ».`);
  }
  return t;
}

export function urlOuNull(v: unknown): string | null {
  const t = texteOuNull(v);
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) throw new SaisieInvalide("source_url doit commencer par http:// ou https://.");
  return t;
}

export interface ArticleSaisi {
  restaurant_id: string;
  categorie: CategorieMenu;
  nom: string;
  description: string | null;
  prix: number;
  devise: DeviseMenu;
  disponible: boolean;
  source_url: string | null;
  date_releve: string | null;
  valide_du: string | null;
  valide_au: string | null;
  a_verifier: boolean;
}

export function validerArticle(brut: Record<string, unknown>): ArticleSaisi {
  const restaurant_id = texteOuNull(brut.restaurant_id);
  if (!restaurant_id) throw new SaisieInvalide("Restaurant manquant.");

  const categorie = texteOuNull(brut.categorie);
  if (!categorie || !(CATEGORIES_MENU as readonly string[]).includes(categorie)) {
    throw new SaisieInvalide("Catégorie invalide ou absente.");
  }

  const nom = texteOuNull(brut.nom);
  if (!nom) throw new SaisieInvalide("Le nom du plat est obligatoire.");

  if (vide(brut.prix)) throw new SaisieInvalide("Le prix est obligatoire (ne pas inventer de prix).");
  const prix = Number(String(brut.prix).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(prix) || prix < 0) throw new SaisieInvalide("Prix invalide.");

  const devise = texteOuNull(brut.devise);
  if (!devise || !(DEVISES as readonly string[]).includes(devise)) {
    throw new SaisieInvalide("Devise obligatoire : HTG ou USD.");
  }

  const valide_du = dateOuNull(brut.valide_du, "valide_du");
  const valide_au = dateOuNull(brut.valide_au, "valide_au");
  if (valide_du && valide_au && valide_du > valide_au) {
    throw new SaisieInvalide("valide_du est après valide_au.");
  }

  return {
    restaurant_id,
    categorie: categorie as CategorieMenu,
    nom,
    description: texteOuNull(brut.description),
    prix,
    devise: devise as DeviseMenu,
    disponible: brut.disponible === true || brut.disponible === "true" || brut.disponible === "oui",
    source_url: urlOuNull(brut.source_url),
    date_releve: dateOuNull(brut.date_releve, "date_releve"),
    valide_du,
    valide_au,
    a_verifier: brut.a_verifier === true || brut.a_verifier === "true" || brut.a_verifier === "oui",
  };
}
