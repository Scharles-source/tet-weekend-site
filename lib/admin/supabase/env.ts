export function urlSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant");
  return url.replace(/\/+$/, "");
}

export function cleAnon(): string {
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!cle) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY manquant");
  return cle;
}

export function supabaseConfigure(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
