"use client";

import {
  deleteOpportunity,
  publishOpportunity,
  unpublishOpportunity,
} from "@/app/admin/actions";

/**
 * Publish / unpublish toggle + a confirmed delete. These call plain Server
 * Actions (which re-verify admin and redirect); the only client behaviour is a
 * confirm() guard before the irreversible delete.
 */
export function PublishControls({
  opportunityId,
  isPublished,
  publicSlug,
}: {
  opportunityId: string;
  isPublished: boolean;
  publicSlug: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Publishing</h2>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPublished
              ? "bg-green-500/15 text-green-700 dark:text-green-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isPublished ? "Published — live" : "Draft — not public"}
        </span>
        {isPublished ? (
          <a href={`/opportunities/${publicSlug}`} className="text-xs font-medium text-primary hover:underline">
            View public page →
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {isPublished ? (
          <form action={unpublishOpportunity}>
            <input type="hidden" name="id" value={opportunityId} />
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
            >
              Unpublish
            </button>
          </form>
        ) : (
          <form action={publishOpportunity}>
            <input type="hidden" name="id" value={opportunityId} />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Publish
            </button>
          </form>
        )}

        <form
          action={deleteOpportunity}
          onSubmit={(e) => {
            if (!window.confirm("Delete this opportunity permanently? This cannot be undone.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={opportunityId} />
          <button
            type="submit"
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            Delete
          </button>
        </form>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Publishing sets the status to Verified and makes the opportunity public. Unpublished drafts are visible only here.
      </p>
    </section>
  );
}
