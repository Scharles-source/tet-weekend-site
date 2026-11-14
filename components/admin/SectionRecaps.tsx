"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marquerRecap } from "@/app/admin/actions-recaps";
import { AIDE, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, TITRE_BLOC } from "@/components/admin/styles";
import type { ChargementRecaps } from "@/lib/admin/recaps";
import { ACTIONS_RECAP, LIBELLES_RECAP, STATUTS_RECAP, compterAValider, libelleAValider, type RecapAdmin, type StatutRecap } from "@/lib/admin/recaps-pures";

const COULEURS: Record<StatutRecap, string> = {
  a_valider: "bg-[#FDE3E1] text-[#9B1C14]",
  publie: "bg-[#DDF5E6] text-[#0E6B33]",
  ecarte: "bg-[#EEF0F4] text-[#5B6472]",
};

export function SectionRecaps({ resultat }: { resultat: ChargementRecaps }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<"actives" | StatutRecap>("actives");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!resultat.ok) {
    return (
      <div className={`${CARTE} mx-auto max-w-3xl p-5 lg:mx-0`}>
        <h2 className={TITRE_BLOC}>Récaps vidéo</h2>
        <p className="mt-2 text-[14px] text-[#92400E]">
          {resultat.absente
            ? "La migration 20261113220000_recaps_video.sql n'est pas encore appliquée : les récaps ne peuvent pas être lus."
            : `Lecture impossible : ${resultat.message}`}
        </p>
      </div>
    );
  }

  const liste = resultat.liste;
  const visibles = liste.filter((r) => (filtre === "actives" ? r.statut !== "ecarte" : r.statut === filtre));
  const nombre = (st: StatutRecap) => liste.filter((r) => r.statut === st).length;

  function changer(r: RecapAdmin, statut: StatutRecap) {
    if (r.statut === statut) return;
    setErreur(null);
    demarrer(async () => {
      const res = await marquerRecap({ id: r.id, statut });
      if (!res.ok) setErreur(res.erreur);
      else router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:mx-0">
      <p className="text-[14px] font-semibold text-[#12161F]">{libelleAValider(compterAValider(liste))}</p>
      <p className={AIDE}>Les vidéos publiées apparaissent dans la rangée « Recaps » de l&apos;accueil. Rien ne se charge chez le visiteur tant qu&apos;il n&apos;a pas cliqué sur une affiche.</p>
      <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filtrer les récaps">
        <Chip actif={filtre === "actives"} onClick={() => setFiltre("actives")}>Actives</Chip>
        {STATUTS_RECAP.map((st) => (
          <Chip key={st} actif={filtre === st} onClick={() => setFiltre(st)}>
            {LIBELLES_RECAP[st]} {nombre(st)}
          </Chip>
        ))}
      </div>
      {erreur && <p className="text-[13px] text-[#D92D20]">{erreur}</p>}
      {enCours && <p className="text-[13px] text-[#5B6472]">Enregistrement…</p>}

      {visibles.length === 0 ? (
        <p className={`${CARTE} p-5 text-[14px] text-[#5B6472]`}>Aucune vidéo dans cette vue.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((r) => (
            <li key={r.id} className={`${CARTE} p-4`}>
              <div className="flex gap-3">
                {r.vignette_url ? (
                  <a href={r.post_url} target="_blank" rel="noreferrer" aria-label={`Ouvrir le post de ${r.titre}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.vignette_url} alt={`Affiche de ${r.titre}`} width={96} height={128} className="h-32 w-24 rounded-[12px] border border-[#E3E6EC] object-cover" loading="lazy" />
                  </a>
                ) : (
                  <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-[12px] border border-[#E3E6EC] bg-[#F3F4F7] p-2 text-center text-[11px] text-[#5B6472]">Affiche indisponible</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <h2 className="min-w-0 flex-1 text-[16px] leading-tight font-extrabold break-words text-[#12161F]">{r.titre}</h2>
                    <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${COULEURS[r.statut]}`}>{LIBELLES_RECAP[r.statut]}</span>
                  </div>
                  {r.lieu_nom && <p className="mt-1 text-[13.5px] text-[#3C4452]">{r.lieu_nom}</p>}
                  {r.evenement_label && <p className="text-[13.5px] text-[#3C4452]">{r.evenement_label}</p>}
                  <p className={`mt-1 ${AIDE}`}>
                    Source :{" "}
                    <a href={r.post_url} target="_blank" rel="noreferrer" className="font-semibold text-[#1D3FD8] underline">
                      {r.compte_source ?? r.post_url}
                    </a>{" "}
                    ({r.plateforme})
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Changer le statut">
                {STATUTS_RECAP.map((st) => (
                  <button key={st} type="button" disabled={enCours || r.statut === st} aria-pressed={r.statut === st} onClick={() => changer(r, st)} className={r.statut === st ? BTN_PRIMAIRE : BTN_SECONDAIRE}>
                    {ACTIONS_RECAP[st]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={actif} onClick={onClick} className={`inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full border-[1.5px] px-3 text-[13px] font-semibold ${actif ? "border-[#12161F] bg-[#12161F] text-white" : "border-[#E3E6EC] bg-white text-[#3C4452]"}`}>
      {children}
    </button>
  );
}
