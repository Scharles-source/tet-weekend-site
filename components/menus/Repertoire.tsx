"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeFraicheur } from "@/components/menus/BadgeFraicheur";
import { formatMontant, type Fourchette, type Fraicheur } from "@/lib/menus/format";
import { ZONES, type Zone } from "@/lib/menus/types";

export interface CarteRestaurant {
  slug: string;
  nom: string;
  zones: Zone[];
  quartier: string | null;
  typeCuisine: string | null;
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

export default function Repertoire({ cartes }: { cartes: CarteRestaurant[] }) {
  const [recherche, setRecherche] = useState("");
  const [zone, setZone] = useState<"" | Zone>("");
  const [budget, setBudget] = useState("");
  const [cuisine, setCuisine] = useState("");

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
      if (budgetActif) {
        if (c.prixMinHtg === null) {
          exclus++;
          return false;
        }
        if (c.prixMinHtg > budgetMax) return false;
      }
      return true;
    });
    return { resultats: res, exclusTaux: exclus };
  }, [cartes, recherche, zone, cuisine, budgetActif, budgetMax]);

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
        <label className="sm:col-span-2">
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
                <div className="mb-1 flex items-start justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold leading-snug">{c.nom}</h3>
                  <span className="shrink-0 text-right text-sm font-semibold text-[var(--blue)]">
                    {c.fourchette
                      ? c.fourchette.min === c.fourchette.max
                        ? formatMontant(c.fourchette.min, c.fourchette.devise)
                        : `${formatMontant(c.fourchette.min, c.fourchette.devise)} – ${formatMontant(c.fourchette.max, c.fourchette.devise)}`
                      : "Prix des plats non renseignés"}
                  </span>
                </div>
                <p className="mb-3 text-sm text-[var(--text-sec)]">
                  {[c.quartier ?? c.zones.join(" / "), c.typeCuisine ?? "Cuisine non renseignée"].join(" · ")}
                  {c.fourchette && <span className="block text-xs">Fourchette des plats, par personne</span>}
                </p>
                <BadgeFraicheur verifiee={c.fraicheur.verifiee} libelle={c.fraicheur.libelle} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
