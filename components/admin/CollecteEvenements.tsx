"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saisieDepuisInstant } from "@/lib/listing/dates";
import { CATEGORIES, FUSEAUX } from "@/lib/listing/schema";
import {
  FREQUENCES,
  LIMITES_VISIBLES,
  PLATEFORMES_SOURCE,
  TYPES_SOURCE,
  frequenceLibelle,
  libelleConfiance,
  libelleStatutJob,
  type VueCandidat,
  type VueCollecte,
  type VueSource,
} from "@/lib/crawlers/vue";

const champ = "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3";

export function CollecteEvenements({ donnees, apercu = false }: { donnees: VueCollecte; apercu?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(apercu ? "Aperçu local, hors production." : null);
  const [pending, setPending] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreSource, setFiltreSource] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [url, setUrl] = useState("");

  async function agir(chemin: string, body?: unknown) {
    setMessage(null);
    if (apercu) {
      setMessage("Aperçu : aucune écriture.");
      return;
    }
    setPending(true);
    try {
      const reponse = await fetch(chemin, {
        method: body ? "POST" : "POST",
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

  const jobs = useMemo(
    () => donnees.jobs.filter((j) => (!filtreStatut || j.status === filtreStatut) && (!filtreSource || j.sourceId === filtreSource)),
    [donnees.jobs, filtreStatut, filtreSource],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-sec)]"><Link href="/admin">Admin</Link></p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">Collecte — Événements</h1>
          <p className="text-sm text-[var(--text-sec)]">{donnees.email} — rien n&apos;est publié sans un clic d&apos;approbation.</p>
        </div>
      </header>
      {message && <p className="text-sm text-amber-100">{message}</p>}
      <section id="bandeau" className="grid gap-3 sm:grid-cols-4">
        <Carte titre="Crawler" valeur={donnees.globalEnabled ? "Activé" : "Pause globale"} />
        <Carte titre="Runner" valeur={donnees.runnerEnLigne ? "En ligne" : "Hors ligne"} detail={donnees.heartbeatAt ? `Dernier battement ${donnees.heartbeatAt}` : "Aucun battement"} />
        <Carte titre="Jobs" valeur={`${donnees.comptes.queued} en file`} detail={`${donnees.comptes.running} en cours · ${donnees.comptes.blocked} bloqués · ${donnees.comptes.failed} échoués`} />
        <Carte titre="À valider" valeur={String(donnees.aValider)} />
      </section>
      <section className="rounded-2xl border border-white/10 p-4 text-sm text-[var(--text-sec)]">
        <ul className="list-disc space-y-1 pl-5">
          {LIMITES_VISIBLES.map((ligne) => <li key={ligne}>{ligne}</li>)}
        </ul>
      </section>
      <section className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} className="min-h-11 rounded-full bg-[var(--blue)] px-4 text-sm text-black disabled:opacity-50" onClick={() => agir("/api/admin/crawlers/jobs", { jobType: "scan_all" })}>Scanner toutes les sources actives</button>
        <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-4 text-sm disabled:opacity-50" onClick={() => agirMethode("/api/admin/crawlers/settings", "PATCH", { globalEnabled: !donnees.globalEnabled })}>{donnees.globalEnabled ? "Pause globale" : "Reprendre"}</button>
        <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-4 text-sm disabled:opacity-50" onClick={() => agirMethode("/api/admin/crawlers/settings", "PATCH", { schedulerEnabled: !donnees.schedulerEnabled })}>Planification automatique : {donnees.schedulerEnabled ? "oui" : "non"}</button>
      </section>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void agir("/api/admin/crawlers/jobs", { jobType: "import_url", inputUrl: url }); }}>
        <input className={`${champ} max-w-xl`} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL à importer" />
        <button type="submit" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-4 text-sm disabled:opacity-50">Importer une URL</button>
      </form>
      <FormulaireSource pending={pending} onCreer={(body) => agir("/api/admin/watch-accounts", body)} />
      <section id="sources" className="space-y-3">
        <h2 className="text-xl font-bold">Sources</h2>
        {donnees.sources.length === 0 && <p className="text-sm text-[var(--text-sec)]">Aucune source.</p>}
        {donnees.sources.map((source) => (
          <article key={source.id} className="rounded-2xl border border-white/10 p-4 text-sm">
            <p className="font-semibold">{source.displayName || source.handle || source.profileUrl} · {source.platform}</p>
            <p className="text-[var(--text-sec)]">{source.sourceType} · {[source.city, source.country].filter(Boolean).join(", ") || "Ville non indiquée"} · {frequenceLibelle(source.scanFrequencyMinutes)} · {source.active ? "active" : "en pause"}</p>
            <p className="text-[var(--text-sec)]">Dernier scan : {source.lastScannedAt ?? "jamais"} · succès : {source.lastSuccessAt ?? "jamais"} · candidats : {source.candidats}</p>
            {source.lastError && <p className="text-amber-100">{source.lastError}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={pending || !source.active} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => agir("/api/admin/crawlers/jobs", { jobType: "scan_source", sourceId: source.id })}>Scanner</button>
              <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => agirMethode(`/api/admin/watch-accounts/${source.id}`, "PATCH", { active: !source.active })}>{source.active ? "Mettre en pause" : "Réactiver"}</button>
            </div>
            <EditionSource source={source} pending={pending} onSauver={(body) => agirMethode(`/api/admin/watch-accounts/${source.id}`, "PATCH", body)} />
          </article>
        ))}
      </section>
      <section id="jobs" className="space-y-3">
        <h2 className="text-xl font-bold">Jobs</h2>
        <div className="flex flex-wrap gap-2">
          <select className={champ} aria-label="Filtrer par statut" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {["queued", "running", "blocked", "failed", "succeeded", "cancelled"].map((s) => <option key={s} value={s}>{libelleStatutJob(s)}</option>)}
          </select>
          <select className={champ} aria-label="Filtrer par source" value={filtreSource} onChange={(e) => setFiltreSource(e.target.value)}>
            <option value="">Toutes les sources</option>
            {donnees.sources.map((s) => <option key={s.id} value={s.id}>{s.displayName || s.handle || s.platform}</option>)}
          </select>
        </div>
        {jobs.map((job) => (
          <details key={job.id} open={apercu} className="rounded-2xl border border-white/10 p-4 text-sm">
            <summary className="cursor-pointer">{new Date(job.createdAt).toLocaleString("fr-FR")} · {job.jobType} · {job.sourceNom ?? job.inputUrl ?? "—"} · {libelleStatutJob(job.status)}</summary>
            <p className="mt-2 text-[var(--text-sec)]">scannés {job.counts.scanned ?? 0} · nouveaux {job.counts.newCandidates ?? 0} · doublons {job.counts.duplicates ?? 0} · ignorés {job.counts.ignored ?? 0} · erreurs {job.counts.errors ?? 0}</p>
            {job.errorMessage && <p className="text-amber-100">{job.errorMessage}</p>}
            <ul className="mt-2 space-y-1">{job.logs.map((log) => <li key={log.id}>{new Date(log.createdAt).toLocaleString("fr-FR")} · {log.level} · {log.message}</li>)}</ul>
            <div className="mt-2 flex gap-2">
              {["queued", "running"].includes(job.status) && <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => agir(`/api/admin/crawlers/jobs/${job.id}/cancel`)}>Annuler</button>}
              {["failed", "blocked"].includes(job.status) && <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => agir(`/api/admin/crawlers/jobs/${job.id}/retry`)}>Réessayer</button>}
            </div>
          </details>
        ))}
      </section>
      <section id="a-valider" className="space-y-4">
        <h2 className="text-xl font-bold">À valider</h2>
        {selection.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => agir("/api/admin/event-candidates/bulk", { ids: selection, action: "reject" })}>Rejeter la sélection</button>
            <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => agir("/api/admin/event-candidates/bulk", { ids: selection, action: "duplicate" })}>Marquer la sélection comme doublon</button>
          </div>
        )}
        {donnees.candidats.map((candidat) => (
          <CandidatCarte key={candidat.id} candidat={candidat} lieux={donnees.lieux} pending={pending} coche={selection.includes(candidat.id)} onCoche={(oui) => setSelection((liste) => oui ? [...liste, candidat.id] : liste.filter((id) => id !== candidat.id))} onAction={agirMethode} />
        ))}
      </section>
    </div>
  );
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <article className="rounded-2xl border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--text-sec)]">{titre}</p>
      <p className="text-lg font-bold">{valeur}</p>
      {detail && <p className="text-xs text-[var(--text-sec)]">{detail}</p>}
    </article>
  );
}

function FormulaireSource({ pending, onCreer }: { pending: boolean; onCreer: (body: Record<string, unknown>) => void }) {
  return (
    <form className="grid gap-2 rounded-2xl border border-white/10 p-4 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      const donnees = new FormData(e.currentTarget);
      onCreer(Object.fromEntries(donnees.entries()));
    }}>
      <h2 className="sm:col-span-2 text-xl font-bold">Ajouter une source</h2>
      <select name="platform" className={champ} aria-label="Plateforme">{PLATEFORMES_SOURCE.map((p) => <option key={p}>{p}</option>)}</select>
      <select name="sourceType" className={champ} aria-label="Type">{TYPES_SOURCE.map((t) => <option key={t}>{t}</option>)}</select>
      <input name="handle" className={champ} placeholder="Handle" aria-label="Handle" />
      <input name="profileUrl" className={champ} placeholder="URL du profil" aria-label="URL du profil" />
      <input name="displayName" className={champ} placeholder="Nom affiché" aria-label="Nom affiché" />
      <input name="city" className={champ} placeholder="Ville" aria-label="Ville" />
      <input name="country" className={champ} placeholder="Pays" aria-label="Pays" />
      <select name="scanFrequencyMinutes" className={champ} defaultValue="1440" aria-label="Fréquence">{FREQUENCES.map((f) => <option key={f.minutes} value={f.minutes}>{f.libelle}</option>)}</select>
      <input name="maxPostsPerScan" className={champ} defaultValue="20" aria-label="Maximum de posts" />
      <input name="notes" className={champ} placeholder="Notes" aria-label="Notes" />
      <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--blue)] px-4 text-sm text-black disabled:opacity-50">Ajouter</button>
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
        <select name="scanFrequencyMinutes" defaultValue={String(source.scanFrequencyMinutes)} className={champ} aria-label="Fréquence">{FREQUENCES.map((f) => <option key={f.minutes} value={f.minutes}>{f.libelle}</option>)}</select>
        <input name="maxPostsPerScan" defaultValue={String(source.maxPostsPerScan)} className={champ} aria-label="Maximum de posts" />
        <input name="notes" defaultValue={source.notes ?? ""} className={champ} aria-label="Notes" />
        <button type="submit" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50">Enregistrer la source</button>
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
    <article className="grid gap-4 rounded-2xl border border-white/10 p-4 lg:grid-cols-2">
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={coche} onChange={(e) => onCoche(e.target.checked)} /> Sélectionner</label>
        {candidat.flyerUrl ? (
          <a href={candidat.flyerUrl} target="_blank" rel="noreferrer">
            {/* Le flyer candidat est une URL signée ou locale : object-fit contain, pas de recadrage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={candidat.flyerUrl} alt={`Flyer — ${candidat.title ?? "candidat"}`} className="max-h-[420px] w-full rounded-[18px] bg-[#0D0A14] object-contain" />
          </a>
        ) : (
          <div className="flex min-h-40 flex-col justify-center rounded-[18px] bg-[#0D0A14] p-4 text-sm">
            <p>Aucun flyer récupéré</p>
            <a className="underline" href={candidat.sourcePostUrl} target="_blank" rel="noreferrer">Voir la source</a>
          </div>
        )}
        {candidat.caption && <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text-sec)]">{candidat.caption}</p>}
      </div>
      <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); onAction(`/api/admin/event-candidates/${candidat.id}/approve`, "POST", champs(e.currentTarget)); }}>
        <p className="text-sm"><a className="underline" href={candidat.sourcePostUrl} target="_blank" rel="noreferrer">{candidat.platform}</a> · {candidat.compte ?? "compte non indiqué"}</p>
        <p className="text-xs text-[var(--text-sec)]">Titre {libelleConfiance(candidat.confidence.titre?.niveau)} · Date {libelleConfiance(candidat.confidence.date?.niveau)} · Lieu {libelleConfiance(candidat.confidence.lieu?.niveau)}</p>
        {(candidat.duplicateOfEventId || candidat.duplicateOfCandidateId) && <p className="text-sm text-amber-100">Doublon probable. {candidat.duplicateOfEventId ? `Événement ${candidat.duplicateOfEventId}` : `Candidat ${candidat.duplicateOfCandidateId}`}</p>}
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
          <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--blue)] px-3 text-sm text-black disabled:opacity-50">{publier ? "Approuver et publier" : "Approuver comme brouillon"}</button>
          <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={(e) => onAction(`/api/admin/event-candidates/${candidat.id}`, "PATCH", champs(e.currentTarget.form!))}>Enregistrer les corrections</button>
          <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => onAction(`/api/admin/event-candidates/${candidat.id}/reject`, "POST", { reason: "" })}>Rejeter</button>
          <button type="button" disabled={pending} className="min-h-11 rounded-full border border-white/15 px-3 disabled:opacity-50" onClick={() => onAction(`/api/admin/event-candidates/${candidat.id}/duplicate`, "POST", {})}>Marquer comme doublon</button>
        </div>
      </form>
    </article>
  );
}
