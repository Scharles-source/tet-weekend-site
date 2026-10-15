import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cleAnon, urlSupabase } from "./env.ts";

export async function creerClientServeur() {
  const cookieStore = await cookies();
  return createServerClient(urlSupabase(), cleAnon(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // set depuis un Server Component en lecture seule : ignoré (middleware rafraîchit).
        }
      },
    },
  });
}
