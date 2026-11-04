import Link from "next/link";

import { PAGE_SIZE, opportunitiesHref, type OpportunityFilters } from "@/lib/opportunities";

const base =
  "rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors";

export function Pagination({
  filters,
  total,
}: {
  filters: OpportunityFilters;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;

  const page = Math.min(filters.page, pages);
  const prev = page > 1 ? opportunitiesHref({ ...filters, page: page - 1 }) : null;
  const next = page < pages ? opportunitiesHref({ ...filters, page: page + 1 }) : null;

  return (
    <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Pagination">
      {prev ? (
        <Link href={prev} className={`${base} text-foreground hover:border-primary/40`}>
          ← Previous
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed text-muted-foreground opacity-60`}>
          ← Previous
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </span>

      {next ? (
        <Link href={next} className={`${base} text-foreground hover:border-primary/40`}>
          Next →
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed text-muted-foreground opacity-60`}>
          Next →
        </span>
      )}
    </nav>
  );
}
