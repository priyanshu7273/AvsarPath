import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { dismissItem } from "@/app/admin/sources/actions";
import { requireAdmin } from "@/lib/auth";
import { listReviewItems } from "@/lib/admin.server";
import { formatDate } from "@/lib/opportunities";

export const metadata: Metadata = { title: "Review queue", description: "Review staged items." };
export const instant = false;

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Back to admin
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Review queue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Staged items from ingestion. Importing creates an <strong>unpublished draft</strong> you then verify and
        publish — nothing here is public.
      </p>

      <Suspense fallback={<div className="mt-8 h-64 rounded-xl border border-border bg-muted/30" aria-hidden />}>
        <ReviewContent />
      </Suspense>
    </div>
  );
}

async function ReviewContent() {
  await connection();
  await requireAdmin("/admin/review");
  const items = await listReviewItems();

  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-border bg-card/40 px-4 py-10 text-center text-sm text-muted-foreground">
        Nothing to review. Fetch a source to stage items here.
      </p>
    );
  }

  return (
    <ul className="mt-8 space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">{item.title ?? "(untitled item)"}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.sourceName}
                {item.publishedAt ? ` · ${formatDate(item.publishedAt.slice(0, 10))}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/admin/opportunities/new?from_item=${item.id}`}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Import
              </Link>
              <form action={dismissItem}>
                <input type="hidden" name="item_id" value={item.id} />
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400"
                >
                  Dismiss
                </button>
              </form>
            </div>
          </div>

          {item.summary ? (
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
          ) : null}

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
            >
              View source →
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
