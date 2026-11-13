"use client";

import { useState } from "react";
import { EMAIL_CONTACT, flyerValide } from "@/lib/listing/soumission";

const CHAMP = "mt-1.5 block min-h-12 w-full rounded-[14px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 text-[16px] text-[var(--nuit-texte)] outline-none focus:border-[var(--nuit-texte)]";
const LABEL = "block text-[13.5px] font-bold text-[var(--nuit-texte)]";

type Etat = "pret" | "envoi" | "ok" | "indisponible" | "echec";

/** Formulaire « Add an event » : coordonnées de l'organisateur + flyer, envoyés à contact@tetweekend.com. */
export function FormulaireEvenement() {
  const [etat, setEtat] = useState<Etat>("pret");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [nomFlyer, setNomFlyer] = useState<string | null>(null);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const donnees = new FormData(form);
    const fichier = donnees.get("flyer");
    if (!(fichier instanceof File) || fichier.size === 0) {
      setErreurs({ flyer: "Add your flyer." });
      return;
    }
    const probleme = flyerValide({ type: fichier.type, size: fichier.size });
    if (probleme) {
      setErreurs({ flyer: probleme });
      return;
    }
    setErreurs({});
    setEtat("envoi");
    try {
      const res = await fetch("/api/soumission", { method: "POST", body: donnees });
      const r = (await res.json().catch(() => ({}))) as { ok?: boolean; erreur?: string; champs?: Record<string, string> };
      if (res.ok && r.ok) {
        setEtat("ok");
        form.reset();
        setNomFlyer(null);
        return;
      }
      if (r.erreur === "champs" && r.champs) {
        setErreurs(r.champs);
        setEtat("pret");
        return;
      }
      setEtat(res.status === 503 ? "indisponible" : "echec");
    } catch {
      setEtat("echec");
    }
  }

  if (etat === "ok") {
    return (
      <div role="status" className="rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-[22px] font-black text-[var(--nuit-texte)]">Thank you!</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--nuit-texte2)]">We received your event. We&apos;ll review it and get back to you by email before publishing it.</p>
        <button type="button" onClick={() => setEtat("pret")} className="mt-5 min-h-12 rounded-full bg-[var(--bouton)] px-6 text-[15px] font-extrabold text-white">
          Add another event
        </button>
      </div>
    );
  }

  const occupe = etat === "envoi";
  const err = (k: string) => (erreurs[k] ? <p className="mt-1 text-[13px] font-semibold text-[#B3261E]" role="alert">{erreurs[k]}</p> : null);

  return (
    <form onSubmit={envoyer} className="space-y-4" noValidate>
      {/* Champ piège pour les robots : invisible pour les personnes. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className={LABEL}>
        Event name *
        <input name="evenement" required maxLength={160} className={CHAMP} autoComplete="off" />
        {err("evenement")}
      </label>
      <label className={LABEL}>
        Date and time *
        <input name="date" required maxLength={80} placeholder="Saturday, Dec 12 · 9 PM" className={CHAMP} autoComplete="off" />
        {err("date")}
      </label>
      <label className={LABEL}>
        Venue and city *
        <input name="lieu" required maxLength={200} placeholder="Club name, Brooklyn NY" className={CHAMP} autoComplete="off" />
        {err("lieu")}
      </label>
      <label className={LABEL}>
        Details (lineup, entry price, ticket link…)
        <textarea name="details" maxLength={2000} rows={4} className={`${CHAMP} min-h-28 py-3`} />
      </label>

      <div>
        <span className={LABEL}>Flyer *</span>
        <label className="mt-1.5 flex min-h-14 cursor-pointer items-center justify-center rounded-[14px] border-2 border-dashed border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] px-4 text-center text-[14.5px] font-semibold text-[var(--nuit-texte2)]">
          {nomFlyer ?? "Tap to choose an image (JPG, PNG or WebP, 5 MB max)"}
          <input
            type="file"
            name="flyer"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(ev) => setNomFlyer(ev.target.files?.[0]?.name ?? null)}
          />
        </label>
        {err("flyer")}
      </div>

      <hr className="border-[var(--nuit-ligne)]" />

      <label className={LABEL}>
        Your name *
        <input name="nom" required maxLength={120} autoComplete="name" className={CHAMP} />
        {err("nom")}
      </label>
      <label className={LABEL}>
        Email *
        <input name="email" type="email" required maxLength={160} autoComplete="email" inputMode="email" className={CHAMP} />
        {err("email")}
      </label>
      <label className={LABEL}>
        Phone / WhatsApp
        <input name="telephone" type="tel" maxLength={40} autoComplete="tel" inputMode="tel" className={CHAMP} />
      </label>

      {etat === "indisponible" && (
        <p role="alert" className="rounded-[14px] bg-[#FEF3C7] p-3 text-[14px] text-[#92400E]">
          Submissions are temporarily unavailable. Please email your flyer and details to <a href={`mailto:${EMAIL_CONTACT}`} className="font-bold underline">{EMAIL_CONTACT}</a>.
        </p>
      )}
      {etat === "echec" && (
        <p role="alert" className="rounded-[14px] bg-[#FDE8E8] p-3 text-[14px] text-[#B3261E]">
          We couldn&apos;t send your event. Check your connection and try again, or email <a href={`mailto:${EMAIL_CONTACT}`} className="font-bold underline">{EMAIL_CONTACT}</a>.
        </p>
      )}

      <button type="submit" disabled={occupe} className="min-h-12 w-full rounded-full bg-[var(--bouton)] px-6 text-[16px] font-extrabold text-white disabled:opacity-60">
        {occupe ? "Sending…" : "Send my event"}
      </button>
      <p className="text-[12.5px] leading-snug text-[var(--nuit-muet)]">Your details are only used to contact you about this event. Tèt Weekend does not sell tickets.</p>
    </form>
  );
}
