import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CARTE } from "@/components/admin/styles";
import {
  PERIODES_SEO,
  formaterCtr,
  formaterPosition,
  libelleDateLongue,
  type DonneesSeo,
  type LigneSeo,
  type PeriodeSeo,
  type RapportSeo,
} from "@/lib/admin/search-console-pures";

const nombre = (n: number) => n.toLocaleString("fr-FR");

/** Rapport SEO de l'Accueil admin : les performances Google Search Console du site. */
export function RapportSeoBloc({ rapport }: { rapport: RapportSeo | null }) {
  const donnees = rapport?.statut === "ok" ? rapport.donnees : null;
  return (
    <section className={`${CARTE} p-4`} aria-label="Rapport SEO">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-[#5B6472] uppercase">Google Search Console</p>
          <h2 className="font-[family-name:var(--font-display)] text-[17px] font-extrabold text-[#12161F]">Rapport SEO</h2>
          {donnees && (
            <p className="mt-0.5 text-[12.5px] text-[#5B6472]">
              Du {libelleDateLongue(donnees.debut)} au {libelleDateLongue(donnees.fin)}
            </p>
          )}
        </div>
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#D5D9E1] bg-white px-3.5 text-[12.5px] font-semibold text-[#12161F] no-underline"
        >
          Ouvrir <ExternalLink size={14} aria-hidden />
        </a>
      </div>

      {!rapport || rapport.statut === "non_configure" ? (
        <ConnexionRequise />
      ) : rapport.statut === "erreur" ? (
        <div className="rounded-[14px] border border-[#E3E6EC] bg-[#FEF3C7] p-4 text-[13.5px] text-[#92400E]">
          <p className="font-bold">Rapport SEO indisponible</p>
          <p className="mt-1">{rapport.message}</p>
        </div>
      ) : (
        <Contenu donnees={rapport.donnees} />
      )}
    </section>
  );
}

function ConnexionRequise() {
  return (
    <div className="rounded-[14px] bg-[#E7ECFF] p-4 text-[13.5px] text-[#1E2A5A]">
      <p className="font-bold">Connectez Google Search Console à cet écran</p>
      <p className="mt-1 leading-snug">
        Vous verrez ici les clics, les impressions, le taux de clics, la position moyenne, les requêtes et les pages qui
        ressortent sur Google — les mêmes chiffres que dans Search Console, sans quitter l&apos;admin.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-snug">
        <li>Dans Google Cloud : activez « Search Console API » et créez un compte de service.</li>
        <li>Dans Search Console → Paramètres → Utilisateurs et autorisations : ajoutez l&apos;e-mail de ce compte de service.</li>
        <li>
          Dans Vercel → projet du site → Settings → Environment Variables : ajoutez{" "}
          <code className="font-semibold">GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON</code> avec le JSON du compte de service, puis
          redéployez.
        </li>
      </ol>
      <p className="mt-3 text-[12.5px] leading-snug">
        Tant que la connexion n&apos;est pas faite, aucun chiffre SEO n&apos;est affiché ici — plutôt que des nombres inventés.
      </p>
    </div>
  );
}

function ChoixPeriode({ actif }: { actif: PeriodeSeo }) {
  return (
    <nav aria-label="Période du rapport SEO" className="mb-3 flex gap-2 overflow-x-auto">
      {PERIODES_SEO.map((p) => (
        <Link
          key={p.jours}
          href={`/admin?section=accueil&seo=${p.jours}`}
          aria-current={p.jours === actif ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 text-[12.5px] font-semibold no-underline ${
            p.jours === actif ? "border-[#12161F] bg-[#12161F] text-white" : "border-[#D5D9E1] bg-white text-[#12161F]"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}

function Tuile({ valeur, libelle, fond, texte }: { valeur: string; libelle: string; fond: string; texte: string }) {
  return (
    <div className={`min-w-0 rounded-[14px] p-3 ${fond}`}>
      <p className={`font-[family-name:var(--font-display)] text-[24px] leading-tight font-extrabold ${texte}`}>{valeur}</p>
      <p className={`text-[11.5px] font-semibold ${texte} opacity-85`}>{libelle}</p>
    </div>
  );
}

function Contenu({ donnees }: { donnees: DonneesSeo }) {
  return (
    <div>
      <ChoixPeriode actif={donnees.periode} />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tuile valeur={nombre(donnees.clics)} libelle="Nombre total de clics" fond="bg-[#1D3FD8]" texte="text-white" />
        <Tuile valeur={nombre(donnees.impressions)} libelle="Nombre total d'impressions" fond="bg-[#6D28D9]" texte="text-white" />
        <Tuile valeur={formaterCtr(donnees.ctr)} libelle="CTR moyen" fond="border border-[#E3E6EC] bg-white" texte="text-[#12161F]" />
        <Tuile valeur={formaterPosition(donnees.position)} libelle="Position moyenne" fond="border border-[#E3E6EC] bg-white" texte="text-[#12161F]" />
      </div>

      <Graphique donnees={donnees} />

      <div className="mt-4 space-y-4">
        <TableauLignes titre="Requêtes" premiereColonne="Requête" lignes={donnees.requetes} vide="Aucune requête enregistrée sur cette période." />
        <TableauLignes titre="Pages" premiereColonne="Page" lignes={donnees.pages} vide="Aucune page enregistrée sur cette période." />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Repartition titre="Pays" lignes={donnees.pays} />
        <Repartition titre="Appareils" lignes={donnees.appareils} />
      </div>

      <p className="mt-3 text-[12px] leading-snug text-[#5B6472]">
        Données finales de Google Search Console, publiées avec environ 3 jours de décalage. La position moyenne est pondérée
        par les impressions.
      </p>
    </div>
  );
}

function Graphique({ donnees }: { donnees: DonneesSeo }) {
  const serie = donnees.serie;
  const aucune = serie.every((j) => j.clics === 0 && j.impressions === 0);
  const largeur = 680;
  const hauteur = 190;
  const haut = 14;
  const bas = 26;
  const marge = 6;
  const interieur = hauteur - haut - bas;
  const maxClics = Math.max(1, ...serie.map((j) => j.clics));
  const maxImpressions = Math.max(1, ...serie.map((j) => j.impressions));
  const x = (i: number) => (serie.length <= 1 ? largeur / 2 : marge + (i / (serie.length - 1)) * (largeur - marge * 2));
  const yClics = (v: number) => haut + interieur - (v / maxClics) * interieur;
  const yImpressions = (v: number) => haut + interieur - (v / maxImpressions) * interieur;
  const points = (valeurs: number[], y: (v: number) => number) => valeurs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const reperes = Array.from(new Set([0, Math.floor((serie.length - 1) / 2), serie.length - 1])).filter((i) => i >= 0);
  const dernier = serie.length - 1;

  return (
    <div className="mt-4">
      <h3 className="mb-1 text-[14px] font-bold text-[#12161F]">Clics et impressions par jour</h3>
      {aucune || serie.length === 0 ? (
        <p className="text-[13px] text-[#5B6472]">Aucune donnée Google sur cette période pour le moment.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label="Clics et impressions par jour" className="block h-auto w-full">
            <g stroke="#E3E6EC">
              <line x1={marge} y1={haut + interieur} x2={largeur - marge} y2={haut + interieur} />
              <line x1={marge} y1={haut + interieur / 2} x2={largeur - marge} y2={haut + interieur / 2} />
              <line x1={marge} y1={haut} x2={largeur - marge} y2={haut} />
            </g>
            <polyline fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points(serie.map((j) => j.impressions), yImpressions)} />
            <polyline fill="none" stroke="#1D3FD8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points(serie.map((j) => j.clics), yClics)} />
            <circle cx={x(dernier)} cy={yImpressions(serie[dernier].impressions)} r="4" fill="#6D28D9" />
            <circle cx={x(dernier)} cy={yClics(serie[dernier].clics)} r="4" fill="#1D3FD8" />
            <g fontSize="11" fill="#5B6472">
              {reperes.map((i) => (
                <text key={i} x={x(i)} y={hauteur - 6} textAnchor={i === 0 ? "start" : i === dernier ? "end" : "middle"}>
                  {serie[i]?.libelle}
                </text>
              ))}
            </g>
          </svg>
          <p className="mt-1 flex flex-wrap gap-x-4 text-[12px] font-semibold text-[#3C4452]">
            <span><b className="text-[#1D3FD8]">━</b> Clics (max {nombre(maxClics)}/jour)</span>
            <span><b className="text-[#6D28D9]">━</b> Impressions (max {nombre(maxImpressions)}/jour)</span>
          </p>
        </>
      )}
    </div>
  );
}

function TableauLignes({ titre, premiereColonne, lignes, vide }: { titre: string; premiereColonne: string; lignes: LigneSeo[]; vide: string }) {
  return (
    <div>
      <h3 className="mb-1.5 text-[14px] font-bold text-[#12161F]">{titre}</h3>
      {lignes.length === 0 ? (
        <p className="text-[13px] text-[#5B6472]">{vide}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[#5B6472]">
                <th className="py-1.5 pr-2 font-semibold">{premiereColonne}</th>
                <th className="px-2 py-1.5 text-right font-semibold">Clics</th>
                <th className="px-2 py-1.5 text-right font-semibold">Impr.</th>
                <th className="px-2 py-1.5 text-right font-semibold">CTR</th>
                <th className="py-1.5 pl-2 text-right font-semibold">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.nom} className="border-t border-[#E3E6EC]">
                  <td className="max-w-[230px] truncate py-2 pr-2 font-semibold text-[#12161F]" title={l.nom}>{l.nom}</td>
                  <td className="px-2 py-2 text-right font-bold text-[#12161F]">{nombre(l.clics)}</td>
                  <td className="px-2 py-2 text-right text-[#3C4452]">{nombre(l.impressions)}</td>
                  <td className="px-2 py-2 text-right text-[#3C4452]">{formaterCtr(l.ctr)}</td>
                  <td className="py-2 pl-2 text-right text-[#3C4452]">{formaterPosition(l.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Repartition({ titre, lignes }: { titre: string; lignes: LigneSeo[] }) {
  const parClics = lignes.some((l) => l.clics > 0);
  const mesure = (l: LigneSeo) => (parClics ? l.clics : l.impressions);
  const maxi = Math.max(1, ...lignes.map(mesure));
  return (
    <div>
      <h3 className="mb-1.5 text-[14px] font-bold text-[#12161F]">{titre}</h3>
      {lignes.length === 0 ? (
        <p className="text-[13px] text-[#5B6472]">Aucune donnée sur cette période.</p>
      ) : (
        <ul className="space-y-2">
          {lignes.map((l) => (
            <li key={l.nom} className="grid grid-cols-[104px_1fr_auto] items-center gap-2 text-[12.5px]">
              <span className="truncate text-[#12161F]">{l.nom}</span>
              <span className="block h-2.5 overflow-hidden rounded-md bg-[#E7ECFF]">
                <span className="block h-full rounded-md bg-[#1D3FD8]" style={{ width: `${Math.max(4, (mesure(l) / maxi) * 100)}%` }} />
              </span>
              <b className="text-right font-bold whitespace-nowrap text-[#12161F]">
                {nombre(l.clics)} clic{l.clics > 1 ? "s" : ""}
              </b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
