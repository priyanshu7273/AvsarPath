import { Suspense } from "react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { OpportunityFilters } from "@/components/opportunity-filters";
import { Pagination } from "@/components/pagination";
import { isSupabaseConfigured } from "@/lib/env";
import { parseOpportunityFilters } from "@/lib/opportunities";
import { getFilterOptions, getOpportunities } from "@/lib/opportunities.server";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Search and filter verified Indian government jobs, exams, admissions and scholarships by qualification, region, department, type and status.",
};

export default function Page({ searchParams }: PageProps<"/opportunities">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Opportunities
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Search and filter verified central-government and Bihar listings by
          qualification, region, department, type and status. Every listing links
          to its official source — always confirm details there before applying.
        </p>
      </header>

      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/opportunities">, "searchParams">) {
  const filters = parseOpportunityFilters(await searchParams);

  if (!isSupabaseConfigured) {
    return (
      <EmptyState message="Opportunity listings are being set up. Please check back soon." />
    );
  }

  const options = await getFilterOptions();
  const { rows, total } = await getOpportunities(filters, options);

  return (
    <div className="space-y-6">
      <OpportunityFilters options={options} current={filters} total={total} />

      {rows.length === 0 ? (
        <EmptyState message="No opportunities match these filters yet. Try widening or clearing them — new verified listings are added regularly." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </ul>
      )}

      <Pagination filters={filters} total={total} />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-40 rounded-xl border border-border bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl border border-border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
