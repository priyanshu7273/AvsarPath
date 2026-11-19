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

/**
 * Preview / non-production builds set NEXT_PUBLIC_SITE_NOINDEX=1 so the site is
 * kept out of search engines (disallow-all robots.txt, noindex meta and an
 * X-Robots-Tag header). It is a NEXT_PUBLIC_ value on purpose: Next inlines it at
 * build time, so it can't be lost to runtime env differences on the host.
 * Production builds leave it unset.
 */
export const isNoIndexBuild = process.env.NEXT_PUBLIC_SITE_NOINDEX === "1";
