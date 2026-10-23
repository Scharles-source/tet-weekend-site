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
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-[400px] rounded-[20px] border-[1.5px] border-[#EFE5D2] bg-white p-6 shadow-[0_3px_14px_rgba(80,55,10,0.06)]">
        <div className="mb-5 flex items-center gap-2">
          <span className="font-[family-name:var(--font-archivo-black)] text-[28px] leading-none">
            <span className="text-[#191410]">T</span>
            <span className="text-[#E02B20]">W</span>
          </span>
          <span className="leading-[1.05]">
            <span className="block font-[family-name:var(--font-display)] text-[13px] font-extrabold">tèt</span>
            <span className="block font-[family-name:var(--font-display)] text-[12px] font-black tracking-[0.08em] text-[#E02B20]">WEEKEND</span>
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-extrabold">Administration</h1>
        <p className="mt-2 text-[13px] text-[#8A7B66]">Connexion avec le compte Google {EMAIL_ADMIN}.</p>
        {erreur && <p className="mt-4 text-[13px] text-[#E02B20]">{erreur}</p>}
        <button
          type="button"
          disabled={chargement}
          onClick={connexionGoogle}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[14px] border-[1.5px] border-[#EFE5D2] bg-white text-[15px] font-semibold text-[#191410] disabled:opacity-50"
        >
          {chargement ? "Connexion…" : "Continuer avec Google"}
        </button>
      </div>
    </main>
  );
}
