import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonDeconnexion } from "@/components/admin/BoutonDeconnexion";
import { exigerAdmin } from "@/lib/admin/auth";
import { lireJob } from "@/lib/admin/data";
import { LIBELLES_ACTION, LIBELLES_STATUT } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdmin();
  const { id } = await params;
  const job = await lireJob(id);
  if (!job) notFound();

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-[var(--blue)] hover:underline">
          ← Retour admin
        </Link>
        <BoutonDeconnexion />
      </div>
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Job {LIBELLES_ACTION[job.action]}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-sec)]">
          {job.slug} · {LIBELLES_STATUT[job.statut]} · {job.id}
        </p>
      </header>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[var(--text-sec)]">Créé</dt>
          <dd>{job.created_at}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-sec)]">Démarré</dt>
          <dd>{job.started_at ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-sec)]">Terminé</dt>
          <dd>{job.finished_at ?? "—"}</dd>
        </div>
      </dl>
      {Object.keys(job.params ?? {}).length > 0 && (
        <pre className="overflow-x-auto rounded-xl border border-[var(--surface2)] bg-[var(--surface)] p-3 text-xs">
          {JSON.stringify(job.params, null, 2)}
        </pre>
      )}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Log</h2>
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--surface2)] bg-[var(--black)] p-4 text-xs leading-relaxed text-[var(--white)]">
          {job.log || "(vide)"}
        </pre>
      </section>
    </main>
  );
}
