"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getOpportunityForAdmin, writeAuditLog } from "@/lib/admin.server";
import {
  DATE_STATUSES,
  EXAM_EVENT_TYPES,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  VERIFICATION_STATUSES,
  type DateStatus,
  type ExamEventType,
} from "@/lib/opportunities";

export type FormState = { error?: string };

const PUBLISHABLE = ["verified", "updated"] as const;

// Re-validate the public surfaces an opportunity change can affect.
function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/opportunities");
  revalidatePath("/eligibility");
  revalidatePath("/calendar");
  revalidatePath("/results");
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

/** Parsed, validated opportunity + English-content fields. */
type ParsedOpportunity = {
  core: Record<string, unknown>;
  translation: Record<string, unknown>;
  slug: string;
  qualificationIds: string[];
};

function parseOpportunity(formData: FormData): ParsedOpportunity | { error: string } {
  const type = str(formData, "opportunity_type");
  if (!type || !(OPPORTUNITY_TYPES as readonly string[]).includes(type)) {
    return { error: "Choose an opportunity type." };
  }

  const status = str(formData, "opportunity_status");
  if (!status || !(OPPORTUNITY_STATUSES as readonly string[]).includes(status)) {
    return { error: "Choose an opportunity status." };
  }

  const verification = str(formData, "verification_status");
  if (!verification || !(VERIFICATION_STATUSES as readonly string[]).includes(verification)) {
    return { error: "Choose a verification status." };
  }

  const categoryId = str(formData, "category_id");
  if (!categoryId) return { error: "Choose a category." };

  const title = str(formData, "title");
  if (!title) return { error: "A title is required." };

  const slug = str(formData, "slug");
  if (!slug) return { error: "A slug is required." };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "The slug may use only lowercase letters, numbers and hyphens." };
  }

  let vacancies: number | null = null;
  const vacanciesRaw = str(formData, "vacancies");
  if (vacanciesRaw !== null) {
    const n = Number.parseInt(vacanciesRaw, 10);
    if (!Number.isFinite(n) || n < 0) return { error: "Vacancies must be a whole number (0 or more)." };
    vacancies = n;
  }

  const startDate = str(formData, "application_start_date");
  const endDate = str(formData, "application_end_date");
  if (startDate && endDate && endDate < startDate) {
    return { error: "The last date to apply cannot be before the start date." };
  }

  const stateRaw = str(formData, "state_id");
  const stateId = stateRaw === "central" ? null : stateRaw;

  const core = {
    opportunity_type: type,
    opportunity_status: status,
    verification_status: verification,
    category_id: categoryId,
    organisation_id: str(formData, "organisation_id"),
    state_id: stateId,
    vacancies,
    application_start_date: startDate,
    application_end_date: endDate,
    publication_date: str(formData, "publication_date"),
    notification_url: str(formData, "notification_url"),
    application_url: str(formData, "application_url"),
    source_url: str(formData, "source_url"),
    source_name: str(formData, "source_name"),
  };

  const translation = {
    locale: "en",
    slug,
    title,
    description: str(formData, "description"),
    qualification: str(formData, "qualification"),
    eligibility: str(formData, "eligibility"),
    age_limit: str(formData, "age_limit"),
    application_fee: str(formData, "application_fee"),
    salary: str(formData, "salary"),
    selection_process: str(formData, "selection_process"),
    application_instructions: str(formData, "application_instructions"),
    required_documents: str(formData, "required_documents"),
  };

  const qualificationIds = formData
    .getAll("qualifications")
    .filter((v): v is string => typeof v === "string" && v !== "");

  return { core, translation, slug, qualificationIds };
}

/** Is `slug` already used by a different opportunity's English translation? */
async function slugTaken(slug: string, exceptOpportunityId?: string): Promise<boolean> {
  const sb = adminClient();
  let query = sb
    .from("opportunity_translations")
    .select("opportunity_id")
    .eq("locale", "en")
    .eq("slug", slug);
  if (exceptOpportunityId) query = query.neq("opportunity_id", exceptOpportunityId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function setQualifications(opportunityId: string, qualificationIds: string[]) {
  const sb = adminClient();
  await sb.from("opportunity_qualifications").delete().eq("opportunity_id", opportunityId);
  if (qualificationIds.length > 0) {
    await sb.from("opportunity_qualifications").insert(
      qualificationIds.map((qid) => ({ opportunity_id: opportunityId, qualification_id: qid })),
    );
  }
}

export async function createOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("/admin");

  const parsed = parseOpportunity(formData);
  if ("error" in parsed) return parsed;

  if (await slugTaken(parsed.slug)) {
    return { error: `The slug “${parsed.slug}” is already in use. Choose another.` };
  }

  const sb = adminClient();
  const { data: opp, error: oppErr } = await sb
    .from("opportunities")
    .insert({ ...parsed.core, is_published: false, created_by: admin.id })
    .select("id")
    .single();

  if (oppErr || !opp) {
    return { error: `Could not create the opportunity: ${oppErr?.message ?? "unknown error"}` };
  }

  const id = opp.id as string;

  const { error: trErr } = await sb
    .from("opportunity_translations")
    .insert({ ...parsed.translation, opportunity_id: id });

  if (trErr) {
    // Roll back the parent so we don't leave an orphan with no English content.
    await sb.from("opportunities").delete().eq("id", id);
    return { error: `Could not save the content: ${trErr.message}` };
  }

  await setQualifications(id, parsed.qualificationIds);
  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "create", newValues: parsed.core });

  revalidatePath("/admin");
  redirect(`/admin/opportunities/${id}?saved=1`);
}

export async function updateOpportunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("/admin");

  const id = str(formData, "id");
  if (!id) return { error: "Missing opportunity id." };

  const existing = await getOpportunityForAdmin(id);
  if (!existing) return { error: "That opportunity no longer exists." };

  const parsed = parseOpportunity(formData);
  if ("error" in parsed) return parsed;

  // Can't leave a published row in a non-publishable verification state.
  const verification = parsed.core.verification_status as string;
  if (existing.isPublished && !(PUBLISHABLE as readonly string[]).includes(verification)) {
    return {
      error:
        "This opportunity is published. Unpublish it before setting a verification status other than Verified or Updated.",
    };
  }

  if (await slugTaken(parsed.slug, id)) {
    return { error: `The slug “${parsed.slug}” is already in use. Choose another.` };
  }

  const sb = adminClient();
  const { error: oppErr } = await sb.from("opportunities").update(parsed.core).eq("id", id);
  if (oppErr) return { error: `Could not save: ${oppErr.message}` };

  const { error: trErr } = await sb
    .from("opportunity_translations")
    .upsert({ ...parsed.translation, opportunity_id: id }, { onConflict: "opportunity_id,locale" });
  if (trErr) return { error: `Could not save the content: ${trErr.message}` };

  await setQualifications(id, parsed.qualificationIds);
  await writeAuditLog({
    adminId: admin.id,
    opportunityId: id,
    action: "update",
    oldValues: { title: existing.title, verificationStatus: existing.verificationStatus },
    newValues: parsed.core,
  });

  revalidatePath("/admin");
  revalidatePublic();
  redirect(`/admin/opportunities/${id}?saved=1`);
}

export async function publishOpportunity(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  if (!id) return;

  const existing = await getOpportunityForAdmin(id);
  if (!existing) return;

  const sb = adminClient();
  // Publishing requires a publishable verification status (DB constraint), so
  // promote pending/needs_review to "verified" as part of the publish.
  const verification = (PUBLISHABLE as readonly string[]).includes(existing.verificationStatus)
    ? existing.verificationStatus
    : "verified";

  await sb
    .from("opportunities")
    .update({
      is_published: true,
      verification_status: verification,
      published_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "publish" });

  revalidatePath("/admin");
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePublic();
  redirect(`/admin/opportunities/${id}?published=1`);
}

export async function unpublishOpportunity(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  if (!id) return;

  const sb = adminClient();
  await sb.from("opportunities").update({ is_published: false }).eq("id", id);
  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "unpublish" });

  revalidatePath("/admin");
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePublic();
  redirect(`/admin/opportunities/${id}?unpublished=1`);
}

export async function deleteOpportunity(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  if (!id) return;

  const existing = await getOpportunityForAdmin(id);

  // Write the audit row BEFORE deleting (the FK is "on delete set null", so the
  // row survives with opportunity_id nulled), keeping a snapshot of what went.
  await writeAuditLog({
    adminId: admin.id,
    opportunityId: id,
    action: "delete",
    oldValues: existing ? { id, title: existing.title } : { id },
  });

  const sb = adminClient();
  await sb.from("opportunities").delete().eq("id", id); // cascades translations/events/quals

  revalidatePath("/admin");
  revalidatePublic();
  redirect("/admin?deleted=1");
}

export async function addExamEvent(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  if (!id) return;

  const eventType = str(formData, "event_type");
  if (!eventType || !(EXAM_EVENT_TYPES as readonly string[]).includes(eventType)) return;

  const dateStatusRaw = str(formData, "date_status") ?? "tentative";
  const dateStatus: DateStatus = (DATE_STATUSES as readonly string[]).includes(dateStatusRaw)
    ? (dateStatusRaw as DateStatus)
    : "tentative";

  const sb = adminClient();
  await sb.from("exam_events").insert({
    opportunity_id: id,
    event_type: eventType as ExamEventType,
    title: str(formData, "event_title"),
    event_date: str(formData, "event_date"),
    date_status: dateStatus,
  });

  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "date_change" });

  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePublic();
  redirect(`/admin/opportunities/${id}#events`);
}

export async function deleteExamEvent(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  const eventId = str(formData, "event_id");
  if (!id || !eventId) return;

  const sb = adminClient();
  await sb.from("exam_events").delete().eq("id", eventId).eq("opportunity_id", id);
  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "date_change" });

  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePublic();
  redirect(`/admin/opportunities/${id}#events`);
}

export async function addPost(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  if (!id) return;

  const name = str(formData, "post_name");
  if (!name) return; // name is required

  let vacancies: number | null = null;
  const vacanciesRaw = str(formData, "post_vacancies");
  if (vacanciesRaw !== null) {
    const n = Number.parseInt(vacanciesRaw, 10);
    if (Number.isFinite(n) && n >= 0) vacancies = n;
  }

  const sb = adminClient();
  // Append after the current last post.
  const { data: last } = await sb
    .from("opportunity_posts")
    .select("sort_order")
    .eq("opportunity_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  await sb.from("opportunity_posts").insert({
    opportunity_id: id,
    name,
    department: str(formData, "post_department"),
    vacancies,
    pay_level: str(formData, "post_pay_level"),
    eligibility: str(formData, "post_eligibility"),
    age_limit: str(formData, "post_age_limit"),
    sort_order: sortOrder,
  });

  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "update" });

  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePublic();
  redirect(`/admin/opportunities/${id}#posts`);
}

export async function deletePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const id = str(formData, "id");
  const postId = str(formData, "post_id");
  if (!id || !postId) return;

  const sb = adminClient();
  await sb.from("opportunity_posts").delete().eq("id", postId).eq("opportunity_id", id);
  await writeAuditLog({ adminId: admin.id, opportunityId: id, action: "update" });

  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePublic();
  redirect(`/admin/opportunities/${id}#posts`);
}
