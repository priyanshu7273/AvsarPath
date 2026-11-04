import { createBrowserClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Browser-side Supabase client, for use in Client Components.
 * Uses the public anon key (safe to expose). Respects Row Level Security.
 *
 * Throws a clear error if called before Supabase is configured — callers in
 * early phases should guard with `isSupabaseConfigured` first.
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
