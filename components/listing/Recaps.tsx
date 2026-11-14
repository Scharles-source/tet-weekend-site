"use client";

import { useEffect, useRef, useState } from "react";
import { flyerAllege } from "@/lib/listing/image-url";
import { nomPlateformeRecap, urlEmbedRecap, type RecapPublic } from "@/lib/listing/recaps";

/**
 * Rangée « Recaps » de l'accueil : aftermovies de soirées passées.
 * Poids maîtrisé (demande de Smith) : aucune vidéo ni iframe n'existe dans le
 * HTML initial — seulement des vignettes en chargement paresseux. Le lecteur
 * (vidéo directe ou intégré Instagram/YouTube) n'est monté qu'au clic, dans
 * une lightbox. Aucune lecture automatique avant ce clic.
 */
export function RangeeRecaps({ recaps }: { recaps: RecapPublic[] }) {
  const [ouvert, setOuvert] = useState<RecapPublic | null>(null);
  if (recaps.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12" aria-label="Recaps">
      <div className="mb-3.5 lg:mb-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[var(--nuit-texte)] lg:text-[30px]">Recaps</h2>
        <p className="mt-1 text-[13.5px] text-[var(--nuit-muet)]">Relive the night — aftermovies from the parties.</p>
      </div>
      <div className="no-scrollbar -mx-[var(--page-px)] flex snap-x gap-3 overflow-x-auto px-[var(--page-px)] lg:gap-5">
        {recaps.map((r) => (
          <CarteRecap key={r.id} recap={r} onOuvrir={() => setOuvert(r)} />
        ))}
      </div>
      {ouvert && <LecteurRecap recap={ouvert} onClose={() => setOuvert(null)} />}
    </section>
  );
}

function CarteRecap({ recap, onOuvrir }: { recap: RecapPublic; onOuvrir: () => void }) {
  const sousTitre = [recap.evenement_label, recap.lieu_nom].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onOuvrir}
      aria-label={`Watch the recap: ${recap.titre}`}
      className="relative block aspect-[4/5] w-[172px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[20px] bg-[var(--nuit-carte2)] text-left lg:w-[210px]"
    >
      {recap.vignette_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flyerAllege(recap.vignette_url, 384)} alt={recap.titre} className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" decoding="async" />
      ) : (
        <span className="absolute inset-0" style={{ background: "linear-gradient(160deg,#C21810 0%,#5B1209 100%)" }} />
      )}
      <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,6,5,0.88) 0%, rgba(10,6,5,0.25) 45%, rgba(10,6,5,0) 70%)" }} />
      <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 shadow-[0_4px_18px_rgba(0,0,0,0.35)]">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="ml-0.5 fill-[#191410]">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <span className="absolute inset-x-3 bottom-3">
        <span className="block text-[14.5px] leading-snug font-extrabold text-balance text-white">{recap.titre}</span>
        {sousTitre && <span className="mt-0.5 block truncate text-[12px] font-medium text-white/75">{sousTitre}</span>}
      </span>
    </button>
  );
}

function LecteurRecap({ recap, onClose }: { recap: RecapPublic; onClose: () => void }) {
  const fermerRef = useRef<HTMLButtonElement>(null);
  const retourRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const embed = urlEmbedRecap(recap);

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

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "rgba(4, 3, 8, 0.96)" }}
      role="dialog"
      aria-modal="true"
      aria-label={recap.titre}
      onClick={onClose}
    >
      <div className="absolute top-3 right-3 z-10">
        <button ref={fermerRef} type="button" className="min-h-11 rounded-full bg-white px-4 text-sm font-medium text-black" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pt-16 pb-24" onClick={(e) => e.stopPropagation()}>
        {recap.video_url ? (
          // URL vidéo directe fiable : lecteur natif, monté seulement maintenant (au clic).
          <video src={recap.video_url} controls autoPlay playsInline className="max-h-full w-auto max-w-[94vw] rounded-[14px] bg-black" />
        ) : embed ? (
          <iframe
            src={embed}
            title={recap.titre}
            className="rounded-[14px] bg-black"
            style={{ width: "min(420px, 94vw)", height: "min(740px, 100%)" }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <a href={recap.post_url} target="_blank" rel="noreferrer" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black no-underline">
            Watch on {nomPlateformeRecap(recap.plateforme)}
          </a>
        )}
      </div>
      <footer className="absolute right-0 bottom-0 left-0 flex flex-col justify-center gap-1 px-4 py-5 text-sm text-white" onClick={(e) => e.stopPropagation()}>
        <p className="font-medium">{recap.titre}</p>
        <p className="text-white/80">
          {[recap.evenement_label, recap.lieu_nom].filter(Boolean).join(" · ")}
          {" · "}
          <a href={recap.post_url} target="_blank" rel="noreferrer" className="font-semibold text-white underline">
            Watch on {nomPlateformeRecap(recap.plateforme)}
          </a>
        </p>
      </footer>
    </div>
  );
}
