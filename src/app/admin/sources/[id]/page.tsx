import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { fetchSourceNow, updateSource } from "@/app/admin/sources/actions";
import { SourceForm, type SourceFormDefaults } from "@/components/admin/source-form";
import { DeleteSourceButton } from "@/components/admin/delete-source-button";
import { requireAdmin } from "@/lib/auth";
import { getSource } from "@/lib/admin.server";
import { formatDate } from "@/lib/opportunities";

export const metadata: Metadata = { title: "Edit source", description: "Edit a content source." };
export const instant = false;

export default function Page({ params, searchParams }: PageProps<"/admin/sources/[id]">) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/sources" className="text-sm text-primary hover:underline">
        ← Back to sources
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 rounded-xl border border-border bg-muted/30" aria-hidden />}>
        <EditSource params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EditSource({
  params,
  searchParams,
}: Pick<PageProps<"/admin/sources/[id]">, "params" | "searchParams">) {
  await connection();
  await requireAdmin("/admin/sources");

  const { id } = await params;
  const source = await getSource(id);
  if (!source) notFound();

  const sp = await searchParams;
  const notice =
    typeof sp.ran === "string" ? "Fetch complete." : typeof sp.saved === "string" ? "Saved." : undefined;

  const defaults: SourceFormDefaults = {
    id: source.id,
    source_name: source.sourceName,
    access_method: source.accessMethod,
    feed_url: source.feedUrl ?? "",
    source_url: source.sourceUrl ?? "",
    source_status: source.status,
    notes: source.notes ?? "",
  };

  return (
    <div className="mt-3 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{source.sourceName}</h1>
        {source.newItemCount > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {source.newItemCount} new item{source.newItemCount === 1 ? "" : "s"} waiting in{" "}
            <Link href="/admin/review" className="text-primary hover:underline">
              review
            </Link>
            .
          </p>
        ) : null}
      </header>

      {notice ? (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {notice}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <form action={fetchSourceNow}>
          <input type="hidden" name="id" value={source.id} />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Fetch now
          </button>
        </form>
        <span className="text-xs text-muted-foreground">Checks robots.txt, fetches the feed, and stages new items.</span>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Source details</h2>
        <SourceForm action={updateSource} defaults={defaults} submitLabel="Save changes" />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Recent runs</h2>
        {source.recentRuns.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No runs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {source.recentRuns.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-muted-foreground">
                  {formatDate(r.startedAt.slice(0, 10))} · {r.status}
                  {r.error ? ` — ${r.error}` : ""}
                </span>
                <span className="text-foreground">
                  {r.itemsFound} found · {r.itemsNew} new
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeleteSourceButton sourceId={source.id} />
    </div>
  );
}
