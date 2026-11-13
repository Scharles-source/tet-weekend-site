"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estTermine, formaterQuand } from "@/lib/listing/dates";
import { envoyer, interets, memoriserInteret, visiteur } from "@/lib/listing/engagement-client";
import { estTresConsulte, libelleInteret, SEUIL_INTERET } from "@/lib/listing/engagement";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";

const SITE = "https://www.tetweekend.com";
const OR = "#FFC247";

function abrege(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/**
 * Bande sous le flyer : fond tiré du flyer lui-même (flou assombri), infos de l'événement,
 * bouton « I'm going », partage et indicateurs de popularité (affichés seulement au-dessus
 * d'un seuil, pour ne jamais faire paraître le site vide).
 */
export function BandeEvenement({ evenement, compact = false }: { evenement: EvenementPublic; compact?: boolean }) {
  const termine = estTermine(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const ou = [evenement.lieu?.nom, evenement.ville].filter(Boolean).join(" · ");
  const couverture = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;

  const [actif, setActif] = useState(false);
  const [total, setTotal] = useState<number | null>(evenement.interets ?? null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setActif(interets().includes(evenement.id));
  }, [evenement.id]);

  async function basculer() {
    if (occupe) return;
    setOccupe(true);
    try {
      const r = await envoyer({ type: "interet", evenementId: evenement.id, visiteur: visiteur() });
      if (r?.ok) {
        setActif(Boolean(r.interesse));
        setTotal(r.total ?? null);
        memoriserInteret(evenement.id, Boolean(r.interesse));
      }
    } catch {
      /* hors ligne : rien ne change */
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

  const nombre = total !== null && total >= SEUIL_INTERET ? total : null;
  const phrase = libelleInteret(total);
  const vues = estTresConsulte(evenement.vues) ? (evenement.vues as number) : null;

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
      <div className={`relative ${compact ? "p-3.5" : "p-4"}`}>
        <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: OR }}>
          {quand}
          {categorie ? ` · ${categorie}` : ""}
          {termine ? " · Event ended" : ""}
        </p>
        <h3 className={`mt-1 font-[family-name:var(--font-display)] font-black leading-tight ${compact ? "text-[17px] lg:text-[18.5px]" : "text-[20px]"}`}>
          <Link href={`/evenements/${evenement.slug}`} className="no-underline" style={{ color: "#FFFFFF" }}>
            {evenement.titre}
          </Link>
        </h3>
        <p className="mt-1 text-[13.5px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
          {ou || "Venue not listed"}
        </p>
        {evenement.artistes.length > 0 && (
          <p className="mt-1 truncate text-[12.5px]" style={{ color: "rgba(255,255,255,0.66)" }}>
            {evenement.artistes.map((a) => a.nom).join(", ")}
          </p>
        )}

        <div className="mt-3.5 flex items-center gap-2">
          {!termine && (
            <button
              type="button"
              aria-pressed={actif}
              disabled={occupe}
              onClick={basculer}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-extrabold"
              style={actif ? { background: "transparent", color: "#FFFFFF", border: `2px solid ${OR}` } : { background: OR, color: "#191410" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {actif ? "You're going" : "I'm going"}
              {nombre !== null && (
                <span className="rounded-[10px] px-2 py-0.5 text-[12.5px]" style={{ background: actif ? "rgba(255,255,255,0.18)" : "rgba(25,20,16,0.14)" }}>
                  {nombre}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            aria-label={`Share ${evenement.titre}`}
            onClick={partager}
            className={`flex h-12 items-center justify-center rounded-full ${termine ? "flex-1 gap-2 px-5 text-[15px] font-extrabold" : "w-12"}`}
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

        {(message || phrase || vues !== null) && (
          <div className="mt-2.5 flex items-center justify-between gap-3 text-[12.5px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }} role="status">
            <span className="min-w-0 truncate">{message ?? phrase ?? ""}</span>
            {vues !== null && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                {abrege(vues)} views
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
