"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Bouton retour des fiches (événement, lieu, artiste) : bien visible en
 * haut de page, atteignable au pouce. Si le visiteur vient d'une autre
 * page du site (le marqueur de parcours connaît une page précédente et
 * l'historique du navigateur a de la profondeur), il revient en arrière
 * dans l'historique — il retrouve donc la liste exactement où il l'avait
 * laissée. S'il est arrivé directement sur la fiche (lien partagé, moteur
 * de recherche), il n'y a rien à « revenir » : le bouton mène à la page
 * parente donnée en repli (l'accueil pour un événement, /lieux, /artistes).
 */
export function BoutonRetour({ repli = "/" }: { repli?: string }) {
  const router = useRouter();

  function retour() {
    let interne = false;
    try {
      const brut = sessionStorage.getItem("tw_trajet");
      if (brut) {
        const trajet = JSON.parse(brut) as { precedent?: string | null };
        interne = Boolean(trajet.precedent) && trajet.precedent !== window.location.pathname;
      }
    } catch {
      /* stockage indisponible : repli */
    }
    if (interne && window.history.length > 1) router.back();
    else router.push(repli);
  }

  return (
    <button
      type="button"
      onClick={retour}
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 text-sm font-bold text-[var(--nuit-texte)]"
    >
      <ArrowLeft size={17} aria-hidden="true" />
      Back
    </button>
  );
}
