"use client";

import { codeCourt, lienCourt } from "@/lib/listing/lien-court";

/**
 * Partage de la carte de l'événement en UN geste (décision de Smith, 16 nov. 2026) :
 * un appui sur « Invite friends » génère la carte — même visuel que l'ancienne feuille
 * de partage (flyer, date, lieu, lien court, « WHERE'S THE PARTY AT? ») — et ouvre
 * directement la feuille de partage native avec l'image jointe et le lien court dans
 * le texte. Aucun écran intermédiaire, aucune fenêtre à boutons.
 * Sans partage de fichier possible (ordinateur, par exemple) : l'image est téléchargée
 * et le lien court copié, confirmé par le petit message passé en `retour`.
 * Le lien partagé est toujours le lien court nu (tetweekend.com/e/<code>), sans paramètre ajouté.
 */
export async function partagerCarteEvenement(evenementId: string, titre: string, retour: (message: string) => void): Promise<void> {
  const code = codeCourt(evenementId);
  const url = lienCourt(evenementId);

  let fichier: File | null = null;
  try {
    const r = await fetch(`/api/story/${code}?v=partage`);
    if (r.ok) fichier = new File([await r.blob()], `event-${code}.png`, { type: "image/png" });
  } catch {
    fichier = null;
  }

  if (fichier) {
    const donnees: ShareData = { files: [fichier], text: `${titre || "Tèt Weekend"} ${url}` };
    if (typeof navigator.canShare === "function" && navigator.canShare(donnees)) {
      try {
        await navigator.share(donnees);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Feuille native refusée (activation expirée, etc.) : on bascule sur le repli ci-dessous, toujours en un geste.
      }
    }
    // Repli sans partage de fichier : téléchargement de l'image + copie du lien court.
    const objectUrl = URL.createObjectURL(fichier);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `event-${code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    try {
      await navigator.clipboard.writeText(url);
      retour("Image saved — link copied");
    } catch {
      retour(url);
    }
    return;
  }

  // La carte n'a pas pu être générée : partage du lien seul, toujours sans écran intermédiaire.
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: titre, url });
      return;
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(url);
    retour("Link copied");
  } catch {
    retour(url);
  }
}
