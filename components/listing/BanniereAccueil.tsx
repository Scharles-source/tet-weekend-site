"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const lieu = [e.lieu?.nom, e.ville].filter(Boolean).join(" · ");
  const meta = [lieu || "Lieu non indiqué", e.prix].filter(Boolean).join(" · ");

  function glisser(fin: number) {
    if (depart === null || panneaux.length < 2) return;
    const ecart = fin - depart;
    if (ecart > 40) setIndex((i) => (i - 1 + panneaux.length) % panneaux.length);
    if (ecart < -40) setIndex((i) => (i + 1) % panneaux.length);
    setDepart(null);
  }

  return (
    <section aria-roledescription="carrousel" aria-label="À la une" className="relative">
      <article
        className="relative h-[300px] overflow-hidden rounded-[20px]"
        onTouchStart={(ev) => setDepart(ev.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(ev) => glisser(ev.changedTouches[0]?.clientX ?? 0)}
      >
        {e.flyer ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.flyer.publicUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(150deg, #F97316, #E02B20 55%, #5B2EE5)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,6,20,.06) 40%, rgba(10,6,20,.82))" }} />
        <span className="absolute top-3 right-3 rounded-full px-2 py-1 text-[10px] font-bold tracking-[.6px] text-[#191410]" style={{ background: "rgba(255,255,255,.92)" }}>
          {courant.sponsorise ? "SPONSORISÉ" : "TENDANCE"}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 pr-24 text-white">
          <p className="text-[10.5px] font-bold text-[#FFB25E]">À LA UNE · {formaterKicker(e.date_debut, e.fuseau)}</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[23px] font-black leading-tight">{e.titre}</h2>
          <p className="mt-1 text-[12.5px]">{meta}</p>
          <Link href={`/evenements/${e.slug}`} className="mt-3 inline-flex min-h-9 items-center rounded-full bg-[#E02B20] px-4 text-sm font-semibold text-white no-underline">
            Voir l&apos;événement
          </Link>
        </div>
        {panneaux.length > 1 && (
          <div className="absolute right-3 bottom-4 flex items-center gap-1.5">
            {panneaux.map((panneau, i) => (
              <button
                key={panneau.evenement.id}
                type="button"
                aria-label={`Panneau ${i + 1}`}
                className={`h-1.5 rounded-full ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/45"}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </article>
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
