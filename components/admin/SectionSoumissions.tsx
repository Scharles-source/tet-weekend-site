"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marquerSoumission } from "@/app/admin/actions-soumissions";
import { AIDE, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, TITRE_BLOC } from "@/components/admin/styles";
import type { ChargementSoumissions } from "@/lib/admin/soumissions";
import { LIBELLES_SOUMISSION, STATUTS_SOUMISSION, compterNouvelles, libelleNouvelles, type SoumissionAdmin, type StatutSoumission } from "@/lib/admin/soumissions-pures";

const COULEURS: Record<StatutSoumission, string> = {
  nouveau: "bg-[#FDE3E1] text-[#9B1C14]",
  lu: "bg-[#FFF1CC] text-[#7A4B00]",
  traite: "bg-[#DDF5E6] text-[#0E6B33]",
  archive: "bg-[#EEF0F4] text-[#5B6472]",
};

function recu(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Port-au-Prince", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function SectionSoumissions({ resultat }: { resultat: ChargementSoumissions }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<"actives" | StatutSoumission>("actives");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!resultat.ok) {
    return (
      <div className={`${CARTE} mx-auto max-w-3xl p-5 lg:mx-0`}>
        <h2 className={TITRE_BLOC}>Soumissions</h2>
        <p className="mt-2 text-[14px] text-[#92400E]">
          {resultat.absente
            ? "La migration 20261113210000_soumissions.sql n'est pas encore appliquée : les soumissions ne peuvent pas être lues."
            : `Lecture impossible : ${resultat.message}`}
        </p>
      </div>
    );
  }

  const liste = resultat.liste;
  const visibles = liste.filter((s) => (filtre === "actives" ? s.statut !== "archive" : s.statut === filtre));
  const nombre = (st: StatutSoumission) => liste.filter((s) => s.statut === st).length;

  function changer(s: SoumissionAdmin, statut: StatutSoumission) {
    if (s.statut === statut) return;
    setErreur(null);
    demarrer(async () => {
      const res = await marquerSoumission({ id: s.id, statut });
      if (!res.ok) setErreur(res.erreur);
      else router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:mx-0">
      <p className="text-[14px] font-semibold text-[#12161F]">{libelleNouvelles(compterNouvelles(liste))}</p>
      <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filtrer les soumissions">
        <Chip actif={filtre === "actives"} onClick={() => setFiltre("actives")}>Actives</Chip>
        {STATUTS_SOUMISSION.map((st) => (
          <Chip key={st} actif={filtre === st} onClick={() => setFiltre(st)}>
            {LIBELLES_SOUMISSION[st]} {nombre(st)}
          </Chip>
        ))}
      </div>
      {erreur && <p className="text-[13px] text-[#D92D20]">{erreur}</p>}
      {enCours && <p className="text-[13px] text-[#5B6472]">Enregistrement…</p>}

      {visibles.length === 0 ? (
        <p className={`${CARTE} p-5 text-[14px] text-[#5B6472]`}>Aucune soumission dans cette vue.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((s) => (
            <li key={s.id} className={`${CARTE} p-4`}>
              <div className="flex gap-3">
                {s.flyer_url ? (
                  <a href={s.flyer_url} target="_blank" rel="noreferrer" aria-label={`Ouvrir le flyer de ${s.evenement}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.flyer_url} alt={`Flyer de ${s.evenement}`} width={96} height={128} className="h-32 w-24 rounded-[12px] border border-[#E3E6EC] object-cover" />
                  </a>
                ) : (
                  <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-[12px] border border-[#E3E6EC] bg-[#F3F4F7] p-2 text-center text-[11px] text-[#5B6472]">Flyer indisponible</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <h2 className="min-w-0 flex-1 text-[16px] leading-tight font-extrabold break-words text-[#12161F]">{s.evenement}</h2>
                    <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${COULEURS[s.statut]}`}>{LIBELLES_SOUMISSION[s.statut]}</span>
                  </div>
                  <p className="mt-1 text-[13.5px] text-[#3C4452]">{s.lieu}</p>
                  <p className="text-[13.5px] text-[#3C4452]">Date : {s.date_evenement}</p>
                  <p className={`mt-1 ${AIDE}`}>Reçue le {recu(s.created_at)}</p>
                </div>
              </div>

              <dl className="mt-3 space-y-1 text-[13.5px]">
                <Ligne etiquette="Nom">{s.nom}</Ligne>
                <Ligne etiquette="E-mail"><a href={`mailto:${s.email}`} className="font-semibold text-[#1D3FD8] underline">{s.email}</a></Ligne>
                {s.telephone && <Ligne etiquette="Téléphone"><a href={`tel:${s.telephone}`} className="font-semibold text-[#1D3FD8] underline">{s.telephone}</a></Ligne>}
                {s.details && <Ligne etiquette="Détails"><span className="whitespace-pre-wrap">{s.details}</span></Ligne>}
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Changer le statut">
                {STATUTS_SOUMISSION.map((st) => (
                  <button key={st} type="button" disabled={enCours || s.statut === st} aria-pressed={s.statut === st} onClick={() => changer(s, st)} className={s.statut === st ? BTN_PRIMAIRE : BTN_SECONDAIRE}>
                    {LIBELLES_SOUMISSION[st]}
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

function Ligne({ etiquette, children }: { etiquette: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-[#5B6472]">{etiquette}</dt>
      <dd className="min-w-0 flex-1 break-words text-[#12161F]">{children}</dd>
    </div>
  );
}
