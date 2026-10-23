"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coquille, titreSection, type SectionAdmin } from "@/components/admin/Coquille";
import { SectionEvenements } from "@/components/admin/SectionEvenements";
import { AIDE, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, LABEL, TITRE_BLOC } from "@/components/admin/styles";
import { changerStatut, enregistrerArtiste, enregistrerCompte, enregistrerLieu } from "@/app/admin/actions";
import type { ArtisteAdmin, CompteAdmin, EvenementAdmin, LieuAdmin } from "@/lib/admin/charger";
import { CATEGORIES, LIBELLES_STATUT, PLATEFORMES, TYPES_ARTISTE, TYPES_COMPTE, TYPES_LIEU } from "@/lib/listing/schema";
import { slugifier } from "@/lib/listing/slug";

const SECTIONS: SectionAdmin[] = ["evenements", "lieux", "artistes", "categories", "comptes"];

export function DashboardListing({
  lieux,
  artistes,
  evenements,
  comptes,
  email,
  section = "evenements",
}: {
  lieux: LieuAdmin[];
  artistes: ArtisteAdmin[];
  evenements: EvenementAdmin[];
  comptes: CompteAdmin[];
  email: string | null;
  section?: string;
}) {
  const router = useRouter();
  const onglet: SectionAdmin = SECTIONS.includes(section as SectionAdmin) ? (section as SectionAdmin) : "evenements";
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [sale, setSale] = useState(false);
  const [nouveau, setNouveau] = useState(0);
  const [pending, setPending] = useState(false);

  function executer(action: () => Promise<{ ok: boolean; erreur?: string }>) {
    setErreur(null);
    setPending(true);
    void action().then((res) => {
      setPending(false);
      if (!res.ok) setErreur(res.erreur ?? "Erreur.");
      else router.refresh();
    });
  }

  const q = recherche.trim().toLowerCase();
  const lieuxFiltres = lieux.filter((l) => !q || [l.nom, l.ville, l.adresse].join(" ").toLowerCase().includes(q));
  const artistesFiltres = artistes.filter((a) => !q || [a.nom, a.ville_base].join(" ").toLowerCase().includes(q));
  const comptesFiltres = comptes.filter((c) => !q || [c.handle, c.url, c.plateforme].join(" ").toLowerCase().includes(q));

  return (
    <Coquille
      actif={onglet}
      email={email}
      titre={titreSection(onglet)}
      recherche={recherche}
      onRecherche={setRecherche}
      onNouveau={onglet === "evenements" ? () => setNouveau((n) => n + 1) : undefined}
      sale={sale}
    >
      {erreur && <p className="mb-4 text-[13px] text-[#E02B20]">{erreur}</p>}
      {pending && <p className="mb-4 text-[13px] text-[#8A7B66]">Enregistrement…</p>}
      {onglet === "evenements" && (
        <SectionEvenements
          lieux={lieux}
          artistes={artistes}
          evenements={evenements}
          recherche={recherche}
          onRecherche={setRecherche}
          ouvrirNouveau={nouveau}
          onSale={setSale}
        />
      )}
      {onglet === "lieux" && <FormulaireLieu lieux={lieuxFiltres} onAction={executer} />}
      {onglet === "artistes" && <FormulaireArtiste artistes={artistesFiltres} onAction={executer} />}
      {onglet === "categories" && <ListeCategories evenements={evenements} />}
      {onglet === "comptes" && <FormulaireCompte comptes={comptesFiltres} onAction={executer} />}
    </Coquille>
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
  const style = statut === "publie" ? "bg-[#E4F3EA] text-[#177E54]" : statut === "retire" ? "bg-[#EFE9DC] text-[#8A7B66]" : "bg-[#FEF3C7] text-[#92400E]";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11.5px] font-semibold capitalize ${style}`}>{LIBELLES_STATUT[statut as "brouillon"] ?? statut}</span>
      {statut !== "publie" && <button type="button" className={BTN_PRIMAIRE} onClick={() => onAction(() => changerStatut({ table, id, statut: "publie" }))}>Publier</button>}
      {statut === "publie" && <button type="button" className={BTN_SECONDAIRE} onClick={() => onAction(() => changerStatut({ table, id, statut: "brouillon" }))}>Dépublier</button>}
      {statut !== "retire" && <button type="button" className="inline-flex min-h-11 items-center rounded-[14px] border-[1.5px] border-[#E02B20] bg-white px-4 text-[14px] font-semibold text-[#E02B20] hover:bg-[#FDECEA]" onClick={() => onAction(() => changerStatut({ table, id, statut: "retire" }))}>Retirer</button>}
    </div>
  );
}

function FormulaireLieu({ lieux, onAction }: { lieux: LieuAdmin[]; onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void }) {
  const vide = { id: "", nom: "", slug: "", ville: "", pays: "", adresse: "", type: "", description: "", instagram: "", facebook: "", site_web: "" };
  const [f, setF] = useState(vide);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <form className={`${CARTE} space-y-3 p-5`} onSubmit={(ev) => { ev.preventDefault(); onAction(() => enregistrerLieu({ id: f.id || null, champs: f })); }}>
        <h2 className={TITRE_BLOC}>{f.id ? "Modifier le lieu" : "Nouveau lieu"}</h2>
        <p className={AIDE}>Les restaurants d&apos;amorce sont des lieux en brouillon. Le type et la description restent vides tant qu&apos;ils ne sont pas saisis.</p>
        <Etiquette id="lieu-nom" label="Nom"><input id="lieu-nom" className={CHAMP} value={f.nom} required onChange={(e) => setF({ ...f, nom: e.target.value, slug: f.id ? f.slug : slugOuVide(e.target.value) })} /></Etiquette>
        <Etiquette id="lieu-slug" label="Adresse de la page"><input id="lieu-slug" className={CHAMP} value={f.slug} required onChange={(e) => setF({ ...f, slug: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-ville" label="Ville"><input id="lieu-ville" className={CHAMP} value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-pays" label="Pays"><input id="lieu-pays" className={CHAMP} value={f.pays} onChange={(e) => setF({ ...f, pays: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-adresse" label="Adresse"><input id="lieu-adresse" className={CHAMP} value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-type" label="Type">
          <select id="lieu-type" className={CHAMP} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="">Non indiqué</option>
            {TYPES_LIEU.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Etiquette>
        <Etiquette id="lieu-description" label="Description"><textarea id="lieu-description" className={CHAMP} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-instagram" label="Instagram"><input id="lieu-instagram" className={CHAMP} value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-facebook" label="Facebook"><input id="lieu-facebook" className={CHAMP} value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} /></Etiquette>
        <Etiquette id="lieu-site" label="Site web"><input id="lieu-site" className={CHAMP} value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} /></Etiquette>
        <button type="submit" className={BTN_PRIMAIRE}>Enregistrer</button>
      </form>
      <ul className="space-y-3">
        {lieux.length === 0 && <Vide texte="Aucun lieu ne correspond à ces filtres." />}
        {lieux.map((l) => (
          <li key={l.id} className={`${CARTE} p-4`}>
            <p className="font-[family-name:var(--font-display)] text-[16px] font-extrabold">{l.nom}</p>
            <p className="text-[13px] text-[#4A4136]">{[l.ville, l.adresse].filter(Boolean).join(" · ")}</p>
            <button type="button" className={`${BTN_SECONDAIRE} mt-3`} onClick={() => setF({ id: l.id, nom: l.nom, slug: l.slug, ville: l.ville ?? "", pays: l.pays ?? "", adresse: l.adresse ?? "", type: l.type ?? "", description: l.description ?? "", instagram: l.instagram ?? "", facebook: l.facebook ?? "", site_web: l.site_web ?? "" })}>Modifier</button>
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
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <form className={`${CARTE} space-y-3 p-5`} onSubmit={(ev) => { ev.preventDefault(); onAction(() => enregistrerArtiste({ id: f.id || null, champs: f })); }}>
        <h2 className={TITRE_BLOC}>{f.id ? "Modifier l'artiste" : "Nouvel artiste"}</h2>
        <Etiquette id="art-nom" label="Nom"><input id="art-nom" className={CHAMP} required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value, slug: f.id ? f.slug : slugOuVide(e.target.value) })} /></Etiquette>
        <Etiquette id="art-slug" label="Adresse de la page"><input id="art-slug" className={CHAMP} required value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></Etiquette>
        <Etiquette id="art-type" label="Type">
          <select id="art-type" className={CHAMP} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="">Non indiqué</option>
            {TYPES_ARTISTE.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Etiquette>
        <Etiquette id="art-ville" label="Ville de base"><input id="art-ville" className={CHAMP} value={f.ville_base} onChange={(e) => setF({ ...f, ville_base: e.target.value })} /></Etiquette>
        <Etiquette id="art-bio" label="Bio courte"><textarea id="art-bio" className={CHAMP} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Etiquette>
        <Etiquette id="art-instagram" label="Instagram"><input id="art-instagram" className={CHAMP} value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></Etiquette>
        <Etiquette id="art-facebook" label="Facebook"><input id="art-facebook" className={CHAMP} value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} /></Etiquette>
        <Etiquette id="art-site" label="Site web"><input id="art-site" className={CHAMP} value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} /></Etiquette>
        <button type="submit" className={BTN_PRIMAIRE}>Enregistrer</button>
      </form>
      <ul className="space-y-3">
        {artistes.length === 0 && <Vide texte="Aucun artiste ne correspond à ces filtres." />}
        {artistes.map((a) => (
          <li key={a.id} className={`${CARTE} p-4`}>
            <p className="font-[family-name:var(--font-display)] text-[16px] font-extrabold">{a.nom}</p>
            <p className="text-[13px] text-[#8A7B66]">{[a.type, a.ville_base].filter(Boolean).join(" · ")}</p>
            <button type="button" className={`${BTN_SECONDAIRE} mt-3`} onClick={() => setF({ id: a.id, nom: a.nom, slug: a.slug, type: a.type ?? "", ville_base: a.ville_base ?? "", bio: a.bio ?? "", instagram: a.instagram ?? "", facebook: a.facebook ?? "", site_web: a.site_web ?? "" })}>Modifier</button>
            <BoutonsStatut table="artists" id={a.id} statut={a.statut} onAction={onAction} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListeCategories({ evenements }: { evenements: EvenementAdmin[] }) {
  return (
    <div className="space-y-3">
      <p className={AIDE}>Ces catégories sont celles du site. Elles se choisissent dans le formulaire d&apos;un événement.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => {
          const nombre = evenements.filter((e) => e.categorie === c.slug).length;
          return (
            <li key={c.slug} className={`${CARTE} p-4`}>
              <p className="font-[family-name:var(--font-display)] text-[16px] font-extrabold">{c.nom}</p>
              <p className="text-[13px] text-[#8A7B66]">{nombre} événement{nombre > 1 ? "s" : ""}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FormulaireCompte({ comptes, onAction }: { comptes: CompteAdmin[]; onAction: (action: () => Promise<{ ok: boolean; erreur?: string }>) => void }) {
  const vide = { id: "", plateforme: "instagram", handle: "", url: "", type: "lieu", actif: true };
  const [f, setF] = useState(vide);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <form className={`${CARTE} space-y-3 p-5`} onSubmit={(ev) => { ev.preventDefault(); onAction(() => enregistrerCompte({ id: f.id || null, champs: f })); }}>
        <h2 className={TITRE_BLOC}>{f.id ? "Modifier le compte" : "Nouveau compte"}</h2>
        <p className={AIDE}>Liste des comptes à surveiller. Aucun scan ne part d&apos;ici : la collecte se lance dans son écran.</p>
        <Etiquette id="cpt-plateforme" label="Plateforme">
          <select id="cpt-plateforme" className={CHAMP} value={f.plateforme} onChange={(e) => setF({ ...f, plateforme: e.target.value })}>
            {PLATEFORMES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Etiquette>
        <Etiquette id="cpt-handle" label="Handle"><input id="cpt-handle" className={CHAMP} value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} /></Etiquette>
        <Etiquette id="cpt-url" label="URL"><input id="cpt-url" className={CHAMP} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Etiquette>
        <Etiquette id="cpt-type" label="Type">
          <select id="cpt-type" className={CHAMP} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            {TYPES_COMPTE.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Etiquette>
        <label className="flex min-h-11 items-center gap-2 text-[14px]"><input type="checkbox" checked={f.actif} onChange={(e) => setF({ ...f, actif: e.target.checked })} /> Actif</label>
        <button type="submit" className={BTN_PRIMAIRE}>Enregistrer</button>
      </form>
      <ul className="space-y-3">
        {comptes.length === 0 && <Vide texte="Aucun compte ne correspond à ces filtres." />}
        {comptes.map((c) => (
          <li key={c.id} className={`${CARTE} p-4`}>
            <p className="font-semibold">{c.handle || c.url || "Compte"}</p>
            <p className="text-[13px] text-[#8A7B66]">{c.plateforme} · {c.type} · {c.actif ? "actif" : "inactif"}</p>
            <button type="button" className={`${BTN_SECONDAIRE} mt-3`} onClick={() => setF({ id: c.id, plateforme: c.plateforme, handle: c.handle ?? "", url: c.url ?? "", type: c.type, actif: c.actif })}>Modifier</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Etiquette({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function Vide({ texte }: { texte: string }) {
  return <p className="rounded-[20px] border-2 border-dashed border-[#D8C6A4] px-5 py-8 text-center text-[14px] text-[#4A4136]">{texte}</p>;
}

function slugOuVide(nom: string): string {
  try {
    return slugifier(nom);
  } catch {
    return "";
  }
}
