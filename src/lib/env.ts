/**
 * Centralised, typed access to environment configuration.
 *
 * Supabase values may be empty during early development (before a project
 * exists). Code should check `isSupabaseConfigured` before creating a client
 * so the app degrades gracefully instead of crashing.
 */

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/** True only when both the Supabase URL and anon key are present. */
export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
