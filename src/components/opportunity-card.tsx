import Link from "next/link";

import {
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  type OpportunitySummary,
} from "@/lib/opportunities";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  upcoming: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function OpportunityCard({ opp }: { opp: OpportunitySummary }) {
  const deadline = formatDate(opp.applicationEndDate);
  const region = opp.state ? opp.state.name : "All India / Central";

  return (
    <li>
      <Link
        href={`/opportunities/${opp.slug}`}
        // The detail route is dynamic and its shell is mostly a skeleton, so
        // prefetching it buys little and costs a server invocation per card.
        prefetch={false}
        className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {TYPE_LABELS[opp.type] ?? opp.type}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              STATUS_STYLES[opp.status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {STATUS_LABELS[opp.status] ?? opp.status}
          </span>
          {opp.category ? (
            <span className="text-xs text-muted-foreground">{opp.category.name}</span>
          ) : null}
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
          {opp.title}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {opp.organisation ? opp.organisation.name : "Recruiting body to be confirmed"}
          <span aria-hidden> · </span>
          {region}
        </p>

        {opp.qualificationText ? (
          <p className="mt-3 text-sm text-foreground">
            <span className="text-muted-foreground">Eligibility: </span>
            {opp.qualificationText}
          </p>
        ) : null}

        {opp.qualifications.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {opp.qualifications.map((q) => (
              <li
                key={q.slug}
                className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {q.name}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {deadline ? (
            <span className="font-medium text-foreground">Last date: {deadline}</span>
          ) : (
            <span>Dates to be announced</span>
          )}
          {typeof opp.vacancies === "number" ? (
            <span>{opp.vacancies.toLocaleString("en-IN")} vacancies</span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
