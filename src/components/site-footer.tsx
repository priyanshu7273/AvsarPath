import Link from "next/link";

import { footerLinks, primaryNav, site } from "@/lib/site";

export async function SiteFooter() {
  "use cache";
  // Cached at prerender time so the static footer can be prerendered under
  // Next 16 cacheComponents (a live `new Date()` cannot be prerendered).
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-2">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-foreground">Avsar</span>
              <span className="text-primary">Path</span>
            </span>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {site.description}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Explore</h2>
            <ul className="mt-3 space-y-2">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Information</h2>
            <ul className="mt-3 space-y-2">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {site.independenceNotice}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            © {year} {site.name}. An independent information platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
