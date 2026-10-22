"use client";

import { useEffect, useRef, useState } from "react";
import { altFlyer, creditPublic } from "@/lib/listing/flyer";
import { formaterQuand } from "@/lib/listing/dates";
import type { EvenementPublic } from "@/lib/listing/types";

export function FlyerViewer({
  evenement,
  open,
  onClose,
}: {
  evenement: EvenementPublic | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !evenement?.flyer) return null;
  return <FlyerOuvert evenement={evenement} onClose={onClose} />;
}

function FlyerOuvert({ evenement, onClose }: { evenement: EvenementPublic; onClose: () => void }) {
  const fermerRef = useRef<HTMLButtonElement>(null);
  const retourRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [zoom, setZoom] = useState(1);
  const flyer = evenement.flyer;
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const lieu = evenement.lieu?.nom ?? evenement.ville;
  const credit = flyer ? creditPublic(flyer.credit, evenement.source_account, evenement.source) : null;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    retourRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const html = document.documentElement.style.overflow;
    const corps = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    fermerRef.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", touche);
    return () => {
      document.documentElement.style.overflow = html;
      document.body.style.overflow = corps;
      window.removeEventListener("keydown", touche);
      retourRef.current?.focus();
    };
  }, []);

  if (!flyer) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "rgba(4, 3, 8, 0.96)" }}
      role="dialog"
      aria-modal="true"
      aria-label={altFlyer(evenement.titre, lieu, quand)}
      onClick={onClose}
    >
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button type="button" className="min-h-11 rounded-full bg-white/10 px-3 text-sm text-white" onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10)); }}>
          Réduire
        </button>
        <button type="button" className="min-h-11 rounded-full bg-white/10 px-3 text-sm text-white" onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(3, Math.round((z + 0.5) * 10) / 10)); }}>
          Agrandir
        </button>
        <button ref={fermerRef} type="button" className="min-h-11 rounded-full bg-white px-4 text-sm font-medium text-black" onClick={onClose}>
          Fermer
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 pb-24" style={{ touchAction: "pinch-zoom" }}>
        {/* Fichier original, zoomable, sans recadrage. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flyer.publicUrl}
          alt={altFlyer(evenement.titre, lieu, quand)}
          style={{ maxWidth: "100vw", maxHeight: "calc(100dvh - 96px)", objectFit: "contain", transform: `scale(${zoom})` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <footer className="absolute right-0 bottom-0 left-0 flex h-24 flex-col justify-center gap-1 px-4 text-sm text-white" onClick={(e) => e.stopPropagation()}>
        <p className="font-medium">{evenement.titre}</p>
        <p className="text-white/80">{[quand, lieu].filter(Boolean).join(" · ")}</p>
        <p className="flex flex-wrap gap-3 text-white/80">
          {credit && <span>Flyer : {credit}</span>}
          {evenement.source_url && (
            <a href={evenement.source_url} className="underline" rel="noreferrer" target="_blank">
              Voir le post d&apos;origine
            </a>
          )}
        </p>
      </footer>
    </div>
  );
}
