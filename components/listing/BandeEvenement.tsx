"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estTermine, formaterQuand } from "@/lib/listing/dates";
import { envoyer, interets, memoriserInteret, visiteur } from "@/lib/listing/engagement-client";
import { preuveSociale } from "@/lib/listing/preuve";
import { signauxRarete } from "@/lib/listing/rarete";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const SITE = "https://www.tetweekend.com";
const OR = "#FFC247";

/**
 * Bande sous le flyer : fond tiré du flyer lui-même (flou assombri), infos de l'événement,
 * badges de rareté écrits par l'organisateur, bouton « I'm in » (définitif, compteur visible
 * avant le clic), partage et une preuve sociale vraie (classement, vues du jour, vues).
 */
export function BandeEvenement({ evenement, compact = false, etroit = false }: { evenement: EvenementPublic; compact?: boolean; etroit?: boolean }) {
  const termine = estTermine(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ");
  const couverture = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;

  const [dedans, setDedans] = useState(false);
  const [total, setTotal] = useState<number | null>(evenement.interets ?? null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDedans(interets().includes(evenement.id));
  }, [evenement.id]);

  /** « I'm in » ne se défait pas : un seul clic par personne et par événement, mémorisé sur l'appareil et confirmé côté serveur. */
  async function confirmer() {
    if (dedans || occupe) return;
    setOccupe(true);
    const avant = total;
    setDedans(true);
    setTotal((avant ?? 0) + 1);
    memoriserInteret(evenement.id, true);
    try {
      const r = await envoyer({ type: "interet", evenementId: evenement.id, visiteur: visiteur() });
      if (r?.ok && r.interesse) {
        setTotal(r.total ?? (avant ?? 0) + 1);
      } else {
        throw new Error("non confirmé");
      }
    } catch {
      setDedans(false);
      setTotal(avant);
      memoriserInteret(evenement.id, false);
    } finally {
      setOccupe(false);
    }
  }

  async function partager() {
    const url = `${SITE}/evenements/${evenement.slug}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: evenement.titre, text: `${evenement.titre} — ${quand}`, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setMessage(url);
    }
    window.setTimeout(() => setMessage(null), 2500);
  }

  const nombre = total !== null && total >= 1 ? total : null;
  const preuve = preuveSociale(evenement);
  const raretes = signauxRarete(evenement).slice(0, etroit ? 1 : 2);

  return (
    <div className="relative overflow-hidden text-white" style={{ background: "#2A1F1B" }}>
      {couverture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={couverture}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-[28px] saturate-150"
          style={{ filter: "blur(28px) saturate(1.5) brightness(0.42)" }}
        />
      )}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,12,10,0.25), rgba(20,12,10,0.55))" }} />
      <div className={`relative ${etroit ? "p-3" : compact ? "p-3.5" : "p-4"}`}>
        {raretes.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {raretes.map((r) => (
              <span key={r} className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold tracking-[0.06em] uppercase" style={{ border: `1px solid ${OR}`, color: OR }}>
                {r}
              </span>
            ))}
          </div>
        )}
        {!etroit && (
          <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: OR }}>
            {quand}
            {categorie ? ` · ${categorie}` : ""}
            {termine ? " · Event ended" : ""}
          </p>
        )}
        <h3 className={`font-[family-name:var(--font-display)] font-black leading-tight ${etroit ? "line-clamp-2 text-[15px]" : `mt-1 ${compact ? "text-[17px] lg:text-[18.5px]" : "text-[20px]"}`}`}>
          <Link href={`/evenements/${evenement.slug}`} className="no-underline" style={{ color: "#FFFFFF" }}>
            {evenement.titre}
          </Link>
        </h3>
        <p className={`mt-1 font-semibold ${etroit ? "truncate text-[13px]" : "text-[13.5px]"}`} style={{ color: "rgba(255,255,255,0.8)" }}>
          {ou || "Venue not listed"}
        </p>
        {!etroit && evenement.artistes.length > 0 && (
          <p className="mt-1 truncate text-[12.5px]" style={{ color: "rgba(255,255,255,0.66)" }}>
            {evenement.artistes.map((a) => a.nom).join(", ")}
          </p>
        )}

        <div className={`flex items-center gap-2 ${etroit ? "mt-2.5" : "mt-3.5"}`}>
          {!termine && (
            <button
              type="button"
              aria-pressed={dedans}
              aria-label={dedans ? "You're in" : undefined}
              disabled={occupe || dedans}
              onClick={confirmer}
              className={`flex items-center justify-center rounded-full font-extrabold ${etroit ? "min-h-11 gap-1.5 px-4 text-[14px]" : "min-h-12 gap-2 px-6 text-[15px]"}`}
              style={dedans ? { background: "transparent", color: OR, border: `2px solid ${OR}`, opacity: 1 } : { background: OR, color: "#191410" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {!dedans && "I'm in"}
              {nombre !== null && (
                <span className="rounded-[10px] px-2 py-0.5 text-[12.5px]" style={{ background: dedans ? "rgba(255,194,71,0.18)" : "rgba(25,20,16,0.14)" }}>
                  {nombre}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            aria-label={`Share ${evenement.titre}`}
            onClick={partager}
            className={`ml-auto flex shrink-0 items-center justify-center rounded-full ${etroit ? "h-11" : "h-12"} ${termine ? "flex-1 gap-2 px-5 text-[15px] font-extrabold" : etroit ? "w-11" : "w-12"}`}
            style={{ border: "1.5px solid rgba(255,255,255,0.5)", color: "#FFFFFF" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
            {termine && "Share"}
          </button>
        </div>

        {(message || preuve) && (
          <div className={`flex items-center gap-1.5 font-semibold ${etroit ? "mt-2 text-[12px]" : "mt-2.5 text-[12.5px]"}`} style={{ color: "rgba(255,255,255,0.88)" }} role="status">
            {!message && (
              <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={OR} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            )}
            <span className="min-w-0 truncate">{message ?? (etroit ? preuve?.court : preuve?.texte)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
