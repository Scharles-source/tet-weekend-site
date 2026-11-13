import Link from "next/link";
import { Actions, Appareils, Chiffres, Courbe, EnLigne, EvenementsPopulaires, InstallationsApp, Localisation, Pays, Sources, StatsIndisponibles } from "@/components/admin/StatsBlocs";
import { PERIODES, type Periode, type Statistiques } from "@/lib/admin/statistiques-pures";

/** Section « Statistiques » : le détail par période. La période est dans l'adresse (?periode=7j). */
export function SectionStatistiques({ stats, periode }: { stats: Statistiques | null; periode: Periode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-4 lg:mx-0">
      <nav aria-label="Période" className="flex gap-2 overflow-x-auto">
        {PERIODES.map((p) => (
          <Link
            key={p.id}
            href={`/admin?section=statistiques&periode=${p.id}`}
            aria-current={p.id === periode ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-[13px] font-semibold no-underline ${p.id === periode ? "border-[#12161F] bg-[#12161F] text-white" : "border-[#D5D9E1] bg-white text-[#12161F]"}`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      {!stats ? (
        <StatsIndisponibles />
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <div className="space-y-3 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            <EnLigne stats={stats} />
            <Chiffres stats={stats} />
          </div>
          <div className="lg:col-span-2"><InstallationsApp stats={stats} /></div>
          <div className="lg:col-span-2"><Courbe stats={stats} /></div>
          <Actions stats={stats} />
          <EvenementsPopulaires stats={stats} />
          <Sources stats={stats} />
          <Localisation stats={stats} />
          <Pays stats={stats} />
          <Appareils stats={stats} />
        </div>
      )}
    </div>
  );
}
