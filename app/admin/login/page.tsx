"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientNavigateur } from "@/lib/admin/browser";

export default function PageConnexionAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const supabase = clientNavigateur();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: motDePasse,
      });
      if (error) {
        setErreur("Connexion refusée. Vérifiez l'e-mail et le mot de passe.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setErreur("Configuration Supabase manquante ou réseau indisponible.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto max-w-md pt-10">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-extrabold">Admin</h1>
      <p className="mb-6 text-sm text-[var(--text-sec)]">Connexion réservée. Cette page n&apos;est liée depuis aucune page publique.</p>
      <form onSubmit={soumettre} className="space-y-4 rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-sec)]">E-mail</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-sec)]">Mot de passe</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3"
          />
        </label>
        {erreur && <p className="text-sm text-amber-200">{erreur}</p>}
        <button type="submit" disabled={chargement} className="min-h-11 w-full rounded-xl bg-[var(--blue)] font-medium text-black disabled:opacity-50">
          {chargement ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
