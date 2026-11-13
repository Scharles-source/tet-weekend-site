"use client";

import { useEffect, useState } from "react";

interface EvenementInstall extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CLE = "tw_install_ferme";

const SEPT_JOURS = 7 * 24 * 3_600_000;

/** « Not now » repousse l'invitation de sept jours. */
function lireFerme(): boolean {
  try {
    const t = Number(window.localStorage.getItem(CLE));
    return Number.isFinite(t) && t > 0 && Date.now() - t < SEPT_JOURS;
  } catch {
    return false;
  }
}

/** Enregistre le service worker et propose d'installer le site comme une application (mobile seulement). */
export function InstallerApp() {
  const [invite, setInvite] = useState<EvenementInstall | null>(null);
  const [ios, setIos] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ferme, setFerme] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);

    const installee = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    const appareilIos = /iPhone|iPad|iPod/.test(ua);
    const tactile = window.matchMedia("(pointer: coarse)").matches;
    // Décision prise après le premier rendu (le serveur ne connaît ni l'appareil ni le stockage).
    const minuteur = window.setTimeout(() => {
      if (installee || lireFerme()) return;
      setIos(appareilIos);
      setMobile(tactile);
      setFerme(false);
    }, 0);

    const avant = (e: Event) => {
      e.preventDefault();
      setInvite(e as EvenementInstall);
    };
    const apres = () => setFerme(true);
    window.addEventListener("beforeinstallprompt", avant);
    window.addEventListener("appinstalled", apres);
    return () => {
      window.clearTimeout(minuteur);
      window.removeEventListener("beforeinstallprompt", avant);
      window.removeEventListener("appinstalled", apres);
    };
  }, []);

  function fermer() {
    setFerme(true);
    try {
      window.localStorage.setItem(CLE, String(Date.now()));
    } catch {
      /* sans stockage, la bannière reviendra à la prochaine visite */
    }
  }

  async function installer() {
    if (!invite) return;
    await invite.prompt();
    const choix = await invite.userChoice;
    setInvite(null);
    if (choix.outcome === "accepted") setFerme(true);
    else fermer();
  }

  if (ferme || !mobile) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-30 rounded-[18px] border border-[var(--nuit-ligne)] bg-[var(--nuit-carte)] p-3.5 shadow-lg md:hidden" role="dialog" aria-label="Install the app">
      <p className="text-[14.5px] font-extrabold text-[var(--nuit-texte)]">Get the Tèt Weekend app</p>
      {ios ? (
        <p className="mt-1 text-[13px] leading-snug text-[var(--nuit-texte2)]">
          Tap the Share button in Safari, then <strong>Add to Home Screen</strong>.
        </p>
      ) : invite ? (
        <p className="mt-1 text-[13px] leading-snug text-[var(--nuit-texte2)]">Add it to your home screen to open it in one tap, like any other app.</p>
      ) : (
        <p className="mt-1 text-[13px] leading-snug text-[var(--nuit-texte2)]">
          Open your browser menu (⋮), then tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {!ios && invite && (
          <button type="button" onClick={installer} className="min-h-11 flex-1 rounded-full bg-[var(--bouton)] px-4 text-[14px] font-extrabold text-white">
            Install
          </button>
        )}
        <button type="button" onClick={fermer} className="min-h-11 rounded-full border border-[var(--nuit-ligne)] px-4 text-[14px] font-semibold text-[var(--nuit-texte)]">
          {ios ? "Got it" : "Not now"}
        </button>
      </div>
    </div>
  );
}
