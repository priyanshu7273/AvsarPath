import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { SignInButtons } from "@/components/sign-in-buttons";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to AvsarPath to save opportunities and track your applications.",
};

export default function Page({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Sign in to AvsarPath
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Save opportunities and track your applications. We use your GitHub or Google
        account — there is no password to create or remember.
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-28" aria-hidden />}>
          <LoginInner searchParams={searchParams} />
        </Suspense>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

async function LoginInner({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (user) redirect(next ?? "/dashboard");
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}
      <SignInButtons next={next} />
    </div>
  );
}
