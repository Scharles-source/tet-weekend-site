"use client";

import { createBrowserClient } from "@supabase/ssr";

export function clientNavigateur() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) throw new Error("Configuration Supabase manquante.");
  return createBrowserClient(url, cle);
}
