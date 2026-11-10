/**
 * Pure (framework-agnostic) types + labels for content ingestion. Mirrors the
 * Postgres enums so both Server Actions and client form components can import
 * them without pulling in server-only code.
 */

export const SOURCE_ACCESS_METHODS = ["manual", "rss", "api", "dataset"] as const;
export type SourceAccessMethod = (typeof SOURCE_ACCESS_METHODS)[number];

export const SOURCE_ACCESS_METHOD_LABELS: Record<SourceAccessMethod, string> = {
  manual: "Manual",
  rss: "RSS / Atom feed",
  api: "API",
  dataset: "Dataset",
};

export const SOURCE_STATUSES = ["active", "paused", "blocked", "error"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  active: "Active",
  paused: "Paused",
  blocked: "Blocked by robots.txt",
  error: "Error",
};

export const SOURCE_ITEM_STATUSES = ["new", "dismissed", "imported"] as const;
export type SourceItemStatus = (typeof SOURCE_ITEM_STATUSES)[number];

export const SOURCE_ITEM_STATUS_LABELS: Record<SourceItemStatus, string> = {
  new: "New",
  dismissed: "Dismissed",
  imported: "Imported",
};

/** A normalised feed item (what the parser yields and ingestion stages). */
export type NormalisedFeedItem = {
  externalId: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  publishedAt: string | null; // ISO
};

/** Summary of one ingestion run, returned by the engine and shown to the admin. */
export type IngestSummary = {
  sourceId: string;
  found: number;
  inserted: number;
  skipped: number;
  blocked: boolean;
  error: string | null;
};
