"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";
import { clientNavigateur } from "@/lib/admin/browser";
import { firebaseApp } from "@/lib/firebase";

const EMAIL_ADMIN = "smithcharles8484@gmail.com";

export default function PageConnexionAdmin() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function connexionGoogle() {
    setErreur(null);
    setChargement(true);
    const auth = getAuth(firebaseApp);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: EMAIL_ADMIN, prompt: "select_account" });
      const resultat = await signInWithPopup(auth, provider);
      const email = resultat.user.email?.trim().toLowerCase() ?? "";
      const jeton = GoogleAuthProvider.credentialFromResult(resultat)?.idToken;
      if (email !== EMAIL_ADMIN) {
        await signOut(auth);
        setErreur(`Seul le compte Google ${EMAIL_ADMIN} peut ouvrir l'admin.`);
        return;
      }
      if (!jeton) {
        await signOut(auth);
        setErreur("Google n'a pas renvoyé de jeton.");
        return;
      }
      const { error } = await clientNavigateur().auth.signInWithIdToken({
        provider: "google",
        token: jeton,
      });
      if (error) {
        setErreur("Connexion Google refusée.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setErreur("Connexion annulée.");
      } else if (code === "auth/popup-blocked") {
        setErreur("Le navigateur a bloqué la fenêtre Google.");
      } else {
        setErreur("Connexion Google impossible.");
      }
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto max-w-md pt-10">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-extrabold">Admin</h1>
      <p className="mb-6 text-sm text-[var(--text-sec)]">
        Connexion avec le compte Google {EMAIL_ADMIN}. Cette page n&apos;est liée depuis aucune page publique.
      </p>
      <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
        {erreur && <p className="mb-4 text-sm text-amber-200">{erreur}</p>}
        <button
          type="button"
          disabled={chargement}
          onClick={connexionGoogle}
          className="min-h-11 w-full rounded-xl bg-[var(--blue)] font-medium text-black disabled:opacity-50"
        >
          {chargement ? "Connexion…" : "Continuer avec Google"}
        </button>
      </div>
    </main>
  );
}
