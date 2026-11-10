"use client";

import { deleteSource } from "@/app/admin/sources/actions";

/** Confirmed delete for a content source (removes its staged items + runs). */
export function DeleteSourceButton({ sourceId }: { sourceId: string }) {
  return (
    <form
      action={deleteSource}
      onSubmit={(e) => {
        if (!window.confirm("Delete this source? Its staged and dismissed items are removed. Imported opportunities are kept.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={sourceId} />
      <button
        type="submit"
        className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
      >
        Delete source
      </button>
    </form>
  );
}
