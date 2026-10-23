"use client";

import { useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  changerStatut,
  dupliquerEvenement,
  enregistrerEvenement,
  importerFlyerDepuisUrl,
  masquerFlyer,
  reafficherFlyer,
  receptionnerFlyer,
} from "@/app/admin/actions";
import { CarteEvenement, ZoneFlyer } from "@/components/listing/CarteEvenement";
import type { ArtisteAdmin, EvenementAdmin, LieuAdmin } from "@/lib/admin/charger";
import { lienGoogleAgenda } from "@/lib/listing/calendrier";
import { estTermine, formaterQuand, instantDepuisSaisie, saisieDepuisInstant } from "@/lib/listing/dates";
import { altFlyer, ratioTexte, resolutionFaible } from "@/lib/listing/flyer";
import { CATEGORIES, FUSEAU_DEFAUT, FUSEAUX, LIBELLES_STATUT, SOURCES, TYPES_ARTISTE } from "@/lib/listing/schema";
import { slugifier } from "@/lib/listing/slug";
import type { EvenementPublic, FlyerPublic } from "@/lib/listing/types";

const champ = "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3";

type Publication = "brouillon" | "publie";
type Entree = "inconnu" | "gratuit" | "texte";

interface ArtisteNouveau {
  nom: string;
  type: string;
  slug: string;
}

interface Formulaire {
  id: string;
  titre: string;
  slug: string;
  statutEnregistre: string;
  publication: Publication;
  date_debut: string;
  date_fin: string;
  fuseau: string;
  venue_id: string;
  nouveauLieu: boolean;
  lieuNom: string;
  lieuAdresse: string;
  lieuVille: string;
  lieuPays: string;
  ville: string;
  description: string;
  categorie: string;
  artist_ids: string[];
  artisteNom: string;
  artisteType: string;
  artistesNouveaux: ArtisteNouveau[];
  entree: Entree;
  prix: string;
  source: string;
  source_account: string;
  source_url: string;
  spotted_at: string;
  a_verifier: boolean;
  flyer_storage_path: string;
  flyer_url: string;
  flyer_card_url: string;
  flyer_width: string;
  flyer_height: string;
  flyer_mime_type: string;
  flyer_alt: string;
  flyer_credit: string;
  flyer_hidden_at: string;
  flyer_hidden_reason: string;
  sponsored_from: string;
  sponsored_to: string;
  apercuLocal: string;
}

const vide: Formulaire = {
  id: "",
  titre: "",
  slug: "",
  statutEnregistre: "brouillon",
  publication: "brouillon",
  date_debut: "",
  date_fin: "",
  fuseau: FUSEAU_DEFAUT,
  venue_id: "",
  nouveauLieu: false,
  lieuNom: "",
  lieuAdresse: "",
  lieuVille: "",
  lieuPays: "",
  ville: "",
  description: "",
  categorie: "",
  artist_ids: [],
  artisteNom: "",
  artisteType: "",
  artistesNouveaux: [],
  entree: "inconnu",
  prix: "",
  source: "manuel",
  source_account: "",
  source_url: "",
  spotted_at: "",
  a_verifier: false,
  flyer_storage_path: "",
  flyer_url: "",
  flyer_card_url: "",
  flyer_width: "",
  flyer_height: "",
  flyer_mime_type: "",
  flyer_alt: "",
  flyer_credit: "",
  flyer_hidden_at: "",
  flyer_hidden_reason: "",
  sponsored_from: "",
  sponsored_to: "",
  apercuLocal: "",
};

export function SectionEvenements({
  lieux,
  artistes,
  evenements,
}: {
  lieux: LieuAdmin[];
  artistes: ArtisteAdmin[];
  evenements: EvenementAdmin[];
}) {
  const router = useRouter();
  const [f, setF] = useState<Formulaire>(vide);
  const [erreur, setErreur] = useState<string | null>(null);
  const [doublon, setDoublon] = useState<{ id: string; titre: string; slug: string } | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [motif, setMotif] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreVille, setFiltreVille] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreQuand, setFiltreQuand] = useState("");
  const [urlDistante, setUrlDistante] = useState("");
  const [pending, start] = useTransition();

  function set<K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) {
    setConfirmer(false);
    setF((actuel) => ({ ...actuel, [cle]: valeur }));
  }

  function charger(e: EvenementAdmin) {
    if (f.apercuLocal.startsWith("blob:")) URL.revokeObjectURL(f.apercuLocal);
    setErreur(null);
    setDoublon(null);
    setConfirmer(false);
    setF(depuisEvenement(e));
  }

  const compteurs = useMemo(() => ({
    brouillons: evenements.filter((e) => e.statut === "brouillon").length,
    publies: evenements.filter((e) => e.statut === "publie").length,
    aVenir: evenements.filter((e) => !estTermine(e)).length,
    termines: evenements.filter((e) => estTermine(e)).length,
  }), [evenements]);

  const villes = useMemo(() => {
    const noms = new Set<string>();
    for (const e of evenements) if (e.ville) noms.add(e.ville);
    for (const l of lieux) if (l.ville) noms.add(l.ville);
    return [...noms].sort((a, b) => a.localeCompare(b, "fr"));
  }, [evenements, lieux]);

  const filtres = evenements.filter((e) => {
    if (filtreStatut && e.statut !== filtreStatut) return false;
    if (filtreVille && (e.ville ?? "") !== filtreVille) return false;
    if (filtreCategorie && (e.categorie ?? "") !== filtreCategorie) return false;
    if (filtreQuand === "avenir" && estTermine(e)) return false;
    if (filtreQuand === "passes" && !estTermine(e)) return false;
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    const lieu = lieux.find((l) => l.id === e.venue_id)?.nom ?? "";
    return [e.titre, e.ville, lieu].join(" ").toLowerCase().includes(q);
  });

  const apercu = apercuDepuis(f, lieux, artistes);

  function executer(action: () => Promise<{ ok: boolean; erreur?: string }>) {
    setErreur(null);
    start(async () => {
      const res = await action();
      if (!res.ok) setErreur(res.erreur ?? "Erreur.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-sec)]">
        {compteurs.brouillons} brouillons · {compteurs.publies} publiés · {compteurs.aVenir} à venir · {compteurs.termines} terminés
      </p>
      <form
        className="space-y-6 rounded-2xl border border-white/10 bg-[var(--surface)] p-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          setErreur(null);
          start(async () => {
            const res = await enregistrerEvenement({
              id: f.id || null,
              confirmer_doublon: confirmer,
              nouveau_lieu: f.nouveauLieu ? { nom: f.lieuNom, slug: slugOuVide(f.lieuNom), ville: f.lieuVille, pays: f.lieuPays, adresse: f.lieuAdresse, type: "", description: "", instagram: "", facebook: "", site_web: "" } : null,
              nouveaux_artistes: f.artistesNouveaux.map((a) => ({ nom: a.nom, slug: a.slug, type: a.type, ville_base: "", bio: "", instagram: "", facebook: "", site_web: "" })),
              champs: champsDepuis(f),
            });
            if (!res.ok) {
              setErreur(res.erreur);
              setDoublon(res.doublon ?? null);
              return;
            }
            setDoublon(null);
            setConfirmer(false);
            setF((actuel) => ({
              ...actuel,
              id: res.id,
              statutEnregistre: actuel.publication,
              venue_id: res.venue_id ?? "",
              nouveauLieu: false,
              lieuNom: "",
              artist_ids: res.artist_ids,
              artistesNouveaux: [],
              artisteNom: "",
            }));
            router.refresh();
          });
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">{f.id ? "Modifier l'événement" : "Ajouter un événement"}</h2>
          {f.id && <button type="button" className="text-sm underline" onClick={() => { if (f.apercuLocal.startsWith("blob:")) URL.revokeObjectURL(f.apercuLocal); setF(vide); }}>Nouveau</button>}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Informations</legend>
          <input className={champ} placeholder="Titre" value={f.titre} required onChange={(e) => { set("titre", e.target.value); if (f.statutEnregistre !== "publie") set("slug", slugOuVide(e.target.value)); }} />
          <input className={champ} placeholder="slug" value={f.slug} required disabled={f.statutEnregistre === "publie"} onChange={(e) => set("slug", e.target.value)} />
          <select className={champ} value={f.categorie} onChange={(e) => set("categorie", e.target.value)}>
            <option value="">Catégorie (inconnue)</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}
          </select>
          <textarea className={champ} placeholder="Description factuelle courte" value={f.description} onChange={(e) => set("description", e.target.value)} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Date et lieu</legend>
          <label className="block text-sm">Début<input type="datetime-local" className={champ} required value={f.date_debut} onChange={(e) => set("date_debut", e.target.value)} /></label>
          <label className="block text-sm">Fin (vide si inconnue)<input type="datetime-local" className={champ} value={f.date_fin} onChange={(e) => set("date_fin", e.target.value)} /></label>
          <select className={champ} value={f.fuseau} onChange={(e) => set("fuseau", e.target.value)}>
            {FUSEAUX.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
          <label className="block text-sm">Sponsorisé du<input type="datetime-local" className={champ} value={f.sponsored_from} onChange={(e) => set("sponsored_from", e.target.value)} /></label>
          <label className="block text-sm">Sponsorisé jusqu&apos;au<input type="datetime-local" className={champ} value={f.sponsored_to} onChange={(e) => set("sponsored_to", e.target.value)} /></label>
          <p className="text-sm text-[var(--text-sec)]">Affiche l&apos;événement dans la bannière d&apos;accueil pendant cette période.</p>
          <input className={champ} placeholder="Ville" value={f.ville} onChange={(e) => set("ville", e.target.value)} />
          <select className={champ} value={f.venue_id} disabled={f.nouveauLieu} onChange={(e) => set("venue_id", e.target.value)}>
            <option value="">Lieu existant (aucun)</option>
            {lieux.map((l) => <option key={l.id} value={l.id}>{l.nom}{l.ville ? ` — ${l.ville}` : ""}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.nouveauLieu} onChange={(e) => set("nouveauLieu", e.target.checked)} /> Nouveau lieu</label>
          {f.nouveauLieu && (
            <>
              <input className={champ} placeholder="Nom du lieu" value={f.lieuNom} onChange={(e) => set("lieuNom", e.target.value)} />
              <input className={champ} placeholder="Adresse" value={f.lieuAdresse} onChange={(e) => set("lieuAdresse", e.target.value)} />
              <input className={champ} placeholder="Ville du lieu" value={f.lieuVille} onChange={(e) => set("lieuVille", e.target.value)} />
              <input className={champ} placeholder="Pays" value={f.lieuPays} onChange={(e) => set("lieuPays", e.target.value)} />
            </>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Artistes</legend>
          <select multiple className={`${champ} min-h-28`} value={f.artist_ids} onChange={(e) => set("artist_ids", [...e.target.selectedOptions].map((o) => o.value))}>
            {artistes.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <input className={`${champ} min-w-40 flex-1`} placeholder="Nouvel artiste" value={f.artisteNom} onChange={(e) => set("artisteNom", e.target.value)} />
            <select className={`${champ} max-w-40`} value={f.artisteType} onChange={(e) => set("artisteType", e.target.value)}>
              <option value="">Type</option>
              {TYPES_ARTISTE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" className="min-h-11 rounded-xl border border-white/15 px-3 text-sm" onClick={() => {
              const nom = f.artisteNom.trim();
              if (!nom) return;
              set("artistesNouveaux", [...f.artistesNouveaux, { nom, type: f.artisteType, slug: slugOuVide(nom) }]);
              set("artisteNom", "");
            }}>Ajouter</button>
          </div>
          {f.artistesNouveaux.length > 0 && <p className="text-sm text-[var(--text-sec)]">À créer : {f.artistesNouveaux.map((a) => a.nom).join(", ")}</p>}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Entrée</legend>
          <div className="flex flex-wrap gap-3 text-sm">
            {(["inconnu", "gratuit", "texte"] as Entree[]).map((mode) => (
              <label key={mode} className="flex items-center gap-2">
                <input type="radio" name="entree" checked={f.entree === mode} onChange={() => set("entree", mode)} />
                {mode === "inconnu" ? "Non indiqué" : mode === "gratuit" ? "Gratuit" : "Texte libre"}
              </label>
            ))}
          </div>
          {f.entree === "texte" && <input className={champ} placeholder="Prix d'entrée, tel qu'il est écrit" value={f.prix} onChange={(e) => set("prix", e.target.value)} />}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Flyer</legend>
          <p className="text-sm text-[var(--text-sec)]">JPEG, PNG ou WebP, 10 Mo maximum. Le fichier original sert à la visionneuse.</p>
          <label className="block text-sm">Téléverser un fichier<input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (!fichier) return;
            const donnees = new FormData();
            donnees.set("fichier", fichier);
            if (f.flyer_storage_path) donnees.set("ancien", f.flyer_storage_path);
            const local = URL.createObjectURL(fichier);
            start(async () => {
              const res = await receptionnerFlyer(donnees);
              if (!res.ok) {
                URL.revokeObjectURL(local);
                setErreur(res.erreur);
                return;
              }
              if (f.apercuLocal.startsWith("blob:")) URL.revokeObjectURL(f.apercuLocal);
              appliquerFlyer(setF, res, local);
            });
          }} /></label>
          <div className="flex flex-wrap gap-2">
            <input className={`${champ} min-w-40 flex-1`} placeholder="URL directe de l'image https://…" value={urlDistante} onChange={(e) => setUrlDistante(e.target.value)} />
            <button type="button" className="min-h-11 rounded-xl border border-white/15 px-3 text-sm" onClick={() => {
              start(async () => {
                const res = await importerFlyerDepuisUrl(urlDistante, f.flyer_storage_path || null);
                if (!res.ok) setErreur(res.erreur);
                else appliquerFlyer(setF, res, "");
              });
            }}>Importer l&apos;URL</button>
          </div>
          <p className="text-sm text-[var(--text-sec)]">Saisie assistée : collez l&apos;URL du post dans Source, puis téléversez l&apos;image ici. Aucun contournement de connexion ou de blocage.</p>
          {(f.flyer_url || f.apercuLocal) && !f.flyer_hidden_at && (
            <div className="space-y-2">
              {/* Miniature non recadrée, y compris pour un fichier local pas encore public. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.apercuLocal || f.flyer_url} alt={f.flyer_alt || f.titre} className="max-h-60 w-full rounded-[18px] bg-[#0D0A14] object-contain" />
              {f.flyer_width && f.flyer_height && (
                <p className="text-sm">{f.flyer_width}×{f.flyer_height} · ratio {ratioTexte(Number(f.flyer_width), Number(f.flyer_height))}</p>
              )}
              {f.flyer_width && f.flyer_height && resolutionFaible(Number(f.flyer_width), Number(f.flyer_height)) && (
                <p className="text-sm text-amber-200">Résolution faible : le texte du flyer peut être difficile à lire.</p>
              )}
            </div>
          )}
          {f.flyer_hidden_at && <p className="text-sm text-amber-200">Flyer masqué{f.flyer_hidden_reason ? ` : ${f.flyer_hidden_reason}` : ""}. Le dégradé est affiché à la place.</p>}
          <input className={champ} placeholder="Crédit affiché (vide si inconnu)" value={f.flyer_credit} onChange={(e) => set("flyer_credit", e.target.value)} />
          {f.id && (f.flyer_storage_path || f.flyer_url) && !f.flyer_hidden_at && (
            <div className="flex flex-wrap gap-2">
              <input className={`${champ} min-w-40 flex-1`} placeholder="Raison du masquage" value={motif} onChange={(e) => setMotif(e.target.value)} />
              <button type="button" className="min-h-11 rounded-xl border border-white/15 px-3 text-sm" onClick={() => executer(async () => {
                const res = await masquerFlyer({ id: f.id, motif });
                if (res.ok) setF((actuel) => ({ ...actuel, flyer_hidden_at: new Date().toISOString(), flyer_hidden_reason: motif, flyer_url: "", flyer_card_url: "", apercuLocal: "" }));
                return res;
              })}>Masquer le flyer</button>
            </div>
          )}
          {f.id && f.flyer_hidden_at && (
            <button type="button" className="text-sm underline" onClick={() => executer(async () => {
              const res = await reafficherFlyer(f.id);
              if (res.ok) setF((actuel) => ({ ...actuel, flyer_hidden_at: "", flyer_hidden_reason: "", flyer_url: res.flyer_url }));
              return res;
            })}>Réafficher le flyer</button>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Source</legend>
          <select className={champ} value={f.source} onChange={(e) => set("source", e.target.value)}>
            <option value="">Plateforme</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className={champ} placeholder="Compte (@compte ou nom)" value={f.source_account} onChange={(e) => set("source_account", e.target.value)} />
          <input className={champ} placeholder="URL du post d'origine" value={f.source_url} onChange={(e) => set("source_url", e.target.value)} />
          {f.source_url.trim().startsWith("http") && (
            <a className="text-sm underline" href={f.source_url.trim()} target="_blank" rel="noreferrer">Ouvrir le post d&apos;origine</a>
          )}
          <label className="block text-sm">Repéré le<input type="datetime-local" className={champ} value={f.spotted_at} onChange={(e) => set("spotted_at", e.target.value)} /></label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Publication</legend>
          {f.statutEnregistre === "retire" && <p className="text-sm text-amber-200">Cet événement est retiré. L&apos;enregistrer le remet en brouillon, ou le publie si vous le choisissez.</p>}
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="publication" checked={f.publication === "brouillon"} onChange={() => set("publication", "brouillon")} /> Brouillon</label>
            <label className="flex items-center gap-2"><input type="radio" name="publication" checked={f.publication === "publie"} onChange={() => set("publication", "publie")} /> Publié</label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.a_verifier} onChange={(e) => set("a_verifier", e.target.checked)} /> À vérifier</label>
        </fieldset>

        {doublon && (
          <div className="rounded-xl border border-amber-200/40 p-3 text-sm">
            <p>Doublon probable : {doublon.titre} ({doublon.slug}).</p>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={confirmer} onChange={(e) => setConfirmer(e.target.checked)} />
              Enregistrer comme nouvel événement
            </label>
          </div>
        )}
        {erreur && <p className="text-sm text-amber-200">{erreur}</p>}
        {pending && <p className="text-sm text-[var(--text-sec)]">Enregistrement…</p>}
        <button type="submit" className="min-h-11 rounded-xl bg-[var(--blue)] px-4 font-medium text-black">Enregistrer</button>
      </form>

      {apercu && (
        <div id="apercu-flyer" className="space-y-4">
          <h2 className="font-bold">Aperçu</h2>
          <div>
            <p className="mb-2 text-sm text-[var(--text-sec)]">Carte mobile</p>
            <div className="w-[390px] max-w-full"><CarteEvenement evenement={apercu} /></div>
          </div>
          <div>
            <p className="mb-2 text-sm text-[var(--text-sec)]">Carte desktop</p>
            <CarteEvenement evenement={apercu} />
          </div>
          <div>
            <p className="mb-2 text-sm text-[var(--text-sec)]">Page événement</p>
            <ZoneFlyer evenement={apercu} />
            <h3 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{apercu.titre}</h3>
            <p className="mt-2 text-[var(--text-sec)]">{formaterQuand(apercu.date_debut, apercu.fuseau)}</p>
            {apercu.source_url && <p className="mt-3"><a className="underline" href={apercu.source_url}>Voir le post d&apos;origine</a></p>}
            <p className="mt-3"><a className="underline" href={lienGoogleAgenda(apercu, "https://www.tetweekend.com")}>Ajouter à mon calendrier</a></p>
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <input className={champ} placeholder="Rechercher un titre" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select className={champ} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="publie">Publié</option>
          <option value="retire">Retiré</option>
        </select>
        <select className={champ} value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)}>
          <option value="">Toutes les villes</option>
          {villes.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className={champ} value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}
        </select>
        <select className={champ} value={filtreQuand} onChange={(e) => setFiltreQuand(e.target.value)}>
          <option value="">À venir et passés</option>
          <option value="avenir">À venir</option>
          <option value="passes">Passés</option>
        </select>
      </div>

      <ul className="space-y-3">
        {filtres.map((e) => (
          <li key={e.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium">{e.titre}</p>
            <p className="text-sm text-[var(--text-sec)]">{[e.ville, e.prix, e.flyer_hidden_at ? "flyer masqué" : e.flyer_url ? "flyer" : ""].filter(Boolean).join(" · ") || "Prix et ville non indiqués"}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <button type="button" className="underline" onClick={() => { charger(e); document.getElementById("apercu-flyer")?.scrollIntoView({ behavior: "smooth" }); }}>Prévisualiser</button>
              <button type="button" className="underline" onClick={() => charger(e)}>Modifier</button>
              <button type="button" className="underline" onClick={() => executer(() => dupliquerEvenement(e.id))}>Dupliquer</button>
              {e.statut === "publie" && <a className="underline" href={`/evenements/${e.slug}`} target="_blank" rel="noreferrer">Page publique</a>}
              {e.source_url && <a className="underline" href={e.source_url} target="_blank" rel="noreferrer">Post d&apos;origine</a>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 px-2 py-1 text-xs">{LIBELLES_STATUT[e.statut as "brouillon"] ?? e.statut}</span>
              {e.statut !== "publie" && <button type="button" className="text-sm underline" onClick={() => executer(() => changerStatut({ table: "events", id: e.id, statut: "publie" }))}>Publier</button>}
              {e.statut === "publie" && <button type="button" className="text-sm underline" onClick={() => executer(() => changerStatut({ table: "events", id: e.id, statut: "brouillon" }))}>Dépublier</button>}
              {e.statut !== "retire" && <button type="button" className="text-sm underline" onClick={() => executer(() => changerStatut({ table: "events", id: e.id, statut: "retire" }))}>Retirer</button>}
              {(e.flyer_storage_path || e.flyer_url) && !e.flyer_hidden_at && (
                <button type="button" className="text-sm underline" onClick={() => {
                  const raison = motif.trim();
                  if (!raison) { setErreur("Indiquez la raison du masquage dans le formulaire."); return; }
                  executer(() => masquerFlyer({ id: e.id, motif: raison }));
                }}>Masquer le flyer</button>
              )}
              {e.flyer_hidden_at && <button type="button" className="text-sm underline" onClick={() => executer(() => reafficherFlyer(e.id))}>Réafficher le flyer</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function appliquerFlyer(
  setF: Dispatch<SetStateAction<Formulaire>>,
  res: { storagePath: string; publicUrl: string; width: number; height: number; mime: string },
  local: string,
) {
  setF((actuel) => ({
    ...actuel,
    flyer_storage_path: res.storagePath,
    flyer_url: res.publicUrl,
    flyer_card_url: "",
    flyer_width: String(res.width),
    flyer_height: String(res.height),
    flyer_mime_type: res.mime,
    flyer_hidden_at: "",
    flyer_hidden_reason: "",
    apercuLocal: local,
    flyer_alt: altFlyer(actuel.titre || "Événement", actuel.ville || actuel.lieuNom || null, actuel.date_debut || "date à préciser"),
  }));
}

function champsDepuis(f: Formulaire): Record<string, unknown> {
  return {
    titre: f.titre,
    slug: f.slug,
    date_debut: f.date_debut,
    date_fin: f.date_fin,
    fuseau: f.fuseau,
    venue_id: f.nouveauLieu ? null : f.venue_id || null,
    ville: f.ville,
    description: f.description,
    prix: f.entree === "gratuit" ? "Gratuit" : f.entree === "texte" ? f.prix : "",
    source: f.source,
    source_url: f.source_url,
    source_account: f.source_account,
    spotted_at: f.spotted_at,
    categorie: f.categorie,
    a_verifier: f.a_verifier,
    statut: f.publication,
    artist_ids: f.artist_ids,
    flyer_storage_path: f.flyer_storage_path,
    flyer_url: f.flyer_hidden_at ? "" : f.flyer_url,
    flyer_card_url: f.flyer_hidden_at ? "" : f.flyer_card_url,
    flyer_width: f.flyer_width,
    flyer_height: f.flyer_height,
    flyer_mime_type: f.flyer_mime_type,
    flyer_alt: f.flyer_alt,
    flyer_credit: f.flyer_credit,
    flyer_hidden_at: f.flyer_hidden_at,
    flyer_hidden_reason: f.flyer_hidden_reason,
    sponsored_from: f.sponsored_from,
    sponsored_to: f.sponsored_to,
  };
}

function depuisEvenement(e: EvenementAdmin): Formulaire {
  const prix = e.prix?.trim() ?? "";
  const entree: Entree = !prix ? "inconnu" : prix.toLowerCase() === "gratuit" ? "gratuit" : "texte";
  return {
    ...vide,
    id: e.id,
    titre: e.titre,
    slug: e.slug,
    statutEnregistre: e.statut,
    publication: e.statut === "publie" ? "publie" : "brouillon",
    date_debut: saisieDepuisInstant(e.date_debut, e.fuseau),
    date_fin: e.date_fin ? saisieDepuisInstant(e.date_fin, e.fuseau) : "",
    fuseau: e.fuseau || FUSEAU_DEFAUT,
    venue_id: e.venue_id ?? "",
    ville: e.ville ?? "",
    description: e.description ?? "",
    categorie: e.categorie ?? "",
    artist_ids: e.artist_ids,
    entree,
    prix: entree === "texte" ? prix : "",
    source: e.source ?? "",
    source_account: e.source_account ?? "",
    source_url: e.source_url ?? "",
    spotted_at: e.spotted_at ? saisieDepuisInstant(e.spotted_at, e.fuseau) : "",
    a_verifier: e.a_verifier,
    flyer_storage_path: e.flyer_storage_path ?? "",
    flyer_url: e.flyer_url ?? "",
    flyer_card_url: e.flyer_card_url ?? "",
    flyer_width: e.flyer_width ? String(e.flyer_width) : "",
    flyer_height: e.flyer_height ? String(e.flyer_height) : "",
    flyer_mime_type: e.flyer_mime_type ?? "",
    flyer_alt: e.flyer_alt ?? "",
    flyer_credit: e.flyer_credit ?? "",
    flyer_hidden_at: e.flyer_hidden_at ?? "",
    flyer_hidden_reason: e.flyer_hidden_reason ?? "",
    sponsored_from: e.sponsored_from ? saisieDepuisInstant(e.sponsored_from, e.fuseau) : "",
    sponsored_to: e.sponsored_to ? saisieDepuisInstant(e.sponsored_to, e.fuseau) : "",
  };
}

function apercuDepuis(f: Formulaire, lieux: LieuAdmin[], artistes: ArtisteAdmin[]): EvenementPublic | null {
  if (!f.titre || !f.date_debut) return null;
  let date_debut = f.date_debut;
  let date_fin: string | null = f.date_fin || null;
  try {
    date_debut = instantDepuisSaisie(f.date_debut, f.fuseau);
    date_fin = f.date_fin ? instantDepuisSaisie(f.date_fin, f.fuseau) : null;
  } catch {
    return null;
  }
  const lieuTrouve = lieux.find((l) => l.id === f.venue_id);
  const nomLieu = f.nouveauLieu ? f.lieuNom.trim() : lieuTrouve?.nom;
  const ville = f.ville.trim() || (f.nouveauLieu ? f.lieuVille.trim() : lieuTrouve?.ville) || null;
  const url = f.flyer_hidden_at ? "" : f.apercuLocal || f.flyer_url;
  const flyer: FlyerPublic | null = url
    ? {
        publicUrl: url,
        cardUrl: null,
        width: Number(f.flyer_width) || null,
        height: Number(f.flyer_height) || null,
        mimeType: f.flyer_mime_type === "image/jpeg" || f.flyer_mime_type === "image/png" || f.flyer_mime_type === "image/webp" ? f.flyer_mime_type : null,
        alt: altFlyer(f.titre, nomLieu || ville, formaterQuand(date_debut, f.fuseau)),
        credit: f.flyer_credit.trim() || null,
      }
    : null;
  return {
    id: f.id || "apercu",
    slug: f.slug || "apercu",
    titre: f.titre,
    date_debut,
    date_fin,
    ville,
    description: f.description.trim() || null,
    prix: f.entree === "gratuit" ? "Gratuit" : f.entree === "texte" ? f.prix.trim() || null : null,
    source: f.source || null,
    source_url: f.source_url.trim() || null,
    source_account: f.source_account.trim() || null,
    categorie: f.categorie || null,
    fuseau: f.fuseau,
    lieu: nomLieu ? { id: lieuTrouve?.id ?? "nouveau", slug: lieuTrouve?.slug ?? "nouveau", nom: nomLieu, ville, pays: f.lieuPays.trim() || lieuTrouve?.pays || null, adresse: f.lieuAdresse.trim() || lieuTrouve?.adresse || null, type: lieuTrouve?.type ?? null, description: null, instagram: null, facebook: null, site_web: null } : null,
    artistes: [
      ...artistes.filter((a) => f.artist_ids.includes(a.id)).map((a) => ({ id: a.id, slug: a.slug, nom: a.nom, type: a.type, ville_base: a.ville_base, bio: a.bio, instagram: a.instagram, facebook: a.facebook, site_web: a.site_web })),
      ...f.artistesNouveaux.map((a, i) => ({ id: `nouveau-${i}`, slug: a.slug || "nouveau", nom: a.nom, type: a.type || null, ville_base: null, bio: null, instagram: null, facebook: null, site_web: null })),
    ],
    flyer,
    sponsored_from: null,
    sponsored_to: null,
    vues: null,
  };
}

function slugOuVide(nom: string): string {
  try {
    return slugifier(nom);
  } catch {
    return "";
  }
}
