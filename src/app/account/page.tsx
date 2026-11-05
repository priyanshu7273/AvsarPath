import { Suspense } from "react";
import type { Metadata } from "next";

import { DeleteAccount } from "@/components/delete-account";
import { getProfile, requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/opportunities";

export const metadata: Metadata = {
  title: "Account",
  description: "Your AvsarPath account settings.",
};

const PROVIDER_LABELS: Record<string, string> = { github: "GitHub", google: "Google" };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Account
      </h1>
      <Suspense fallback={<div className="mt-6 h-40 rounded-xl border border-border bg-muted/30" aria-hidden />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const user = await requireUser("/account");
  const profile = await getProfile();
  const provider = (user.app_metadata?.provider as string | undefined) ?? "";

  return (
    <div className="mt-6 space-y-8">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Signed in with" value={PROVIDER_LABELS[provider] ?? "—"} />
          <Row label="Member since" value={formatDate(profile?.createdAt?.slice(0, 10)) ?? "—"} />
        </dl>
      </section>

      <DeleteAccount />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
