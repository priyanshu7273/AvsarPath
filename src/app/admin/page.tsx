import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { getAdminCounts, listOpportunitiesForAdmin } from "@/lib/admin.server";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  VERIFICATION_STATUS_LABELS,
  formatDate,
} from "@/lib/opportunities";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage opportunities.",
};

// Reads the session + admin role; render dynamically.
export const instant = false;

export default function Page({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage opportunities. Drafts are visible only here until published.
          </p>
        </div>
        <Link
          href="/admin/opportunities/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + New opportunity
        </Link>
      </div>

      <Suspense fallback={<div className="h-64 rounded-xl border border-border bg-muted/30" aria-hidden />}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminContent({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await connection();
  await requireAdmin("/admin");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const notice = typeof sp.deleted === "string" ? "Opportunity deleted." : undefined;

  const [counts, rows] = await Promise.all([getAdminCounts(), listOpportunitiesForAdmin(q)]);

  return (
    <div className="space-y-6">
      {notice ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">{notice}</p>
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="rounded-lg border border-border bg-card px-4 py-2 text-foreground">
          <strong className="font-semibold">{counts.published}</strong> published
        </span>
        <span className="rounded-lg border border-border bg-card px-4 py-2 text-foreground">
          <strong className="font-semibold">{counts.drafts}</strong> drafts
        </span>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
        >
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-10 text-center text-sm text-muted-foreground">
          {q ? `No opportunities match “${q}”.` : "No opportunities yet. Create your first one."}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/opportunities/${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {TYPE_LABELS[row.type]} · {STATUS_LABELS[row.status]} ·{" "}
                    {VERIFICATION_STATUS_LABELS[row.verificationStatus]}
                    {row.applicationEndDate ? ` · closes ${formatDate(row.applicationEndDate)}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    row.isPublished
                      ? "bg-green-500/15 text-green-700 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {row.isPublished ? "Published" : "Draft"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
