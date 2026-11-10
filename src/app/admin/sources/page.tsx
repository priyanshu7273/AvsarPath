import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { createSource, fetchAllNow, fetchSourceNow } from "@/app/admin/sources/actions";
import { BLANK_SOURCE, SourceForm } from "@/components/admin/source-form";
import { requireAdmin } from "@/lib/auth";
import { listSources } from "@/lib/admin.server";
import { formatDate } from "@/lib/opportunities";
import {
  SOURCE_ACCESS_METHOD_LABELS,
  SOURCE_STATUS_LABELS,
  type SourceAccessMethod,
  type SourceStatus,
} from "@/lib/ingest";

export const metadata: Metadata = { title: "Sources", description: "Content sources for ingestion." };
export const instant = false;

export default function Page({ searchParams }: PageProps<"/admin/sources">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Back to admin
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Content sources</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Register RSS/Atom feeds. Fetching stages items in the review queue — it never publishes.
      </p>

      <Suspense fallback={<div className="mt-8 h-64 rounded-xl border border-border bg-muted/30" aria-hidden />}>
        <SourcesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SourcesContent({ searchParams }: Pick<PageProps<"/admin/sources">, "searchParams">) {
  await connection();
  await requireAdmin("/admin/sources");

  const sp = await searchParams;
  const ran = typeof sp.ran === "string";
  const sources = await listSources();

  return (
    <div className="mt-8 space-y-8">
      {ran ? (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          Fetch complete — check the review queue for new items.
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Sources ({sources.length})</h2>
          {sources.length > 0 ? (
            <form action={fetchAllNow}>
              <button
                type="submit"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
              >
                Fetch all active
              </button>
            </form>
          ) : null}
        </div>

        {sources.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
            No sources yet. Add one below.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {sources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/sources/${s.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                    {s.sourceName}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {SOURCE_ACCESS_METHOD_LABELS[s.accessMethod as SourceAccessMethod]} ·{" "}
                    {SOURCE_STATUS_LABELS[s.status as SourceStatus]}
                    {s.robotsAllowed === false ? " · robots: blocked" : s.robotsAllowed ? " · robots: ok" : ""}
                    {s.lastCheckedAt ? ` · checked ${formatDate(s.lastCheckedAt.slice(0, 10))}` : " · never fetched"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.newItemCount > 0 ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {s.newItemCount} new
                    </span>
                  ) : null}
                  <form action={fetchSourceNow}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
                    >
                      Fetch now
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Add a source</h2>
        <SourceForm action={createSource} defaults={BLANK_SOURCE} submitLabel="Add source" />
      </section>
    </div>
  );
}
