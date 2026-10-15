"use client";

import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/admin/supabase/browser";

export function BoutonDeconnexion() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg border border-[var(--surface2)] px-3 py-1.5 text-sm text-[var(--text-sec)] hover:border-[var(--blue)] hover:text-[var(--white)]"
      onClick={async () => {
        const supabase = creerClientNavigateur();
        await supabase.auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Déconnexion
    </button>
  );
}
