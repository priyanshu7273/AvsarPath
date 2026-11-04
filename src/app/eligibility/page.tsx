import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";

import { EligibilityFinder } from "@/components/eligibility-finder";
import { EmptyState } from "@/components/empty-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { isSupabaseConfigured } from "@/lib/env";
import {
  PAGE_SIZE,
  opportunitiesHref,
  parseOpportunityFilters,
  type FilterOptions,
  type OpportunityFilters,
  type OpportunitySummary,
} from "@/lib/opportunities";
import { getFilterOptions, getOpportunities } from "@/lib/opportunities.server";

export const metadata: Metadata = {
  title: "Eligibility Finder",
  description:
    "Pick your highest qualification to discover the Indian government jobs, exams, admissions and scholarships you may be eligible for.",
  alternates: { canonical: "/eligibility" },
};

export default function Page({ searchParams }: PageProps<"/eligibility">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Eligibility Finder
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick your highest qualification to see opportunities you may be eligible
          for. This is a guide, not a guarantee — always confirm the full criteria
          (age, category, domicile, subject or stream) on the official notification.
          Age limits are shown on each opportunity for reference and are not used as
          a filter here.
        </p>
      </header>

      <Suspense fallback={<FinderSkeleton />}>
        <Finder searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Finder({ searchParams }: Pick<PageProps<"/eligibility">, "searchParams">) {
  // Request-time: results depend on live data and the chosen qualification.
  await connection();
  const filters = parseOpportunityFilters(await searchParams);
  const current = {
    qualification: filters.qualification,
    state: filters.state,
    category: filters.category,
  };

  if (!isSupabaseConfigured) {
    return (
      <EmptyState message="The Eligibility Finder is being set up. Please check back soon." />
    );
  }

  const options = await getFilterOptions();

  let results: React.ReactNode;
  if (!filters.qualification) {
    results = (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Select your highest qualification above to see opportunities you may be
        eligible for.
      </div>
    );
  } else {
    const { rows, total } = await getOpportunities(filters, options);
    results = <Results filters={filters} options={options} rows={rows} total={total} />;
  }

  return (
    <div className="space-y-6">
      <EligibilityFinder options={options} current={current} />
      {results}
    </div>
  );
}

function Results({
  filters,
  options,
  rows,
  total,
}: {
  filters: OpportunityFilters;
  options: FilterOptions;
  rows: OpportunitySummary[];
  total: number;
}) {
  const qualName =
    options.qualifications.find((q) => q.slug === filters.qualification)?.name ??
    filters.qualification;

  if (rows.length === 0) {
    return (
      <EmptyState message={`No current opportunities are tagged for ${qualName}. Try another qualification, or clear the region and category.`} />
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Opportunities for {qualName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString("en-IN")} {total === 1 ? "match" : "matches"}
        </p>
      </div>

      <p className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        These opportunities list {qualName} among the qualifications that make a
        person eligible. Confirm the complete eligibility on each official
        notification before applying.
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
      </ul>

      {total > PAGE_SIZE ? (
        <Link
          href={opportunitiesHref({
            qualification: filters.qualification,
            state: filters.state,
            category: filters.category,
            sort: "newest",
            page: 1,
          })}
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          See all {total.toLocaleString("en-IN")} in the full listing →
        </Link>
      ) : null}
    </section>
  );
}

function FinderSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-48 rounded-xl border border-border bg-muted/40" />
      <div className="h-24 rounded-xl border border-dashed border-border bg-muted/20" />
    </div>
  );
}
