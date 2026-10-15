"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/admin/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    fetch("/api/admin/etat")
      .then((r) => {
        if (r.ok) router.replace("/admin");
      })
      .catch(() => {});
  }, [router]);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const supabase = creerClientNavigateur();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: motDePasse,
      });
      if (error) {
        setErreur("Connexion refusée. Vérifiez l'e-mail et le mot de passe.");
        return;
      }
      // Vérifie is_admin côté API (RLS / sessionAdmin)
      const res = await fetch("/api/admin/etat");
      if (res.status === 401) {
        await supabase.auth.signOut();
        setErreur("Ce compte n'est pas administrateur.");
        return;
      }
      if (!res.ok) {
        setErreur("Impossible de vérifier les droits admin.");
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
    <main className="mx-auto max-w-md pt-16">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
        Admin collecte
      </h1>
      <p className="mb-8 text-sm text-[var(--text-sec)]">
        Connexion réservée. Cette page n&apos;est liée depuis aucune page publique.
      </p>
      <form onSubmit={soumettre} className="space-y-4 rounded-xl border border-[var(--surface2)] bg-[var(--surface)] p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-sec)]">E-mail</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--surface2)] bg-[var(--black)] px-3 py-2 outline-none focus:border-[var(--blue)]"
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
            className="w-full rounded-lg border border-[var(--surface2)] bg-[var(--black)] px-3 py-2 outline-none focus:border-[var(--blue)]"
          />
        </label>
        {erreur && (
          <p className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200" role="alert">
            {erreur}
          </p>
        )}
        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded-lg bg-[var(--blue)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {chargement ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
