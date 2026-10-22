import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ConfigurationSupabaseManquante } from "@/lib/listing/data";

export function Gabarit({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="mx-auto w-full max-w-3xl px-[var(--page-px)] py-8">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function MessageEtat({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div role="status" className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6 text-center">
      <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold">{titre}</h2>
      <p className="text-sm text-[var(--text-sec)]">{texte}</p>
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
