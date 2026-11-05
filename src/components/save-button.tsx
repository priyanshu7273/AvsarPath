"use client";

import { useState, useTransition } from "react";

import { toggleSave } from "@/app/account/actions";

export function SaveButton({
  opportunityId,
  initialSaved,
}: {
  opportunityId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const nextSaved = !saved;
    setSaved(nextSaved); // optimistic
    startTransition(async () => {
      try {
        await toggleSave(opportunityId);
      } catch {
        setSaved(!nextSaved); // revert on failure
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      className={
        saved
          ? "w-full rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          : "w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
      }
    >
      {saved ? "Saved ✓" : "Save opportunity"}
    </button>
  );
}
