import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";

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

async function OpportunityDetailView({
  params,
}: Pick<PageProps<"/opportunities/[slug]">, "params">) {
  // Request-time: the detail comes from live data keyed by the URL slug.
  await connection();
  const { slug } = await params;
  const opp = await getOpportunityBySlug(slug);

  if (!opp) notFound();

  const region = opp.state ? opp.state.name : "All India / Central";
  const applyHref = usableUrl(opp.applicationUrl);
  const notificationHref = usableUrl(opp.notificationUrl);
  // Application window is shown separately, so drop those from the dated list.
  const keyEvents = opp.events
    .filter((e) => e.eventType !== "application_start" && e.eventType !== "application_end")
    .sort(byEventDate);

  const user = await getSessionUser();
  const [saved, trackingStatus] = user
    ? await Promise.all([isSaved(opp.id), getTrackingStatus(opp.id)])
    : ([false, null] as const);

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={buildStructuredData(opp, env.siteUrl)} />
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/opportunities" className="hover:text-foreground">
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
          {region}
        </p>
      </header>

      <p className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        AvsarPath is an independent platform. This page summarises information for
        convenience — always confirm every detail on the official notification
        before applying.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          <Block title="Overview">
            <Prose value={opp.description} />
          </Block>

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

        <aside className="space-y-4">
          {user ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <SaveButton opportunityId={opp.id} initialSaved={saved} />
              <TrackingControl opportunityId={opp.id} initialStatus={trackingStatus} />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
              <Link
                href={`/login?next=/opportunities/${opp.slug}`}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>{" "}
              to save this opportunity or track your application.
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Key facts</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Field label="Department" value={opp.organisation?.name ?? null} />
              <Field label="Category" value={opp.category?.name ?? null} />
              <Field label="Region" value={region} />
              <Field
                label="Vacancies"
                value={
                  typeof opp.vacancies === "number"
                    ? opp.vacancies.toLocaleString("en-IN")
                    : null
                }
              />
              <Field label="Published" value={formatDate(opp.publicationDate)} />
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
                Official notification (PDF)
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
            {formatDate(opp.lastVerifiedAt?.slice(0, 10)) ? (
              <>Last verified {formatDate(opp.lastVerifiedAt?.slice(0, 10))}.</>
            ) : null}
          </p>
        </aside>
      </div>
    </article>
  );
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
