"use client";

import { getApps } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { clientNavigateur } from "@/lib/admin/browser";

export function Deconnexion() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="min-h-11 rounded-xl border border-white/15 px-4 text-sm"
      onClick={async () => {
        await clientNavigateur().auth.signOut();
        if (getApps().length > 0) await signOut(getAuth(getApps()[0])).catch(() => undefined);
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Déconnexion
    </button>
  );
}
