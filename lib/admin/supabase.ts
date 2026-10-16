import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseConfigure(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function urlEtCle(): { url: string; cle: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) throw new Error("Configuration Supabase manquante.");
  return { url, cle };
}

export async function clientServeur() {
  const { url, cle } = urlEtCle();
  const cookieStore = await cookies();
  return createServerClient(url, cle, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          /* lecture seule */
        }
      },
    },
  });
}

