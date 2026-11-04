import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Cookie-less, read-only Supabase client for PUBLIC data (published, verified
 * opportunities and the reference lookups). It carries no user session, so Row
 * Level Security always evaluates it as the `anon` role — the exact access a
 * logged-out visitor has. This keeps public pages independent of the request's
 * cookies (so they can be cached) and avoids leaking anything RLS would hide.
 *
 * Use the cookie-based server client (./server) only when the signed-in user
 * matters (dashboards, saved items, account actions).
 */
let cached: SupabaseClient | null = null;

export function publicClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  if (!cached) {
    cached = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
