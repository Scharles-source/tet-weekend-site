import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatsAujourdhui } from "@/components/admin/StatsAujourdhui";
import { CARTE } from "@/components/admin/styles";
import type { Statistiques } from "@/lib/admin/statistiques-pures";
import type { ExtrasAccueil } from "@/lib/admin/accueil";
import type { EvenementAdmin } from "@/lib/admin/charger";

function dateCourte(iso: string, fuseau: string): { jour: string; mois: string } {
  const d = new Date(iso);
  const f = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau || "America/Port-au-Prince", ...opts }).format(d);
  return { jour: f({ day: "numeric" }), mois: f({ month: "short" }).replace(".", "") };
}

export function AccueilAdmin({ evenements, extras, maintenantIso, stats }: { evenements: EvenementAdmin[]; extras: ExtrasAccueil; maintenantIso: string; stats: Statistiques | null }) {
  const maintenant = new Date(maintenantIso).getTime();
  const aVenir = evenements.filter((e) => new Date(e.date_fin ?? e.date_debut).getTime() >= maintenant);
  const publies = aVenir.filter((e) => e.statut === "publie").length;
  const brouillons = evenements.filter((e) => e.statut === "brouillon").length;
  const aVerifier = evenements.filter((e) => e.a_verifier && e.statut !== "retire").length;
  const prochains = aVenir
    .filter((e) => e.statut !== "retire")
    .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:mx-0">
      <Link
        href="/admin/collecte-evenements"
        className="flex items-center gap-3.5 rounded-[16px] bg-[#1D3FD8] p-4 text-white no-underline"
      >
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-white/20 font-[family-name:var(--font-display)] text-[24px] font-extrabold">
          {extras.aValider ?? "–"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold">Événements à valider</span>
          <span className="block text-[13px] opacity-90">
            {extras.aValider === null ? "Compteur indisponible pour le moment" : "Trouvés par la collecte, en attente"}
          </span>
        </span>
        <ChevronRight size={20} aria-hidden />
      </Link>

      <StatsAujourdhui stats={stats} />

      <div className="grid grid-cols-3 gap-2.5">
        <Compteur valeur={publies} libelle="Publiés à venir" href="/admin?section=evenements" />
        <Compteur valeur={brouillons} libelle="Brouillons" href="/admin?section=evenements" />
        <Compteur valeur={aVerifier} libelle="À vérifier" href="/admin?section=evenements" />
      </div>

      <section className={`${CARTE} p-4`}>
        <h2 className="mb-3 text-[15px] font-bold">Prochains événements</h2>
        {prochains.length === 0 ? (
          <p className="text-[13px] text-[#5B6472]">Aucun événement à venir.</p>
        ) : (
          <ul className="space-y-3">
            {prochains.map((e) => {
              const d = dateCourte(e.date_debut, e.fuseau);
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-11 shrink-0 text-center text-[11px] leading-tight font-bold text-[#5B6472] uppercase">
                    {d.mois}
                    <span className="block text-[18px] text-[#12161F]">{d.jour}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{e.titre}</span>
                  <Badge statut={e.statut} aVerifier={e.a_verifier} />
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/admin?section=evenements" className="mt-3 flex min-h-11 items-center text-[14px] font-bold text-[#1D3FD8] no-underline">
          Tous les événements
        </Link>
      </section>
    </div>
  );
}

function Compteur({ valeur, libelle, href }: { valeur: number; libelle: string; href: string }) {
  return (
    <Link href={href} className={`${CARTE} block p-3 no-underline`}>
      <span className="block font-[family-name:var(--font-display)] text-[24px] font-extrabold text-[#12161F]">{valeur}</span>
      <span className="block text-[12px] font-semibold text-[#5B6472]">{libelle}</span>
    </Link>
  );
}

function Badge({ statut, aVerifier }: { statut: string; aVerifier: boolean }) {
  if (aVerifier) return <span className="shrink-0 rounded-full bg-[#FDE3E1] px-2 py-0.5 text-[11px] font-bold text-[#9B1C14]">À vérifier</span>;
  if (statut === "publie") return <span className="shrink-0 rounded-full bg-[#DDF5E6] px-2 py-0.5 text-[11px] font-bold text-[#0E6B33]">Publié</span>;
  return <span className="shrink-0 rounded-full bg-[#FFF1CC] px-2 py-0.5 text-[11px] font-bold text-[#7A4B00]">Brouillon</span>;
}
