"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CENTRAL_STATE,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
  hasActiveFilters,
  opportunitiesHref,
  type FilterOptions,
  type OpportunityFilters,
} from "@/lib/opportunities";

type Props = {
  options: FilterOptions;
  current: OpportunityFilters;
  total: number;
};

const selectClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

export function OpportunityFilters({ options, current, total }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(current.q ?? "");

  // Navigate with the current filters plus an override. Any change resets to
  // page 1. Empty strings become `undefined` so they drop out of the URL.
  function go(next: Partial<OpportunityFilters>) {
    router.push(opportunitiesHref({ ...current, ...next, page: 1 }));
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

        <div>
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

        <div>
          <label htmlFor="f-status" className={labelClass}>
            Status
          </label>
          <select
            id="f-status"
            className={selectClass}
            value={current.status ?? ""}
            onChange={(e) =>
              go({ status: (e.target.value || undefined) as OpportunityFilters["status"] })
            }
          >
            <option value="">Any</option>
            {OPPORTUNITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No matching opportunities"
            : `${total.toLocaleString("en-IN")} ${total === 1 ? "opportunity" : "opportunities"}`}
          {hasActiveFilters(current) ? (
            <button
              type="button"
              onClick={clearAll}
              className="ml-3 font-medium text-primary hover:underline"
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
            onChange={(e) =>
              router.push(
                opportunitiesHref({
                  ...current,
                  sort: e.target.value === "deadline" ? "deadline" : "newest",
                }),
              )
            }
          >
            <option value="newest">Newest first</option>
            <option value="deadline">Closing soonest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
