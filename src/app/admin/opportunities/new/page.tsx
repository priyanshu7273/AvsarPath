import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { createOpportunity } from "@/app/admin/actions";
import { BLANK_DEFAULTS, OpportunityForm } from "@/components/admin/opportunity-form";
import { requireAdmin } from "@/lib/auth";
import { getFilterOptions } from "@/lib/opportunities.server";

export const metadata: Metadata = {
  title: "New opportunity",
  description: "Create an opportunity.",
};

export const instant = false;

export default function Page() {
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
          <NewForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewForm() {
  await connection();
  await requireAdmin("/admin/opportunities/new");
  const options = await getFilterOptions();

  return (
    <OpportunityForm
      action={createOpportunity}
      options={options}
      defaults={BLANK_DEFAULTS}
      submitLabel="Create draft"
    />
  );
}
