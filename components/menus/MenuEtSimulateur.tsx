"use client";
import { useEffect, useMemo, useState } from "react";
import { calculerBudget, convertirEnCentimes, tauxApplicable, type MontantDouble } from "@/lib/menus/budget";
import { articlePreRempli, etatArticle, formatMontant, formatTaux, periodeCommune } from "@/lib/menus/format";
import { CATEGORIES, type Devise, type MenuItem } from "@/lib/menus/types";

interface ParametresRestaurant {
  devise: Devise | null;
  taux: number | null;
  taxePct: number | null;
  taxeIncluse: boolean | null;
  servicePct: number | null;
  serviceInclus: boolean | null;
}

interface Props {
  slug: string;
  items: MenuItem[];
  restaurant: ParametresRestaurant;
  tauxGlobal: number | null;
}

interface PlateauSauve {
  quantites: Record<string, number>;
  personnes: number;
  pourboire: string;
  /** null = taux par défaut (restaurant, sinon global). */
  tauxSaisi: string | null;
}

const PLATEAU_VIDE: PlateauSauve = { quantites: {}, personnes: 1, pourboire: "0", tauxSaisi: null };

const cleStockage = (slug: string) => `tetweekend:plateau:${slug}`;

const lireNombre = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]";
const BOUTON_ROND =
  `flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[var(--surface2)] ` +
  `text-lg font-bold disabled:opacity-30 ${FOCUS}`;
const CHAMP =
  `min-h-11 w-full rounded-xl border border-white/15 bg-[var(--surface2)] px-3 text-[15px] text-[var(--white)] ${FOCUS}`;

export default function MenuEtSimulateur({ slug, items, restaurant, tauxGlobal }: Props) {
  const [plateau, setPlateau] = useState<PlateauSauve>(PLATEAU_VIDE);
  const [charge, setCharge] = useState(false);
  const [prerempli, setPrerempli] = useState<string | null>(null);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(cleStockage(slug));
      if (brut) {
        const sauve = JSON.parse(brut) as Partial<PlateauSauve>;
        const ids = new Set(items.map((i) => i.id));
        const quantites = Object.fromEntries(
          Object.entries(sauve.quantites ?? {}).filter(([id, q]) => ids.has(id) && Number.isInteger(q) && q > 0)
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique après hydratation (localStorage indisponible côté serveur)
        setPlateau({ ...PLATEAU_VIDE, ...sauve, quantites });
      } else {
        const article = articlePreRempli(items);
        if (article) {
          setPlateau({ ...PLATEAU_VIDE, quantites: { [article.id]: 1 } });
          setPrerempli(article.nom);
        }
      }
    } catch {}
    setCharge(true);
  }, [slug, items]);

  useEffect(() => {
    if (!charge) return;
    try {
      window.localStorage.setItem(cleStockage(slug), JSON.stringify(plateau));
    } catch {}
  }, [charge, plateau, slug]);

  const devise: Devise = restaurant.devise ?? items[0]?.devise ?? "HTG";
  const tauxParDefaut = tauxApplicable(restaurant.taux, tauxGlobal);
  const tauxUtilise =
    plateau.tauxSaisi === null ? tauxParDefaut : tauxApplicable(lireNombre(plateau.tauxSaisi));
  const pourboirePct = Math.min(100, Math.max(0, lireNombre(plateau.pourboire) ?? 0));

  const lignes = useMemo(
    () => items.filter((i) => (plateau.quantites[i.id] ?? 0) > 0).map((i) => ({ item: i, quantite: plateau.quantites[i.id] })),
    [items, plateau.quantites]
  );
  const nbArticles = lignes.reduce((s, l) => s + l.quantite, 0);

  const resultat = calculerBudget({
    lignes: lignes.map((l) => ({ prix: l.item.prix, devise: l.item.devise, quantite: l.quantite })),
    personnes: plateau.personnes,
    devise,
    taux: tauxUtilise,
    taxePct: restaurant.taxePct,
    taxeIncluse: restaurant.taxeIncluse,
    servicePct: restaurant.servicePct,
    serviceInclus: restaurant.serviceInclus,
    pourboirePct,
  });

  const changerQuantite = (id: string, delta: number) =>
    setPlateau((p) => {
      const q = Math.max(0, Math.min(99, (p.quantites[id] ?? 0) + delta));
      const quantites = { ...p.quantites };
      if (q === 0) delete quantites[id];
      else quantites[id] = q;
      return { ...p, quantites };
    });

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6 text-center">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-bold">Menu en cours de mise à jour</h2>
        <p className="text-sm text-[var(--text-sec)]">
          Les prix de ce restaurant sont en cours de relevé. Le simulateur de budget sera disponible dès leur
          publication.
        </p>
      </section>
    );
  }

  const parCategorie = CATEGORIES.map((c) => ({ categorie: c, items: items.filter((i) => i.categorie === c) })).filter(
    (g) => g.items.length > 0
  );
  const libelleTaux = tauxUtilise !== null ? formatTaux(tauxUtilise) : "Taux de change non renseigné";
  const maintenant = new Date();
  const equivalent = (item: MenuItem): string | null => {
    const autre: Devise = item.devise === "HTG" ? "USD" : "HTG";
    const c = convertirEnCentimes(item.prix, item.devise, autre, tauxUtilise);
    return c === null ? null : `≈ ${formatMontant(c / 100, autre)}`;
  };

  return (
    <>
      <section aria-labelledby="titre-menu">
        <h2 id="titre-menu" className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold">
          Menu
        </h2>
        {tauxUtilise !== null && (
          <p className="mb-3 text-xs text-[var(--text-sec)]">Équivalents calculés au taux {libelleTaux}.</p>
        )}
        {parCategorie.map((g) => {
          const periode = periodeCommune(g.items);
          return (
          <div key={g.categorie} className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--blue)]">
              {g.categorie}
              {periode && <span className="font-normal normal-case tracking-normal text-[var(--text-sec)]"> du {periode}</span>}
            </h3>
            <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[var(--surface)]">
              {g.items.map((item) => {
                const q = plateau.quantites[item.id] ?? 0;
                const etat = etatArticle(item, maintenant);
                const eq = equivalent(item);
                return (
                  <li key={item.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${item.disponible ? "" : "text-[var(--text-sec)] line-through"}`}>
                        {item.nom}
                      </p>
                      {item.description && <p className="text-sm text-[var(--text-sec)]">{item.description}</p>}
                      <p className="text-sm">
                        <span className="font-semibold text-[var(--white)]">{formatMontant(item.prix, item.devise)}</span>
                        {eq && <span className="text-[var(--text-sec)]"> {eq}</span>}
                        {!item.disponible && <span className="ml-2 text-amber-200">Indisponible</span>}
                        {etat.aConfirmer && <span className="ml-2 font-medium text-amber-200">Prix à confirmer</span>}
                      </p>
                      {(etat.date || item.source_url) && (
                        <p className="text-xs text-[var(--text-sec)]">
                          {!periode && etat.date}
                          {item.source_url && (
                            <>
                              {!periode && etat.date && " · "}
                              <a
                                href={item.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-[var(--white)]"
                              >
                                source
                              </a>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    {item.disponible && (
                      <div className="flex items-center gap-2">
                        {q > 0 && (
                          <>
                            <button
                              type="button"
                              className={BOUTON_ROND}
                              onClick={() => changerQuantite(item.id, -1)}
                              aria-label={`Retirer un ${item.nom}`}
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-semibold" aria-live="polite">
                              {q}
                            </span>
                          </>
                        )}
                        <button
                          type="button"
                          className={BOUTON_ROND}
                          onClick={() => changerQuantite(item.id, 1)}
                          aria-label={`Ajouter un ${item.nom} au plateau`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </section>

      <section
        id="budget"
        aria-labelledby="titre-budget"
        className="scroll-mt-24 rounded-2xl border border-[var(--blue)]/30 bg-[var(--surface)] p-4"
      >
        <h2 id="titre-budget" className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold">
          Mon budget
        </h2>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <span id="libelle-personnes" className="mb-1 block text-xs font-medium text-[var(--text-sec)]">
              Personnes
            </span>
            <div className="flex items-center gap-2" role="group" aria-labelledby="libelle-personnes">
              <button
                type="button"
                className={BOUTON_ROND}
                disabled={plateau.personnes <= 1}
                onClick={() => setPlateau((p) => ({ ...p, personnes: Math.max(1, p.personnes - 1) }))}
                aria-label="Une personne de moins"
              >
                −
              </button>
              <span className="w-6 text-center text-lg font-semibold" aria-live="polite">
                {plateau.personnes}
              </span>
              <button
                type="button"
                className={BOUTON_ROND}
                disabled={plateau.personnes >= 50}
                onClick={() => setPlateau((p) => ({ ...p, personnes: Math.min(50, p.personnes + 1) }))}
                aria-label="Une personne de plus"
              >
                +
              </button>
            </div>
          </div>
          <label>
            <span className="mb-1 block text-xs font-medium text-[var(--text-sec)]">Pourboire (%)</span>
            <input
              inputMode="decimal"
              className={CHAMP}
              value={plateau.pourboire}
              onChange={(e) => setPlateau((p) => ({ ...p, pourboire: e.target.value }))}
            />
          </label>
          <label className="col-span-2">
            <span className="mb-1 block text-xs font-medium text-[var(--text-sec)]">
              Taux de change (HTG pour 1 $ US)
            </span>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                className={CHAMP}
                placeholder="Non renseigné"
                value={plateau.tauxSaisi ?? (tauxParDefaut !== null ? String(tauxParDefaut) : "")}
                onChange={(e) => setPlateau((p) => ({ ...p, tauxSaisi: e.target.value }))}
              />
              {plateau.tauxSaisi !== null && (
                <button
                  type="button"
                  className={`min-h-11 shrink-0 rounded-xl border border-white/15 px-3 text-sm ${FOCUS}`}
                  onClick={() => setPlateau((p) => ({ ...p, tauxSaisi: null }))}
                >
                  Taux par défaut
                </button>
              )}
            </div>
            <span className="mt-1 block text-xs text-[var(--text-sec)]">
              {plateau.tauxSaisi !== null
                ? "Taux modifié par vous."
                : restaurant.taux !== null
                  ? "Taux appliqué par le restaurant."
                  : tauxGlobal !== null
                    ? "Taux de référence Tèt Weekend."
                    : "Aucun taux renseigné : saisissez-en un pour voir l'équivalent dans l'autre devise."}
            </span>
          </label>
        </div>

        {nbArticles === 0 ? (
          <p className="rounded-xl bg-[var(--surface2)] p-4 text-center text-sm text-[var(--text-sec)]">
            Ajoutez des plats et boissons du menu avec le bouton « + » pour calculer votre budget.
          </p>
        ) : (
          <>
            {prerempli && lignes.some((l) => l.item.nom === prerempli) && (
              <p className="mb-2 text-xs text-[var(--text-sec)]">
                « {prerempli} » a été ajouté pour démarrer : ajoutez ou retirez des plats avec + et −.
              </p>
            )}
            <ul className="mb-3 text-sm">
              {lignes.map(({ item, quantite }) => (
                <li key={item.id} className="flex justify-between gap-3 py-1">
                  <span>
                    {quantite} × {item.nom}
                  </span>
                  <span className="shrink-0">{formatMontant(item.prix * quantite, item.devise)}</span>
                </li>
              ))}
            </ul>

            {!resultat.ok ? (
              <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                Ce plateau mélange HTG et $ US : saisissez un taux de change ci-dessus pour calculer le total.
              </p>
            ) : (
              <dl className="space-y-1 border-t border-white/10 pt-3 text-sm">
                <LigneBudget terme="Sous-total" valeur={formatMontant(resultat.sousTotal, devise)} />
                <LigneBudget
                  terme={restaurant.taxePct !== null && restaurant.taxePct > 0 ? `Taxe ${restaurant.taxePct.toLocaleString("fr-FR")} %` : "Taxe"}
                  valeur={
                    resultat.taxeAjoutee
                      ? `+ ${formatMontant(resultat.taxe, devise)}`
                      : restaurant.taxePct === null
                        ? "non renseignée"
                        : restaurant.taxePct === 0
                          ? "aucune"
                          : restaurant.taxeIncluse
                            ? "taxes incluses"
                            : "inclusion non renseignée"
                  }
                />
                <LigneBudget
                  terme={restaurant.servicePct !== null && restaurant.servicePct > 0 ? `Service ${restaurant.servicePct.toLocaleString("fr-FR")} %` : "Service"}
                  valeur={
                    resultat.serviceAjoute
                      ? `+ ${formatMontant(resultat.service, devise)}`
                      : restaurant.servicePct === null
                        ? "non renseigné"
                        : restaurant.servicePct === 0
                          ? "aucun"
                          : restaurant.serviceInclus
                            ? "service inclus"
                            : "inclusion non renseignée"
                  }
                />
                {pourboirePct > 0 && (
                  <LigneBudget
                    terme={`Pourboire ${pourboirePct.toLocaleString("fr-FR")} %`}
                    valeur={`+ ${formatMontant(resultat.pourboire, devise)}`}
                  />
                )}
                <div className="mt-3 rounded-xl bg-[var(--surface2)] p-3">
                  <TotalDouble titre="Total" montant={resultat.total} />
                  <TotalDouble
                    titre={`Par personne (÷ ${plateau.personnes})`}
                    montant={resultat.parPersonne}
                  />
                  <p className="mt-2 text-xs text-[var(--text-sec)]">{libelleTaux}</p>
                </div>
              </dl>
            )}

            <button
              type="button"
              className={`mt-3 min-h-11 w-full rounded-xl border border-white/15 text-sm text-[var(--text-sec)] ${FOCUS}`}
              onClick={() => setPlateau((p) => ({ ...p, quantites: {} }))}
            >
              Vider le plateau
            </button>
          </>
        )}
      </section>

      {nbArticles > 0 && resultat.ok && (
        <a
          href="#budget"
          className={`fixed inset-x-3 bottom-3 z-50 flex min-h-12 items-center justify-between rounded-2xl bg-[var(--blue)] px-4 font-semibold text-[var(--black)] shadow-lg ${FOCUS}`}
        >
          <span>
            {nbArticles} article{nbArticles > 1 ? "s" : ""}
          </span>
          <span>{montantPrincipal(resultat.total, devise)} · Voir mon budget</span>
        </a>
      )}
      {nbArticles > 0 && <div aria-hidden="true" className="h-16" />}
    </>
  );
}

function montantPrincipal(m: MontantDouble, devise: Devise): string {
  const v = devise === "HTG" ? m.htg : m.usd;
  return v === null ? "" : formatMontant(v, devise);
}

function LigneBudget({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--text-sec)]">{terme}</dt>
      <dd className="text-right">{valeur}</dd>
    </div>
  );
}

function TotalDouble({ titre, montant }: { titre: string; montant: MontantDouble }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="font-semibold">{titre}</dt>
      <dd className="text-right">
        <span className="block text-lg font-bold">
          {montant.htg !== null ? formatMontant(montant.htg, "HTG") : "— HTG"}
        </span>
        <span className="block text-sm text-[var(--text-sec)]">
          {montant.usd !== null ? formatMontant(montant.usd, "USD") : "— $ US"}
        </span>
      </dd>
    </div>
  );
}
