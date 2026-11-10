import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { updateOpportunity } from "@/app/admin/actions";
import {
  OpportunityForm,
  type OpportunityFormDefaults,
} from "@/components/admin/opportunity-form";
import { ExamEventsEditor } from "@/components/admin/exam-events-editor";
import { PostsEditor } from "@/components/admin/posts-editor";
import { PublishControls } from "@/components/admin/publish-controls";
import { requireAdmin } from "@/lib/auth";
import { getOpportunityForAdmin, type AdminOpportunityRecord } from "@/lib/admin.server";
import { getFilterOptions } from "@/lib/opportunities.server";

export const metadata: Metadata = {
  title: "Edit opportunity",
  description: "Edit an opportunity.",
};

export const instant = false;

function toDefaults(r: AdminOpportunityRecord): OpportunityFormDefaults {
  const s = (v: string | null) => v ?? "";
  return {
    id: r.id,
    opportunity_type: r.type,
    opportunity_status: r.status,
    verification_status: r.verificationStatus,
    category_id: r.categoryId,
    organisation_id: s(r.organisationId),
    state_id: r.stateId ?? "central",
    vacancies: r.vacancies === null ? "" : String(r.vacancies),
    application_start_date: s(r.applicationStartDate),
    application_end_date: s(r.applicationEndDate),
    publication_date: s(r.publicationDate),
    notification_url: s(r.notificationUrl),
    application_url: s(r.applicationUrl),
    source_url: s(r.sourceUrl),
    source_name: s(r.sourceName),
    slug: r.slug,
    title: r.title,
    description: s(r.description),
    qualification: s(r.qualification),
    eligibility: s(r.eligibility),
    age_limit: s(r.ageLimit),
    application_fee: s(r.applicationFee),
    salary: s(r.salary),
    selection_process: s(r.selectionProcess),
    application_instructions: s(r.applicationInstructions),
    required_documents: s(r.requiredDocuments),
    qualificationIds: r.qualificationIds,
  };
}

export default function Page({ params, searchParams }: PageProps<"/admin/opportunities/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Back to admin
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 rounded-xl border border-border bg-muted/30" aria-hidden />}>
        <EditContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EditContent({
  params,
  searchParams,
}: Pick<PageProps<"/admin/opportunities/[id]">, "params" | "searchParams">) {
  await connection();
  await requireAdmin("/admin");

  const { id } = await params;
  const [record, options] = await Promise.all([getOpportunityForAdmin(id), getFilterOptions()]);
  if (!record) notFound();

  const sp = await searchParams;
  const notice =
    typeof sp.published === "string"
      ? "Published — the opportunity is now public."
      : typeof sp.unpublished === "string"
        ? "Unpublished — the opportunity is no longer public."
        : typeof sp.saved === "string"
          ? "Saved."
          : undefined;

  return (
    <div className="mt-3 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {record.title || "Untitled opportunity"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit the record, manage dates, and publish.</p>
      </header>

      {notice ? (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {notice}
        </p>
      ) : null}

      <PublishControls
        opportunityId={record.id}
        isPublished={record.isPublished}
        publicSlug={record.slug}
      />

      <OpportunityForm
        action={updateOpportunity}
        options={options}
        defaults={toDefaults(record)}
        submitLabel="Save changes"
      />

      <PostsEditor opportunityId={record.id} posts={record.posts} />

      <ExamEventsEditor opportunityId={record.id} events={record.events} />
    </div>
  );
}
