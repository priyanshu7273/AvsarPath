import Link from "next/link";
import { connection } from "next/server";
import type { User } from "@supabase/supabase-js";

import { signOut } from "@/app/auth/actions";
import { getProfile, getSessionUser } from "@/lib/auth";

const itemClass = "rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted";

export async function AccountMenu() {
  await connection();
  const user = await getSessionUser();
  const profile = user ? await getProfile() : null;
  const isAdmin = profile?.role === "admin";

  if (!user) {
    return (
      <Link
        href="/login"
        prefetch={false}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
      >
        Sign in
      </Link>
    );
  }

  return (
    <details className="relative">
      <summary
        className="flex cursor-pointer list-none items-center rounded-full border border-border p-0.5 [&::-webkit-details-marker]:hidden"
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {avatarInitial(user)}
        </span>
      </summary>
      <nav
        className="absolute right-0 mt-2 flex w-52 flex-col rounded-lg border border-border bg-card p-2 shadow-lg"
        aria-label="Account"
      >
        <span className="truncate px-3 py-1 text-xs text-muted-foreground" title={user.email}>
          {user.email}
        </span>
        {/* No prefetch: each background prefetch is a billed server invocation. */}
        <Link href="/dashboard" prefetch={false} className={itemClass}>
          Dashboard
        </Link>
        <Link href="/saved" prefetch={false} className={itemClass}>
          Saved
        </Link>
        <Link href="/account" prefetch={false} className={itemClass}>
          Account
        </Link>
        {isAdmin ? (
          <Link href="/admin" prefetch={false} className={`${itemClass} text-primary`}>
            Admin
          </Link>
        ) : null}
        <form action={signOut}>
          <button type="submit" className={`${itemClass} w-full text-left`}>
            Sign out
          </button>
        </form>
      </nav>
    </details>
  );
}

function avatarInitial(user: User): string {
  const source = (user.email ?? user.user_metadata?.name ?? "U") as string;
  return source.trim().charAt(0).toUpperCase() || "U";
}
