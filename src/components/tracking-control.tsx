"use client";

import { useState, useTransition } from "react";

import { setTracking } from "@/app/account/actions";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/opportunities";

export function TrackingControl({
  opportunityId,
  initialStatus,
}: {
  opportunityId: string;
  initialStatus: ApplicationStatus | null;
}) {
  const [status, setStatus] = useState<ApplicationStatus | "">(initialStatus ?? "");
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const next = value === "" ? null : (value as ApplicationStatus);
    setStatus(value as ApplicationStatus | "");
    startTransition(() => {
      setTracking(opportunityId, next);
    });
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        Track your application
      </span>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary"
      >
        <option value="">Not tracking</option>
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {APPLICATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
