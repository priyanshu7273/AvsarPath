import "server-only";

import { adminClient } from "@/lib/supabase/admin";
import type {
  DateStatus,
  ExamEventType,
  OpportunityStatus,
  OpportunityType,
  VerificationStatus,
} from "@/lib/opportunities";

/**
 * Admin data access. Every function here runs through the SERVICE-ROLE client,
 * which bypasses Row Level Security, so callers MUST have passed requireAdmin()
 * first (every admin page and Server Action does). This is the path the schema
 * was designed for: privileged writes and audit-log inserts happen server-side
 * with the service role, and draft (unpublished) rows are only visible here.
 */

export type AdminAuditAction =
  | "create"
  | "update"
  | "publish"
  | "unpublish"
  | "verify"
  | "date_change"
  | "delete";

/** A row in the admin listing (includes unpublished drafts). */
export type AdminOpportunityRow = {
  id: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  verificationStatus: VerificationStatus;
  isPublished: boolean;
  applicationEndDate: string | null;
  updatedAt: string;
};

type RawAdminRow = {
  id: string;
  opportunity_type: OpportunityType;
  opportunity_status: OpportunityStatus;
  verification_status: VerificationStatus;
  is_published: boolean;
  application_end_date: string | null;
  updated_at: string;
  tr: { locale: string; title: string }[];
};

function enTitle(tr: { locale: string; title: string }[]): string {
  return tr?.find((t) => t.locale === "en")?.title ?? "(untitled — no English content)";
}

/** All opportunities, newest-updated first, optionally filtered by title text. */
export async function listOpportunitiesForAdmin(
  search?: string,
): Promise<AdminOpportunityRow[]> {
  const sb = adminClient();

  // Title search is resolved to opportunity ids first (title lives in the
  // translations table), then AND-ed into the main query.
  let matchedIds: string[] | null = null;
  const q = search?.trim();
  if (q) {
    const { data } = await sb
      .from("opportunity_translations")
      .select("opportunity_id")
      .ilike("title", `%${q}%`);
    matchedIds = ((data ?? []) as { opportunity_id: string }[]).map((r) => r.opportunity_id);
    if (matchedIds.length === 0) return [];
  }

  let query = sb
    .from("opportunities")
    .select(
      `id, opportunity_type, opportunity_status, verification_status,
       is_published, application_end_date, updated_at,
       tr:opportunity_translations ( locale, title )`,
    )
    .order("updated_at", { ascending: false });

  if (matchedIds) query = query.in("id", matchedIds);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list opportunities: ${error.message}`);

  return ((data ?? []) as unknown as RawAdminRow[]).map((row) => ({
    id: row.id,
    title: enTitle(row.tr),
    type: row.opportunity_type,
    status: row.opportunity_status,
    verificationStatus: row.verification_status,
    isPublished: row.is_published,
    applicationEndDate: row.application_end_date,
    updatedAt: row.updated_at,
  }));
}

/** Draft/published counts for the dashboard summary. */
export async function getAdminCounts(): Promise<{ published: number; drafts: number }> {
  const sb = adminClient();
  const [pub, draft] = await Promise.all([
    sb.from("opportunities").select("id", { count: "exact", head: true }).eq("is_published", true),
    sb.from("opportunities").select("id", { count: "exact", head: true }).eq("is_published", false),
  ]);
  return { published: pub.count ?? 0, drafts: draft.count ?? 0 };
}

export type AdminExamEvent = {
  id: string;
  eventType: ExamEventType;
  title: string | null;
  eventDate: string | null;
  dateStatus: DateStatus;
};

/** The full record behind the edit form: core fields + English text + events + quals. */
export type AdminOpportunityRecord = {
  id: string;
  organisationId: string | null;
  categoryId: string;
  stateId: string | null;
  type: OpportunityType;
  status: OpportunityStatus;
  verificationStatus: VerificationStatus;
  isPublished: boolean;
  vacancies: number | null;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  publicationDate: string | null;
  notificationUrl: string | null;
  applicationUrl: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  // English translation
  slug: string;
  title: string;
  description: string | null;
  qualification: string | null;
  eligibility: string | null;
  ageLimit: string | null;
  applicationFee: string | null;
  salary: string | null;
  selectionProcess: string | null;
  applicationInstructions: string | null;
  requiredDocuments: string | null;
  // Relations
  qualificationIds: string[];
  events: AdminExamEvent[];
};

const RECORD_SELECT = `
  id, organisation_id, category_id, state_id, opportunity_type, opportunity_status,
  verification_status, is_published, vacancies, application_start_date,
  application_end_date, publication_date, notification_url, application_url,
  source_url, source_name,
  tr:opportunity_translations ( locale, slug, title, description, qualification,
    eligibility, age_limit, application_fee, salary, selection_process,
    application_instructions, required_documents ),
  events:exam_events ( id, event_type, title, event_date, date_status ),
  quals:opportunity_qualifications ( qualification_id )
`;

/** Load one opportunity for editing, or null if it does not exist. */
export async function getOpportunityForAdmin(
  id: string,
): Promise<AdminOpportunityRecord | null> {
  const sb = adminClient();
  const { data, error } = await sb
    .from("opportunities")
    .select(RECORD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load opportunity: ${error.message}`);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const translations = (row.tr ?? []) as Record<string, unknown>[];
  const en = translations.find((t) => t.locale === "en") ?? {};
  const events = (row.events ?? []) as Record<string, unknown>[];
  const quals = (row.quals ?? []) as { qualification_id: string }[];

  return {
    id: row.id as string,
    organisationId: (row.organisation_id as string | null) ?? null,
    categoryId: row.category_id as string,
    stateId: (row.state_id as string | null) ?? null,
    type: row.opportunity_type as OpportunityType,
    status: row.opportunity_status as OpportunityStatus,
    verificationStatus: row.verification_status as VerificationStatus,
    isPublished: row.is_published as boolean,
    vacancies: (row.vacancies as number | null) ?? null,
    applicationStartDate: (row.application_start_date as string | null) ?? null,
    applicationEndDate: (row.application_end_date as string | null) ?? null,
    publicationDate: (row.publication_date as string | null) ?? null,
    notificationUrl: (row.notification_url as string | null) ?? null,
    applicationUrl: (row.application_url as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    sourceName: (row.source_name as string | null) ?? null,
    slug: (en.slug as string) ?? "",
    title: (en.title as string) ?? "",
    description: (en.description as string | null) ?? null,
    qualification: (en.qualification as string | null) ?? null,
    eligibility: (en.eligibility as string | null) ?? null,
    ageLimit: (en.age_limit as string | null) ?? null,
    applicationFee: (en.application_fee as string | null) ?? null,
    salary: (en.salary as string | null) ?? null,
    selectionProcess: (en.selection_process as string | null) ?? null,
    applicationInstructions: (en.application_instructions as string | null) ?? null,
    requiredDocuments: (en.required_documents as string | null) ?? null,
    qualificationIds: quals.map((q) => q.qualification_id),
    events: events.map((e) => ({
      id: e.id as string,
      eventType: e.event_type as ExamEventType,
      title: (e.title as string | null) ?? null,
      eventDate: (e.event_date as string | null) ?? null,
      dateStatus: e.date_status as DateStatus,
    })),
  };
}

/**
 * Append an audit row (service role; audit_logs has no INSERT policy by design).
 * Failures here must never break the actual mutation, so they are swallowed with
 * a server log rather than thrown.
 */
export async function writeAuditLog(entry: {
  adminId: string;
  opportunityId: string | null;
  action: AdminAuditAction;
  oldValues?: unknown;
  newValues?: unknown;
}): Promise<void> {
  try {
    const sb = adminClient();
    await sb.from("audit_logs").insert({
      administrator_id: entry.adminId,
      entity_type: "opportunity",
      opportunity_id: entry.opportunityId,
      action: entry.action,
      old_values: entry.oldValues ?? null,
      new_values: entry.newValues ?? null,
    });
  } catch (err) {
    console.error("audit_log write failed", err);
  }
}
