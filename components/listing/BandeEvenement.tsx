"use client";

import Link from "next/link";
import { useState } from "react";
import { CarteStory } from "@/components/listing/CarteStory";
import { estEnCours, estTermine, formaterQuand } from "@/lib/listing/dates";
import { nomLieuAffiche } from "@/lib/listing/faits";
import { lienCourt } from "@/lib/listing/lien-court";
import { libelleVues, preuveSociale } from "@/lib/listing/preuve";
import { signauxRarete } from "@/lib/listing/rarete";
import { nomCategorie } from "@/lib/listing/schema";
import type { EvenementPublic } from "@/lib/listing/types";
import { flyerAllege } from "@/lib/listing/image-url";

const OR = "#FFC247";

/**
 * Bande sous le flyer : fond tiré du flyer lui-même (flou assombri), infos de l'événement,
 * badges de rareté écrits par l'organisateur, nombre de vues (dès la première), bouton
 * « Invite friends » et une preuve sociale vraie (classement, vues du jour). Plus de « I'm in »
 * (décision de Smith, 15 nov. 2026).
 */
export function BandeEvenement({ evenement, compact = false, etroit = false }: { evenement: EvenementPublic; compact?: boolean; etroit?: boolean }) {
  const termine = estTermine(evenement);
  const enCours = estEnCours(evenement);
  const categorie = nomCategorie(evenement.categorie);
  const quand = formaterQuand(evenement.date_debut, evenement.fuseau);
  const nomLieu = nomLieuAffiche(evenement);
  const ou = [nomLieu, evenement.ville].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i).join(" · ");
  const couverture = evenement.flyer ? evenement.flyer.cardUrl || evenement.flyer.publicUrl : null;

  const [message, setMessage] = useState<string | null>(null);
  const [cartePartage, setCartePartage] = useState(false);

  async function partager() {
    const url = lienCourt(evenement.id);
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

  // Les vues s'affichent toujours (dès 1) sous « I'm in » ; la preuve ne garde que classement / vues du jour pour ne pas répéter.
  const vues = libelleVues(evenement.vues);
  const preuveBrute = preuveSociale(evenement);
  const preuve = preuveBrute && !preuveBrute.texte.endsWith(" views") ? preuveBrute : null;
  // Badges pré-calculés au chargement quand la description n'a pas voyagé (liste allégée de l'API).
  const raretes = (evenement.badges_rarete ?? signauxRarete(evenement)).slice(0, etroit ? 1 : 2);

  return (
    <div className="relative flex-1 overflow-hidden text-white" style={{ background: "#2A1F1B" }}>
      {couverture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flyerAllege(couverture, 64)}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-[28px] saturate-150"
          style={{ filter: "blur(28px) saturate(1.5) brightness(0.42)" }}
        />
      )}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,12,10,0.25), rgba(20,12,10,0.55))" }} />
      <div className={`relative ${etroit ? "p-3" : compact ? "p-3.5" : "p-4"}`}>
        {(enCours || raretes.length > 0) && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {enCours && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E02B20] px-2 py-0.5 text-[10.5px] font-extrabold tracking-[0.06em] uppercase text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                Happening now
              </span>
            )}
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
            {termine ? " · Event ended" : enCours ? " · Happening now" : ""}
          </p>
        )}
        <h3 className={`font-[family-name:var(--font-display)] font-black leading-tight ${etroit ? "line-clamp-2 text-[15px]" : `mt-1 ${compact ? "text-[17px] lg:text-[18.5px]" : "text-[20px]"}`}`}>
          <Link href={`/evenements/${evenement.slug}`} className="no-underline" style={{ color: "#FFFFFF" }}>
            {evenement.titre}
          </Link>
        </h3>
        <p className={`mt-1 font-semibold ${etroit ? "truncate text-[13px]" : "text-[13.5px]"}`} style={{ color: "rgba(255,255,255,0.8)" }}>
          {ou}
        </p>
        {!etroit && evenement.artistes.length > 0 && (
          <p className="mt-1 truncate text-[12.5px]" style={{ color: "rgba(255,255,255,0.66)" }}>
            {evenement.artistes.map((a) => a.nom).join(", ")}
          </p>
        )}

        <div className={`flex items-center justify-between gap-2 ${etroit ? "mt-2.5" : "mt-3.5"}`}>
          {vues ? (
            <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
              <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={OR} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="truncate">{vues}</span>
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label={`Invite friends to ${evenement.titre}`}
            onClick={() => setCartePartage(true)}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-full font-extrabold ${etroit ? "min-h-11 px-3.5 text-[13px]" : "min-h-12 px-5 text-[14.5px]"}`}
            style={{ background: OR, color: "#191410" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
              <path d="M19 8v6M16 11h6" />
            </svg>
            Invite friends
          </button>
        </div>

        <CarteStory evenementId={evenement.id} titre={evenement.titre} ouvert={cartePartage} onFermer={() => setCartePartage(false)} mode="partage" secours={partager} />

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
