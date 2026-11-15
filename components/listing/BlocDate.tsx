"use client";

import { useEffect, useState } from "react";
import { couleurDominante, styleBlocDate, type Rgb } from "@/lib/listing/couleur-flyer";
import { formaterPastille } from "@/lib/listing/dates";

/**
 * Couleurs déjà tirées d'un flyer, par URL : un même flyer apparaît
 * souvent plusieurs fois sur une page (carrousel, cartes), un seul
 * échantillonnage suffit. `null` = échec connu (image illisible), on ne
 * réessaie pas à chaque rendu.
 */
const cache = new Map<string, Rgb | null>();

/**
 * Échantillonne un flyer sur un minuscule canvas (24×24) et en tire la
 * couleur dominante. Les flyers du site passent par l'optimiseur d'images
 * (même origine) ou le stockage Supabase : le canvas n'est normalement pas
 * bloqué. Toute erreur (CORS, image cassée) résout à `null` — le bloc
 * garde alors son fond sombre de repli, il ne casse jamais.
 */
function echantillonner(url: string): Promise<Rgb | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, 24, 24);
        resolve(couleurDominante(ctx.getImageData(0, 0, 24, 24).data));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Bloc date posé sur un flyer (demande de Smith, 15 nov. 2026) : le grand
 * numéro du jour, le mois en capitales dessous, aux couleurs du flyer
 * lui-même — fond = couleur vive dominante de l'image, texte blanc ou
 * encre selon la luminance. `flyerUrl` doit être une petite version de
 * l'image (largeur 128 de l'optimiseur) : l'échantillon n'a pas besoin de
 * plus. Sans flyer ou en cas d'échec, fond sombre translucide, texte blanc.
 */
export function BlocDate({
  iso,
  fuseau,
  flyerUrl,
  grand = false,
  className = "",
}: {
  iso: string;
  fuseau?: string;
  flyerUrl?: string | null;
  grand?: boolean;
  className?: string;
}) {
  const { jour, mois } = formaterPastille(iso, fuseau);
  // La couleur suit l'URL courante : quand le carrousel tourne, le bloc du
  // nouveau panneau ne garde pas la couleur du précédent.
  const [etat, setEtat] = useState<{ url: string | null; rgb: Rgb | null }>(() => ({
    url: flyerUrl ?? null,
    rgb: flyerUrl ? (cache.get(flyerUrl) ?? null) : null,
  }));

  useEffect(() => {
    if (!flyerUrl) return;
    let annule = false;
    if (cache.has(flyerUrl)) {
      const c = cache.get(flyerUrl) ?? null;
      Promise.resolve().then(() => {
        if (!annule) setEtat({ url: flyerUrl, rgb: c });
      });
    } else {
      echantillonner(flyerUrl).then((c) => {
        cache.set(flyerUrl, c);
        if (!annule) setEtat({ url: flyerUrl, rgb: c });
      });
    }
    return () => {
      annule = true;
    };
  }, [flyerUrl]);

  const rgb = !flyerUrl ? null : etat.url === flyerUrl ? etat.rgb : (cache.get(flyerUrl) ?? null);
  const style = styleBlocDate(rgb);
  return (
    <span
      className={`flex flex-col items-center justify-center rounded-[10px] leading-none shadow-[0_6px_16px_rgba(0,0,0,0.35)] ${
        grand ? "min-w-[64px] px-3 py-2" : "min-w-[46px] px-2 py-1.5"
      } ${className}`}
      style={style}
    >
      <span className={`font-[family-name:var(--font-display)] font-black ${grand ? "text-[30px]" : "text-[21px]"}`}>{jour}</span>
      <span className={`mt-1 font-extrabold tracking-[0.14em] uppercase ${grand ? "text-[12px]" : "text-[10px]"}`}>{mois}</span>
    </span>
  );
}
