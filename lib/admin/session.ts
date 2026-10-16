import { clientServeur, supabaseConfigure } from "./supabase.ts";

export interface SessionAdmin {
  userId: string;
  email: string | null;
  isAdmin: boolean;
}

/** null = pas de session. isAdmin false = connecté sans droit. */
export async function lireSession(): Promise<SessionAdmin | null> {
  if (!supabaseConfigure()) return null;
  const supabase = await clientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("is_admin, email").eq("id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    userId: user.id,
    email: data?.email ?? user.email ?? null,
    isAdmin: data?.is_admin === true,
  };
}
