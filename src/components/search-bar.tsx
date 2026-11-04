"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/opportunities?q=${encodeURIComponent(q)}` : "/opportunities");
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      <label htmlFor="site-search" className="sr-only">
        Search opportunities
      </label>
      <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs, exams, scholarships…"
          className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </div>
    </form>
  );
}
