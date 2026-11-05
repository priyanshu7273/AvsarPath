import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";
import {
  CENTRAL_STATE,
  PAGE_SIZE,
  emptyFilterOptions,
  type FilterOptions,
  type LookupOption,
  type OpportunityDetail,
  type OpportunityFilters,
  type OpportunitySummary,
  type QualificationOption,
  type StateOption,
} from "@/lib/opportunities";

/**
 * Fail a query with context. When the framework aborts a render (e.g. while
 * prefetching or prerendering a dynamic route), the in-flight request surfaces
 * here as an abort; re-throw it as a real AbortError so Next treats it as its
 * own control-flow signal rather than a page-level error. Everything else is a
 * genuine failure, surfaced with context.
 */
function throwQueryError(context: string, error: { message?: string } | null): never {
  const message = error?.message ?? "unknown error";
  if (/abort/i.test(message)) throw new DOMException(message, "AbortError");
  throw new Error(`${context}: ${message}`);
}

// Columns selected for a listing row. Each row is an opportunity with its
// required English translation (inner join) plus the relations we display.
// Visibility (published + verified) is enforced by RLS for the anon key, so we
// don't repeat those predicates here.
const LIST_SELECT = `
  id,
  opportunity_type,
  opportunity_status,
  vacancies,
  application_end_date,
  published_at,
  organisation:organisations ( name, slug ),
  category:categories ( name, slug ),
  state:states ( name, code, slug ),
  tr:opportunity_translations!inner ( slug, title, qualification, age_limit ),
  quals:opportunity_qualifications ( qualification:qualifications ( slug, name, rank ) )
`;

const DETAIL_SELECT = `
  slug,
  title,
  description,
  qualification,
  eligibility,
  age_limit,
  application_fee,
  salary,
  selection_process,
  application_instructions,
  required_documents,
  opportunity:opportunities!inner (
    id,
    opportunity_type,
    opportunity_status,
    vacancies,
    application_start_date,
    application_end_date,
    publication_date,
    notification_url,
    application_url,
    source_url,
    source_name,
    last_verified_at,
    published_at,
    organisation:organisations ( name, slug, website ),
    category:categories ( name, slug ),
    state:states ( name, code, slug ),
    quals:opportunity_qualifications ( qualification:qualifications ( slug, name, rank ) ),
    events:exam_events ( event_type, title, event_date, date_status )
  )
`;

type Rel = { name: string; slug: string } | null;
type QualRel = { qualification: { slug: string; name: string; rank: number } | null };

type RawListRow = {
  id: string;
  opportunity_type: OpportunitySummary["type"];
  opportunity_status: OpportunitySummary["status"];
  vacancies: number | null;
  application_end_date: string | null;
  published_at: string | null;
  organisation: Rel;
  category: Rel;
  state: { name: string; slug: string; code: string } | null;
  tr: { slug: string; title: string; qualification: string | null; age_limit: string | null }[];
  quals: QualRel[];
};

function sortedQualifications(
  quals: QualRel[],
): { slug: string; name: string; rank: number }[] {
  return quals
    .map((q) => q.qualification)
    .filter((q): q is { slug: string; name: string; rank: number } => q !== null)
    .sort((a, b) => a.rank - b.rank);
}

function mapSummary(row: RawListRow): OpportunitySummary {
  const tr = row.tr?.[0];
  return {
    id: row.id,
    slug: tr?.slug ?? "",
    title: tr?.title ?? "Untitled opportunity",
    type: row.opportunity_type,
    status: row.opportunity_status,
    qualificationText: tr?.qualification ?? null,
    ageLimit: tr?.age_limit ?? null,
    vacancies: row.vacancies,
    applicationEndDate: row.application_end_date,
    organisation: row.organisation,
    category: row.category,
    state: row.state,
    qualifications: sortedQualifications(row.quals ?? []),
  };
}

/** Reference lists that populate the filter controls. Deduped per request. */
export const getFilterOptions = cache(async (): Promise<FilterOptions> => {
  if (!isSupabaseConfigured) return emptyFilterOptions;

  const sb = publicClient();
  const [categories, states, qualifications, organisations] = await Promise.all([
    sb.from("categories").select("id, slug, name").order("sort_order"),
    sb.from("states").select("id, slug, name, code").order("name"),
    sb.from("qualifications").select("id, slug, name, rank").order("sort_order"),
    sb.from("organisations").select("id, slug, name").order("name"),
  ]);

  return {
    categories: (categories.data ?? []) as LookupOption[],
    states: (states.data ?? []) as StateOption[],
    qualifications: (qualifications.data ?? []) as QualificationOption[],
    organisations: (organisations.data ?? []) as LookupOption[],
  };
});

export type OpportunityListResult = {
  rows: OpportunitySummary[];
  total: number;
  configured: boolean;
};

const EMPTY_RESULT = (configured: boolean): OpportunityListResult => ({
  rows: [],
  total: 0,
  configured,
});

/**
 * Fetch a page of opportunities for the public listing. The many-to-many
 * qualification filter and full-text search are resolved to opportunity ids
 * first, then AND-ed into the main query by id. `options` provides slug -> id
 * lookups so we don't re-query reference tables here.
 */
export async function getOpportunities(
  filters: OpportunityFilters,
  options: FilterOptions,
): Promise<OpportunityListResult> {
  if (!isSupabaseConfigured) return EMPTY_RESULT(false);

  const sb = publicClient();

  // Resolve slug-based filters to ids; an unknown slug means "no matches".
  const categoryId = filters.category
    ? options.categories.find((c) => c.slug === filters.category)?.id
    : undefined;
  if (filters.category && !categoryId) return EMPTY_RESULT(true);

  const organisationId = filters.department
    ? options.organisations.find((o) => o.slug === filters.department)?.id
    : undefined;
  if (filters.department && !organisationId) return EMPTY_RESULT(true);

  let stateId: string | undefined;
  if (filters.state && filters.state !== CENTRAL_STATE) {
    stateId = options.states.find((s) => s.slug === filters.state)?.id;
    if (!stateId) return EMPTY_RESULT(true);
  }

  // Id-based constraints (search + qualification). Each is AND-ed in.
  const idConstraints: string[][] = [];

  if (filters.q) {
    const { data } = await sb
      .from("opportunity_translations")
      .select("opportunity_id")
      .eq("locale", "en")
      .textSearch("search_tsv", filters.q, { type: "plain", config: "simple" });
    idConstraints.push(((data ?? []) as { opportunity_id: string }[]).map((r) => r.opportunity_id));
  }

  if (filters.qualification) {
    const { data } = await sb
      .from("opportunity_qualifications")
      .select("opportunity_id, qualifications!inner ( slug )")
      .eq("qualifications.slug", filters.qualification);
    idConstraints.push(((data ?? []) as { opportunity_id: string }[]).map((r) => r.opportunity_id));
  }

  if (idConstraints.some((ids) => ids.length === 0)) return EMPTY_RESULT(true);

  let query = sb
    .from("opportunities")
    .select(LIST_SELECT, { count: "exact" })
    .eq("tr.locale", "en");

  if (categoryId) query = query.eq("category_id", categoryId);
  if (organisationId) query = query.eq("organisation_id", organisationId);
  if (filters.state === CENTRAL_STATE) query = query.is("state_id", null);
  else if (stateId) query = query.eq("state_id", stateId);
  if (filters.type) query = query.eq("opportunity_type", filters.type);
  if (filters.status) query = query.eq("opportunity_status", filters.status);
  for (const ids of idConstraints) query = query.in("id", ids);

  if (filters.sort === "deadline") {
    query = query.order("application_end_date", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  const from = (filters.page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) throwQueryError("Failed to load opportunities", error);

  const rows = ((data ?? []) as unknown as RawListRow[]).map(mapSummary);
  return { rows, total: count ?? rows.length, configured: true };
}

/** The most recently published opportunities, for the homepage. */
export async function getLatestOpportunities(limit = 4): Promise<OpportunitySummary[]> {
  if (!isSupabaseConfigured) return [];

  const sb = publicClient();
  const { data, error } = await sb
    .from("opportunities")
    .select(LIST_SELECT)
    .eq("tr.locale", "en")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throwQueryError("Failed to load latest opportunities", error);
  return ((data ?? []) as unknown as RawListRow[]).map(mapSummary);
}

/**
 * Opportunities whose application deadline is on or after `today`, soonest
 * first. `today` is passed in (as yyyy-mm-dd) so the caller controls the
 * request-time clock read. A `.gte` on a date column also drops NULL deadlines.
 */
export async function getUpcomingDeadlines(
  today: string,
  limit = 4,
): Promise<OpportunitySummary[]> {
  if (!isSupabaseConfigured) return [];

  const sb = publicClient();
  const { data, error } = await sb
    .from("opportunities")
    .select(LIST_SELECT)
    .eq("tr.locale", "en")
    .gte("application_end_date", today)
    .order("application_end_date", { ascending: true })
    .limit(limit);

  if (error) throwQueryError("Failed to load upcoming deadlines", error);
  return ((data ?? []) as unknown as RawListRow[]).map(mapSummary);
}

/** Public opportunity summaries for a set of ids (order not preserved). */
export async function getOpportunitiesByIds(ids: string[]): Promise<OpportunitySummary[]> {
  if (!isSupabaseConfigured || ids.length === 0) return [];

  const sb = publicClient();
  const { data, error } = await sb
    .from("opportunities")
    .select(LIST_SELECT)
    .eq("tr.locale", "en")
    .in("id", ids);

  if (error) throwQueryError("Failed to load opportunities", error);
  return ((data ?? []) as unknown as RawListRow[]).map(mapSummary);
}

type RawDetailRow = {
  slug: string;
  title: string;
  description: string | null;
  qualification: string | null;
  eligibility: string | null;
  age_limit: string | null;
  application_fee: string | null;
  salary: string | null;
  selection_process: string | null;
  application_instructions: string | null;
  required_documents: string | null;
  opportunity: {
    id: string;
    opportunity_type: OpportunityDetail["type"];
    opportunity_status: OpportunityDetail["status"];
    vacancies: number | null;
    application_start_date: string | null;
    application_end_date: string | null;
    publication_date: string | null;
    notification_url: string | null;
    application_url: string | null;
    source_url: string | null;
    source_name: string | null;
    last_verified_at: string | null;
    published_at: string | null;
    organisation: { name: string; slug: string; website: string | null } | null;
    category: Rel;
    state: { name: string; slug: string; code: string } | null;
    quals: QualRel[];
    events: {
      event_type: string;
      title: string | null;
      event_date: string | null;
      date_status: string;
    }[];
  };
};

/** Fetch a single opportunity by its English slug (or null if not public). */
export const getOpportunityBySlug = cache(
  async (slug: string): Promise<OpportunityDetail | null> => {
    if (!isSupabaseConfigured) return null;

    const sb = publicClient();
    const { data, error } = await sb
      .from("opportunity_translations")
      .select(DETAIL_SELECT)
      .eq("locale", "en")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throwQueryError("Failed to load opportunity", error);
    if (!data) return null;

    const row = data as unknown as RawDetailRow;
    const o = row.opportunity;

    return {
      id: o.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      type: o.opportunity_type,
      status: o.opportunity_status,
      qualificationText: row.qualification,
      eligibility: row.eligibility,
      ageLimit: row.age_limit,
      applicationFee: row.application_fee,
      salary: row.salary,
      selectionProcess: row.selection_process,
      applicationInstructions: row.application_instructions,
      requiredDocuments: row.required_documents,
      vacancies: o.vacancies,
      applicationStartDate: o.application_start_date,
      applicationEndDate: o.application_end_date,
      publicationDate: o.publication_date,
      lastVerifiedAt: o.last_verified_at,
      notificationUrl: o.notification_url,
      applicationUrl: o.application_url,
      sourceUrl: o.source_url,
      sourceName: o.source_name,
      organisation: o.organisation,
      category: o.category,
      state: o.state,
      qualifications: sortedQualifications(o.quals ?? []),
      events: (o.events ?? []).map((e) => ({
        eventType: e.event_type,
        title: e.title,
        eventDate: e.event_date,
        dateStatus: e.date_status,
      })),
    };
  },
);
