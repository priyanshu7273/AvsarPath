"use client";

import { useState } from "react";

export function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not delete your account. Please try again.");
        setPending(false);
        return;
      }
      // Account and session are gone; land on the homepage.
      window.location.href = "/";
    } catch {
      setError("Could not delete your account. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-5">
      <h2 className="text-sm font-semibold text-foreground">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This permanently deletes your account, saved opportunities and tracking. It
        cannot be undone. Type <span className="font-semibold">DELETE</span> to confirm.
      </p>
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        aria-label="Type DELETE to confirm"
        placeholder="DELETE"
        className="mt-3 w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-red-500"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={onDelete}
        disabled={confirm !== "DELETE" || pending}
        className="mt-3 block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </div>
  );
}
