import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeFraicheur } from "@/components/menus/BadgeFraicheur";
import { Gabarit, MessageErreurDonnees } from "@/components/menus/Gabarit";
import MenuEtSimulateur from "@/components/menus/MenuEtSimulateur";
import { lireRestaurant } from "@/lib/menus/data";
import {
  chiffresSeulement,
  formatTaux,
  fraicheur,
  lienItineraire,
  lienTelephone,
  lienWhatsapp,
} from "@/lib/menus/format";
import type { Reglages, Restaurant } from "@/lib/menus/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const d = await lireRestaurant(slug);
    if (d) {
      return {
        title: `${d.restaurant.nom} — menu et prix | Tèt Weekend`,
        description: `Menu, prix et simulateur de budget pour ${d.restaurant.nom}${d.restaurant.quartier ? `, ${d.restaurant.quartier}` : ""}.`,
      };
    }
  } catch {}
  return { title: "Restaurant | Tèt Weekend" };
}

const NON_RENSEIGNE = "Non renseigné";

export default async function FicheRestaurant({ params }: Props) {
  const { slug } = await params;
  let donnees: Awaited<ReturnType<typeof lireRestaurant>>;
  try {
    donnees = await lireRestaurant(slug);
  } catch (e) {
    return (
      <Gabarit>
        <Retour />
        <MessageErreurDonnees erreur={e} />
      </Gabarit>
    );
  }
  if (!donnees) notFound();

  const { restaurant: r, items, reglages } = donnees;
  const f = fraicheur(r.date_dernier_releve);
  const itineraire = lienItineraire(r);

  return (
    <Gabarit>
      <Retour />

      <header className="mb-5">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-[clamp(26px,6vw,38px)] font-extrabold leading-tight tracking-tight">
          {r.nom}
        </h1>
        <p className="mb-3 text-[15px] text-[var(--text-sec)]">
          {[r.quartier ?? r.zones.join(" / "), r.type_cuisine, r.ambiance].filter(Boolean).join(" · ")}
        </p>
        <BadgeFraicheur verifiee={f.verifiee} libelle={f.libelle} />
      </header>

      <nav aria-label="Contacter le restaurant" className="mb-6 grid grid-cols-3 gap-2">
        <BoutonAction href={r.whatsapp ? lienWhatsapp(r.whatsapp) : null} externe libelle="WhatsApp" />
        <BoutonAction href={r.telephone ? lienTelephone(r.telephone) : null} libelle="Appeler" />
        <BoutonAction href={itineraire} externe libelle="Itinéraire" />
      </nav>

      <MenuEtSimulateur
        slug={r.slug}
        items={items}
        restaurant={{
          devise: r.devise,
          taux: r.taux_htg_usd,
          taxePct: r.taxe_pct,
          taxeIncluse: r.taxe_incluse,
          servicePct: r.service_pct,
          serviceInclus: r.service_inclus,
        }}
        tauxGlobal={reglages.tauxGlobal}
      />

      <InfosPratiques r={r} />
      <Tarification r={r} tauxGlobal={reglages.tauxGlobal} />

      <section className="mt-6 space-y-3 text-sm text-[var(--text-sec)]">
        <p>
          Prix relevés par Tèt Weekend à titre indicatif ; ils peuvent avoir changé. Tèt Weekend n&apos;est pas
          partenaire de ce restaurant.
        </p>
        <LienRetrait nom={r.nom} reglages={reglages} />
      </section>
    </Gabarit>
  );
}

function Retour() {
  return (
    <Link
      href="/"
      className="mb-4 inline-flex min-h-11 items-center text-sm text-[var(--text-sec)] hover:text-[var(--white)] focus-visible:outline-2 focus-visible:outline-[var(--blue)]"
    >
      ← Tous les restaurants
    </Link>
  );
}

function BoutonAction({ href, libelle, externe = false }: { href: string | null; libelle: string; externe?: boolean }) {
  const classes =
    "flex min-h-12 flex-col items-center justify-center rounded-xl px-2 text-center text-sm font-semibold";
  if (!href) {
    return (
      <span className={`${classes} border border-white/10 text-[var(--text-sec)]`} aria-disabled="true">
        {libelle}
        <span className="text-[11px] font-normal">{NON_RENSEIGNE.toLowerCase()}</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${classes} bg-[var(--blue)] text-[var(--black)] hover:bg-[var(--blue-dim)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--white)]`}
    >
      {libelle}
    </a>
  );
}

function ouiNon(v: boolean | null): string {
  return v === null ? NON_RENSEIGNE : v ? "Oui" : "Non";
}

function Ligne({ terme, valeur }: { terme: string; valeur: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2 last:border-b-0">
      <dt className="text-[var(--text-sec)]">{terme}</dt>
      <dd className="text-right font-medium">{valeur}</dd>
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
      <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold">{titre}</h2>
      <dl className="text-sm">{children}</dl>
    </section>
  );
}

function InfosPratiques({ r }: { r: Restaurant }) {
  return (
    <Bloc titre="Infos pratiques">
      <Ligne terme="Adresse" valeur={r.adresse ?? NON_RENSEIGNE} />
      <Ligne terme="Point de repère" valeur={r.point_repere ?? NON_RENSEIGNE} />
      <Ligne terme="Horaires" valeur={r.horaires ?? NON_RENSEIGNE} />
      <Ligne terme="Jours de fermeture" valeur={r.jours_fermeture ?? NON_RENSEIGNE} />
      <Ligne terme="Heure limite cuisine" valeur={r.heure_limite_cuisine ?? NON_RENSEIGNE} />
      <Ligne terme="Parking gardé" valeur={ouiNon(r.parking_garde)} />
      <Ligne terme="Groupe électrogène" valeur={ouiNon(r.groupe_electrogene)} />
      <Ligne terme="Climatisation" valeur={ouiNon(r.climatisation)} />
      <Ligne terme="Terrasse" valeur={ouiNon(r.terrasse)} />
      <Ligne
        terme="Paiement"
        valeur={r.modes_paiement && r.modes_paiement.length > 0 ? r.modes_paiement.join(", ") : NON_RENSEIGNE}
      />
      <Ligne
        terme="Instagram"
        valeur={
          r.instagram ? (
            <a
              className="text-[var(--blue)] underline-offset-2 hover:underline"
              href={`https://www.instagram.com/${r.instagram.replace(/^@/, "")}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{r.instagram.replace(/^@/, "")}
            </a>
          ) : (
            NON_RENSEIGNE
          )
        }
      />
      {r.photo_carte_url && (
        <Ligne
          terme="Carte"
          valeur={
            <a
              className="text-[var(--blue)] underline-offset-2 hover:underline"
              href={r.photo_carte_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir la photo de la carte
            </a>
          }
        />
      )}
    </Bloc>
  );
}

function pourcentageTexte(pct: number | null, inclus: boolean | null, motInclus: string): string {
  if (pct === null) return NON_RENSEIGNE;
  if (pct === 0) return "Aucun(e)";
  const n = `${pct.toLocaleString("fr-FR")} %`;
  if (inclus === null) return `${n} (inclusion non renseignée)`;
  return inclus ? `${n} · ${motInclus}` : `${n} · ajouté(e) à l'addition`;
}

function Tarification({ r, tauxGlobal }: { r: Restaurant; tauxGlobal: number | null }) {
  return (
    <Bloc titre="Tarification">
      <Ligne terme="Devise des prix" valeur={r.devise ?? NON_RENSEIGNE} />
      <Ligne terme="Taxe" valeur={pourcentageTexte(r.taxe_pct, r.taxe_incluse, "taxes incluses")} />
      <Ligne terme="Service" valeur={pourcentageTexte(r.service_pct, r.service_inclus, "service inclus")} />
      <Ligne
        terme="Taux de change"
        valeur={
          r.taux_htg_usd !== null
            ? `${formatTaux(r.taux_htg_usd)} (taux du restaurant)`
            : tauxGlobal !== null
              ? `${formatTaux(tauxGlobal)} (taux Tèt Weekend)`
              : NON_RENSEIGNE
        }
      />
    </Bloc>
  );
}

function LienRetrait({ nom, reglages }: { nom: string; reglages: Reglages }) {
  const libelle = "Restaurant : demander la correction ou le retrait de votre menu";
  const objet = `Correction ou retrait du menu — ${nom}`;
  const liens: { href: string; texte: string }[] = [];
  if (reglages.contactWhatsapp) {
    liens.push({
      href: `https://wa.me/${chiffresSeulement(reglages.contactWhatsapp)}?text=${encodeURIComponent(objet)}`,
      texte: "par WhatsApp",
    });
  }
  if (reglages.contactEmail) {
    liens.push({ href: `mailto:${reglages.contactEmail}?subject=${encodeURIComponent(objet)}`, texte: "par e-mail" });
  }
  return (
    <p className="font-medium text-[var(--white)]">
      {libelle}
      {liens.length === 0 ? (
        <span className="font-normal text-[var(--text-sec)]"> — contact en cours de configuration.</span>
      ) : (
        <>
          {" "}
          —{" "}
          {liens.map((l, i) => (
            <span key={l.href}>
              {i > 0 && " ou "}
              <a
                className="text-[var(--blue)] underline underline-offset-2"
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {l.texte}
              </a>
            </span>
          ))}
        </>
      )}
    </p>
  );
}
