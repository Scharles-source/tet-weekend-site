"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saisieDepuisInstant } from "@/lib/listing/dates";
import { CATEGORIES, FUSEAUX } from "@/lib/listing/schema";
import { AIDE, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP } from "@/components/admin/styles";
import {
  PLATEFORMES_SOURCE,
  TYPES_SOURCE,
  libelleConfiance,
  type VueCandidat,
  type VueCollecte,
  type VueSource,
} from "@/lib/crawlers/vue";

const champ = CHAMP;

export function CollecteEvenements({ donnees, apercu = false }: { donnees: VueCollecte; apercu?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(apercu ? "Aperçu local, hors production." : null);
  const [pending, setPending] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);

  async function agir(chemin: string, body?: unknown) {
    setMessage(null);
    if (apercu) {
      setMessage("Aperçu : aucune écriture.");
      return;
    }
    setPending(true);
    try {
      const reponse = await fetch(chemin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const json = (await reponse.json()) as { ok?: boolean; erreur?: string };
      setMessage(json.ok ? "Enregistré." : json.erreur ?? "Erreur.");
      if (json.ok) router.refresh();
    } catch {
      setMessage("Le serveur n'a pas répondu.");
    } finally {
      setPending(false);
    }
  }

  async function agirMethode(chemin: string, method: "POST" | "PATCH", body?: unknown) {
    setMessage(null);
    if (apercu) {
      setMessage("Aperçu : aucune écriture.");
      return;
    }
    setPending(true);
    try {
      const reponse = await fetch(chemin, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
      const json = (await reponse.json()) as { ok?: boolean; erreur?: string };
      setMessage(json.ok ? "Enregistré." : json.erreur ?? "Erreur.");
      if (json.ok) router.refresh();
    } catch {
      setMessage("Le serveur n'a pas répondu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className={AIDE}>{donnees.email} — la collecte est assurée par Jarvis, chaque jour à 21 h : les événements repérés sur Instagram et Facebook arrivent ci-dessous avec leur flyer. Rien n&apos;est publié sans un clic d&apos;approbation. <Link href="/admin" className="font-semibold text-[#E02B20] no-underline">Retour aux événements</Link></p>
      {message && <p className="text-sm font-semibold text-[#92400E]">{message}</p>}
      <section id="a-valider" className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-[18px] font-extrabold">À valider ({donnees.aValider})</h2>
        {donnees.candidats.length === 0 && <p className="text-sm text-[#8A7B66]">Aucun événement en attente de validation.</p>}
        {selection.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} className={BTN_SECONDAIRE} onClick={() => agir("/api/admin/event-candidates/bulk", { ids: selection, action: "reject" })}>Rejeter la sélection</button>
            <button type="button" disabled={pending} className={BTN_SECONDAIRE} onClick={() => agir("/api/admin/event-candidates/bulk", { ids: selection, action: "duplicate" })}>Marquer la sélection comme doublon</button>
          </div>
        )}
        {donnees.candidats.map((candidat) => (
          <CandidatCarte key={candidat.id} candidat={candidat} lieux={donnees.lieux} pending={pending} coche={selection.includes(candidat.id)} onCoche={(oui) => setSelection((liste) => oui ? [...liste, candidat.id] : liste.filter((id) => id !== candidat.id))} onAction={agirMethode} />
        ))}
      </section>
      <FormulaireSource pending={pending} onCreer={(body) => agir("/api/admin/watch-accounts", body)} />
      <section id="sources" className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[18px] font-extrabold">Sources surveillées</h2>
        <p className="text-sm text-[#8A7B66]">C&apos;est la liste que Jarvis parcourt chaque soir — ajoute un compte ici pour l&apos;inclure à la veille.</p>
        {donnees.sources.length === 0 && <p className="text-sm text-[#8A7B66]">Aucune source.</p>}
        {donnees.sources.map((source) => (
          <article key={source.id} className={`${CARTE} p-4 text-sm`}>
            <p className="font-semibold">{source.displayName || source.handle || source.profileUrl} · {source.platform}</p>
            <p className="text-[#8A7B66]">{source.sourceType} · {[source.city, source.country].filter(Boolean).join(", ") || "Ville non indiquée"} · {source.active ? "active" : "en pause"} · candidats : {source.candidats}</p>
            {source.notes && <p className="text-[#8A7B66]">{source.notes}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={pending} className={BTN_SECONDAIRE} onClick={() => agirMethode(`/api/admin/watch-accounts/${source.id}`, "PATCH", { active: !source.active })}>{source.active ? "Mettre en pause" : "Réactiver"}</button>
            </div>
            <EditionSource source={source} pending={pending} onSauver={(body) => agirMethode(`/api/admin/watch-accounts/${source.id}`, "PATCH", body)} />
          </article>
        ))}
      </section>
    </div>
  );
}

function FormulaireSource({ pending, onCreer }: { pending: boolean; onCreer: (body: Record<string, unknown>) => void }) {
  return (
    <form className={`${CARTE} grid gap-2 p-4 sm:grid-cols-2`} onSubmit={(e) => {
      e.preventDefault();
      const donnees = new FormData(e.currentTarget);
      onCreer(Object.fromEntries(donnees.entries()));
    }}>
      <h2 className="sm:col-span-2 font-[family-name:var(--font-display)] text-[18px] font-extrabold">Ajouter une source</h2>
      <select name="platform" className={champ} aria-label="Plateforme">{PLATEFORMES_SOURCE.map((p) => <option key={p}>{p}</option>)}</select>
      <select name="sourceType" className={champ} aria-label="Type">{TYPES_SOURCE.map((t) => <option key={t}>{t}</option>)}</select>
      <input name="handle" className={champ} placeholder="Handle" aria-label="Handle" />
      <input name="profileUrl" className={champ} placeholder="URL du profil" aria-label="URL du profil" />
      <input name="displayName" className={champ} placeholder="Nom affiché" aria-label="Nom affiché" />
      <input name="city" className={champ} placeholder="Ville" aria-label="Ville" />
      <input name="country" className={champ} placeholder="Pays" aria-label="Pays" />
      <input name="notes" className={champ} placeholder="Notes" aria-label="Notes" />
      <button type="submit" disabled={pending} className={BTN_PRIMAIRE}>Ajouter</button>
    </form>
  );
}

function EditionSource({ source, pending, onSauver }: { source: VueSource; pending: boolean; onSauver: (body: Record<string, unknown>) => void }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer">Modifier</summary>
      <form className="mt-2 grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSauver({ ...Object.fromEntries(new FormData(e.currentTarget).entries()), active: source.active }); }}>
        <input name="platform" defaultValue={source.platform} className={champ} aria-label="Plateforme" />
        <input name="sourceType" defaultValue={source.sourceType} className={champ} aria-label="Type" />
        <input name="handle" defaultValue={source.handle ?? ""} className={champ} aria-label="Handle" />
        <input name="profileUrl" defaultValue={source.profileUrl ?? ""} className={champ} aria-label="URL" />
        <input name="displayName" defaultValue={source.displayName ?? ""} className={champ} aria-label="Nom affiché" />
        <input name="city" defaultValue={source.city ?? ""} className={champ} aria-label="Ville" />
        <input name="country" defaultValue={source.country ?? ""} className={champ} aria-label="Pays" />
        <input name="notes" defaultValue={source.notes ?? ""} className={champ} aria-label="Notes" />
        <button type="submit" disabled={pending} className={BTN_SECONDAIRE}>Enregistrer la source</button>
      </form>
    </details>
  );
}

function CandidatCarte({
  candidat,
  lieux,
  pending,
  coche,
  onCoche,
  onAction,
}: {
  candidat: VueCandidat;
  lieux: { id: string; nom: string; ville: string | null }[];
  pending: boolean;
  coche: boolean;
  onCoche: (oui: boolean) => void;
  onAction: (chemin: string, method: "POST" | "PATCH", body?: unknown) => void;
}) {
  const [publier, setPublier] = useState(false);
  const debut = candidat.startsAt ? saisieDepuisInstant(candidat.startsAt, candidat.timezone ?? "America/Port-au-Prince") : "";
  function champs(form: HTMLFormElement) {
    const brut = Object.fromEntries(new FormData(form).entries());
    return { fields: { ...brut, gratuit: brut.gratuit === "on", venueId: brut.venueId || null }, publish: publier };
  }
  return (
    <article className={`${CARTE} grid gap-4 p-4 lg:grid-cols-2`}>
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={coche} onChange={(e) => onCoche(e.target.checked)} /> Sélectionner</label>
        {candidat.flyerUrl ? (
          <a href={candidat.flyerUrl} target="_blank" rel="noreferrer">
            {/* Le flyer candidat est une URL signée ou locale : object-fit contain, pas de recadrage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={candidat.flyerUrl} alt={`Flyer — ${candidat.title ?? "candidat"}`} className="max-h-[260px] w-full rounded-[12px] bg-[#F3E6D8] object-contain" />
          </a>
        ) : (
          <div className="flex min-h-40 flex-col justify-center rounded-[12px] border-2 border-dashed border-[#D8C6A4] p-4 text-sm">
            <p>Aucun flyer récupéré</p>
            <a className="underline" href={candidat.sourcePostUrl} target="_blank" rel="noreferrer">Voir la source</a>
          </div>
        )}
        {candidat.caption && <p className="mt-3 whitespace-pre-wrap text-sm text-[#8A7B66]">{candidat.caption}</p>}
      </div>
      <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); onAction(`/api/admin/event-candidates/${candidat.id}/approve`, "POST", champs(e.currentTarget)); }}>
        <p className="text-sm"><a className="underline" href={candidat.sourcePostUrl} target="_blank" rel="noreferrer">{candidat.platform}</a> · {candidat.compte ?? "compte non indiqué"}</p>
        <p className="text-xs text-[#8A7B66]">Titre {libelleConfiance(candidat.confidence.titre?.niveau)} · Date {libelleConfiance(candidat.confidence.date?.niveau)} · Lieu {libelleConfiance(candidat.confidence.lieu?.niveau)}</p>
        {(candidat.duplicateOfEventId || candidat.duplicateOfCandidateId) && <p className="text-sm text-[#92400E]">Doublon probable. {candidat.duplicateOfEventId ? `Événement ${candidat.duplicateOfEventId}` : `Candidat ${candidat.duplicateOfCandidateId}`}</p>}
        <input name="titre" defaultValue={candidat.title ?? ""} className={champ} aria-label="Titre" required />
        <input name="dateDebut" type="datetime-local" defaultValue={debut} className={champ} aria-label="Début" />
        <input name="dateFin" type="datetime-local" className={champ} aria-label="Fin" />
        <select name="fuseau" defaultValue={candidat.timezone ?? "America/Port-au-Prince"} className={champ} aria-label="Fuseau">{FUSEAUX.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}</select>
        <select name="venueId" defaultValue={candidat.venueId ?? ""} className={champ} aria-label="Lieu connu"><option value="">Lieu libre</option>{lieux.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}</select>
        <input name="lieu" defaultValue={candidat.venueName ?? ""} className={champ} aria-label="Nom du lieu" />
        <input name="ville" defaultValue={candidat.city ?? ""} className={champ} aria-label="Ville" />
        <input name="artistes" defaultValue={candidat.artistsText ?? ""} className={champ} aria-label="Artistes" />
        <input name="prix" defaultValue={candidat.priceText ?? ""} className={champ} aria-label="Prix" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="gratuit" defaultChecked={candidat.isFree === true} /> Gratuit</label>
        <select name="categorie" defaultValue={candidat.category ?? ""} className={champ} aria-label="Catégorie"><option value="">Catégorie</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}</select>
        <textarea name="description" defaultValue={candidat.description ?? ""} className={champ} aria-label="Description" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={publier} onChange={(e) => setPublier(e.target.checked)} /> Publier immédiatement après approbation</label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={BTN_PRIMAIRE}>{publier ? "Approuver et publier" : "Approuver comme brouillon"}</button>
          <button type="button" disabled={pending} className={BTN_SECONDAIRE} onClick={(e) => onAction(`/api/admin/event-candidates/${candidat.id}`, "PATCH", champs(e.currentTarget.form!))}>Enregistrer les corrections</button>
          <button type="button" disabled={pending} className={BTN_SECONDAIRE} onClick={() => onAction(`/api/admin/event-candidates/${candidat.id}/reject`, "POST", { reason: "" })}>Rejeter</button>
          <button type="button" disabled={pending} className={BTN_SECONDAIRE} onClick={() => onAction(`/api/admin/event-candidates/${candidat.id}/duplicate`, "POST", {})}>Marquer comme doublon</button>
        </div>
      </form>
    </article>
  );
}
