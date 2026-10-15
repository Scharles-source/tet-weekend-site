"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeFraicheur } from "@/components/menus/BadgeFraicheur";
import { formatMontant, type Fourchette, type Fraicheur } from "@/lib/menus/format";
import { ZONES, type Categorie, type Devise, type Zone } from "@/lib/menus/types";

export interface OffreCarte {
  id: string;
  categorie: Categorie;
  nom: string;
  prix: number;
  devise: Devise;
  date: string | null;
}

export interface CarteRestaurant {
  slug: string;
  nom: string;
  zones: Zone[];
  quartier: string | null;
  typeCuisine: string | null;
  nbArticles: number;
  /** Menu du jour / de la semaine / spécial en cours (2 au plus). */
  offres: OffreCarte[];
  autresOffres: number;
  fourchette: Fourchette | null;
  /** Prix minimal d'un plat converti en HTG (taux du restaurant, sinon global) ; null si non convertible. */
  prixMinHtg: number | null;
  fraicheur: Fraicheur;
}

const normaliser = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const CHAMP =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--surface2)] px-3 text-[15px] text-[var(--white)] " +
  "placeholder:text-[var(--text-sec)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]";

function texteFourchette(f: Fourchette): string {
  return f.min === f.max
    ? formatMontant(f.min, f.devise)
    : `${formatMontant(f.min, f.devise)} – ${formatMontant(f.max, f.devise)}`;
}

export default function Repertoire({ cartes }: { cartes: CarteRestaurant[] }) {
  const [recherche, setRecherche] = useState("");
  const [zone, setZone] = useState<"" | Zone>("");
  const [budget, setBudget] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [avecMenu, setAvecMenu] = useState(false);

  const cuisines = useMemo(
    () =>
      Array.from(new Set(cartes.map((c) => c.typeCuisine).filter((c): c is string => Boolean(c)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [cartes]
  );

  const budgetMax = Number(budget.replace(/\s/g, "").replace(",", "."));
  const budgetActif = budget.trim() !== "" && Number.isFinite(budgetMax) && budgetMax > 0;

  const { resultats, exclusTaux } = useMemo(() => {
    const q = normaliser(recherche);
    let exclus = 0;
    const res = cartes.filter((c) => {
      if (q && !normaliser(c.nom).includes(q)) return false;
      if (zone && !c.zones.includes(zone)) return false;
      if (cuisine && c.typeCuisine !== cuisine) return false;
      if (avecMenu && c.nbArticles === 0) return false;
      if (budgetActif) {
        if (c.prixMinHtg === null) {
          if (c.nbArticles > 0) exclus++;
          return false;
        }
        if (c.prixMinHtg > budgetMax) return false;
      }
      return true;
    });
    // Les restaurants avec une offre en cours d'abord, puis ceux avec menu, puis les autres (ordre alphabétique conservé).
    const rang = (c: CarteRestaurant) => (c.offres.length > 0 ? 0 : c.nbArticles > 0 ? 1 : 2);
    res.sort((a, b) => rang(a) - rang(b));
    return { resultats: res, exclusTaux: exclus };
  }, [cartes, recherche, zone, cuisine, avecMenu, budgetActif, budgetMax]);

  return (
    <section aria-labelledby="titre-repertoire">
      <h2 id="titre-repertoire" className="sr-only">
        Rechercher un restaurant
      </h2>
      <form role="search" className="mb-5 grid gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[var(--text-sec)]">Nom du restaurant</span>
          <input
            type="search"
            className={CHAMP}
            placeholder="Ex. Magdoos"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-[var(--text-sec)]">Zone</span>
          <select className={CHAMP} value={zone} onChange={(e) => setZone(e.target.value as "" | Zone)}>
            <option value="">Toutes les zones</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-[var(--text-sec)]">Type de cuisine</span>
          <select className={CHAMP} value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            <option value="">Toutes les cuisines</option>
            {cuisines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-[var(--text-sec)]">
            Budget maximal par personne (HTG)
          </span>
          <input
            inputMode="numeric"
            className={CHAMP}
            placeholder="Ex. 2500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-xl border border-white/15 bg-[var(--surface2)] px-3 text-[15px]">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
            checked={avecMenu}
            onChange={(e) => setAvecMenu(e.target.checked)}
          />
          Avec menu uniquement
        </label>
      </form>

      <p className="mb-3 text-sm text-[var(--text-sec)]" aria-live="polite">
        {resultats.length} restaurant{resultats.length > 1 ? "s" : ""}
        {budgetActif && exclusTaux > 0 && (
          <> · {exclusTaux} non comparable{exclusTaux > 1 ? "s" : ""} au budget (taux de change non renseigné)</>
        )}
      </p>

      {cartes.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-sec)]">
          Les premiers menus sont en cours de collecte. Revenez bientôt.
        </p>
      ) : resultats.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-sec)]">
          Aucun restaurant ne correspond à ces critères.
        </p>
      ) : (
        <ul className="grid gap-3">
          {resultats.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/restaurant/${c.slug}`}
                className="block rounded-2xl border border-white/10 bg-[var(--surface)] p-4 transition-colors hover:border-[var(--blue)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold leading-snug">{c.nom}</h3>
                <p className="mb-3 text-sm text-[var(--text-sec)]">
                  {[c.quartier ?? c.zones.join(" / "), c.typeCuisine ?? "Cuisine non renseignée"].join(" · ")}
                </p>

                {c.offres.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {c.offres.map((o) => (
                      <li key={o.id} className="rounded-xl border border-[var(--blue)]/30 bg-[var(--blue)]/10 px-3 py-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--blue)]">
                          {o.categorie}
                          {o.date && <span className="font-normal normal-case tracking-normal"> · {o.date}</span>}
                        </span>
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{o.nom}</span>
                          <span className="shrink-0 font-semibold">{formatMontant(o.prix, o.devise)}</span>
                        </span>
                      </li>
                    ))}
                    {c.autresOffres > 0 && (
                      <li className="text-xs text-[var(--text-sec)]">
                        + {c.autresOffres} autre{c.autresOffres > 1 ? "s" : ""} offre{c.autresOffres > 1 ? "s" : ""} en cours
                      </li>
                    )}
                  </ul>
                )}

                {c.nbArticles === 0 ? (
                  <p className="mb-3 text-sm font-medium text-amber-200">Menu en cours de mise à jour</p>
                ) : (
                  <p className="mb-3 text-sm">
                    <span className="text-[var(--text-sec)]">Plats : </span>
                    <span className="font-semibold text-[var(--blue)]">
                      {c.fourchette ? texteFourchette(c.fourchette) : "prix non renseignés"}
                    </span>
                    <span className="text-[var(--text-sec)]">
                      {" "}
                      · {c.nbArticles} article{c.nbArticles > 1 ? "s" : ""} au menu
                    </span>
                  </p>
                )}
                <BadgeFraicheur verifiee={c.fraicheur.verifiee} libelle={c.fraicheur.libelle} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
