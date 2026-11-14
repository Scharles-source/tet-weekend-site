import Link from "next/link";
import { CARTE } from "@/components/admin/styles";
import { evolution, libellePays, libelleSource, pourcent, type Statistiques, type StatsEvenement } from "@/lib/admin/statistiques-pures";

const nombre = (n: number) => n.toLocaleString("fr-FR");

export function EnLigne({ stats }: { stats: Statistiques }) {
  const { total, mobile, ordinateur } = stats.en_ligne;
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-[#1D3FD8] p-4 text-white">
      <span className="font-[family-name:var(--font-display)] text-[44px] leading-none font-extrabold">{nombre(total)}</span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <span aria-hidden className="inline-block h-[9px] w-[9px] rounded-full bg-[#7CF0B6] motion-safe:animate-pulse" />
          En ligne maintenant
        </p>
        <p className="text-[12.5px] opacity-90">
          5 dernières minutes · {nombre(mobile)} téléphone{mobile > 1 ? "s" : ""}, {nombre(ordinateur)} ordinateur{ordinateur > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

function Chiffre({ valeur, libelle, note }: { valeur: number; libelle: string; note?: string | null }) {
  return (
    <div className="min-w-0 rounded-[14px] border border-[#E3E6EC] bg-white p-3">
      <p className="font-[family-name:var(--font-display)] text-[22px] font-extrabold text-[#12161F]">{nombre(valeur)}</p>
      <p className="text-[11.5px] font-semibold text-[#5B6472]">{libelle}</p>
      {note && <p className="mt-0.5 text-[11.5px] font-bold text-[#177E54]">{note}</p>}
    </div>
  );
}

/** Installations de la web app : visiteurs distincts ayant installé ou ouvert l'app depuis l'écran d'accueil. */
export function InstallationsApp({ stats }: { stats: Statistiques }) {
  const app = stats.app;
  if (!app) return null;
  return (
    <section className={`${CARTE} p-4`} aria-label="Installations de l'app">
      <h2 className="mb-3 text-[15px] font-bold text-[#12161F]">App installée</h2>
      <div className="grid grid-cols-3 gap-2">
        <Chiffre valeur={app.installations} libelle="Installations" note={app.nouvelles_aujourdhui > 0 ? `+${app.nouvelles_aujourdhui} aujourd'hui` : null} />
        <Chiffre valeur={app.nouvelles_7j} libelle="Nouvelles (7 jours)" />
        <Chiffre valeur={app.ouvertures_aujourdhui} libelle="Ouvertures aujourd'hui" />
      </div>
      <p className="mt-2 text-[11.5px] text-[#5B6472]">Android : {app.android} · iPhone : {app.ios}. Un iPhone est compté à sa première ouverture depuis l&apos;écran d&apos;accueil.</p>
    </section>
  );
}

export function Chiffres({ stats }: { stats: Statistiques }) {
  const comparer = stats.periode === "aujourdhui";
  const filtres = stats.visiteurs_engages !== undefined || stats.robots_filtres !== undefined || stats.visiteurs_exclus !== undefined;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Chiffre valeur={stats.visiteurs} libelle={stats.periode === "aujourdhui" ? "Visiteurs aujourd'hui" : "Visiteurs"} note={comparer ? evolution(stats.visiteurs, stats.visiteurs_hier_meme_heure) : null} />
        <Chiffre valeur={stats.pages_vues} libelle="Pages vues" note={comparer ? evolution(stats.pages_vues, stats.pages_vues_hier_meme_heure) : null} />
        <Chiffre valeur={stats.jy_vais} libelle="« J'y vais »" note={comparer ? evolution(stats.jy_vais, stats.jy_vais_hier_meme_heure) : null} />
      </div>
      {filtres && (
        <p className="text-[11.5px] leading-snug text-[#5B6472]">
          Dont <b className="text-[#12161F]">{nombre(stats.visiteurs_engages ?? 0)} visiteur{(stats.visiteurs_engages ?? 0) > 1 ? "s" : ""} engagé{(stats.visiteurs_engages ?? 0) > 1 ? "s" : ""}</b> (au moins 2 pages vues ou une action).
          {" "}Non comptés ci-dessus : {nombre(stats.robots_filtres ?? 0)} robot{(stats.robots_filtres ?? 0) > 1 ? "s" : ""} filtré{(stats.robots_filtres ?? 0) > 1 ? "s" : ""} et {nombre(stats.visiteurs_exclus ?? 0)} visiteur{(stats.visiteurs_exclus ?? 0) > 1 ? "s" : ""} exclu{(stats.visiteurs_exclus ?? 0) > 1 ? "s" : ""} (tes appareils).
        </p>
      )}
      {comparer && <p className="text-[11.5px] text-[#5B6472]">Variation : comparé à hier à la même heure.</p>}
    </div>
  );
}

function Carte({ titre, note, children }: { titre: string; note?: string; children: React.ReactNode }) {
  return (
    <section className={`${CARTE} min-w-0 p-4`}>
      <h2 className="mb-3 flex items-baseline justify-between gap-2 text-[15px] font-bold text-[#12161F]">
        {titre}
        {note && <small className="text-[12px] font-semibold text-[#5B6472]">{note}</small>}
      </h2>
      {children}
    </section>
  );
}

export function Courbe({ stats }: { stats: Statistiques }) {
  const parHeure = stats.serie_type === "heure";
  const points = parHeure ? stats.serie.slice(0, stats.heure_actuelle + 1) : stats.serie;
  const precedente = parHeure ? stats.serie_precedente : null;
  const maxi = Math.max(1, ...points.map((p) => p.n), ...(precedente ?? [0]));
  const largeur = 300;
  const hauteur = 100;
  const total = parHeure ? 24 : Math.max(stats.serie.length, 2);
  const x = (i: number) => (i / (total - 1)) * largeur;
  const y = (n: number) => hauteur - (n / maxi) * (hauteur - 10) - 2;
  const ligne = (valeurs: number[]) => valeurs.map((n, i) => `${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(" ");
  const dernier = points.length - 1;
  const aucune = points.every((p) => p.n === 0) && !(precedente ?? []).some((n) => n > 0);
  const reperes = parHeure ? [0, 6, 12, 18, 23] : [0, Math.floor((stats.serie.length - 1) / 2), stats.serie.length - 1];
  return (
    <Carte titre={parHeure ? "Visiteurs par heure" : "Visiteurs par jour"} note={parHeure ? "heure d'Haïti" : undefined}>
      {aucune ? (
        <p className="text-[13px] text-[#5B6472]">Aucune visite enregistrée pour le moment.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${largeur} ${hauteur + 14}`} role="img" aria-label={parHeure ? "Visiteurs par heure, aujourd'hui et hier" : "Visiteurs par jour"} className="block h-auto w-full">
            <g stroke="#E3E6EC">
              <line x1="0" y1={hauteur - 2} x2={largeur} y2={hauteur - 2} />
              <line x1="0" y1={hauteur / 2} x2={largeur} y2={hauteur / 2} />
            </g>
            {precedente && precedente.length > 0 && <polyline fill="none" stroke="#AEB4C0" strokeWidth="2" strokeDasharray="4 4" points={ligne(precedente)} />}
            {points.length > 0 && <polyline fill="none" stroke="#1D3FD8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={ligne(points.map((p) => p.n))} />}
            {points.length > 0 && <circle cx={x(dernier)} cy={y(points[dernier].n)} r="4.5" fill="#1D3FD8" />}
            <g fontSize="9" fill="#5B6472">
              {reperes.map((i) => (
                <text key={i} x={x(i)} y={hauteur + 11} textAnchor={i === 0 ? "start" : i === total - 1 || i === stats.serie.length - 1 ? "end" : "middle"}>
                  {parHeure ? `${i === 23 ? 24 : i}h` : stats.serie[i]?.x}
                </text>
              ))}
            </g>
          </svg>
          {precedente && (
            <p className="mt-1 flex gap-4 text-[12px] font-semibold text-[#3C4452]">
              <span><b className="text-[#1D3FD8]">━</b> Aujourd&apos;hui</span>
              <span><b className="text-[#AEB4C0]">╌</b> Hier</span>
            </p>
          )}
        </>
      )}
    </Carte>
  );
}

function Barres({ lignes, vide }: { lignes: { nom: string; n: number }[]; vide: string }) {
  if (lignes.length === 0) return <p className="text-[13px] text-[#5B6472]">{vide}</p>;
  const maxi = Math.max(1, ...lignes.map((l) => l.n));
  return (
    <ul className="space-y-2">
      {lignes.map((l) => (
        <li key={l.nom} className="grid grid-cols-[104px_1fr_40px] items-center gap-2 text-[13px]">
          <span className="truncate text-[#12161F]">{l.nom}</span>
          <span className="block h-2.5 overflow-hidden rounded-md bg-[#E7ECFF]">
            <span className="block h-full rounded-md bg-[#1D3FD8]" style={{ width: `${Math.max(4, (l.n / maxi) * 100)}%` }} />
          </span>
          <b className="text-right font-bold text-[#12161F]">{nombre(l.n)}</b>
        </li>
      ))}
    </ul>
  );
}

export function Sources({ stats }: { stats: Statistiques }) {
  return (
    <Carte titre="D'où viennent-ils" note="visiteurs">
      <Barres lignes={stats.sources.map((s) => ({ nom: libelleSource(s.nom), n: s.n }))} vide="Aucune visite enregistrée pour le moment." />
      <p className="mt-3 text-[12px] leading-snug text-[#5B6472]">
        Les liens ouverts depuis une application n&apos;indiquent pas toujours leur origine. Ajoutez <code>?s=ig</code>, <code>?s=wa</code> ou <code>?s=fb</code> à la fin du lien que vous partagez.
      </p>
    </Carte>
  );
}

export function Localisation({ stats, villes = 6 }: { stats: Statistiques; villes?: number }) {
  const { haiti, diaspora, inconnu } = stats.localisation;
  const total = haiti + diaspora + inconnu;
  return (
    <Carte titre="Où sont-ils" note="visiteurs">
      {total === 0 ? (
        <p className="text-[13px] text-[#5B6472]">Aucune visite enregistrée pour le moment.</p>
      ) : (
        <>
          <div className="flex h-3.5 overflow-hidden rounded-lg bg-[#E3E6EC]" role="img" aria-label={`${pourcent(haiti, total)} % en Haïti, ${pourcent(diaspora, total)} % à l'étranger`}>
            <span style={{ width: `${(haiti / total) * 100}%` }} className="bg-[#1D3FD8]" />
            <span style={{ width: `${(diaspora / total) * 100}%` }} className="bg-[#8AA0F5]" />
          </div>
          <p className="mt-2 flex flex-wrap gap-x-4 text-[12.5px] text-[#3C4452]">
            <span><b>{pourcent(haiti, total)} %</b> en Haïti</span>
            <span><b>{pourcent(diaspora, total)} %</b> diaspora</span>
            {inconnu > 0 && <span><b>{pourcent(inconnu, total)} %</b> inconnu</span>}
          </p>
          <div className="mt-3">
            <Barres lignes={stats.villes.slice(0, villes).map((v) => ({ nom: v.nom, n: v.n }))} vide="Villes non disponibles." />
          </div>
          <p className="mt-3 text-[12px] leading-snug text-[#5B6472]">Lieu approximatif, déduit de l&apos;adresse de connexion (jamais de la position du téléphone).</p>
        </>
      )}
    </Carte>
  );
}

export function Pays({ stats }: { stats: Statistiques }) {
  return (
    <Carte titre="Pays" note="visiteurs">
      <Barres lignes={stats.pays.map((p) => ({ nom: libellePays(p.code), n: p.n }))} vide="Aucune visite enregistrée pour le moment." />
    </Carte>
  );
}

export function Appareils({ stats }: { stats: Statistiques }) {
  const { mobile, ordinateur } = stats.appareils;
  const total = mobile + ordinateur;
  return (
    <Carte titre="Appareils">
      {total === 0 ? (
        <p className="text-[13px] text-[#5B6472]">Aucune visite enregistrée pour le moment.</p>
      ) : (
        <>
          <div className="flex h-3.5 overflow-hidden rounded-lg bg-[#E3E6EC]" role="img" aria-label={`${pourcent(mobile, total)} % téléphone`}>
            <span style={{ width: `${(mobile / total) * 100}%` }} className="bg-[#1D3FD8]" />
            <span style={{ width: `${(ordinateur / total) * 100}%` }} className="bg-[#8AA0F5]" />
          </div>
          <p className="mt-2 flex gap-4 text-[12.5px] text-[#3C4452]">
            <span><b>{pourcent(mobile, total)} %</b> téléphone</span>
            <span><b>{pourcent(ordinateur, total)} %</b> ordinateur</span>
          </p>
        </>
      )}
    </Carte>
  );
}

export function Actions({ stats }: { stats: Statistiques }) {
  return (
    <Carte titre="Ce qu'ils font">
      <Barres
        lignes={[
          { nom: "J'y vais", n: stats.jy_vais },
          { nom: "Flyer ouvert", n: stats.actions.flyer },
          { nom: "Agenda ajouté", n: stats.actions.agenda },
        ]}
        vide=""
      />
      <p className="mt-3 text-[12px] leading-snug text-[#5B6472]">Chaque action compte une fois par visiteur, par événement et par jour.</p>
    </Carte>
  );
}

function dateCourte(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "America/Port-au-Prince" }).format(new Date(iso)).replace(".", "");
  } catch {
    return "";
  }
}

function LigneEvenement({ e, rang, detail }: { e: StatsEvenement; rang: number; detail: boolean }) {
  return (
    <li className="grid grid-cols-[20px_1fr_auto] items-center gap-3 border-t border-[#E3E6EC] py-2.5 first:border-t-0 first:pt-0">
      <span className="text-[13px] font-extrabold text-[#5B6472]">{rang}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-bold text-[#12161F]">{e.titre}</span>
        <span className="block truncate text-[12px] text-[#5B6472]">{[e.ville, dateCourte(e.date_debut)].filter(Boolean).join(" · ")}</span>
      </span>
      <span className="flex gap-3 text-[12px] font-bold whitespace-nowrap text-[#3C4452]">
        <span>{nombre(e.vues)} vue{e.vues > 1 ? "s" : ""}</span>
        {detail && <span className="hidden sm:inline">{nombre(e.flyers)} flyer{e.flyers > 1 ? "s" : ""}</span>}
        <span>{nombre(e.interets)} y vont</span>
      </span>
    </li>
  );
}

export function EvenementsPopulaires({ stats, limite = 8, detail = true, titre = "Événements les plus consultés" }: { stats: Statistiques; limite?: number; detail?: boolean; titre?: string }) {
  const liste = stats.evenements.slice(0, limite);
  return (
    <Carte titre={titre}>
      {liste.length === 0 ? (
        <p className="text-[13px] text-[#5B6472]">Aucune fiche d&apos;événement consultée pour le moment.</p>
      ) : (
        <ul>{liste.map((e, i) => <LigneEvenement key={e.id} e={e} rang={i + 1} detail={detail} />)}</ul>
      )}
    </Carte>
  );
}

export function StatsIndisponibles() {
  return (
    <div className="rounded-[16px] border border-[#E3E6EC] bg-[#FEF3C7] p-4 text-[13.5px] text-[#92400E]">
      <p className="font-bold">Statistiques indisponibles</p>
      <p className="mt-1">La migration <code>20261113000000_statistiques_site.sql</code> n&apos;est pas encore appliquée, ou la lecture a échoué.</p>
    </div>
  );
}

export function LienToutesLesStats() {
  return (
    <Link href="/admin?section=statistiques" className="flex min-h-11 items-center text-[14px] font-bold text-[#1D3FD8] no-underline">
      Toutes les statistiques
    </Link>
  );
}
