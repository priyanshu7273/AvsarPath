import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user, or null. Validates the session against Supabase Auth and
 * is deduped per request with React.cache. Reads cookies(), so every caller
 * must sit behind a <Suspense> boundary (Cache Components).
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Require a signed-in user or redirect to /login (optionally returning to `next`). */
export async function requireUser(next?: string): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  return user;
}

export type Profile = {
  id: string;
  role: string;
  displayName: string | null;
  localePreference: string;
  createdAt: string;
};

/** True when the current user is signed in AND has the admin role. */
export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

/**
 * Require an admin. Signed-out users are sent to /login; signed-in non-admins
 * get a 404 so the admin area never reveals itself. Returns the admin User.
 * Called at the top of every admin page AND re-checked inside every admin
 * Server Action (POST endpoints are reachable directly — never trust the UI).
 */
export async function requireAdmin(next?: string): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  if (!(await isAdmin())) {
    notFound();
  }
  return user;
}

/** The current user's profile row (auto-created by a DB trigger on sign-up). */
export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, display_name, locale_preference, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    role: data.role as string,
    displayName: (data.display_name as string | null) ?? null,
    localePreference: data.locale_preference as string,
    createdAt: data.created_at as string,
  };
}
