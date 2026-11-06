/**
 * Shared, framework-agnostic types and helpers for opportunities.
 *
 * This module is PURE (no database, no "server-only") so it can be imported by
 * both Server Components and Client Components. The data-fetching functions
 * that talk to Supabase live in `./opportunities.server`.
 */

export const OPPORTUNITY_TYPES = [
  "job",
  "exam",
  "admission",
  "scholarship",
  "apprenticeship",
  "internship",
] as const;

export const OPPORTUNITY_STATUSES = [
  "upcoming",
  "open",
  "closed",
  "expired",
  "cancelled",
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const TYPE_LABELS: Record<OpportunityType, string> = {
  job: "Job",
  exam: "Exam",
  admission: "Admission",
  scholarship: "Scholarship",
  apprenticeship: "Apprenticeship",
  internship: "Internship",
};

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  upcoming: "Upcoming",
  open: "Open",
  closed: "Closed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  application_start: "Application starts",
  application_end: "Last date to apply",
  exam: "Examination",
  admit_card: "Admit card",
  result: "Result",
  answer_key: "Answer key",
  interview: "Interview",
  notice: "Notice",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Admin-form enums (match the Postgres enum types in the schema). These live in
// this PURE module so both the Server Actions and the client form components can
// import them without pulling in "server-only" code.
// ---------------------------------------------------------------------------

export const VERIFICATION_STATUSES = [
  "pending_verification",
  "verified",
  "needs_review",
  "updated",
  "expired",
  "cancelled",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending_verification: "Pending verification",
  verified: "Verified",
  needs_review: "Needs review",
  updated: "Updated",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const EXAM_EVENT_TYPES = [
  "application_start",
  "application_end",
  "exam",
  "admit_card",
  "result",
  "answer_key",
  "interview",
  "notice",
  "other",
] as const;

export type ExamEventType = (typeof EXAM_EVENT_TYPES)[number];

export const DATE_STATUSES = ["official", "tentative", "expected"] as const;

export type DateStatus = (typeof DATE_STATUSES)[number];

export const DATE_STATUS_LABELS: Record<DateStatus, string> = {
  official: "Official",
  tentative: "Tentative",
  expected: "Expected",
};

export const APPLICATION_STATUSES = [
  "interested",
  "planning_to_apply",
  "applied",
  "admit_card_released",
  "examination_completed",
  "result_declared",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  planning_to_apply: "Planning to apply",
  applied: "Applied",
  admit_card_released: "Admit card released",
  examination_completed: "Exam completed",
  result_declared: "Result declared",
};

/** How many results to show per page. */
export const PAGE_SIZE = 12;

export type LookupOption = { id: string; slug: string; name: string };
export type StateOption = LookupOption & { code: string };
export type QualificationOption = LookupOption & { rank: number };

export type FilterOptions = {
  categories: LookupOption[];
  states: StateOption[];
  qualifications: QualificationOption[];
  organisations: LookupOption[];
};

export const emptyFilterOptions: FilterOptions = {
  categories: [],
  states: [],
  qualifications: [],
  organisations: [],
};

export type OpportunitySort = "newest" | "deadline";

export type OpportunityFilters = {
  q?: string;
  qualification?: string; // qualification slug
  category?: string; // category slug
  state?: string; // state slug, or the sentinel "central"
  department?: string; // organisation slug
  type?: OpportunityType;
  status?: OpportunityStatus;
  sort: OpportunitySort;
  page: number;
};

/** The sentinel used for all-India / central roles (state_id is null). */
export const CENTRAL_STATE = "central";

export type OpportunitySummary = {
  id: string;
  slug: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  qualificationText: string | null;
  ageLimit: string | null;
  vacancies: number | null;
  applicationEndDate: string | null;
  organisation: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  state: { name: string; slug: string; code: string } | null;
  qualifications: { slug: string; name: string; rank: number }[];
};

export type ExamEvent = {
  eventType: string;
  title: string | null;
  eventDate: string | null;
  dateStatus: string;
};

export type OpportunityDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: OpportunityType;
  status: OpportunityStatus;
  qualificationText: string | null;
  eligibility: string | null;
  ageLimit: string | null;
  applicationFee: string | null;
  salary: string | null;
  selectionProcess: string | null;
  applicationInstructions: string | null;
  requiredDocuments: string | null;
  vacancies: number | null;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  publicationDate: string | null;
  lastVerifiedAt: string | null;
  notificationUrl: string | null;
  applicationUrl: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  organisation: { name: string; slug: string; website: string | null } | null;
  category: { name: string; slug: string } | null;
  state: { name: string; slug: string; code: string } | null;
  qualifications: { slug: string; name: string; rank: number }[];
  events: ExamEvent[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Turn raw `searchParams` into a validated, typed filter object. */
export function parseOpportunityFilters(
  searchParams: Record<string, string | string[] | undefined>,
): OpportunityFilters {
  const type = firstValue(searchParams.type);
  const status = firstValue(searchParams.status);
  const page = Number.parseInt(firstValue(searchParams.page) ?? "1", 10);

  return {
    q: firstValue(searchParams.q),
    qualification: firstValue(searchParams.qualification),
    category: firstValue(searchParams.category),
    state: firstValue(searchParams.state),
    department: firstValue(searchParams.department),
    type: (OPPORTUNITY_TYPES as readonly string[]).includes(type ?? "")
      ? (type as OpportunityType)
      : undefined,
    status: (OPPORTUNITY_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as OpportunityStatus)
      : undefined,
    sort: firstValue(searchParams.sort) === "deadline" ? "deadline" : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Build a canonical `/opportunities` URL from a (partial) filter set. */
export function opportunitiesHref(filters: Partial<OpportunityFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.qualification) params.set("qualification", filters.qualification);
  if (filters.category) params.set("category", filters.category);
  if (filters.state) params.set("state", filters.state);
  if (filters.department) params.set("department", filters.department);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/opportunities?${query}` : "/opportunities";
}

/** Build an /eligibility URL from the qualification-first filter subset. */
export function eligibilityHref(filters: {
  qualification?: string;
  state?: string;
  category?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.qualification) params.set("qualification", filters.qualification);
  if (filters.state) params.set("state", filters.state);
  if (filters.category) params.set("category", filters.category);
  const query = params.toString();
  return query ? `/eligibility?${query}` : "/eligibility";
}

/** True when any narrowing filter (not counting sort/page) is active. */
export function hasActiveFilters(filters: OpportunityFilters): boolean {
  return Boolean(
    filters.q ||
      filters.qualification ||
      filters.category ||
      filters.state ||
      filters.department ||
      filters.type ||
      filters.status,
  );
}

/**
 * Format an ISO date string (yyyy-mm-dd) for display. Parsed at a fixed time
 * of day so it is deterministic and does not read the current clock (which
 * Cache Components would flag during prerendering).
 */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Turn a title into a URL-safe slug: lowercase, ASCII words joined by hyphens.
 * Used to suggest (not force) a translation slug in the admin form; the admin
 * can edit it, and the DB's unique(locale, slug) constraint is the real guard.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
