"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import {
  changerStatut,
  dupliquerEvenement,
  enregistrerEvenement,
  importerFlyerDepuisUrl,
  masquerFlyer,
  reafficherFlyer,
  receptionnerFlyer,
} from "@/app/admin/actions";
import { AIDE, BTN_DANGER_PLEIN, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, CHAMP_ERREUR, CHIP, CHIP_ACTIF, LABEL, TITRE_BLOC } from "@/components/admin/styles";
import { CarteEvenement, ZoneFlyer } from "@/components/listing/CarteEvenement";
import type { ArtisteAdmin, EvenementAdmin, LieuAdmin } from "@/lib/admin/charger";
import { estSponsorise } from "@/lib/listing/banniere";
import { estTermine, formaterPastille, formaterQuand, instantDepuisSaisie, saisieDepuisInstant } from "@/lib/listing/dates";
import { altFlyer, ratioTexte, resolutionFaible } from "@/lib/listing/flyer";
import { CATEGORIES, FUSEAU_DEFAUT, FUSEAUX, LIBELLES_STATUT, SOURCES, TYPES_ARTISTE, nomCategorie } from "@/lib/listing/schema";
import { slugifier } from "@/lib/listing/slug";
import type { EvenementPublic, FlyerPublic } from "@/lib/listing/types";

const DEGRADE = "linear-gradient(150deg, #F97316, #E02B20 55%, #5B2EE5)";

type Publication = "brouillon" | "publie";
type Entree = "inconnu" | "gratuit" | "texte";
type Tri = "croissante" | "decroissante" | "recents";

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

type Dialogue =
  | null
  | { type: "supprimer" | "masquer"; evenement: EvenementAdmin }
  | { type: "quitter"; suite: () => void }
  | { type: "apercu"; evenement: EvenementPublic };

export function SectionEvenements({
  lieux,
  artistes,
  evenements,
  recherche: rechercheProp,
  onRecherche,
  ouvrirNouveau = 0,
  onSale,
}: {
  lieux: LieuAdmin[];
  artistes: ArtisteAdmin[];
  evenements: EvenementAdmin[];
  recherche?: string;
  onRecherche?: (valeur: string) => void;
  ouvrirNouveau?: number;
  onSale?: (sale: boolean) => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<Formulaire>(vide);
  const [rechercheInterne, setRechercheInterne] = useState("");
  const recherche = rechercheProp ?? rechercheInterne;
  function majRecherche(valeur: string) {
    if (onRecherche) onRecherche(valeur);
    else setRechercheInterne(valeur);
  }
  const [edition, setEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [doublon, setDoublon] = useState<{ id: string; titre: string; slug: string } | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [motif, setMotif] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreVille, setFiltreVille] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreQuand, setFiltreQuand] = useState("");
  const [filtreFlyer, setFiltreFlyer] = useState(false);
  const [tri, setTri] = useState<Tri>("croissante");
  const [urlDistante, setUrlDistante] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [enregistreA, setEnregistreA] = useState<string | null>(null);
  const [lieuTexte, setLieuTexte] = useState("");
  const [suggestionsLieu, setSuggestionsLieu] = useState(false);
  const [suggestionsArtiste, setSuggestionsArtiste] = useState(false);
  const [pending, start] = useTransition();
  const base = useRef(signature(vide));
  const dernierNouveau = useRef(ouvrirNouveau);
  const onSaleRef = useRef(onSale);
  onSaleRef.current = onSale;

  const sale = signature(f) !== base.current;

  useEffect(() => {
    onSaleRef.current?.(edition && sale);
  }, [edition, sale]);

  useEffect(() => {
    const bloquer = (ev: BeforeUnloadEvent) => {
      if (!edition || signature(f) === base.current) return;
      ev.preventDefault();
      ev.returnValue = "";
    };
    window.addEventListener("beforeunload", bloquer);
    return () => window.removeEventListener("beforeunload", bloquer);
  }, [edition, f]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  function set<K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) {
    setConfirmer(false);
    setErreurs((actuel) => {
      if (!actuel[String(cle)]) return actuel;
      const suivant = { ...actuel };
      delete suivant[String(cle)];
      return suivant;
    });
    setF((actuel) => ({ ...actuel, [cle]: valeur }));
  }

  function ouvrirFormulaire(suivant: Formulaire) {
    if (f.apercuLocal.startsWith("blob:")) URL.revokeObjectURL(f.apercuLocal);
    base.current = signature(suivant);
    setErreur(null);
    setErreurs({});
    setDoublon(null);
    setConfirmer(false);
    setEnregistreA(null);
    setF(suivant);
    setLieuTexte(suivant.nouveauLieu ? suivant.lieuNom : lieux.find((l) => l.id === suivant.venue_id)?.nom ?? "");
    setEdition(true);
  }

  function demander(suite: () => void) {
    if (edition && signature(f) !== base.current) setDialogue({ type: "quitter", suite });
    else suite();
  }

  useEffect(() => {
    if (ouvrirNouveau === dernierNouveau.current) return;
    dernierNouveau.current = ouvrirNouveau;
    demander(() => ouvrirFormulaire(vide));
    // La confirmation lit l'état courant au moment du clic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvrirNouveau]);

  const compteurs = useMemo(() => ({
    brouillons: evenements.filter((e) => e.statut === "brouillon").length,
    publies: evenements.filter((e) => e.statut === "publie").length,
    aVenir: evenements.filter((e) => !estTermine(e)).length,
    termines: evenements.filter((e) => estTermine(e)).length,
  }), [evenements]);

  const sansFlyer = evenements.filter((e) => e.statut === "publie" && (!e.flyer_url || e.flyer_hidden_at)).length;
  const cetteSemaine = evenements.filter((e) => dansSeptJours(e)).length;
  const villes = useMemo(() => {
    const noms = new Set<string>();
    for (const e of evenements) if (e.ville) noms.add(e.ville);
    for (const l of lieux) if (l.ville) noms.add(l.ville);
    return [...noms].sort((a, b) => a.localeCompare(b, "fr"));
  }, [evenements, lieux]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const liste = evenements.filter((e) => {
      if (filtreStatut && e.statut !== filtreStatut) return false;
      if (filtreVille && (e.ville ?? "") !== filtreVille) return false;
      if (filtreCategorie && (e.categorie ?? "") !== filtreCategorie) return false;
      if (filtreQuand === "avenir" && estTermine(e)) return false;
      if (filtreQuand === "passes" && !estTermine(e)) return false;
      if (filtreQuand === "semaine" && !dansSeptJours(e)) return false;
      if (filtreFlyer && !(!e.flyer_url || e.flyer_hidden_at)) return false;
      if (!q) return true;
      const lieu = lieux.find((l) => l.id === e.venue_id)?.nom ?? "";
      return [e.titre, e.ville, lieu].join(" ").toLowerCase().includes(q);
    });
    return liste.sort((a, b) => {
      if (tri === "recents") return Date.parse(b.spotted_at ?? b.date_debut) - Date.parse(a.spotted_at ?? a.date_debut);
      const delta = Date.parse(a.date_debut) - Date.parse(b.date_debut);
      return tri === "decroissante" ? -delta : delta;
    });
  }, [evenements, filtreCategorie, filtreFlyer, filtreQuand, filtreStatut, filtreVille, lieux, recherche, tri]);

  function choisirCompteur(statut: string, quand: string) {
    const deja = filtreStatut === statut && filtreQuand === quand && !filtreFlyer;
    setFiltreStatut(deja ? "" : statut);
    setFiltreQuand(deja ? "" : quand);
    setFiltreFlyer(false);
  }

  function executer(action: () => Promise<{ ok: boolean; erreur?: string }>) {
    setErreur(null);
    start(async () => {
      const res = await action();
      if (!res.ok) setErreur(res.erreur ?? "Erreur.");
      else router.refresh();
    });
  }

  function valider(): boolean {
    const suivant: Record<string, string> = {};
    if (!f.titre.trim()) suivant.titre = "Le titre est requis.";
    if (!f.slug.trim()) suivant.slug = "L'adresse de la page est requise.";
    if (!dateDe(f.date_debut)) suivant.date = "La date est requise.";
    if (!heureDe(f.date_debut)) suivant.heure = "L'heure de début est requise.";
    if (f.nouveauLieu && !f.lieuNom.trim() && !lieuTexte.trim()) suivant.lieu = "Le nom du lieu est requis.";
    setErreurs(suivant);
    const premier = ["titre", "slug", "lieu", "date", "heure"].find((cle) => suivant[cle]);
    if (premier) document.getElementById(`champ-${premier}`)?.focus();
    return Object.keys(suivant).length === 0;
  }

  function soumettre(statut: string) {
    if (!valider()) return;
    setErreur(null);
    start(async () => {
      const courant = { ...f, lieuNom: f.nouveauLieu ? f.lieuNom || lieuTexte : f.lieuNom };
      const res = await enregistrerEvenement({
        id: courant.id || null,
        confirmer_doublon: confirmer,
        nouveau_lieu: courant.nouveauLieu ? { nom: courant.lieuNom, slug: slugOuVide(courant.lieuNom), ville: courant.lieuVille, pays: courant.lieuPays, adresse: courant.lieuAdresse, type: "", description: "", instagram: "", facebook: "", site_web: "" } : null,
        nouveaux_artistes: courant.artistesNouveaux.map((a) => ({ nom: a.nom, slug: a.slug, type: a.type, ville_base: "", bio: "", instagram: "", facebook: "", site_web: "" })),
        champs: champsDepuis(courant, statut),
      });
      if (!res.ok) {
        setErreur(res.erreur);
        setDoublon(res.doublon ?? null);
        return;
      }
      const suivant: Formulaire = {
        ...courant,
        id: res.id,
        statutEnregistre: statut,
        publication: statut === "publie" ? "publie" : "brouillon",
        venue_id: res.venue_id ?? "",
        nouveauLieu: false,
        lieuNom: "",
        artist_ids: res.artist_ids,
        artistesNouveaux: [],
        artisteNom: "",
      };
      base.current = signature(suivant);
      setF(suivant);
      setDoublon(null);
      setConfirmer(false);
      setEnregistreA(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      setToast(statut === "publie" ? "Événement publié" : "Brouillon enregistré");
      router.refresh();
    });
  }

  const apercu = apercuDepuis(f, lieux, artistes);
  const lieuChoisi = lieux.find((l) => l.id === f.venue_id);
  const propositionsLieu = lieux.filter((l) => l.nom.toLowerCase().includes(lieuTexte.trim().toLowerCase())).slice(0, 6);
  const propositionsArtiste = artistes.filter((a) => !f.artist_ids.includes(a.id) && a.nom.toLowerCase().includes(f.artisteNom.trim().toLowerCase())).slice(0, 6);
  const plusieursErreurs = Object.keys(erreurs).length > 1 || (erreur && Object.keys(erreurs).length > 0);

  if (!edition) {
    return (
      <div className="space-y-4">
        {(compteurs.brouillons > 0 || sansFlyer > 0 || cetteSemaine > 0) && (
          <section className={`${CARTE} border-l-4 border-l-[#E02B20] p-4`}>
            {compteurs.brouillons > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-[family-name:var(--font-display)] text-[16px] font-extrabold">{compteurs.brouillons} brouillon{compteurs.brouillons > 1 ? "s" : ""} à vérifier</p>
                <button type="button" className={BTN_PRIMAIRE} onClick={() => { const premier = brouillonLePlusProche(evenements); if (premier) ouvrirFormulaire(depuisEvenement(premier)); }}>Vérifier le premier</button>
              </div>
            )}
            <div className="mt-2 space-y-1">
              {sansFlyer > 0 && (
                <button type="button" className="flex min-h-10 items-center gap-2 text-left text-[14px] font-semibold text-[#92400E]" onClick={() => { setFiltreFlyer(true); setFiltreStatut("publie"); setFiltreQuand(""); }}>
                  <AlertTriangle size={16} aria-hidden />
                  {sansFlyer} événement{sansFlyer > 1 ? "s" : ""} publié{sansFlyer > 1 ? "s" : ""} sans flyer
                </button>
              )}
              {cetteSemaine > 0 && (
                <button type="button" className="flex min-h-10 items-center gap-2 text-left text-[14px] font-semibold text-[#92400E]" onClick={() => { setFiltreQuand("semaine"); setFiltreStatut(""); setFiltreFlyer(false); }}>
                  <AlertTriangle size={16} aria-hidden />
                  {cetteSemaine} événement{cetteSemaine > 1 ? "s" : ""} à venir cette semaine
                </button>
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Compteur libelle="Brouillons" valeur={compteurs.brouillons} actif={filtreStatut === "brouillon" && !filtreQuand && !filtreFlyer} onClick={() => choisirCompteur("brouillon", "")} />
          <Compteur libelle="Publiés" valeur={compteurs.publies} actif={filtreStatut === "publie" && !filtreQuand && !filtreFlyer} onClick={() => choisirCompteur("publie", "")} />
          <Compteur libelle="À venir" valeur={compteurs.aVenir} actif={filtreQuand === "avenir" && !filtreStatut && !filtreFlyer} onClick={() => choisirCompteur("", "avenir")} />
          <Compteur libelle="Terminés" valeur={compteurs.termines} actif={filtreQuand === "passes" && !filtreStatut && !filtreFlyer} onClick={() => choisirCompteur("", "passes")} />
        </div>

        <div className="sticky top-[132px] z-10 space-y-3 rounded-[20px] bg-[#FBF7EF]/95 py-2 lg:top-[76px]">
          <label className="block">
            <span className="sr-only">Recherche dans la liste</span>
            <input className={CHAMP} value={recherche} onChange={(e) => majRecherche(e.target.value)} placeholder="Titre, lieu ou ville" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Chip actif={!filtreStatut && !filtreQuand && !filtreFlyer} onClick={() => { setFiltreStatut(""); setFiltreQuand(""); setFiltreFlyer(false); }}>Tous</Chip>
            <Chip actif={filtreStatut === "brouillon" && !filtreQuand} onClick={() => choisirCompteur("brouillon", "")}>Brouillons</Chip>
            <Chip actif={filtreStatut === "publie" && !filtreQuand && !filtreFlyer} onClick={() => choisirCompteur("publie", "")}>Publiés</Chip>
            <Chip actif={filtreQuand === "passes"} onClick={() => choisirCompteur("", "passes")}>Terminés</Chip>
            <label className="min-w-36 flex-1">
              <span className="sr-only">Ville</span>
              <select className={CHAMP} value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)} aria-label="Ville">
                <option value="">Toutes les villes</option>
                {villes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="min-w-36 flex-1">
              <span className="sr-only">Catégorie</span>
              <select className={CHAMP} value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)} aria-label="Catégorie">
                <option value="">Toutes les catégories</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}
              </select>
            </label>
            <label className="min-w-40">
              <span className="sr-only">Tri</span>
              <select className={CHAMP} value={tri} onChange={(e) => setTri(e.target.value as Tri)} aria-label="Tri">
                <option value="croissante">Date croissante</option>
                <option value="decroissante">Date décroissante</option>
                <option value="recents">Récents</option>
              </select>
            </label>
          </div>
          <p className="text-[12.5px] text-[#8A7B66]">{filtres.length} événement{filtres.length > 1 ? "s" : ""}</p>
        </div>

        {erreur && <p className="text-[13px] text-[#E02B20]">{erreur}</p>}

        {filtres.length === 0 ? (
          <div className="rounded-[20px] border-2 border-dashed border-[#D8C6A4] bg-[#FBF7EF] px-5 py-10 text-center">
            <p className="text-[15px] text-[#4A4136]">{filtreStatut === "brouillon" && !recherche && !filtreVille && !filtreCategorie ? "Aucun brouillon — tout est publié." : "Aucun événement ne correspond à ces filtres."}</p>
            {filtreStatut === "brouillon" && <button type="button" className={`${BTN_PRIMAIRE} mt-4`} onClick={() => ouvrirFormulaire(vide)}><Plus size={16} aria-hidden /> Nouvel événement</button>}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtres.map((e) => (
              <Ligne
                key={e.id}
                evenement={e}
                lieu={lieux.find((l) => l.id === e.venue_id)?.nom ?? null}
                artistes={artistes.filter((a) => e.artist_ids.includes(a.id)).map((a) => a.nom)}
                menuOuvert={menuId === e.id}
                onMenu={() => setMenuId(menuId === e.id ? null : e.id)}
                onModifier={() => { setMenuId(null); ouvrirFormulaire(depuisEvenement(e)); }}
                onApercu={() => { setMenuId(null); setDialogue({ type: "apercu", evenement: publicDepuisAdmin(e, lieux, artistes) }); }}
                onDupliquer={() => { setMenuId(null); executer(() => dupliquerEvenement(e.id)); }}
                onPublier={() => executer(() => changerStatut({ table: "events", id: e.id, statut: "publie" }))}
                onDepublier={() => executer(() => changerStatut({ table: "events", id: e.id, statut: "brouillon" }))}
                onMasquer={() => { setMenuId(null); setMotif(""); setDialogue({ type: "masquer", evenement: e }); }}
                onReafficher={() => { setMenuId(null); executer(() => reafficherFlyer(e.id)); }}
                onSupprimer={() => { setMenuId(null); setDialogue({ type: "supprimer", evenement: e }); }}
              />
            ))}
          </ul>
        )}
        {menuId && <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuId(null)} />}
        {dialogue?.type === "supprimer" && (
          <Modal titre={`Supprimer « ${dialogue.evenement.titre} » ?`} onFermer={() => setDialogue(null)}>
            <p className="text-[14px] text-[#4A4136]">L&apos;événement sera retiré. Il disparaît du site et reste dans l&apos;admin avec le statut retiré.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN_SECONDAIRE} onClick={() => setDialogue(null)}>Annuler</button>
              <button type="button" className={BTN_DANGER_PLEIN} onClick={() => { const id = dialogue.evenement.id; setDialogue(null); executer(() => changerStatut({ table: "events", id, statut: "retire" })); }}>Supprimer</button>
            </div>
          </Modal>
        )}
        {dialogue?.type === "masquer" && (
          <Modal titre={`Masquer le flyer de « ${dialogue.evenement.titre} » ?`} onFermer={() => setDialogue(null)}>
            <label className={LABEL} htmlFor="motif-masque">Raison</label>
            <input id="motif-masque" className={CHAMP} value={motif} onChange={(e) => setMotif(e.target.value)} />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN_SECONDAIRE} onClick={() => setDialogue(null)}>Annuler</button>
              <button type="button" className={BTN_PRIMAIRE} onClick={() => {
                const raison = motif.trim();
                if (!raison) { setErreur("Indiquez la raison du masquage."); return; }
                const id = dialogue.evenement.id;
                setDialogue(null);
                executer(() => masquerFlyer({ id, motif: raison }));
              }}>Masquer le flyer</button>
            </div>
          </Modal>
        )}
        {dialogue?.type === "apercu" && (
          <Modal titre="Aperçu" large onFermer={() => setDialogue(null)}>
            <ApercuPublic evenement={dialogue.evenement} />
          </Modal>
        )}
      </div>
    );
  }

  return (
    <form
      className="pb-24"
      onSubmit={(ev) => {
        ev.preventDefault();
        soumettre(f.statutEnregistre === "publie" ? "publie" : "brouillon");
      }}
    >
      <button type="button" className="mb-4 text-[14px] font-semibold text-[#E02B20]" onClick={() => demander(() => setEdition(false))}>Retour à la liste</button>
      {(plusieursErreurs || erreur) && (
        <div className="mb-4 rounded-[14px] bg-[#FDECEA] px-4 py-3 text-[13px] text-[#E02B20]">
          {erreur && <p>{erreur}</p>}
          {Object.values(erreurs).map((message) => <p key={message}>{message}</p>)}
        </div>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className={`${CARTE} space-y-4 p-5`}>
            <h2 className={TITRE_BLOC}>Infos</h2>
            <Champ id="champ-titre" label="Titre" erreur={erreurs.titre}>
              <input id="champ-titre" className={`${CHAMP} ${erreurs.titre ? CHAMP_ERREUR : ""}`} value={f.titre} onChange={(e) => { set("titre", e.target.value); if (f.statutEnregistre !== "publie") set("slug", slugOuVide(e.target.value)); }} />
            </Champ>
            <Champ id="champ-slug" label="Adresse de la page" erreur={erreurs.slug}>
              <input id="champ-slug" className={`${CHAMP} ${erreurs.slug ? CHAMP_ERREUR : ""}`} value={f.slug} disabled={f.statutEnregistre === "publie"} onChange={(e) => set("slug", e.target.value)} />
            </Champ>
            <div className="relative">
              <Champ id="champ-lieu" label="Lieu" erreur={erreurs.lieu}>
                <input
                  id="champ-lieu"
                  className={`${CHAMP} ${erreurs.lieu ? CHAMP_ERREUR : ""}`}
                  value={lieuTexte}
                  onFocus={() => setSuggestionsLieu(true)}
                  onChange={(e) => {
                    setLieuTexte(e.target.value);
                    set("venue_id", "");
                    set("nouveauLieu", false);
                    setSuggestionsLieu(true);
                  }}
                />
              </Champ>
              {suggestionsLieu && lieuTexte.trim() && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-[14px] border-[1.5px] border-[#EFE5D2] bg-white shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
                  {propositionsLieu.map((l) => (
                    <li key={l.id}>
                      <button type="button" className="min-h-11 w-full px-3 text-left text-[14px] hover:bg-[#FBF7EF]" onClick={() => {
                        set("venue_id", l.id);
                        set("nouveauLieu", false);
                        setLieuTexte(l.nom);
                        if (!f.ville && l.ville) set("ville", l.ville);
                        setSuggestionsLieu(false);
                      }}>{l.nom}{l.ville ? ` — ${l.ville}` : ""}</button>
                    </li>
                  ))}
                  <li>
                    <button type="button" className="min-h-11 w-full px-3 text-left text-[14px] font-semibold text-[#E02B20]" onClick={() => {
                      set("nouveauLieu", true);
                      set("lieuNom", lieuTexte.trim());
                      set("venue_id", "");
                      setSuggestionsLieu(false);
                    }}>Créer « {lieuTexte.trim()} »</button>
                  </li>
                </ul>
              )}
            </div>
            {f.nouveauLieu && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ id="champ-adresse" label="Adresse complète"><input id="champ-adresse" className={CHAMP} value={f.lieuAdresse} onChange={(e) => set("lieuAdresse", e.target.value)} /></Champ>
                <Champ id="champ-ville-lieu" label="Ville du lieu"><input id="champ-ville-lieu" className={CHAMP} value={f.lieuVille} onChange={(e) => set("lieuVille", e.target.value)} /></Champ>
                <Champ id="champ-pays" label="Pays"><input id="champ-pays" className={CHAMP} value={f.lieuPays} onChange={(e) => set("lieuPays", e.target.value)} /></Champ>
              </div>
            )}
            {!f.nouveauLieu && lieuChoisi?.adresse && <p className={AIDE}>Adresse : {lieuChoisi.adresse}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Champ id="champ-ville" label="Ville"><input id="champ-ville" className={CHAMP} value={f.ville} onChange={(e) => set("ville", e.target.value)} /></Champ>
              <Champ id="champ-categorie" label="Catégorie">
                <select id="champ-categorie" className={CHAMP} value={f.categorie} onChange={(e) => set("categorie", e.target.value)}>
                  <option value="">Non indiquée</option>
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}
                </select>
              </Champ>
              <Champ id="champ-date" label="Date" erreur={erreurs.date}>
                <input id="champ-date" type="date" className={`${CHAMP} ${erreurs.date ? CHAMP_ERREUR : ""}`} value={dateDe(f.date_debut)} onChange={(e) => set("date_debut", combiner(e.target.value, heureDe(f.date_debut)))} />
              </Champ>
              <Champ id="champ-heure" label="Heure de début" erreur={erreurs.heure}>
                <input id="champ-heure" type="time" className={`${CHAMP} ${erreurs.heure ? CHAMP_ERREUR : ""}`} value={heureDe(f.date_debut)} onChange={(e) => set("date_debut", combiner(dateDe(f.date_debut), e.target.value))} />
              </Champ>
              <Champ id="champ-fin-date" label="Date de fin">
                <input id="champ-fin-date" type="date" className={CHAMP} value={dateDe(f.date_fin)} onChange={(e) => set("date_fin", e.target.value ? combiner(e.target.value, heureDe(f.date_fin) || "00:00") : "")} />
              </Champ>
              <Champ id="champ-fin-heure" label="Heure de fin">
                <input id="champ-fin-heure" type="time" className={CHAMP} value={heureDe(f.date_fin)} onChange={(e) => set("date_fin", combiner(dateDe(f.date_fin) || dateDe(f.date_debut), e.target.value))} />
              </Champ>
            </div>
            <Champ id="champ-fuseau" label="Fuseau">
              <select id="champ-fuseau" className={CHAMP} value={f.fuseau} onChange={(e) => set("fuseau", e.target.value)}>
                {FUSEAUX.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
              </select>
            </Champ>
            <fieldset>
              <legend className={LABEL}>Prix</legend>
              <div className="flex flex-wrap gap-3 text-[14px]">
                {(["inconnu", "gratuit", "texte"] as Entree[]).map((mode) => (
                  <label key={mode} className="flex min-h-11 items-center gap-2">
                    <input type="radio" name="entree" checked={f.entree === mode} onChange={() => set("entree", mode)} />
                    {mode === "inconnu" ? "Non indiqué" : mode === "gratuit" ? "Gratuit" : "Texte libre"}
                  </label>
                ))}
              </div>
              {f.entree === "texte" && <input className={`${CHAMP} mt-2`} aria-label="Prix écrit" value={f.prix} onChange={(e) => set("prix", e.target.value)} />}
            </fieldset>
            <Champ id="champ-description" label="Description">
              <textarea id="champ-description" rows={6} className={CHAMP} value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Champ>
          </section>

          <section className={`${CARTE} space-y-3 p-5`}>
            <h2 className={TITRE_BLOC}>Artistes & DJ</h2>
            <div className="flex flex-wrap gap-2">
              {f.artist_ids.map((id) => {
                const nom = artistes.find((a) => a.id === id)?.nom ?? id;
                return <PastilleCle key={id} nom={nom} onRetirer={() => set("artist_ids", f.artist_ids.filter((x) => x !== id))} />;
              })}
              {f.artistesNouveaux.map((a) => (
                <PastilleCle key={a.slug} nom={`${a.nom} (nouveau)`} onRetirer={() => set("artistesNouveaux", f.artistesNouveaux.filter((x) => x.slug !== a.slug))} />
              ))}
            </div>
            <div className="relative grid gap-2 sm:grid-cols-[1fr_160px]">
              <Champ id="champ-artiste" label="Ajouter un artiste ou un DJ">
                <input id="champ-artiste" className={CHAMP} value={f.artisteNom} onFocus={() => setSuggestionsArtiste(true)} onChange={(e) => { set("artisteNom", e.target.value); setSuggestionsArtiste(true); }} />
              </Champ>
              <Champ id="champ-type-artiste" label="Type">
                <select id="champ-type-artiste" className={CHAMP} value={f.artisteType} onChange={(e) => set("artisteType", e.target.value)}>
                  <option value="">Non indiqué</option>
                  {TYPES_ARTISTE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Champ>
              {suggestionsArtiste && f.artisteNom.trim() && (
                <ul className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-[14px] border-[1.5px] border-[#EFE5D2] bg-white sm:w-[calc(100%-168px)]">
                  {propositionsArtiste.map((a) => (
                    <li key={a.id}>
                      <button type="button" className="min-h-11 w-full px-3 text-left hover:bg-[#FBF7EF]" onClick={() => { set("artist_ids", [...f.artist_ids, a.id]); set("artisteNom", ""); setSuggestionsArtiste(false); }}>{a.nom}</button>
                    </li>
                  ))}
                  <li>
                    <button type="button" className="min-h-11 w-full px-3 text-left font-semibold text-[#E02B20]" onClick={() => {
                      const nom = f.artisteNom.trim();
                      if (!nom) return;
                      set("artistesNouveaux", [...f.artistesNouveaux, { nom, type: f.artisteType, slug: slugOuVide(nom) }]);
                      set("artisteNom", "");
                      setSuggestionsArtiste(false);
                    }}>Créer « {f.artisteNom.trim()} »</button>
                  </li>
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-[84px]">
          <section className={`${CARTE} space-y-3 p-4`}>
            <h2 className={TITRE_BLOC}>Publication</h2>
            <PastilleStatut evenement={{ statut: f.statutEnregistre, date_debut: "", date_fin: null, fuseau: f.fuseau }} />
            <p className={AIDE}>{f.statutEnregistre === "publie" ? "Visible sur le site." : "Le brouillon n'est pas visible sur le site."}</p>
            {f.statutEnregistre === "retire" && <p className={AIDE}>Enregistrer remet cet événement en brouillon.</p>}
            <div className="flex flex-wrap gap-2">
              {f.statutEnregistre !== "publie" && <button type="button" className={BTN_PRIMAIRE} disabled={pending} onClick={() => soumettre("publie")}>Publier</button>}
              {f.statutEnregistre === "publie" && <button type="button" className={BTN_SECONDAIRE} disabled={pending} onClick={() => soumettre("brouillon")}>Dépublier</button>}
              <button type="button" className={BTN_SECONDAIRE} onClick={() => apercu && setDialogue({ type: "apercu", evenement: { ...apercu, source_url: null } })} disabled={!apercu}>
                <Eye size={16} aria-hidden /> Aperçu
              </button>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-[14px]"><input type="checkbox" checked={f.a_verifier} onChange={(e) => set("a_verifier", e.target.checked)} /> À vérifier</label>
          </section>

          <section className={`${CARTE} space-y-3 p-4`}>
            <h2 className={TITRE_BLOC}>Flyer</h2>
            {(f.flyer_url || f.apercuLocal) && !f.flyer_hidden_at ? (
              <div className="relative max-h-[260px] overflow-hidden rounded-[12px] bg-[#F3E6D8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.apercuLocal || f.flyer_url} alt="" className="absolute inset-0 h-full max-h-[260px] w-full scale-110 object-cover blur-[16px]" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.apercuLocal || f.flyer_url} alt={f.flyer_alt || f.titre || "Flyer"} className="relative max-h-[260px] w-full object-contain" />
              </div>
            ) : (
              <div className="flex min-h-28 items-center justify-center rounded-[12px] border-2 border-dashed border-[#D8C6A4] px-3 text-center text-[14px] text-[#8A7B66]">
                {f.flyer_hidden_at ? "Flyer masqué — le site affiche le dégradé." : "Ajouter un flyer"}
              </div>
            )}
            {f.flyer_width && f.flyer_height && <p className={AIDE}>{f.flyer_width}×{f.flyer_height} · ratio {ratioTexte(Number(f.flyer_width), Number(f.flyer_height))}</p>}
            {f.flyer_width && f.flyer_height && resolutionFaible(Number(f.flyer_width), Number(f.flyer_height)) && <p className="text-[12px] text-[#92400E]">Résolution faible : le texte du flyer peut être difficile à lire.</p>}
            <label className={LABEL}>Téléverser un fichier
              <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[13px]" onChange={(e) => {
                const fichier = e.target.files?.[0];
                if (!fichier) return;
                const donnees = new FormData();
                donnees.set("fichier", fichier);
                if (f.flyer_storage_path) donnees.set("ancien", f.flyer_storage_path);
                const local = URL.createObjectURL(fichier);
                start(async () => {
                  const res = await receptionnerFlyer(donnees);
                  if (!res.ok) { URL.revokeObjectURL(local); setErreur(res.erreur); return; }
                  if (f.apercuLocal.startsWith("blob:")) URL.revokeObjectURL(f.apercuLocal);
                  appliquerFlyer(setF, res, local);
                });
              }} />
            </label>
            <Champ id="champ-url-flyer" label="URL directe de l'image">
              <div className="flex gap-2">
                <input id="champ-url-flyer" className={CHAMP} value={urlDistante} onChange={(e) => setUrlDistante(e.target.value)} />
                <button type="button" className={BTN_SECONDAIRE} onClick={() => start(async () => {
                  const res = await importerFlyerDepuisUrl(urlDistante, f.flyer_storage_path || null);
                  if (!res.ok) setErreur(res.erreur);
                  else appliquerFlyer(setF, res, "");
                })}>Importer</button>
              </div>
            </Champ>
            <p className={AIDE}>Collez l&apos;adresse du post dans Source, puis téléversez l&apos;image ici.</p>
            <Champ id="champ-credit" label="Crédit"><input id="champ-credit" className={CHAMP} value={f.flyer_credit} onChange={(e) => set("flyer_credit", e.target.value)} /></Champ>
            {f.id && (f.flyer_storage_path || f.flyer_url) && !f.flyer_hidden_at && (
              <button type="button" className={BTN_SECONDAIRE} onClick={() => { setMotif(""); setDialogue({ type: "masquer", evenement: adminDepuisFormulaire(f) }); }}>Masquer le flyer sur le site</button>
            )}
            {f.id && f.flyer_hidden_at && (
              <button type="button" className={BTN_SECONDAIRE} onClick={() => executer(async () => {
                const res = await reafficherFlyer(f.id);
                if (res.ok) setF((actuel) => ({ ...actuel, flyer_hidden_at: "", flyer_hidden_reason: "", flyer_url: res.flyer_url }));
                return res;
              })}>Réafficher le flyer</button>
            )}
            <p className={AIDE}>Le flyer reste dans l&apos;admin, le site affiche le dégradé.</p>
          </section>

          <section className={`${CARTE} space-y-3 p-4`}>
            <h2 className={TITRE_BLOC}>Source</h2>
            <Champ id="champ-plateforme" label="Plateforme">
              <select id="champ-plateforme" className={CHAMP} value={f.source} onChange={(e) => set("source", e.target.value)}>
                <option value="">Non indiquée</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Champ>
            <Champ id="champ-compte" label="Compte"><input id="champ-compte" className={CHAMP} value={f.source_account} onChange={(e) => set("source_account", e.target.value)} /></Champ>
            <Champ id="champ-source" label="URL du post d'origine">
              <input id="champ-source" className={CHAMP} value={f.source_url} onChange={(e) => set("source_url", e.target.value)} />
            </Champ>
            {f.source_url.trim().startsWith("http") && (
              <a className={BTN_SECONDAIRE} href={f.source_url.trim()} target="_blank" rel="noreferrer">
                <ExternalLink size={16} aria-hidden /> Ouvrir le post
              </a>
            )}
            <p className={AIDE}>Visible seulement ici, pour vérifier avant de publier. Jamais affiché sur le site.</p>
            <Champ id="champ-repere" label="Repéré le">
              <input id="champ-repere" type="datetime-local" className={CHAMP} value={f.spotted_at} onChange={(e) => set("spotted_at", e.target.value)} />
            </Champ>
          </section>

          <section className={`${CARTE} space-y-3 p-4`}>
            <h2 className={TITRE_BLOC}>Sponsoring</h2>
            <Champ id="champ-sponsor-de" label="Sponsorisé du">
              <input id="champ-sponsor-de" type="datetime-local" className={CHAMP} value={f.sponsored_from} onChange={(e) => set("sponsored_from", e.target.value)} />
            </Champ>
            <Champ id="champ-sponsor-au" label="Sponsorisé jusqu'au">
              <input id="champ-sponsor-au" type="datetime-local" className={CHAMP} value={f.sponsored_to} onChange={(e) => set("sponsored_to", e.target.value)} />
            </Champ>
            <p className={AIDE}>L&apos;événement apparaît dans la bannière d&apos;accueil pendant cette période.</p>
          </section>
        </div>
      </div>

      {doublon && (
        <div className={`${CARTE} mt-4 p-4 text-[14px]`}>
          <p>Doublon probable : {doublon.titre} ({doublon.slug}).</p>
          <label className="mt-2 flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={confirmer} onChange={(e) => setConfirmer(e.target.checked)} />
            Enregistrer comme nouvel événement
          </label>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-[#EFE5D2] bg-white px-4 py-3 lg:left-[248px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[12.5px] text-[#8A7B66]">
            {sale ? <><span className="h-2 w-2 rounded-full bg-[#F97316]" aria-hidden /> Modifications non enregistrées</> : enregistreA ? `Enregistré à ${enregistreA}` : "Aucune modification"}
          </p>
          <button type="submit" className={BTN_PRIMAIRE} disabled={pending}>
            {f.statutEnregistre === "publie" ? "Enregistrer" : "Enregistrer le brouillon"}
          </button>
        </div>
      </div>

      {dialogue?.type === "quitter" && (
        <Modal titre="Quitter sans enregistrer ?" onFermer={() => setDialogue(null)}>
          <p className="text-[14px] text-[#4A4136]">Les modifications de cet événement ne sont pas enregistrées.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={BTN_SECONDAIRE} onClick={() => setDialogue(null)}>Annuler</button>
            <button type="button" className={BTN_DANGER_PLEIN} onClick={() => { const suite = dialogue.suite; setDialogue(null); suite(); }}>Quitter</button>
          </div>
        </Modal>
      )}
      {dialogue?.type === "masquer" && (
        <Modal titre="Masquer le flyer sur le site ?" onFermer={() => setDialogue(null)}>
          <label className={LABEL} htmlFor="motif-form">Raison</label>
          <input id="motif-form" className={CHAMP} value={motif} onChange={(e) => setMotif(e.target.value)} />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={BTN_SECONDAIRE} onClick={() => setDialogue(null)}>Annuler</button>
            <button type="button" className={BTN_PRIMAIRE} onClick={() => {
              const raison = motif.trim();
              if (!raison) return;
              setDialogue(null);
              executer(async () => {
                const res = await masquerFlyer({ id: f.id, motif: raison });
                if (res.ok) setF((actuel) => ({ ...actuel, flyer_hidden_at: new Date().toISOString(), flyer_hidden_reason: raison, flyer_url: "", flyer_card_url: "", apercuLocal: "" }));
                return res;
              });
            }}>Masquer</button>
          </div>
        </Modal>
      )}
      {dialogue?.type === "apercu" && (
        <Modal titre="Aperçu" large onFermer={() => setDialogue(null)}>
          <ApercuPublic evenement={dialogue.evenement} />
        </Modal>
      )}
      {toast && (
        <p className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#E4F3EA] px-4 py-3 text-[14px] font-semibold text-[#177E54] shadow">
          <Check size={16} aria-hidden /> {toast}
        </p>
      )}
    </form>
  );
}

function Ligne({
  evenement,
  lieu,
  artistes,
  menuOuvert,
  onMenu,
  onModifier,
  onApercu,
  onDupliquer,
  onPublier,
  onDepublier,
  onMasquer,
  onReafficher,
  onSupprimer,
}: {
  evenement: EvenementAdmin;
  lieu: string | null;
  artistes: string[];
  menuOuvert: boolean;
  onMenu: () => void;
  onModifier: () => void;
  onApercu: () => void;
  onDupliquer: () => void;
  onPublier: () => void;
  onDepublier: () => void;
  onMasquer: () => void;
  onReafficher: () => void;
  onSupprimer: () => void;
}) {
  const pastille = formaterPastille(evenement.date_debut, evenement.fuseau);
  const debut = heureCourte(evenement.date_debut, evenement.fuseau);
  const fin = evenement.date_fin ? heureCourte(evenement.date_fin, evenement.fuseau) : "";
  const horaire = fin ? `${debut} – ${fin}` : debut;
  const categorie = nomCategorie(evenement.categorie);
  const flyerVisible = Boolean(evenement.flyer_url) && !evenement.flyer_hidden_at;
  return (
    <li className={`${CARTE} relative flex flex-wrap items-center gap-3 p-3.5 ${menuOuvert ? "z-40" : ""}`}>
      <Vignette titre={evenement.titre} url={flyerVisible ? evenement.flyer_url : null} masque={Boolean(evenement.flyer_hidden_at)} />
      <span className="flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-xl bg-[#FDECEA]">
        <span className="font-[family-name:var(--font-display)] text-[17px] leading-none font-black text-[#191410]">{pastille.jour}</span>
        <span className="mt-0.5 text-[10px] font-semibold text-[#B91C1C]">{pastille.mois}</span>
      </span>
      <div className="min-w-[180px] flex-1">
        <p className="font-[family-name:var(--font-display)] text-[16px] font-extrabold text-[#191410]">{evenement.titre}</p>
        <p className="text-[13px] text-[#4A4136]">{[lieu, evenement.ville].filter(Boolean).join(" · ") || "Lieu non indiqué"}</p>
        <p className="truncate text-[12.5px] text-[#8A7B66]">{[horaire, categorie, artistes.join(", ")].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="flex items-center gap-2">
        <PastilleStatut evenement={evenement} />
        {estSponsorise(evenement) && <span className="rounded-full bg-[#191410] px-2 py-1 text-[11px] font-semibold text-white">SPONSORISÉ</span>}
        {flyerVisible && <span title="Flyer présent"><ImageIcon size={16} aria-label="Flyer présent" className="text-[#8A7B66]" /></span>}
        {evenement.source_url && <span title="Lien source"><Link2 size={16} aria-label="Lien source, admin uniquement" className="text-[#8A7B66]" /></span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {evenement.statut === "publie" ? (
          <button type="button" className={BTN_SECONDAIRE} onClick={onDepublier}>Dépublier</button>
        ) : (
          <button type="button" className={BTN_PRIMAIRE} onClick={onPublier}>Publier</button>
        )}
        <button type="button" className={BTN_SECONDAIRE} onClick={onModifier}>Modifier</button>
        <button type="button" aria-label="Plus d'actions" className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border-[1.5px] border-[#EFE5D2] bg-white" onClick={onMenu}>
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>
      {menuOuvert && (
        <div className="absolute top-14 right-3 z-30 w-56 rounded-[14px] border-[1.5px] border-[#EFE5D2] bg-white p-1 shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
          <ItemMenu onClick={onApercu}>Aperçu de la carte</ItemMenu>
          {(evenement.flyer_storage_path || evenement.flyer_url) && !evenement.flyer_hidden_at && <ItemMenu onClick={onMasquer}>Masquer le flyer</ItemMenu>}
          {evenement.flyer_hidden_at && <ItemMenu onClick={onReafficher}>Réafficher le flyer</ItemMenu>}
          <ItemMenu onClick={onDupliquer}>Dupliquer</ItemMenu>
          {evenement.statut !== "retire" && (
            <>
              <hr className="my-1 border-[#EFE5D2]" />
              <ItemMenu danger onClick={onSupprimer}>Supprimer</ItemMenu>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function ItemMenu({ children, onClick, danger = false }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-11 w-full items-center rounded-[10px] px-3 text-left text-[14px] font-semibold ${danger ? "text-[#E02B20] hover:bg-[#FDECEA]" : "text-[#191410] hover:bg-[#FBF7EF]"}`}>
      {children}
    </button>
  );
}

function Vignette({ titre, url, masque }: { titre: string; url: string | null; masque: boolean }) {
  const lettres = titre.trim().split(/\s+/).slice(0, 2).map((mot) => mot[0]?.toUpperCase() ?? "").join("");
  return (
    <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[#F3E6D8]">
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[8px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-contain" />
        </>
      ) : (
        <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-[14px] font-black text-white" style={{ background: DEGRADE }}>{lettres}</span>
      )}
      {masque && <span className="absolute bottom-1 left-1 rounded-full bg-[#191410] px-1.5 py-0.5 text-[9px] font-semibold text-white">Masqué</span>}
    </span>
  );
}

function Compteur({ libelle, valeur, actif, onClick }: { libelle: string; valeur: number; actif: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${CARTE} px-4 py-3 text-left ${actif ? "border-2 border-[#E02B20]" : ""}`}>
      <span className="block font-[family-name:var(--font-display)] text-[30px] leading-none font-black text-[#191410]">{valeur}</span>
      <span className="mt-2 block text-[12.5px] font-semibold tracking-[0.08em] text-[#8A7B66] uppercase">{libelle}</span>
    </button>
  );
}

function Chip({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`${CHIP} ${actif ? CHIP_ACTIF : ""}`}>{children}</button>;
}

function Champ({ id, label, erreur, children }: { id: string; label: string; erreur?: string; children: ReactNode }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      {children}
      {erreur && <p className="mt-1 text-[12px] text-[#E02B20]">{erreur}</p>}
    </div>
  );
}

function PastilleCle({ nom, onRetirer }: { nom: string; onRetirer: () => void }) {
  return (
    <span className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#FDECEA] pr-1 pl-3 text-[13px] font-semibold text-[#B91C1C]">
      {nom}
      <button type="button" aria-label={`Retirer ${nom}`} className="flex h-8 w-8 items-center justify-center" onClick={onRetirer}><X size={14} aria-hidden /></button>
    </span>
  );
}

function PastilleStatut({ evenement }: { evenement: Pick<EvenementAdmin, "statut" | "date_debut" | "date_fin" | "fuseau"> }) {
  const termine = evenement.date_debut ? estTermine(evenement) && evenement.statut === "publie" : false;
  const libelle = termine ? "Terminé" : LIBELLES_STATUT[evenement.statut as "brouillon"] ?? evenement.statut;
  const style = termine || evenement.statut === "retire"
    ? "bg-[#EFE9DC] text-[#8A7B66]"
    : evenement.statut === "publie"
      ? "bg-[#E4F3EA] text-[#177E54]"
      : "bg-[#FEF3C7] text-[#92400E]";
  return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11.5px] font-semibold capitalize ${style}`}>{libelle}</span>;
}

function Modal({ titre, children, onFermer, large = false }: { titre: string; children: ReactNode; onFermer: () => void; large?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#191410]/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className={`max-h-[90vh] w-full overflow-auto rounded-[20px] bg-white p-5 ${large ? "max-w-3xl" : "max-w-md"}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-[18px] font-extrabold">{titre}</h2>
          <button type="button" aria-label="Fermer" className="flex h-10 w-10 items-center justify-center" onClick={onFermer}><X size={18} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApercuPublic({ evenement }: { evenement: EvenementPublic }) {
  return (
    <div className="space-y-4 bg-[#FBF7EF] p-3">
      <CarteEvenement evenement={{ ...evenement, source_url: null }} />
      <ZoneFlyer evenement={{ ...evenement, source_url: null }} />
      <h3 className="font-[family-name:var(--font-display)] text-[28px] font-extrabold">{evenement.titre}</h3>
      <p className="text-[#4A4136]">{formaterQuand(evenement.date_debut, evenement.fuseau)}</p>
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

function champsDepuis(f: Formulaire, statut: string): Record<string, unknown> {
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
    statut,
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
  if (!f.titre || !/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.test(f.date_debut)) return null;
  let date_debut = f.date_debut;
  let date_fin: string | null = f.date_fin || null;
  try {
    date_debut = instantDepuisSaisie(f.date_debut, f.fuseau);
    date_fin = f.date_fin && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.test(f.date_fin) ? instantDepuisSaisie(f.date_fin, f.fuseau) : null;
  } catch {
    return null;
  }
  return publicDepuis(f, date_debut, date_fin, lieux, artistes);
}

function publicDepuis(f: Formulaire, date_debut: string, date_fin: string | null, lieux: LieuAdmin[], artistes: ArtisteAdmin[]): EvenementPublic {
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
    source_url: null,
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

function publicDepuisAdmin(e: EvenementAdmin, lieux: LieuAdmin[], artistes: ArtisteAdmin[]): EvenementPublic {
  const formulaire = depuisEvenement(e);
  let date_debut = e.date_debut;
  let date_fin = e.date_fin;
  try {
    date_debut = instantDepuisSaisie(formulaire.date_debut, formulaire.fuseau);
    date_fin = formulaire.date_fin ? instantDepuisSaisie(formulaire.date_fin, formulaire.fuseau) : null;
  } catch {
    date_debut = e.date_debut;
    date_fin = e.date_fin;
  }
  return publicDepuis(formulaire, date_debut, date_fin, lieux, artistes);
}

function adminDepuisFormulaire(f: Formulaire): EvenementAdmin {
  return {
    id: f.id,
    slug: f.slug,
    titre: f.titre,
    date_debut: f.date_debut,
    date_fin: f.date_fin || null,
    venue_id: f.venue_id || null,
    ville: f.ville || null,
    description: f.description || null,
    prix: f.prix || null,
    source: f.source || null,
    source_url: f.source_url || null,
    source_account: f.source_account || null,
    spotted_at: f.spotted_at || null,
    categorie: f.categorie || null,
    fuseau: f.fuseau,
    a_verifier: f.a_verifier,
    statut: f.statutEnregistre,
    artist_ids: f.artist_ids,
    flyer_storage_path: f.flyer_storage_path || null,
    flyer_url: f.flyer_url || null,
    flyer_card_url: f.flyer_card_url || null,
    flyer_width: Number(f.flyer_width) || null,
    flyer_height: Number(f.flyer_height) || null,
    flyer_mime_type: f.flyer_mime_type || null,
    flyer_alt: f.flyer_alt || null,
    flyer_credit: f.flyer_credit || null,
    flyer_hidden_at: f.flyer_hidden_at || null,
    flyer_hidden_reason: f.flyer_hidden_reason || null,
    sponsored_from: f.sponsored_from || null,
    sponsored_to: f.sponsored_to || null,
  };
}

function signature(f: Formulaire): string {
  return JSON.stringify(f);
}

function dateDe(valeur: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(valeur) ? valeur.slice(0, 10) : "";
}

function heureDe(valeur: string): string {
  const m = /T(\d{2}:\d{2})/.exec(valeur);
  return m?.[1] ?? "";
}

function combiner(date: string, heure: string): string {
  if (!date) return "";
  return heure ? `${date}T${heure}` : `${date}T`;
}

function heureCourte(iso: string, fuseau: string): string {
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: fuseau }).formatToParts(new Date(iso));
    const h = parts.find((p) => p.type === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${h}h${m}`;
  } catch {
    return "";
  }
}

function dansSeptJours(e: EvenementAdmin): boolean {
  if (estTermine(e)) return false;
  const t = Date.parse(e.date_debut);
  return t >= Date.now() && t <= Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function brouillonLePlusProche(evenements: EvenementAdmin[]): EvenementAdmin | undefined {
  return [...evenements.filter((e) => e.statut === "brouillon")].sort((a, b) => Math.abs(Date.parse(a.date_debut) - Date.now()) - Math.abs(Date.parse(b.date_debut) - Date.now()))[0];
}

function slugOuVide(nom: string): string {
  try {
    return slugifier(nom);
  } catch {
    return "";
  }
}
