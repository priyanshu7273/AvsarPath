import { Suspense } from "react";
import Link from "next/link";

import { AccountMenu } from "@/components/account-menu";
import { primaryNav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label={`${site.name} home`}>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Avsar</span>
            <span className="text-primary">Path</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth state reads the session, so it streams in behind Suspense */}
          <Suspense fallback={<div className="h-8 w-16" aria-hidden />}>
            <AccountMenu />
          </Suspense>

          {/* Mobile navigation (CSS-only disclosure, no JS) */}
          <details className="relative md:hidden">
          <summary
            className="flex cursor-pointer list-none items-center rounded-md border border-border p-2 text-foreground [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </summary>
          <nav
            className="absolute right-0 mt-2 flex w-56 flex-col rounded-lg border border-border bg-card p-2 shadow-lg"
            aria-label="Primary mobile"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
