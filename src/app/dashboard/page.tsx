import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { getSavedOpportunities, getTrackedOpportunities } from "@/lib/account.server";
import { getProfile, requireUser } from "@/lib/auth";
import { APPLICATION_STATUS_LABELS } from "@/lib/opportunities";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your saved opportunities and application tracking.",
};

// This route always reads the session, so there is no useful static shell to
// prerender; render it dynamically (opts out of instant-navigation validation).
export const instant = false;

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await connection();
  const user = await requireUser("/dashboard");
  const [profile, saved, tracked] = await Promise.all([
    getProfile(),
    getSavedOpportunities(),
    getTrackedOpportunities(),
  ]);
  const name = profile?.displayName ?? user.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome, {name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your saved opportunities and the applications you&apos;re tracking.
        </p>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Saved ({saved.length})
          </h2>
          {saved.length > 0 ? (
            <Link href="/saved" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          ) : null}
        </div>
        {saved.length === 0 ? (
          <EmptyState message="Nothing saved yet. Browse opportunities and tap “Save”." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {saved.slice(0, 4).map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Tracking ({tracked.length})
        </h2>
        {tracked.length === 0 ? (
          <EmptyState message="You're not tracking any applications yet. Set a status on an opportunity to track it here." />
        ) : (
          <ul className="space-y-2">
            {tracked.map((t) => (
              <li
                key={t.opportunity.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <Link
                  href={`/opportunities/${t.opportunity.slug}`}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {t.opportunity.title}
                </Link>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {APPLICATION_STATUS_LABELS[t.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-10 w-64 rounded bg-muted/50" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl border border-border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
