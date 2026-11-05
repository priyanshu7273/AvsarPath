"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Provider = "github" | "google";

/**
 * Begin an OAuth sign-in. Supabase returns the provider's authorize URL (and
 * stores the PKCE verifier in a cookie); we redirect the browser there. The
 * provider sends the user back to /auth/callback to complete the exchange.
 */
export async function signInWithProvider(provider: Provider, next?: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? env.siteUrl;
  const callback = new URL("/auth/callback", origin);
  if (next && next.startsWith("/")) callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.toString() },
  });

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Sign-in failed")}`);
  }
  redirect(data.url);
}
