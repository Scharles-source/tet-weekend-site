import { SaisieInvalide } from "../listing/erreurs.ts";

export interface ChampsApprobation {
  titre: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  fuseau: string;
  ville: string | null;
  lieu: string | null;
  artistes: string | null;
  prix: string | null;
  gratuit: boolean;
  categorie: string | null;
  description: string | null;
}

/** Le runner n'appelle pas cette fonction. Publier exige publish === true. */
export function preparerEvenementDepuisCandidat(
  champs: ChampsApprobation,
  publish: boolean | undefined,
  flyerPrive: string | null,
): { statut: "brouillon" | "publie"; flyerPublic: string | null; prix: string | null } {
  if (!champs.titre?.trim()) throw new SaisieInvalide("Le titre est obligatoire pour créer le brouillon.");
  if (!champs.dateDebut?.trim()) throw new SaisieInvalide("La date est obligatoire pour créer le brouillon.");
  return {
    statut: publish === true ? "publie" : "brouillon",
    flyerPublic: flyerPrive ? flyerPrive.replace(/^candidats\//, "flyers/") : null,
    prix: champs.gratuit ? "Gratuit" : champs.prix?.trim() || null,
  };
}
