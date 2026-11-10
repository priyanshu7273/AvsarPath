"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/admin/actions";
import {
  SOURCE_ACCESS_METHODS,
  SOURCE_ACCESS_METHOD_LABELS,
  SOURCE_STATUSES,
  SOURCE_STATUS_LABELS,
} from "@/lib/ingest";

export type SourceFormDefaults = {
  id?: string;
  source_name: string;
  access_method: string;
  feed_url: string;
  source_url: string;
  source_status: string;
  notes: string;
};

export const BLANK_SOURCE: SourceFormDefaults = {
  source_name: "",
  access_method: "rss",
  feed_url: "",
  source_url: "",
  source_status: "active",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

export function SourceForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: SourceFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="space-y-4">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <label className="block">
        <span className={labelClass}>
          Source name<span className="text-primary"> *</span>
        </span>
        <input name="source_name" type="text" required defaultValue={defaults.source_name} className={inputClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Access method</span>
          <select name="access_method" defaultValue={defaults.access_method} className={inputClass}>
            {SOURCE_ACCESS_METHODS.map((m) => (
              <option key={m} value={m}>
                {SOURCE_ACCESS_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Status</span>
          <select name="source_status" defaultValue={defaults.source_status} className={inputClass}>
            {SOURCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Feed URL (RSS/Atom)</span>
        <input name="feed_url" type="url" defaultValue={defaults.feed_url} placeholder="https://example.gov.in/feed.xml" className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Site URL</span>
        <input name="source_url" type="url" defaultValue={defaults.source_url} placeholder="https://example.gov.in/" className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Notes</span>
        <textarea name="notes" rows={2} defaultValue={defaults.notes} className={`${inputClass} resize-y`} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
