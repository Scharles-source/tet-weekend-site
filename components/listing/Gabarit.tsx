import { EnTete } from "@/components/listing/EnTete";
import { Logo } from "@/components/listing/Logo";
import { NavBasse } from "@/components/listing/NavBasse";
import { ConfigurationSupabaseManquante } from "@/lib/listing/data";

export function Gabarit({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-clair min-h-dvh">
      <EnTete />
      <main className="pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-3xl px-[var(--page-px)] py-6">{children}</div>
      </main>
      <footer className="hidden border-t border-[#EFE5D2] px-[var(--page-px)] py-8 md:block">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <Logo compact />
          <p className="text-xs text-[#8A7B66]">© {new Date().getFullYear()} Tèt Weekend</p>
        </div>
      </footer>
      <NavBasse />
    </div>
  );
}

export function MessageEtat({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div role="status" className="rounded-[20px] border-[1.5px] border-[#EFE5D2] bg-white p-6 text-center shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
      <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-black">{titre}</h2>
      <p className="text-sm text-[#4A4136]">{texte}</p>
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
