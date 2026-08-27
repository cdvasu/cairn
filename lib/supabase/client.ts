"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/lib/types";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Singleton browser client — all mutations go through this, under RLS. */
export function supabaseBrowser() {
  if (!cached) {
    cached = createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY());
  }
  return cached;
}
