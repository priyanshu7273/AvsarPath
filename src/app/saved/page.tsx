import { Suspense } from "react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { getSavedOpportunities } from "@/lib/account.server";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Saved",
  description: "Opportunities you've saved on AvsarPath.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Saved opportunities
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Opportunities you&apos;ve kept to apply to or review later.
        </p>
      </header>

      <Suspense fallback={<GridSkeleton />}>
        <SavedList />
      </Suspense>
    </div>
  );
}

async function SavedList() {
  await requireUser("/saved");
  const rows = await getSavedOpportunities();

  if (rows.length === 0) {
    return (
      <EmptyState message="You haven't saved anything yet. Tap “Save opportunity” on any listing to keep it here." />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {rows.map((opp) => (
        <OpportunityCard key={opp.id} opp={opp} />
      ))}
    </ul>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-44 rounded-xl border border-border bg-muted/30" />
      ))}
    </div>
  );
}
