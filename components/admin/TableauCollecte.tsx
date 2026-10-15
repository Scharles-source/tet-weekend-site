"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RestaurantAdmin } from "@/lib/admin/catalogue";
import {
  LIBELLES_ACTION,
  LIBELLES_ETAT,
  LIBELLES_STATUT,
  type ActionJob,
  type CollecteEtatLigne,
  type CollecteJob,
  type EtatCollecteDb,
  type RunnerStatut,
} from "@/lib/admin/types";

const ACTIONS_LIGNE: ActionJob[] = ["sites", "maps", "ocr", "export"];

function formatHeure(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "America/Port-au-Prince",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TableauCollecte({
  restaurants,
  etats,
  jobs,
  runner,
  email,
}: {
  restaurants: RestaurantAdmin[];
  etats: CollecteEtatLigne[];
  jobs: CollecteJob[];
  runner: RunnerStatut;
  email: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const parSlug = new Map(etats.map((e) => [e.slug, e]));

  async function lancer(slug: string, action: ActionJob, params: Record<string, unknown> = {}) {
    const cle = `${slug}:${action}`;
    setEnCours(cle);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action, params }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.erreur ?? "Échec de la création du job.");
        return;
      }
      setMessage(`Job ${LIBELLES_ACTION[action]} créé pour ${slug}.`);
      router.refresh();
    } catch {
      setMessage("Impossible de joindre l'API.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
            Collecte des menus
          </h1>
          <p className="mt-1 text-sm text-[var(--text-sec)]">
            {email ?? "Admin"} · Les jobs s&apos;exécutent sur le PC du runner, jamais sur Vercel.
          </p>
        </div>
        <a
          href="#doc"
          className="rounded-lg border border-[var(--surface2)] px-3 py-1.5 text-sm text-[var(--text-sec)] hover:border-[var(--blue)]"
        >
          Doc
        </a>
      </header>

      <section
        className={`rounded-xl border px-4 py-3 text-sm ${
          runner.en_ligne
            ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
            : "border-amber-800/60 bg-amber-950/30 text-amber-100"
        }`}
        aria-live="polite"
      >
        <p className="font-medium">
          Runner : {runner.en_ligne ? "en ligne" : "hors ligne"}
          {runner.version ? ` · ${runner.version}` : ""}
        </p>
        {!runner.en_ligne && (
          <p className="mt-1 text-[var(--text-sec)]">
            Lance <code className="text-[var(--white)]">npm run collecte:runner</code> sur ton PC. Les boutons sont
            désactivés tant que le heartbeat a plus de 2 minutes.
          </p>
        )}
        {runner.dernier_heartbeat && (
          <p className="mt-1 text-xs text-[var(--text-sec)]">
            Dernier heartbeat : {formatHeure(runner.dernier_heartbeat)}
          </p>
        )}
      </section>

      {message && (
        <p className="rounded-lg border border-[var(--surface2)] bg-[var(--surface)] px-3 py-2 text-sm" role="status">
          {message}
        </p>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Restaurants</h2>
          <button
            type="button"
            disabled={!runner.en_ligne || enCours === "_global:etat"}
            onClick={() => lancer("_global", "etat")}
            className="rounded-lg border border-[var(--surface2)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Régénérer ETAT.md
          </button>
        </div>
        <ul className="space-y-3">
          {restaurants.map((r) => {
            const etat = (parSlug.get(r.slug)?.etat ?? "pas_commence") as EtatCollecteDb;
            return (
              <li
                key={r.slug}
                className="rounded-xl border border-[var(--surface2)] bg-[var(--surface)] p-4"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{r.nom}</h3>
                    <p className="text-xs text-[var(--text-sec)]">
                      {r.zones.length ? r.zones.join(" · ") : "—"} · <code>{r.slug}</code>
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--surface2)] px-2.5 py-0.5 text-xs text-[var(--text-sec)]">
                    {LIBELLES_ETAT[etat]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS_LIGNE.map((action) => {
                    const cle = `${r.slug}:${action}`;
                    return (
                      <button
                        key={action}
                        type="button"
                        disabled={!runner.en_ligne || enCours === cle}
                        onClick={() => lancer(r.slug, action)}
                        className="rounded-lg bg-[var(--surface2)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--blue-dim)] disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          action === "ocr"
                            ? "OCR : le runner utilise params.image / params.texte, sinon le fichier le plus récent dans sources/."
                            : undefined
                        }
                      >
                        {LIBELLES_ACTION[action]}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Historique des jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-[var(--text-sec)]">Aucun job pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-[var(--surface2)] rounded-xl border border-[var(--surface2)]">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{LIBELLES_ACTION[j.action]}</span>
                  <span className="text-[var(--text-sec)]"> · {j.slug}</span>
                  <span className="ml-2 text-xs text-[var(--text-sec)]">{LIBELLES_STATUT[j.statut]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-xs text-[var(--text-sec)]" dateTime={j.created_at}>
                    {formatHeure(j.created_at)}
                  </time>
                  <a href={`/admin/jobs/${j.id}`} className="text-[var(--blue)] hover:underline">
                    Log
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="doc" className="rounded-xl border border-[var(--surface2)] bg-[var(--surface)] p-4 text-sm text-[var(--text-sec)]">
        <h2 className="mb-2 font-semibold text-[var(--white)]">Architecture</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Tu cliques → un job est créé dans Supabase (<code>en_attente</code>).</li>
          <li>Le runner local récupère le job et lance la CLI (<code>scripts/collecte/</code>).</li>
          <li>Le log et l&apos;état sont mis à jour. Aucun import Supabase, aucune publication.</li>
        </ol>
        <p className="mt-3">
          Détails : README, section « Interface admin /admin ». Import manuel :{" "}
          <code>scripts/import-menus.mjs --completer-seulement</code>.
        </p>
      </section>
    </div>
  );
}
