"use client";

import { LogOut } from "lucide-react";
import { getApps } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { clientNavigateur } from "@/lib/admin/browser";
import { BTN_SECONDAIRE } from "@/components/admin/styles";

export function Deconnexion() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={`${BTN_SECONDAIRE} w-full`}
      onClick={async () => {
        await clientNavigateur().auth.signOut();
        if (getApps().length > 0) await signOut(getAuth(getApps()[0])).catch(() => undefined);
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      <LogOut size={16} aria-hidden />
      Déconnexion
    </button>
  );
}
