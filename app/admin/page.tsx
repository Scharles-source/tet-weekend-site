import { BoutonDeconnexion } from "@/components/admin/BoutonDeconnexion";
import { TableauCollecte } from "@/components/admin/TableauCollecte";
import { exigerAdmin } from "@/lib/admin/auth";
import { RESTAURANTS_ADMIN } from "@/lib/admin/catalogue";
import { lireEtats, lireJobs, lireRunner } from "@/lib/admin/data";
import type { CollecteEtatLigne, CollecteJob, RunnerStatut } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await exigerAdmin();

  let etats: CollecteEtatLigne[] = [];
  let jobs: CollecteJob[] = [];
  let runner: RunnerStatut = { en_ligne: false, dernier_heartbeat: null, version: null };
  let erreur: string | null = null;
  try {
    [etats, jobs, runner] = await Promise.all([lireEtats(), lireJobs(20), lireRunner()]);
  } catch (e) {
    erreur = (e as Error).message;
  }

  return (
    <main>
      <div className="mb-4 flex justify-end">
        <BoutonDeconnexion />
      </div>
      {erreur ? (
        <p className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          Impossible de lire les jobs / états : {erreur}. La migration{" "}
          <code>20261015000100_collecte_jobs.sql</code> est-elle appliquée ? Variables{" "}
          <code>NEXT_PUBLIC_SUPABASE_*</code> présentes ?
        </p>
      ) : (
        <TableauCollecte
          restaurants={RESTAURANTS_ADMIN}
          etats={etats}
          jobs={jobs}
          runner={runner}
          email={session.email}
        />
      )}
    </main>
  );
}
