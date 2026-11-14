"use client";

import { useState } from "react";
import { codeCourt, lienCourt } from "@/lib/listing/lien-court";

/**
 * Feuille proposée juste après « I'm in » : la carte verticale de l'événement (flyer, date, I'm in, lien),
 * à poster en un geste dans une story Instagram ou un statut WhatsApp, ou à enregistrer.
 */
export function CarteStory({
  evenementId,
  titre,
  ouvert,
  onFermer,
  mode = "interet",
  secours,
}: {
  evenementId: string;
  titre: string;
  ouvert: boolean;
  onFermer: () => void;
  /** « interet » : après « I'm in » (macaron « I'm in » sur la carte). « partage » : bouton partager (même carte, sans le macaron). */
  mode?: "interet" | "partage";
  /** Partage du lien seul, si l'image de la carte ne se charge pas (mode « partage »). */
  secours?: () => void;
}) {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [imageKo, setImageKo] = useState(false);
  if (!ouvert) return null;

  const code = codeCourt(evenementId);
  const partage = mode === "partage";
  const src = partage ? `/api/story/${code}?v=partage` : `/api/story/${code}`;
  const nomFichier = `${partage ? "event" : "im-in"}-${code}.png`;

  async function obtenirFichier(): Promise<File> {
    const r = await fetch(src);
    if (!r.ok) throw new Error("image");
    return new File([await r.blob()], nomFichier, { type: "image/png" });
  }

  async function enregistrer(fichier: File) {
    const url = URL.createObjectURL(fichier);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function partager() {
    if (occupe) return;
    setOccupe(true);
    setErreur(null);
    try {
      const fichier = await obtenirFichier();
      const donnees: ShareData = { files: [fichier], text: `${partage ? titre || "Tèt Weekend" : titre ? `I'm in — ${titre}` : "I'm in!"} ${lienCourt(evenementId)}?s=story` };
      if (typeof navigator.canShare === "function" && navigator.canShare(donnees)) {
        await navigator.share(donnees);
      } else {
        await enregistrer(fichier);
        setErreur("Image saved. Add it to your story from your gallery.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setErreur("Couldn't prepare the card. Try again.");
    } finally {
      setOccupe(false);
    }
  }

  async function sauver() {
    if (occupe) return;
    setOccupe(true);
    setErreur(null);
    try {
      await enregistrer(await obtenirFichier());
    } catch {
      setErreur("Couldn't prepare the card. Try again.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={partage ? "Share this event" : "Share your card"}>
      <button type="button" aria-label="Close" onClick={onFermer} className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-[480px] rounded-t-3xl border-t border-[var(--nuit-ligne)] bg-[#2a211b] px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] text-[#fff7ef] shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#6b584c]" />
        <div className="flex items-start gap-4">
          {!imageKo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Your event card" width={126} height={224} onError={() => setImageKo(true)} className="h-[224px] w-[126px] shrink-0 rounded-xl bg-[#191410] object-cover shadow-lg" />
          )}
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-[24px] leading-[1.05] font-black">{partage ? <>Share this event.<br />Bring your crew.</> : <>You&apos;re in.<br />Bring your crew.</>}</p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#d8c5b8]">{partage ? "The card is ready: the flyer, the date and the link to the event. One tap to post it." : "Your card is ready: the flyer, the date and the link back to the event. One tap to post it."}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {imageKo && partage && secours ? (
            <button type="button" onClick={() => { onFermer(); secours(); }} className="h-[52px] rounded-[14px] bg-[var(--accent)] text-[16px] font-extrabold text-white">
              Share the link
            </button>
          ) : (
            <button type="button" onClick={partager} disabled={occupe || imageKo} className="h-[52px] rounded-[14px] bg-[var(--accent)] text-[16px] font-extrabold text-white disabled:opacity-60">
              {occupe ? "Preparing…" : "Share to my story"}
            </button>
          )}
          <div className="flex gap-2.5">
            <button type="button" onClick={sauver} disabled={occupe || imageKo} className="h-[46px] flex-1 rounded-xl border border-[#5a493e] text-[14px] font-bold disabled:opacity-60">
              Save image
            </button>
            <button type="button" onClick={onFermer} className="h-[46px] flex-1 rounded-xl text-[14px] font-semibold text-[#d8c5b8]">
              Not now
            </button>
          </div>
        </div>
        {erreur && (
          <p className="mt-3 text-[12.5px] text-[#f1c9b8]" role="status">
            {erreur}
          </p>
        )}
      </div>
    </div>
  );
}
