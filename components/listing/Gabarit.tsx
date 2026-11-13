import Link from "next/link";
import { EnTete } from "@/components/listing/EnTete";
import { Logo } from "@/components/listing/Logo";
import { Mesure } from "@/components/listing/Mesure";
import { NavBasse } from "@/components/listing/NavBasse";
import { ConfigurationSupabaseManquante, emailContact } from "@/lib/listing/data";

export async function Gabarit({ children, large = false }: { children: React.ReactNode; large?: boolean }) {
  const email = await emailContact();
  const largeur = large ? "max-w-[1240px]" : "max-w-3xl";
  return (
    <div className="theme-nuit min-h-dvh">
      <EnTete large={large} email={email} />
      <main className="pb-24 md:pb-10">
        <div className={`mx-auto w-full ${largeur} px-[var(--page-px)] py-6`}>{children}</div>
      </main>
      <footer className="hidden border-t border-[var(--nuit-ligne)] px-[var(--page-px)] py-8 md:block">
        <div className={`mx-auto flex w-full ${largeur} items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
            <Logo compact />
            <p className="text-xs text-[var(--nuit-muet)]">
              Tèt Weekend — les événements haïtiens, partout.
              <br />© {new Date().getFullYear()} Tèt Weekend
            </p>
          </div>
          <nav className="flex gap-6 text-[13.5px] font-semibold text-[var(--nuit-muet)]" aria-label="Pied de page">
            <Link href="/evenements" className="no-underline">Événements</Link>
            <Link href="/villes" className="no-underline">Villes</Link>
            <Link href="/lieux" className="no-underline">Lieux</Link>
            <Link href="/artistes" className="no-underline">Artistes</Link>
          </nav>
        </div>
      </footer>
      <NavBasse email={email} />
      <Mesure />
    </div>
  );
}

export function MessageEtat({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div role="status" className="rounded-[20px] border-[1.5px] border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-6 text-center shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
      <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-black">{titre}</h2>
      <p className="text-sm text-[var(--nuit-texte2)]">{texte}</p>
    </div>
  );
}

export function MessageErreurDonnees({ erreur }: { erreur: unknown }) {
  if (erreur instanceof ConfigurationSupabaseManquante) {
    return <MessageEtat titre="Service non configuré" texte={erreur.message} />;
  }
  const texte = erreur instanceof Error ? erreur.message : "Erreur inconnue.";
  return <MessageEtat titre="Événements momentanément indisponibles" texte={texte} />;
}
