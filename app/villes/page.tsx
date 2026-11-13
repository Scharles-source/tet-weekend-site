import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Gabarit, MessageErreurDonnees } from "@/components/listing/Gabarit";
import { chargerAnnuaire } from "@/lib/listing/data";
import { dansLeWeekend, estTermine } from "@/lib/listing/dates";
import { normaliser } from "@/lib/listing/recherche";
import { slugifier } from "@/lib/listing/slug";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Villes — Tèt Weekend",
  description: "Événements haïtiens par ville, en Haïti et dans la diaspora.",
};

const VILLES_HAITI = ["port-au-prince", "petion-ville", "delmas", "carrefour", "tabarre", "cap-haitien", "jacmel", "les cayes", "gonaives", "jeremie", "saint-marc", "hinche", "port-de-paix", "fort-liberte", "leogane", "kenscoff", "croix-des-bouquets"];

type Ville = { slug: string; nom: string; haiti: boolean; total: number; weekend: number };

export default async function PageVilles() {
  const charge = await chargerAnnuaire();
  if (!charge.ok) {
    return (
      <Gabarit>
        <MessageErreurDonnees erreur={charge.erreur} />
      </Gabarit>
    );
  }
  const { lieux, evenements } = charge.annuaire;
  const maintenant = new Date();
  const aVenir = evenements.filter((e) => !estTermine(e));
  const pays = new Map<string, string>();
  for (const l of lieux) if (l.ville && l.pays) pays.set(slugifier(l.ville), normaliser(l.pays));

  const m = new Map<string, Ville>();
  const noter = (nom: string | null | undefined) => {
    if (!nom) return null;
    const slug = slugifier(nom);
    if (!m.has(slug)) {
      const p = pays.get(slug);
      const haiti = p ? p.includes("haiti") : VILLES_HAITI.includes(normaliser(nom).replace(/ /g, "-")) || VILLES_HAITI.includes(normaliser(nom));
      m.set(slug, { slug, nom, haiti, total: 0, weekend: 0 });
    }
    return m.get(slug)!;
  };
  for (const l of lieux) noter(l.ville);
  for (const e of aVenir) {
    const v = noter(e.ville);
    if (!v) continue;
    v.total += 1;
    if (dansLeWeekend(e.date_debut, maintenant, e.fuseau)) v.weekend += 1;
  }
  const toutes = [...m.values()].sort((a, b) => b.total - a.total || a.nom.localeCompare(b.nom, "fr"));
  const haiti = toutes.filter((v) => v.haiti);
  const diaspora = toutes.filter((v) => !v.haiti);
  const [une, ...autres] = haiti;

  return (
    <Gabarit>
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-3xl font-black">Villes</h1>
      <p className="mb-6 text-[15px] text-[var(--nuit-texte2)]">Où est-ce que ça bouge ? Choisis ta ville.</p>
      {toutes.length === 0 ? (
        <p className="text-sm text-[var(--nuit-texte2)]">Aucune ville publiée pour le moment.</p>
      ) : (
        <div className="space-y-8">
          {une && (
            <section aria-labelledby="v-haiti">
              <h2 id="v-haiti" className="mb-3 text-xs font-bold tracking-[0.14em] text-[var(--nuit-muet)] uppercase">En Haïti</h2>
              <Link href={`/villes/${une.slug}`} className="block rounded-[24px] bg-[linear-gradient(160deg,#C21810,#5B1209)] p-5 text-white no-underline">
                <span className="block font-[family-name:var(--font-display)] text-2xl font-black">{une.nom}</span>
                <span className="mt-1 block text-sm text-white/85">{compte(une)}</span>
              </Link>
              {autres.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 gap-3">
                  {autres.map((v) => (
                    <li key={v.slug}>
                      <Link href={`/villes/${v.slug}`} className="flex min-h-20 flex-col justify-center rounded-[18px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-3.5 text-inherit no-underline">
                        <span className="text-base font-bold text-[var(--nuit-texte)]">{v.nom}</span>
                        <span className="text-[13px] text-[var(--nuit-muet)]">{compte(v)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {diaspora.length > 0 && (
            <section aria-labelledby="v-diaspora">
              <h2 id="v-diaspora" className="mb-3 text-xs font-bold tracking-[0.14em] text-[var(--nuit-muet)] uppercase">Diaspora</h2>
              <ul className="overflow-hidden rounded-[20px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)]">
                {diaspora.map((v) => (
                  <li key={v.slug} className="border-b border-[var(--nuit-ligne)] last:border-b-0">
                    <Link href={`/villes/${v.slug}`} className="flex min-h-14 items-center justify-between gap-3 px-4 text-inherit no-underline">
                      <span className="font-semibold text-[var(--nuit-texte)]">{v.nom}</span>
                      <span className="flex items-center gap-1 text-[13px] text-[var(--nuit-muet)]">{compte(v)}<ChevronRight size={16} aria-hidden /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Gabarit>
  );
}

function compte(v: Ville): string {
  if (v.total === 0) return "Rien d'annoncé";
  const base = `${v.total} événement${v.total > 1 ? "s" : ""}`;
  return v.weekend > 0 ? `${base} · ${v.weekend} ce week-end` : base;
}
