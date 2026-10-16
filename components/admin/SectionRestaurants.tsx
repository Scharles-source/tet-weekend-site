"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { changerStatut, enregistrerArticle, supprimerArticle } from "@/app/admin/actions";
import type { ArticleAdmin, RestaurantAdmin } from "@/lib/admin/charger";
import { CATEGORIES_MENU, DEVISES, LIBELLES_STATUT, STATUTS, ZONES, type StatutRestaurant } from "@/lib/admin/schema";
import { Deconnexion } from "@/components/admin/Deconnexion";

const inputCls =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3 text-[15px]";

function champVersObjet(a: ArticleAdmin | null, restaurantId: string): Record<string, unknown> {
  return {
    restaurant_id: restaurantId,
    categorie: a?.categorie ?? "",
    nom: a?.nom ?? "",
    description: a?.description ?? "",
    prix: a ? String(a.prix) : "",
    devise: a?.devise ?? "",
    disponible: a ? a.disponible : true,
    source_url: a?.source_url ?? "",
    date_releve: a?.date_releve ?? "",
    valide_du: a?.valide_du ?? "",
    valide_au: a?.valide_au ?? "",
    a_verifier: a?.a_verifier ?? false,
  };
}

export function SectionRestaurants({
  restaurants,
  email,
}: {
  restaurants: RestaurantAdmin[];
  email: string | null;
}) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"" | StatutRestaurant>("");
  const [filtreZone, setFiltreZone] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const liste = useMemo(() => {
    const q = recherche.trim().toLocaleLowerCase("fr");
    return restaurants.filter((r) => {
      if (filtreStatut && r.statut !== filtreStatut) return false;
      if (filtreZone && !r.zones.includes(filtreZone)) return false;
      if (q && !r.nom.toLocaleLowerCase("fr").includes(q)) return false;
      return true;
    });
  }, [restaurants, recherche, filtreStatut, filtreZone]);

  async function executer(fn: () => Promise<{ ok: true } | { ok: false; erreur: string }>) {
    setBusy(true);
    setMessage(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) setMessage(res.erreur);
    else {
      setMessage("Enregistré.");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">Admin</h1>
          <p className="text-sm text-[var(--text-sec)]">{email}</p>
        </div>
        <Deconnexion />
      </header>

      <section aria-labelledby="titre-restaurants" className="space-y-4">
        <h2 id="titre-restaurants" className="text-lg font-semibold">
          Restaurants et menus
        </h2>
        <p className="text-sm text-[var(--text-sec)]">
          Publier n&apos;affiche le restaurant dans le répertoire public que s&apos;il a au moins un article. Aucun prix
          n&apos;est inventé : un champ vide reste vide.
        </p>

        <div className="grid gap-3">
          <input
            type="search"
            placeholder="Rechercher par nom"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className={inputCls}
            aria-label="Recherche par nom"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label="Filtrer par statut"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as "" | StatutRestaurant)}
              className={inputCls}
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT[s]}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par zone"
              value={filtreZone}
              onChange={(e) => setFiltreZone(e.target.value)}
              className={inputCls}
            >
              <option value="">Toutes les zones</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="rounded-xl border border-white/10 bg-[var(--surface)] px-3 py-2 text-sm">{message}</p>}

        <p className="text-sm text-[var(--text-sec)]">{liste.length} restaurant{liste.length > 1 ? "s" : ""}</p>

        <ul className="space-y-3">
          {liste.map((r) => (
            <li key={r.id} className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{r.nom}</h3>
                  <p className="text-xs text-[var(--text-sec)]">
                    {r.zones.join(" · ") || "—"} · {r.articles.length} article{r.articles.length > 1 ? "s" : ""}
                    {r.date_dernier_releve ? ` · relevé ${r.date_dernier_releve}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs">{LIBELLES_STATUT[r.statut]}</span>
              </div>

              <ActionsStatut restaurant={r} busy={busy} onAction={executer} />

              <button
                type="button"
                className="mt-3 min-h-11 text-sm text-[var(--blue)]"
                onClick={() => setOuvert(ouvert === r.id ? null : r.id)}
              >
                {ouvert === r.id ? "Fermer le menu" : "Gérer le menu"}
              </button>
              {ouvert === r.id && <EditeurMenu restaurant={r} busy={busy} onAction={executer} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ActionsStatut({
  restaurant: r,
  busy,
  onAction,
}: {
  restaurant: RestaurantAdmin;
  busy: boolean;
  onAction: (fn: () => Promise<{ ok: true } | { ok: false; erreur: string }>) => Promise<void>;
}) {
  const [motif, setMotif] = useState(r.motif_retrait ?? "");
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {r.statut === "brouillon" && (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-xl bg-[var(--blue)] px-4 text-sm font-medium text-black disabled:opacity-40"
            onClick={() => onAction(() => changerStatut({ id: r.id, statut: "publie" }))}
          >
            Publier
          </button>
        )}
        {r.statut === "publie" && (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40"
            onClick={() => onAction(() => changerStatut({ id: r.id, statut: "brouillon" }))}
          >
            Dépublier
          </button>
        )}
        {r.statut !== "retire" && (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-xl border border-amber-700/50 px-4 text-sm text-amber-100 disabled:opacity-40"
            onClick={() => onAction(() => changerStatut({ id: r.id, statut: "retire", motif }))}
          >
            Retirer
          </button>
        )}
        {r.statut === "retire" && (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-40"
            onClick={() => onAction(() => changerStatut({ id: r.id, statut: "brouillon" }))}
          >
            Remettre en brouillon
          </button>
        )}
      </div>
      {r.statut !== "retire" && (
        <input
          aria-label={`Motif de retrait pour ${r.nom}`}
          placeholder="Motif de retrait (optionnel)"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

function EditeurMenu({
  restaurant,
  busy,
  onAction,
}: {
  restaurant: RestaurantAdmin;
  busy: boolean;
  onAction: (fn: () => Promise<{ ok: true } | { ok: false; erreur: string }>) => Promise<void>;
}) {
  const [edition, setEdition] = useState<string | "nouveau" | null>(null);
  const groupes = CATEGORIES_MENU.map((c) => ({
    categorie: c,
    articles: restaurant.articles.filter((a) => a.categorie === c),
  })).filter((g) => g.articles.length > 0);

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      <button
        type="button"
        className="min-h-11 rounded-xl bg-[var(--surface2)] px-4 text-sm"
        onClick={() => setEdition(edition === "nouveau" ? null : "nouveau")}
      >
        Ajouter un article
      </button>
      {edition === "nouveau" && (
        <FormulaireArticle
          restaurantId={restaurant.id}
          article={null}
          busy={busy}
          onAction={onAction}
          onFini={() => setEdition(null)}
        />
      )}
      {groupes.length === 0 && <p className="text-sm text-[var(--text-sec)]">Aucun article.</p>}
      {groupes.map((g) => (
        <div key={g.categorie}>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-sec)]">{g.categorie}</h4>
          <ul className="space-y-2">
            {g.articles.map((a) => (
              <li key={a.id} className="rounded-xl bg-[var(--black)] p-3 text-sm">
                <p className="font-medium">
                  {a.nom}{" "}
                  <span className="text-[var(--blue)]">
                    {a.prix} {a.devise}
                  </span>
                  {a.a_verifier ? " · à vérifier" : ""}
                  {!a.disponible ? " · indisponible" : ""}
                </p>
                {a.description && <p className="text-[var(--text-sec)]">{a.description}</p>}
                <p className="text-xs text-[var(--text-sec)]">
                  {a.date_releve ? `Relevé ${a.date_releve}` : "Sans date de relevé"}
                  {a.source_url ? " · source" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="min-h-11 px-2 text-[var(--blue)]" onClick={() => setEdition(a.id)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="min-h-11 px-2"
                    onClick={() =>
                      onAction(() =>
                        enregistrerArticle({
                          id: a.id,
                          champs: { ...champVersObjet(a, restaurant.id), a_verifier: !a.a_verifier },
                        })
                      )
                    }
                  >
                    {a.a_verifier ? "Décocher à vérifier" : "À vérifier"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="min-h-11 px-2 text-amber-200"
                    onClick={() => {
                      if (confirm(`Supprimer « ${a.nom} » ?`)) onAction(() => supprimerArticle(a.id));
                    }}
                  >
                    Supprimer
                  </button>
                </div>
                {edition === a.id && (
                  <FormulaireArticle
                    restaurantId={restaurant.id}
                    article={a}
                    busy={busy}
                    onAction={onAction}
                    onFini={() => setEdition(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FormulaireArticle({
  restaurantId,
  article,
  busy,
  onAction,
  onFini,
}: {
  restaurantId: string;
  article: ArticleAdmin | null;
  busy: boolean;
  onAction: (fn: () => Promise<{ ok: true } | { ok: false; erreur: string }>) => Promise<void>;
  onFini: () => void;
}) {
  const [f, setF] = useState(() => champVersObjet(article, restaurantId));
  const set = (cle: string, valeur: unknown) => setF((prev) => ({ ...prev, [cle]: valeur }));

  return (
    <form
      className="mt-3 grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAction(async () => {
          const res = await enregistrerArticle({ id: article?.id ?? null, champs: f });
          if (res.ok) onFini();
          return res;
        });
      }}
    >
      <select required aria-label="Catégorie" className={inputCls} value={String(f.categorie)} onChange={(e) => set("categorie", e.target.value)}>
        <option value="">Catégorie</option>
        {CATEGORIES_MENU.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input required aria-label="Nom" placeholder="Nom du plat" className={inputCls} value={String(f.nom)} onChange={(e) => set("nom", e.target.value)} />
      <input aria-label="Description" placeholder="Description (vide si absente)" className={inputCls} value={String(f.description)} onChange={(e) => set("description", e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input required inputMode="decimal" aria-label="Prix" placeholder="Prix" className={inputCls} value={String(f.prix)} onChange={(e) => set("prix", e.target.value)} />
        <select required aria-label="Devise" className={inputCls} value={String(f.devise)} onChange={(e) => set("devise", e.target.value)}>
          <option value="">Devise</option>
          {DEVISES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <input aria-label="Source" placeholder="URL source (vide si absente)" className={inputCls} value={String(f.source_url)} onChange={(e) => set("source_url", e.target.value)} />
      <label className="text-xs text-[var(--text-sec)]">
        Date de relevé
        <input type="date" aria-label="Date de relevé" className={inputCls} value={String(f.date_releve)} onChange={(e) => set("date_releve", e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-[var(--text-sec)]">
          Valide du
          <input type="date" className={inputCls} value={String(f.valide_du)} onChange={(e) => set("valide_du", e.target.value)} />
        </label>
        <label className="text-xs text-[var(--text-sec)]">
          Valide au
          <input type="date" className={inputCls} value={String(f.valide_au)} onChange={(e) => set("valide_au", e.target.value)} />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(f.a_verifier)} onChange={(e) => set("a_verifier", e.target.checked)} />
        À vérifier
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={f.disponible !== false} onChange={(e) => set("disponible", e.target.checked)} />
        Disponible
      </label>
      <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-[var(--blue)] font-medium text-black disabled:opacity-40">
        Enregistrer
      </button>
    </form>
  );
}
