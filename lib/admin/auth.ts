import { redirect } from "next/navigation";
import { creerClientServeur } from "./supabase/server.ts";
import { supabaseConfigure } from "./supabase/env.ts";

export interface SessionAdmin {
  userId: string;
  email: string | null;
}

/** Session + is_admin. Retourne null si non connecté ou non admin. */
export async function sessionAdmin(): Promise<SessionAdmin | null> {
  if (!supabaseConfigure()) return null;
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profil?.is_admin) return null;
  return { userId: user.id, email: profil.email ?? user.email ?? null };
}

export async function exigerAdmin(): Promise<SessionAdmin> {
  const s = await sessionAdmin();
  if (!s) redirect("/admin/login");
  return s;
}

/** Pour les routes API : 401 JSON. */
export async function exigerAdminApi(): Promise<
  { ok: true; session: SessionAdmin } | { ok: false; status: number; message: string }
> {
  if (!supabaseConfigure()) {
    return { ok: false, status: 503, message: "Configuration Supabase manquante." };
  }
  const s = await sessionAdmin();
  if (!s) return { ok: false, status: 401, message: "Authentification admin requise." };
  return { ok: true, session: s };
}
