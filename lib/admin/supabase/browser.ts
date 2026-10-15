"use client";

import { createBrowserClient } from "@supabase/ssr";
import { cleAnon, urlSupabase } from "./env.ts";

export function creerClientNavigateur() {
  return createBrowserClient(urlSupabase(), cleAnon());
}
