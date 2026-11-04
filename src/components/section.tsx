import Link from "next/link";
import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  description?: string;
  /** Optional "view all" link shown next to the heading. */
  moreHref?: string;
  moreLabel?: string;
  children: ReactNode;
};

export function Section({
  title,
  description,
  moreHref,
  moreLabel = "View all",
  children,
}: SectionProps) {
  return (
    <section className="py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {moreHref ? (
          <Link
            href={moreHref}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {moreLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
