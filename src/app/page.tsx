import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";

import { EmptyState } from "@/components/empty-state";
import { NewsletterForm } from "@/components/newsletter-form";
import { OpportunityCard } from "@/components/opportunity-card";
import { SearchBar } from "@/components/search-bar";
import { Section } from "@/components/section";
import { isSupabaseConfigured } from "@/lib/env";
import type { OpportunitySummary } from "@/lib/opportunities";
import {
  getLatestOpportunities,
  getUpcomingDeadlines,
} from "@/lib/opportunities.server";
import { categories, qualifications, regions, site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div>
      {/* Hero — immediately communicates what the site does */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="inline-block rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Independent platform · Official sources · Verified dates
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {site.tagline}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Discover central and state government jobs, exams, admissions and
            scholarships that match your qualification — and track deadlines so
            you never miss an opportunity.
          </p>

          <div className="mt-6 max-w-2xl">
            <SearchBar />
          </div>

          {/* Qualification-based discovery */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">
              Find by your qualification
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {qualifications.map((q) => (
                <Link
                  key={q.slug}
                  href={`/eligibility?qualification=${q.slug}`}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {q.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Popular categories */}
        <Section
          title="Popular categories"
          description="Browse opportunities by recruiting body and type."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/opportunities?category=${c.slug}`}
                className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </Section>

        {/* State-wise opportunities */}
        <Section
          title="By region"
          description="Starting with all-India (central) roles and Bihar."
        >
          <div className="flex flex-wrap gap-3">
            {regions.map((r) => (
              <Link
                key={r.slug}
                href={`/opportunities?state=${r.slug}`}
                className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </Section>

        {/* Latest opportunities */}
        <Section
          title="Latest opportunities"
          description="Newly published, verified listings."
          moreHref="/opportunities"
        >
          <Suspense fallback={<CardsSkeleton />}>
            <LatestOpportunities />
          </Suspense>
        </Section>

        {/* Deadlines approaching */}
        <Section
          title="Application deadlines approaching"
          moreHref="/opportunities?sort=deadline"
        >
          <Suspense fallback={<CardsSkeleton />}>
            <UpcomingDeadlines />
          </Suspense>
        </Section>

        {/* Recently published notifications */}
        <Section title="Recently published notifications" moreHref="/opportunities">
          <EmptyState message="No notifications published yet." />
        </Section>

        {/* Upcoming examinations */}
        <Section title="Upcoming examinations" moreHref="/calendar">
          <EmptyState message="No examinations scheduled yet. The exam calendar will fill in as dates are verified." />
        </Section>

        {/* Latest results */}
        <Section title="Latest results" moreHref="/results">
          <EmptyState message="No results published yet." />
        </Section>

        {/* Latest admit cards */}
        <Section title="Latest admit cards" moreHref="/admit-cards">
          <EmptyState message="No admit cards published yet." />
        </Section>
      </div>

      {/* Newsletter subscription */}
      <section className="mt-8 border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Get deadline reminders
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Be notified about new opportunities and approaching deadlines.
          </p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}

async function LatestOpportunities() {
  if (!isSupabaseConfigured) return <EmptyState />;
  const rows = await getLatestOpportunities(4);
  if (rows.length === 0) return <EmptyState />;
  return <OpportunityGrid rows={rows} />;
}

async function UpcomingDeadlines() {
  if (!isSupabaseConfigured) {
    return (
      <EmptyState message="No approaching deadlines to show yet. Closing dates will appear here once opportunities are published." />
    );
  }
  // Read the clock at request time (deferred via connection) so "today" is
  // resolved per request, not baked into the prerendered shell.
  await connection();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await getUpcomingDeadlines(today, 4);
  if (rows.length === 0) {
    return (
      <EmptyState message="No approaching deadlines right now. New closing dates will appear here as opportunities are published." />
    );
  }
  return <OpportunityGrid rows={rows} />;
}

function OpportunityGrid({ rows }: { rows: OpportunitySummary[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {rows.map((opp) => (
        <OpportunityCard key={opp.id} opp={opp} />
      ))}
    </ul>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-44 rounded-xl border border-border bg-muted/30" />
      ))}
    </div>
  );
}
