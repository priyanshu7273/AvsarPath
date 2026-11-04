"use client";

import { useRouter } from "next/navigation";

import {
  CENTRAL_STATE,
  eligibilityHref,
  type FilterOptions,
} from "@/lib/opportunities";

type Current = {
  qualification?: string;
  state?: string;
  category?: string;
};

const selectClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

export function EligibilityFinder({
  options,
  current,
}: {
  options: FilterOptions;
  current: Current;
}) {
  const router = useRouter();

  function go(next: Partial<Current>) {
    router.push(eligibilityHref({ ...current, ...next }));
  }

  const hasSelection = Boolean(current.qualification || current.state || current.category);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          Your highest qualification
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.qualifications.map((qual) => {
            const selected = current.qualification === qual.slug;
            return (
              <button
                key={qual.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => go({ qualification: selected ? undefined : qual.slug })}
                className={
                  selected
                    ? "rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                    : "rounded-full border border-border bg-card px-4 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                }
              >
                {qual.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="elig-region" className={labelClass}>
            Region (optional)
          </label>
          <select
            id="elig-region"
            className={selectClass}
            value={current.state ?? ""}
            onChange={(e) => go({ state: e.target.value || undefined })}
          >
            <option value="">Any region</option>
            <option value={CENTRAL_STATE}>All India / Central</option>
            {options.states.map((state) => (
              <option key={state.slug} value={state.slug}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="elig-category" className={labelClass}>
            Category (optional)
          </label>
          <select
            id="elig-category"
            className={selectClass}
            value={current.category ?? ""}
            onChange={(e) => go({ category: e.target.value || undefined })}
          >
            <option value="">Any category</option>
            {options.categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasSelection ? (
        <button
          type="button"
          onClick={() => router.push("/eligibility")}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
