import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { createOpportunity } from "@/app/admin/actions";
import {
  BLANK_DEFAULTS,
  OpportunityForm,
  type OpportunityFormDefaults,
} from "@/components/admin/opportunity-form";
import { requireAdmin } from "@/lib/auth";
import { getSourceItem } from "@/lib/admin.server";
import { getFilterOptions } from "@/lib/opportunities.server";
import { slugify } from "@/lib/opportunities";

export const metadata: Metadata = {
  title: "New opportunity",
  description: "Create an opportunity.",
};

export const instant = false;

export default function Page({ searchParams }: PageProps<"/admin/opportunities/new">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Back to admin
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        New opportunity
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Saved as a draft. Add exam dates and publish from the edit page.
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-96 rounded-xl border border-border bg-muted/30" aria-hidden />}>
          <NewForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function NewForm({ searchParams }: Pick<PageProps<"/admin/opportunities/new">, "searchParams">) {
  await connection();
  await requireAdmin("/admin/opportunities/new");
  const options = await getFilterOptions();

  const sp = await searchParams;
  const fromItem = typeof sp.from_item === "string" ? sp.from_item : undefined;

  let defaults: OpportunityFormDefaults = BLANK_DEFAULTS;
  if (fromItem) {
    const item = await getSourceItem(fromItem);
    if (item) {
      // Prefill ONLY these fields from the staged item; the admin fills the rest
      // (type, category, posts, dates…) and verifies before publishing.
      defaults = {
        ...BLANK_DEFAULTS,
        from_item: fromItem,
        title: item.title ?? "",
        slug: item.title ? slugify(item.title) : "",
        source_url: item.url ?? "",
        source_name: item.sourceName,
        description: item.summary ?? "",
        publication_date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
      };
    }
  }

  return (
    <OpportunityForm
      action={createOpportunity}
      options={options}
      defaults={defaults}
      submitLabel="Create draft"
    />
  );
}
