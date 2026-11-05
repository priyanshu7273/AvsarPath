import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. It BYPASSES Row Level Security, so it is used
 * only for trusted server-side operations that a user cannot do under RLS —
 * currently just deleting their own auth user. The key must never be exposed to
 * the client (it is read from a non-public env var) and this module is
 * `server-only`.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
