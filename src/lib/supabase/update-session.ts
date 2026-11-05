import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Refresh the Supabase auth session on each request and pass the (possibly
 * rotated) cookies through to the response. Called from `proxy.ts`. This does
 * NOT make authorization decisions — protected pages and routes re-check the
 * session themselves (see `@/lib/auth`).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the user to let the client rotate an expired access token. The result
  // is intentionally ignored here; routing stays with the pages themselves.
  await supabase.auth.getUser();

  return response;
}
