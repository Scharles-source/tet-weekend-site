"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { formaterKicker } from "@/lib/listing/dates";
import type { EvenementPublic } from "@/lib/listing/types";

export interface Panneau {
  evenement: EvenementPublic;
  sponsorise: boolean;
}

export function BanniereAccueil({ panneaux, email, auto = true }: { panneaux: Panneau[]; email: string; auto?: boolean }) {
  const [index, setIndex] = useState(0);
  const [depart, setDepart] = useState<number | null>(null);
  const courant = panneaux[index] ?? panneaux[0];

  useEffect(() => {
    if (!auto || panneaux.length < 2) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % panneaux.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [auto, panneaux.length]);

  if (!courant) return <BanniereVide email={email} />;

  const e = courant.evenement;
  const lieu = [e.lieu?.nom, e.ville].filter(Boolean).join(" · ") || "Lieu non indiqué";
  const badge = (
    <span className="rounded-full bg-[#14100B] px-3 py-1.5 text-[11px] font-bold tracking-[1.5px] text-white">
      {courant.sponsorise ? "SPONSORISÉ" : "TENDANCE"}
    </span>
  );

  function glisser(fin: number) {
    if (depart === null || panneaux.length < 2) return;
    const ecart = fin - depart;
    if (ecart > 40) setIndex((i) => (i - 1 + panneaux.length) % panneaux.length);
    if (ecart < -40) setIndex((i) => (i + 1) % panneaux.length);
    setDepart(null);
  }

  const points = (classes: string, pointClasses: (actif: boolean) => string) =>
    panneaux.length > 1 ? (
      <div className={classes}>
        {panneaux.map((panneau, i) => (
          <button
            key={panneau.evenement.id}
            type="button"
            aria-label={`Panneau ${i + 1}`}
            className={pointClasses(i === index)}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    ) : null;

  return (
    <section aria-roledescription="carrousel" aria-label="À la une" className="relative">
      {/* Libellé au-dessus de la carte (mobile) */}
      <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
        <p className="flex items-center gap-2 text-[13px] font-extrabold tracking-[2.5px] text-[#191410]">
          <span className="h-[9px] w-[9px] rounded-full bg-[#E02B20]" />
          À LA UNE
        </p>
        {badge}
      </div>

      <article
        className="relative overflow-hidden rounded-[26px] shadow-[0_6px_24px_rgba(28,23,16,.08)]"
        onTouchStart={(ev) => setDepart(ev.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(ev) => glisser(ev.changedTouches[0]?.clientX ?? 0)}
      >
        {/* Fond : le flyer lui-même, flouté */}
        {e.flyer ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.flyer.publicUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover brightness-[.55] blur-[26px]" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(150deg, #F97316, #E02B20 55%, #5B2EE5)" }} />
        )}

        <div className="relative flex flex-col lg:min-h-[380px] lg:flex-row lg:items-center">
          {/* Flyer entier, jamais recadré */}
          <div className="flex items-center justify-center px-5 pt-5 lg:py-[30px] lg:pr-0 lg:pl-[34px]">
            {e.flyer ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.flyer.publicUrl} alt={e.titre} className="h-[320px] w-auto max-w-full rounded-[14px] object-contain shadow-[0_18px_40px_rgba(0,0,0,.45)] lg:h-[320px]" />
            ) : (
              <div className="flex h-[320px] w-[240px] items-center justify-center rounded-[14px] bg-[rgba(0,0,0,.25)] px-4 text-center">
                <p className="font-[family-name:var(--font-display)] text-[22px] font-black text-white">{e.titre}</p>
              </div>
            )}
          </div>

          {/* Informations : bloc blanc sur mobile, texte blanc sur le fond flouté sur desktop */}
          <div className="mt-5 bg-white p-5 lg:mt-0 lg:flex-1 lg:bg-transparent lg:py-[30px] lg:pr-[34px] lg:pl-7">
            <div className="mb-3 hidden items-center gap-3 lg:flex">
              <p className="flex items-center gap-2 text-[13px] font-extrabold tracking-[2.5px] text-white">
                <span className="h-[9px] w-[9px] rounded-full bg-[#E02B20]" />
                À LA UNE
              </p>
              {badge}
            </div>
            <p className="text-[13px] font-extrabold tracking-[1.2px] text-[#C21810] uppercase lg:text-[14.5px] lg:text-[#FFC9C4]">
              {formaterKicker(e.date_debut, e.fuseau)}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-black leading-tight text-[#191410] lg:text-[37px] lg:leading-[1.12] lg:text-white">
              {e.titre}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-[14px] text-[#6E6252] lg:text-[16.5px] lg:text-[#E9E2D2]">
              <MapPin size={16} aria-hidden className="shrink-0" />
              {lieu}
            </p>
            <div className="mt-5 flex items-center gap-5">
              {e.prix ? (
                <div>
                  <p className="text-[11px] font-bold tracking-[1.5px] text-[#8A7B66] lg:text-[#CFC6B0]">ENTRÉE</p>
                  <p className="font-[family-name:var(--font-display)] text-[20px] font-black text-[#191410] lg:text-[26px] lg:text-white">{e.prix}</p>
                </div>
              ) : null}
              <Link href={`/evenements/${e.slug}`} className="inline-flex min-h-11 items-center rounded-[14px] bg-[#E02B20] px-[30px] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(224,43,32,.45)] no-underline lg:min-h-[52px] lg:text-base">
                Voir l&apos;événement
              </Link>
            </div>
          </div>
        </div>

        {/* Points du carrousel (desktop : dans la carte, en bas à droite) */}
        {points("absolute right-[30px] bottom-6 hidden items-center gap-1.5 lg:flex", (actif) =>
          `h-2 rounded-full ${actif ? "w-[26px] bg-[#E02B20]" : "w-2 bg-white/45"}`,
        )}
      </article>

      {/* Points du carrousel (mobile : sous la carte) */}
      {points("mt-3 flex items-center justify-center gap-1.5 lg:hidden", (actif) =>
        `h-2 rounded-full ${actif ? "w-[26px] bg-[#E02B20]" : "w-2 bg-[#D8C6A4]"}`,
      )}
    </section>
  );
}

export function BanniereVide({ email }: { email: string }) {
  return (
    <section className="rounded-[20px] border-2 border-dashed border-[#D8C6A4] bg-[#FFFDF8] px-5 py-8 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-[23px] font-black text-[#191410]">Votre événement ici</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#4A4136]">La bannière d&apos;accueil, vue par tous les visiteurs. Emplacement sponsorisé</p>
      <a href={`mailto:${email}?subject=Devenir%20sponsor`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#191410] px-4 text-sm font-semibold text-white no-underline">
        Devenir sponsor
      </a>
    </section>
  );
}
