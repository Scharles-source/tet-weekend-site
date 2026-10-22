"use client";

import { useState, useTransition } from "react";
import { Deconnexion } from "@/components/admin/Deconnexion";
import { changerStatut, enregistrerArtiste, enregistrerCompte, enregistrerEvenement, enregistrerLieu } from "@/app/admin/actions";
import type { ArtisteAdmin, CompteAdmin, EvenementAdmin, LieuAdmin } from "@/lib/admin/charger";
import { saisieDepuisInstant } from "@/lib/listing/dates";
import { CATEGORIES, FUSEAU_DEFAUT, FUSEAUX, LIBELLES_STATUT, PLATEFORMES, SOURCES, TYPES_ARTISTE, TYPES_COMPTE, TYPES_LIEU } from "@/lib/listing/schema";
import { slugifier } from "@/lib/listing/slug";

type Onglet = "evenements" | "lieux" | "artistes" | "comptes";

const champ = "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3";

export function DashboardListing({
  lieux,
  artistes,
  evenements,
  comptes,
  email,
}: {
  lieux: LieuAdmin[];
  artistes: ArtisteAdmin[];
  evenements: EvenementAdmin[];
  comptes: CompteAdmin[];
  email: string | null;
}) {
  const [onglet, setOnglet] = useState<Onglet>("evenements");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function executer(action: () => Promise<{ ok: boolean; erreur?: string }>) {
    setErreur(null);
    start(async () => {
      const res = await action();
      if (!res.ok) setErreur(res.erreur ?? "Erreur.");
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">Événements</h1>
          <p className="text-sm text-[var(--text-sec)]">{email} — rien n&apos;est publié sans un clic.</p>
        </div>
        <Deconnexion />
      </header>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["evenements", "lieux", "artistes", "comptes"] as Onglet[]).map((id) => (
          <button key={id} type="button" onClick={() => setOnglet(id)} className={`min-h-11 rounded-full px-4 text-sm ${onglet === id ? "bg-[var(--blue)] text-black" : "border border-white/15"}`}>
            {id === "evenements" ? "Événements" : id === "lieux" ? "Lieux" : id === "artistes" ? "Artistes" : "Comptes suivis"}
          </button>
        ))}
      </div>
      {erreur && <p className="mb-4 text-sm text-amber-200">{erreur}</p>}
      {pending && <p className="mb-4 text-sm text-[var(--text-sec)]">Enregistrement…</p>}
      {onglet === "evenements" && <FormulaireEvenement lieux={lieux} artistes={artistes} evenements={evenements} onAction={executer} />}
      {onglet === "lieux" && <FormulaireLieu lieux={lieux} onAction={executer} />}
      {onglet === "artistes" && <FormulaireArtiste artistes={artistes} onAction={executer} />}
      {onglet === "comptes" && <FormulaireCompte comptes={comptes} onAction={executer} />}
    </div>
  );
}

function BoutonsStatut({
  table,
  id,
  statut,
  onAction,
}: {
  table: "venues" | "artists" | "events";
  id: string;
  statut: string;
  onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <span className="rounded-full border border-white/15 px-2 py-1 text-xs">{LIBELLES_STATUT[statut as "brouillon"] ?? statut}</span>
      {statut !== "publie" && (
        <button type="button" className="text-sm underline" onClick={() => onAction(() => changerStatut({ table, id, statut: "publie" }))}>Publier</button>
      )}
      {statut === "publie" && (
        <button type="button" className="text-sm underline" onClick={() => onAction(() => changerStatut({ table, id, statut: "brouillon" }))}>Dépublier</button>
      )}
      {statut !== "retire" && (
        <button type="button" className="text-sm underline" onClick={() => onAction(() => changerStatut({ table, id, statut: "retire" }))}>Retirer</button>
      )}
    </div>
  );
}

function FormulaireEvenement({
  lieux,
  artistes,
  evenements,
  onAction,
}: {
  lieux: LieuAdmin[];
  artistes: ArtisteAdmin[];
  evenements: EvenementAdmin[];
  onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void;
}) {
  const vide = {
    id: "",
    titre: "",
    slug: "",
    date_debut: "",
    date_fin: "",
    venue_id: "",
    ville: "",
    description: "",
    prix: "",
    source: "manuel",
    source_url: "",
    categorie: "",
    fuseau: FUSEAU_DEFAUT,
    a_verifier: false,
    artist_ids: [] as string[],
  };
  const [f, setF] = useState(vide);
  function set<K extends keyof typeof vide>(cle: K, valeur: (typeof vide)[K]) {
    setF((actuel) => ({ ...actuel, [cle]: valeur }));
  }
  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-2xl border border-white/10 bg-[var(--surface)] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onAction(() => enregistrerEvenement({ id: f.id || null, champs: { ...f, venue_id: f.venue_id || null } }));
        }}
      >
        <h2 className="font-bold">{f.id ? "Modifier l'événement" : "Nouvel événement"}</h2>
        <input className={champ} placeholder="Titre" value={f.titre} onChange={(e) => { set("titre", e.target.value); if (!f.id) set("slug", slugOuVide(e.target.value)); }} required />
        <input className={champ} placeholder="slug" value={f.slug} onChange={(e) => set("slug", e.target.value)} required />
        <label className="block text-sm">Début<input type="datetime-local" className={champ} value={f.date_debut} onChange={(e) => set("date_debut", e.target.value)} required /></label>
        <label className="block text-sm">Fin (vide si inconnue)<input type="datetime-local" className={champ} value={f.date_fin} onChange={(e) => set("date_fin", e.target.value)} /></label>
        <select className={champ} value={f.fuseau} onChange={(e) => set("fuseau", e.target.value)}>
          {FUSEAUX.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>
        <input className={champ} placeholder="Ville" value={f.ville} onChange={(e) => set("ville", e.target.value)} />
        <select className={champ} value={f.venue_id} onChange={(e) => set("venue_id", e.target.value)}>
          <option value="">Lieu (aucun)</option>
          {lieux.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
        </select>
        <select className={champ} value={f.categorie} onChange={(e) => set("categorie", e.target.value)}>
          <option value="">Catégorie (inconnue)</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}
        </select>
        <select multiple className={`${champ} min-h-28`} value={f.artist_ids} onChange={(e) => set("artist_ids", [...e.target.selectedOptions].map((o) => o.value))}>
          {artistes.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </select>
        <textarea className={champ} placeholder="Description" value={f.description} onChange={(e) => set("description", e.target.value)} />
        <input className={champ} placeholder="Prix d'entrée (laisser vide si inconnu)" value={f.prix} onChange={(e) => set("prix", e.target.value)} />
        <select className={champ} value={f.source} onChange={(e) => set("source", e.target.value)}>
          <option value="">Source</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className={champ} placeholder="Lien du post d'origine" value={f.source_url} onChange={(e) => set("source_url", e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.a_verifier} onChange={(e) => set("a_verifier", e.target.checked)} /> À vérifier</label>
        <div className="flex gap-2">
          <button type="submit" className="min-h-11 rounded-xl bg-[var(--blue)] px-4 font-medium text-black">Enregistrer en brouillon</button>
          {f.id && <button type="button" className="min-h-11 rounded-xl border border-white/15 px-4" onClick={() => setF(vide)}>Annuler</button>}
        </div>
      </form>
      <ul className="space-y-3">
        {evenements.map((e) => (
          <li key={e.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium">{e.titre}</p>
            <p className="text-sm text-[var(--text-sec)]">{[e.ville, e.prix].filter(Boolean).join(" · ") || "Prix et ville non indiqués"}</p>
            <button
              type="button"
              className="mt-2 text-sm underline"
              onClick={() => setF({
                id: e.id,
                titre: e.titre,
                slug: e.slug,
                date_debut: saisieDepuisInstant(e.date_debut, e.fuseau),
                date_fin: e.date_fin ? saisieDepuisInstant(e.date_fin, e.fuseau) : "",
                venue_id: e.venue_id ?? "",
                ville: e.ville ?? "",
                description: e.description ?? "",
                prix: e.prix ?? "",
                source: e.source ?? "",
                source_url: e.source_url ?? "",
                categorie: e.categorie ?? "",
                fuseau: e.fuseau || FUSEAU_DEFAUT,
                a_verifier: e.a_verifier,
                artist_ids: e.artist_ids,
              })}
            >
              Modifier
            </button>
            <BoutonsStatut table="events" id={e.id} statut={e.statut} onAction={onAction} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormulaireLieu({ lieux, onAction }: { lieux: LieuAdmin[]; onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void }) {
  const vide = { id: "", nom: "", slug: "", ville: "", pays: "", adresse: "", type: "", description: "", instagram: "", facebook: "", site_web: "" };
  const [f, setF] = useState(vide);
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-sec)]">Les 24 restaurants d&apos;amorce sont des lieux en brouillon. Le type et la description restent vides tant qu&apos;ils ne sont pas saisis.</p>
      <form className="space-y-3 rounded-2xl border border-white/10 bg-[var(--surface)] p-4" onSubmit={(ev) => { ev.preventDefault(); onAction(() => enregistrerLieu({ id: f.id || null, champs: f })); }}>
        <h2 className="font-bold">{f.id ? "Modifier le lieu" : "Nouveau lieu"}</h2>
        <input className={champ} placeholder="Nom" value={f.nom} required onChange={(e) => setF({ ...f, nom: e.target.value, slug: f.id ? f.slug : slugOuVide(e.target.value) })} />
        <input className={champ} placeholder="slug" value={f.slug} required onChange={(e) => setF({ ...f, slug: e.target.value })} />
        <input className={champ} placeholder="Ville" value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })} />
        <input className={champ} placeholder="Pays" value={f.pays} onChange={(e) => setF({ ...f, pays: e.target.value })} />
        <input className={champ} placeholder="Adresse" value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} />
        <select className={champ} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="">Type (inconnu)</option>
          {TYPES_LIEU.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea className={champ} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <input className={champ} placeholder="Instagram" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
        <input className={champ} placeholder="Facebook" value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} />
        <input className={champ} placeholder="Site web https://…" value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} />
        <button type="submit" className="min-h-11 rounded-xl bg-[var(--blue)] px-4 font-medium text-black">Enregistrer</button>
      </form>
      <ul className="space-y-3">
        {lieux.map((l) => (
          <li key={l.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium">{l.nom}</p>
            <p className="text-sm text-[var(--text-sec)]">{[l.ville, l.adresse].filter(Boolean).join(" · ")}</p>
            <button type="button" className="mt-2 text-sm underline" onClick={() => setF({ id: l.id, nom: l.nom, slug: l.slug, ville: l.ville ?? "", pays: l.pays ?? "", adresse: l.adresse ?? "", type: l.type ?? "", description: l.description ?? "", instagram: l.instagram ?? "", facebook: l.facebook ?? "", site_web: l.site_web ?? "" })}>Modifier</button>
            <BoutonsStatut table="venues" id={l.id} statut={l.statut} onAction={onAction} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormulaireArtiste({ artistes, onAction }: { artistes: ArtisteAdmin[]; onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void }) {
  const vide = { id: "", nom: "", slug: "", type: "", ville_base: "", bio: "", instagram: "", facebook: "", site_web: "" };
  const [f, setF] = useState(vide);
  return (
    <div className="space-y-6">
      <form className="space-y-3 rounded-2xl border border-white/10 bg-[var(--surface)] p-4" onSubmit={(ev) => { ev.preventDefault(); onAction(() => enregistrerArtiste({ id: f.id || null, champs: f })); }}>
        <h2 className="font-bold">{f.id ? "Modifier l'artiste" : "Nouvel artiste"}</h2>
        <input className={champ} placeholder="Nom" required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value, slug: f.id ? f.slug : slugOuVide(e.target.value) })} />
        <input className={champ} placeholder="slug" required value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
        <select className={champ} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="">Type (inconnu)</option>
          {TYPES_ARTISTE.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className={champ} placeholder="Ville de base" value={f.ville_base} onChange={(e) => setF({ ...f, ville_base: e.target.value })} />
        <textarea className={champ} placeholder="Bio courte" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        <input className={champ} placeholder="Instagram" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
        <input className={champ} placeholder="Facebook" value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} />
        <input className={champ} placeholder="Site web https://…" value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} />
        <button type="submit" className="min-h-11 rounded-xl bg-[var(--blue)] px-4 font-medium text-black">Enregistrer</button>
      </form>
      <ul className="space-y-3">
        {artistes.map((a) => (
          <li key={a.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium">{a.nom}</p>
            <button type="button" className="mt-2 text-sm underline" onClick={() => setF({ id: a.id, nom: a.nom, slug: a.slug, type: a.type ?? "", ville_base: a.ville_base ?? "", bio: a.bio ?? "", instagram: a.instagram ?? "", facebook: a.facebook ?? "", site_web: a.site_web ?? "" })}>Modifier</button>
            <BoutonsStatut table="artists" id={a.id} statut={a.statut} onAction={onAction} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormulaireCompte({ comptes, onAction }: { comptes: CompteAdmin[]; onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void }) {
  const vide = { id: "", plateforme: "instagram", handle: "", url: "", type: "lieu", actif: true };
  const [f, setF] = useState(vide);
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-sec)]">Liste des comptes à surveiller. Aucun scan automatique pour l&apos;instant : les événements se saisissent à la main.</p>
      <form className="space-y-3 rounded-2xl border border-white/10 bg-[var(--surface)] p-4" onSubmit={(ev) => { ev.preventDefault(); onAction(() => enregistrerCompte({ id: f.id || null, champs: f })); }}>
        <select className={champ} value={f.plateforme} onChange={(e) => setF({ ...f, plateforme: e.target.value })}>
          {PLATEFORMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className={champ} placeholder="Handle" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} />
        <input className={champ} placeholder="URL https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <select className={champ} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {TYPES_COMPTE.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.actif} onChange={(e) => setF({ ...f, actif: e.target.checked })} /> Actif</label>
        <button type="submit" className="min-h-11 rounded-xl bg-[var(--blue)] px-4 font-medium text-black">Enregistrer</button>
      </form>
      <ul className="space-y-2 text-sm">
        {comptes.map((c) => (
          <li key={c.id}>{c.actif ? "actif" : "inactif"} — {c.plateforme} — {c.handle || c.url} ({c.type})</li>
        ))}
      </ul>
    </div>
  );
}

function slugOuVide(nom: string): string {
  try {
    return slugifier(nom);
  } catch {
    return "";
  }
}
