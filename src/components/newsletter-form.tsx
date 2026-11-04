"use client";

import { useState } from "react";

/**
 * Newsletter sign-up. Phase 1 is a non-submitting placeholder — we do NOT
 * store or send anything yet, and we never show a fake "subscribed!" success.
 * Real storage + opt-in confirmation arrive in a later phase.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNote(
      "Thanks for your interest — newsletter sign-ups aren't active yet. This form will go live in a later phase.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Notify me
        </button>
      </div>
      {note ? (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {note}
        </p>
      ) : null}
    </form>
  );
}
