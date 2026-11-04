import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Server-side Supabase client, for Server Components, Route Handlers and
 * Server Actions. Reads/writes the auth session via cookies. Respects Row
 * Level Security (uses the anon key, not the service-role key).
 *
 * Note: reading cookies opts a route out of static rendering.
 */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies cannot be written.
          // Safe to ignore when middleware refreshes the session instead.
        }
      },
    },
  });
}
