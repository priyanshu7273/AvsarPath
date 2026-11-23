import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";

import {
  EVENT_TYPE_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  type ExamEvent,
  type OpportunityDetail,
} from "@/lib/opportunities";
import { getOpportunityBySlug } from "@/lib/opportunities.server";
import { getTrackingStatus, isSaved } from "@/lib/account.server";
import { getSessionUser } from "@/lib/auth";
import { JsonLd } from "@/components/json-ld";
import { SaveButton } from "@/components/save-button";
import { TrackingControl } from "@/components/tracking-control";
import { env } from "@/lib/env";

export async function generateMetadata({
  params,
}: PageProps<"/opportunities/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const opp = await getOpportunityBySlug(slug);

  if (!opp) {
    return { title: "Opportunity not found" };
  }

  const description =
    opp.description?.slice(0, 160) ??
    `Eligibility, important dates and the official notification for ${opp.title}.`;

  return {
    title: opp.title,
    description,
    alternates: { canonical: `/opportunities/${opp.slug}` },
    openGraph: {
      title: opp.title,
      description,
      type: "article",
      url: `/opportunities/${opp.slug}`,
    },
  };
}

export default function Page({ params }: PageProps<"/opportunities/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <OpportunityDetailView params={params} />
    </Suspense>
  );
}

/**
 * Uncached page shell. It owns the layout and composes two kinds of boundary as
 * SIBLINGS:
 *  - shared content (header, body, key facts) — each `use cache`, keyed by slug,
 *    tagged for revalidation, and identical for every visitor;
 *  - the per-user Save/Track block — streamed per request, never cached.
 * Nothing per-user is ever passed into a cached scope, so no user's state can be
 * captured in (or served from) a shared cache entry.
 */
async function OpportunityDetailView({
  params,
}: Pick<PageProps<"/opportunities/[slug]">, "params">) {
  const { slug } = await params;
  // Existence check outside any cached scope, so notFound() never runs in `use cache`.
  const opp = await getOpportunityBySlug(slug);
  if (!opp) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <CachedArticleHeader slug={slug} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <CachedArticleBody slug={slug} />

        <aside className="space-y-4">
          <Suspense
            fallback={<div className="h-28 rounded-xl border border-border bg-muted/30" aria-hidden />}
          >
            <UserActions slug={slug} />
          </Suspense>
          <CachedArticleFacts slug={slug} />
        </aside>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Shared (cached) content — no session, no cookies, same for everyone.
// ---------------------------------------------------------------------------

/** Structured data, breadcrumb, title block and the independence notice. */
async function CachedArticleHeader({ slug }: { slug: string }) {
  "use cache";
  cacheLife("hours");
  cacheTag("opportunities", `opportunity:${slug}`);

  const opp = await getOpportunityBySlug(slug);
  if (!opp) return null;

  return (
    <>
      <JsonLd data={buildStructuredData(opp, env.siteUrl)} />
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        {/* No prefetch: detail pages take the result-day traffic, and each
            background prefetch is a billed server invocation on Netlify. */}
        <Link href="/opportunities" prefetch={false} className="hover:text-foreground">
          Opportunities
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{opp.title}</span>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{TYPE_LABELS[opp.type] ?? opp.type}</Badge>
          <Badge>{STATUS_LABELS[opp.status] ?? opp.status}</Badge>
          {opp.category ? <span className="text-sm text-muted-foreground">{opp.category.name}</span> : null}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {opp.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {opp.organisation ? opp.organisation.name : "Recruiting body to be confirmed"}
          <span aria-hidden> · </span>
          {regionLabel(opp)}
        </p>
      </header>

      <p className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        AvsarPath is an independent platform. This page summarises information for
        convenience — always confirm every detail on the official notification
        before applying.
      </p>
    </>
  );
}

/** The main column: overview, posts, eligibility, fees, selection, how to apply, dates. */
async function CachedArticleBody({ slug }: { slug: string }) {
  "use cache";
  cacheLife("hours");
  cacheTag("opportunities", `opportunity:${slug}`);

  const opp = await getOpportunityBySlug(slug);
  if (!opp) return null;

  // Application window is shown separately, so drop those from the dated list.
  const keyEvents = opp.events
    .filter((e) => e.eventType !== "application_start" && e.eventType !== "application_end")
    .sort(byEventDate);

  return (
    <div className="space-y-8">
      <Block title="Overview">
        <Prose value={opp.description} />
      </Block>

      {opp.posts.length > 0 ? (
        <Block title="Posts & vacancies">
          <p className="mb-3 text-sm text-muted-foreground">
            {opp.totalVacancies !== null
              ? `${opp.totalVacancies.toLocaleString("en-IN")} total ${
                  opp.totalVacancies === 1 ? "vacancy" : "vacancies"
                } across ${opp.posts.length} ${opp.posts.length === 1 ? "post" : "posts"}.`
              : `${opp.posts.length} ${opp.posts.length === 1 ? "post" : "posts"}.`}
          </p>
          <ul className="space-y-4">
            {opp.posts.map((p) => (
              <li key={p.id} className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                {p.department ? (
                  <p className="text-xs text-muted-foreground">{p.department}</p>
                ) : null}
                <dl className="mt-3 space-y-2 text-sm">
                  <Field
                    label="Vacancies"
                    value={
                      typeof p.vacancies === "number" ? p.vacancies.toLocaleString("en-IN") : null
                    }
                  />
                  <Field label="Pay level" value={p.payLevel} />
                  <Field label="Eligibility" value={p.eligibility} />
                  <Field label="Age limit" value={p.ageLimit} />
                </dl>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title="Eligibility">
        <dl className="space-y-3 text-sm">
          <Field label="Qualification" value={opp.qualificationText} />
          <Field label="Age" value={opp.ageLimit} />
          <Field label="Other conditions" value={opp.eligibility} />
        </dl>
        {opp.qualifications.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {opp.qualifications.map((q) => (
              <li
                key={q.slug}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {q.name}
              </li>
            ))}
          </ul>
        ) : null}
      </Block>

      <Block title="Fees & pay">
        <dl className="space-y-3 text-sm">
          <Field label="Application fee" value={opp.applicationFee} />
          <Field label="Pay / salary" value={opp.salary} />
        </dl>
      </Block>

      <Block title="Selection process">
        <Prose value={opp.selectionProcess} />
      </Block>

      <Block title="How to apply">
        <dl className="space-y-3 text-sm">
          <Field label="Instructions" value={opp.applicationInstructions} />
          <Field label="Required documents" value={opp.requiredDocuments} />
        </dl>
      </Block>

      <Block title="Important dates">
        <dl className="space-y-3 text-sm">
          <Field label="Application starts" value={formatDate(opp.applicationStartDate)} />
          <Field label="Last date to apply" value={formatDate(opp.applicationEndDate)} />
        </dl>
        {keyEvents.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {keyEvents.map((event, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
                <span className="text-muted-foreground">
                  {event.title || EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                </span>
                <span className="text-foreground">{eventDateLabel(event)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Block>
    </div>
  );
}

/** Sidebar key facts, official links and the source / last-verified note. */
async function CachedArticleFacts({ slug }: { slug: string }) {
  "use cache";
  cacheLife("hours");
  cacheTag("opportunities", `opportunity:${slug}`);

  const opp = await getOpportunityBySlug(slug);
  if (!opp) return null;

  const applyHref = usableUrl(opp.applicationUrl);
  const notificationHref = usableUrl(opp.notificationUrl);
  const verified = formatDate(opp.lastVerifiedAt?.slice(0, 10));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Key facts</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Field label="Department" value={opp.organisation?.name ?? null} />
          <Field label="Category" value={opp.category?.name ?? null} />
          <Field label="Region" value={regionLabel(opp)} />
          <Field
            label="Vacancies"
            value={
              typeof opp.totalVacancies === "number"
                ? opp.totalVacancies.toLocaleString("en-IN")
                : null
            }
          />
          <Field label="Published" value={formatDate(opp.publicationDate)} />
          {/* A missing official link is stated explicitly, like any other gap,
              instead of the button silently disappearing. */}
          {applyHref ? null : <Field label="Apply online" value={null} />}
          {notificationHref ? null : <Field label="Official notification" value={null} />}
        </dl>

        {applyHref ? (
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-4 block rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Apply on official site
          </a>
        ) : null}
        {notificationHref ? (
          <a
            href={notificationHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-2 block rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:border-primary/40"
          >
            Official notification
          </a>
        ) : null}
        {applyHref || notificationHref ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Opens the official website in a new tab.
          </p>
        ) : null}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        {opp.sourceName ? <>Source: {opp.sourceName}. </> : null}
        {verified ? <>Last verified {verified}.</> : null}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-user (dynamic) content — reads the session; streamed, never cached.
// ---------------------------------------------------------------------------

/** Save/Track for a signed-in user, or a sign-in prompt for anonymous visitors. */
async function UserActions({ slug }: { slug: string }) {
  await connection();
  const user = await getSessionUser();
  const opp = await getOpportunityBySlug(slug); // shared cache hit — public data only
  if (!opp) return null;

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <Link
          href={`/login?next=/opportunities/${opp.slug}`}
          prefetch={false}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>{" "}
        to save this opportunity or track your application.
      </div>
    );
  }

  // Per-user reads go through the cookie client (RLS: owner rows only) and are
  // never cached.
  const [saved, trackingStatus] = await Promise.all([
    isSaved(opp.id),
    getTrackingStatus(opp.id),
  ]);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <SaveButton opportunityId={opp.id} initialSaved={saved} />
      <TrackingControl opportunityId={opp.id} initialStatus={trackingStatus} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function regionLabel(opp: OpportunityDetail): string {
  return opp.state ? opp.state.name : "All India / Central";
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Shown for any field whose value is absent, so a gap in the record is explicit
// rather than silently hidden. (The data may still be undergoing verification.)
const NOT_SPECIFIED = "Not specified in the available official notification";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const hasValue = Boolean(value && value.trim());
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-muted-foreground sm:w-40">{label}</dt>
      <dd className={hasValue ? "text-foreground" : "italic text-muted-foreground"}>
        {hasValue ? value : NOT_SPECIFIED}
      </dd>
    </div>
  );
}

/** Free-text block that shows the placeholder (not a blank) when empty. */
function Prose({ value }: { value: string | null | undefined }) {
  if (value && value.trim()) {
    return (
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{value}</p>
    );
  }
  return <p className="text-sm italic text-muted-foreground">{NOT_SPECIFIED}</p>;
}

function usableUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/**
 * schema.org JSON-LD for the page: a BreadcrumbList always, plus a JobPosting
 * only when the opportunity is a job and the fields Google requires are present.
 * We deliberately do NOT mark exams, admissions or scholarships as JobPosting —
 * that would misrepresent non-jobs and violates Google's structured-data rules.
 */
function buildStructuredData(opp: OpportunityDetail, siteUrl: string): object[] {
  const base = siteUrl.replace(/\/$/, "");
  const url = `${base}/opportunities/${opp.slug}`;

  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
        { "@type": "ListItem", position: 2, name: "Opportunities", item: `${base}/opportunities` },
        { "@type": "ListItem", position: 3, name: opp.title, item: url },
      ],
    },
  ];

  const datePosted = opp.publicationDate ?? opp.applicationStartDate;
  if (opp.type === "job" && datePosted && opp.organisation) {
    data.push({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: opp.title,
      description: opp.description ?? opp.title,
      datePosted,
      ...(opp.applicationEndDate ? { validThrough: opp.applicationEndDate } : {}),
      ...(typeof opp.totalVacancies === "number"
        ? { totalJobOpenings: opp.totalVacancies }
        : {}),
      hiringOrganization: {
        "@type": "Organization",
        name: opp.organisation.name,
        ...(opp.organisation.website ? { sameAs: opp.organisation.website } : {}),
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
          ...(opp.state ? { addressRegion: opp.state.name } : {}),
        },
      },
      url,
    });
  }

  return data;
}

function eventDateLabel(event: ExamEvent): string {
  const date = formatDate(event.eventDate);
  if (!date) return event.dateStatus === "official" ? "To be announced" : "Tentative";
  if (event.dateStatus === "official") return date;
  return `${date} (${event.dateStatus})`;
}

function byEventDate(a: ExamEvent, b: ExamEvent): number {
  if (!a.eventDate) return 1;
  if (!b.eventDate) return -1;
  return a.eventDate.localeCompare(b.eventDate);
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8" aria-hidden>
      <div className="h-4 w-40 rounded bg-muted/50" />
      <div className="mt-4 h-8 w-3/4 rounded bg-muted/50" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="h-72 rounded-xl border border-border bg-muted/30" />
        <div className="h-60 rounded-xl border border-border bg-muted/30" />
      </div>
    </div>
  );
}
