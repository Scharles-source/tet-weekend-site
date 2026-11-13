import { Chiffres, Courbe, EnLigne, EvenementsPopulaires, InstallationsApp, LienToutesLesStats, Localisation, Sources, StatsIndisponibles } from "@/components/admin/StatsBlocs";
import type { Statistiques } from "@/lib/admin/statistiques-pures";

/** Bloc « Aujourd'hui » de l'Accueil admin. */
export function StatsAujourdhui({ stats }: { stats: Statistiques | null }) {
  if (!stats) return <StatsIndisponibles />;
  return (
    <div className="space-y-3">
      <EnLigne stats={stats} />
      <Chiffres stats={stats} />
      <InstallationsApp stats={stats} />
      <Courbe stats={stats} />
      <Sources stats={stats} />
      <Localisation stats={stats} villes={4} />
      <EvenementsPopulaires stats={stats} limite={3} detail={false} titre="Événements les plus consultés aujourd'hui" />
      <LienToutesLesStats />
    </div>
  );
}
