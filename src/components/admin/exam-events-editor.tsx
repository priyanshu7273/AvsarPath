import { addExamEvent, deleteExamEvent } from "@/app/admin/actions";
import type { AdminExamEvent } from "@/lib/admin.server";
import {
  DATE_STATUSES,
  DATE_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EXAM_EVENT_TYPES,
  formatDate,
} from "@/lib/opportunities";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";

/**
 * Add / list / remove exam-calendar events for an opportunity. Plain Server
 * Action forms (progressive enhancement) — no client JS required.
 */
export function ExamEventsEditor({
  opportunityId,
  events,
}: {
  opportunityId: string;
  events: AdminExamEvent[];
}) {
  return (
    <section id="events" className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Exam calendar events</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Application, exam, admit-card and result dates shown on the Calendar and Results pages.
      </p>

      {events.length > 0 ? (
        <ul className="mt-4 divide-y divide-border">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}
                  {e.title ? <span className="text-muted-foreground"> — {e.title}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.eventDate) ?? "No date"} · {DATE_STATUS_LABELS[e.dateStatus]}
                </p>
              </div>
              <form action={deleteExamEvent}>
                <input type="hidden" name="id" value={opportunityId} />
                <input type="hidden" name="event_id" value={e.id} />
                <button
                  type="submit"
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No events yet.</p>
      )}

      <form action={addExamEvent} className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
        <input type="hidden" name="id" value={opportunityId} />
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Event type</span>
          <select name="event_type" defaultValue="exam" className={inputClass}>
            {EXAM_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Date</span>
          <input name="event_date" type="date" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Label (optional)</span>
          <input name="event_title" type="text" placeholder="e.g. Preliminary examination" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Date status</span>
          <select name="date_status" defaultValue="tentative" className={inputClass}>
            {DATE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DATE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
          >
            Add event
          </button>
        </div>
      </form>
    </section>
  );
}
