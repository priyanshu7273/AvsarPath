"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import {
  CENTRAL_STATE,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  STATUS_FILTER_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  defaultStatus,
  hasActiveFilters,
  opportunitiesHref,
  type FilterOptions,
  type OpportunityFilters,
  type OpportunitySort,
  type StatusFilter,
} from "@/lib/opportunities";

type Props = {
  options: FilterOptions;
  current: OpportunityFilters;
  total: number;
  /** Closed/expired/cancelled matches hidden by the "open & upcoming" filter. */
  hiddenClosed: number;
};

const selectClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

/**
 * Search box + filters for /opportunities. Everything shown here comes from the
 * URL (`current`): the parent keys this component by the URL's filters, so a
 * different URL always starts from that URL's values. The only local state is
 * the search box's unsubmitted text, which is dropped when the page is left
 * (Next keeps visited pages alive and would otherwise show it again).
 */
export function OpportunityFilters({ options, current, total, hiddenClosed }: Props) {
  const router = useRouter();
  const urlQ = current.q ?? "";
  const [q, setQ] = useState(urlQ);

  // Runs when Next hides this page on navigation: back to the URL's search.
  useLayoutEffect(() => () => setQ(urlQ), [urlQ]);

  // Navigate with the current filters plus an override. Any change resets to
  // page 1 and also applies whatever is typed in the search box. Empty strings
  // become `undefined` so they drop out of the URL.
  function go(next: Partial<OpportunityFilters>) {
    const nextQ = "q" in next ? next.q : q.trim() || undefined;
    // A new search term gets the default order (best match) unless the user
    // picked "closing soonest" or is choosing a sort right now.
    const sort =
      next.sort ??
      (nextQ !== current.q && current.sort !== "deadline" ? undefined : current.sort);
    // Likewise the status: if it was just the default for the old search
    // (browse: open & upcoming; search: all), let the new term's default apply.
    const status =
      "status" in next
        ? next.status
        : nextQ !== current.q && current.status === defaultStatus(current.q)
          ? undefined
          : current.status;
    router.push(opportunitiesHref({ ...current, ...next, q: nextQ, sort, status, page: 1 }));
  }

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    go({ q: q.trim() || undefined });
  }

  function clearAll() {
    setQ("");
    router.push("/opportunities");
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <form onSubmit={onSearch} role="search">
        <label htmlFor="opp-search" className="sr-only">
          Search opportunities
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5">
          <input
            id="opp-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by title, keyword or qualification…"
            className="w-full bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </div>
      </form>

      {/* On wide screens the last column (Status) is a little wider so
          "Open & upcoming" fits even at 1024px. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1.25fr)]">
        <div>
          <label htmlFor="f-qual" className={labelClass}>
            Qualification
          </label>
          <select
            id="f-qual"
            className={selectClass}
            value={current.qualification ?? ""}
            onChange={(e) => go({ qualification: e.target.value || undefined })}
          >
            <option value="">Any</option>
            {options.qualifications.map((qual) => (
              <option key={qual.slug} value={qual.slug}>
                {qual.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-cat" className={labelClass}>
            Category
          </label>
          <select
            id="f-cat"
            className={selectClass}
            value={current.category ?? ""}
            onChange={(e) => go({ category: e.target.value || undefined })}
          >
            <option value="">Any</option>
            {options.categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-state" className={labelClass}>
            Region
          </label>
          <select
            id="f-state"
            className={selectClass}
            value={current.state ?? ""}
            onChange={(e) => go({ state: e.target.value || undefined })}
          >
            <option value="">Any</option>
            <option value={CENTRAL_STATE}>All India / Central</option>
            {options.states.map((state) => (
              <option key={state.slug} value={state.slug}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-dept" className={labelClass}>
            Department
          </label>
          <select
            id="f-dept"
            className={selectClass}
            value={current.department ?? ""}
            onChange={(e) => go({ department: e.target.value || undefined })}
          >
            <option value="">Any</option>
            {options.organisations.map((org) => (
              <option key={org.slug} value={org.slug}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type and Status take a full row on phones so "Open & upcoming" isn't
            clipped. */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="f-type" className={labelClass}>
            Type
          </label>
          <select
            id="f-type"
            className={selectClass}
            value={current.type ?? ""}
            onChange={(e) => go({ type: (e.target.value || undefined) as OpportunityFilters["type"] })}
          >
            <option value="">Any</option>
            {OPPORTUNITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="f-status" className={labelClass}>
            Status
          </label>
          <select
            id="f-status"
            className={selectClass}
            value={current.status ?? defaultStatus(current.q)}
            onChange={(e) => go({ status: e.target.value as StatusFilter })}
          >
            <option value="active">{STATUS_FILTER_LABELS.active}</option>
            <option value="all">{STATUS_FILTER_LABELS.all}</option>
            <optgroup label="Only">
              {OPPORTUNITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {total === 0
              ? "No matching opportunities"
              : `${total.toLocaleString("en-IN")} ${total === 1 ? "opportunity" : "opportunities"}`}
          </span>
          {/* Say what the default "open & upcoming" filter hides, so nothing
              looks missing. */}
          {current.status === "active" && hiddenClosed > 0 ? (
            <span>
              {hiddenClosed.toLocaleString("en-IN")} closed{" "}
              {hiddenClosed === 1 ? "listing" : "listings"} hidden —{" "}
              <button
                type="button"
                onClick={() => go({ status: "all" })}
                className="font-medium text-primary hover:underline"
              >
                show
              </button>
            </span>
          ) : null}
          {hasActiveFilters(current) ? (
            <button
              type="button"
              onClick={clearAll}
              className="font-medium text-primary hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="f-sort" className="text-xs font-medium text-muted-foreground">
            Sort
          </label>
          <select
            id="f-sort"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-primary"
            value={current.sort}
            onChange={(e) => go({ sort: e.target.value as OpportunitySort })}
          >
            {current.q ? <option value="relevance">Best match</option> : null}
            <option value="newest">Newest first</option>
            <option value="deadline">Closing soonest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
