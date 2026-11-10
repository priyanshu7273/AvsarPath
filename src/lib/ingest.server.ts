import "server-only";

import { XMLParser } from "fast-xml-parser";

import { adminClient } from "@/lib/supabase/admin";
import type { IngestSummary, NormalisedFeedItem } from "@/lib/ingest";

/**
 * Content ingestion engine. All DB access is via the SERVICE-ROLE client, so
 * callers must have passed requireAdmin() (admin UI) or presented the ingest
 * secret (the cron route). It only ever writes to the admin-only staging tables
 * `source_items` / `ingestion_runs` — never to any public-readable table, and
 * never publishes.
 */

// A generic, identifiable bot UA. Deliberately NOT the user's email (a site
// asking for a contact address is not a reason to leak a personal one).
const USER_AGENT = "AvsarPathBot/1.0 (+https://avsarpath.app/about)";
const UA_TOKEN = "avsarpathbot";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 3_000_000; // ~3 MB cap on a fetched feed

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------
async function fetchText(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      signal: controller.signal,
      redirect: "follow",
    });
    const len = Number(res.headers.get("content-length") ?? "0");
    if (len && len > MAX_BYTES) {
      return { ok: false, status: res.status, text: "" };
    }
    const raw = await res.text();
    return { ok: res.ok, status: res.status, text: raw.slice(0, MAX_BYTES) };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
type RobotsDecision = { allowed: boolean; reason: string };

function escapeRegex(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/** Translate a robots path pattern (`*` wildcard, trailing `$`) to a prefix regex. */
function patternToRegex(pattern: string): RegExp {
  let re = "^";
  for (const ch of pattern) {
    if (ch === "*") re += ".*";
    else if (ch === "$") re += "$";
    else re += escapeRegex(ch);
  }
  return new RegExp(re);
}

type RobotsGroup = { agents: string[]; allows: string[]; disallows: string[] };

function parseRobotsGroups(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], allows: [], disallows: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (current) {
      lastWasAgent = false;
      if (field === "disallow" && value) current.disallows.push(value);
      else if (field === "allow" && value) current.allows.push(value);
      // An empty "Disallow:" means allow-all; nothing to record.
    }
  }
  return groups;
}

function bestMatchLength(patterns: string[], path: string): number {
  let best = -1;
  for (const p of patterns) {
    if (patternToRegex(p).test(path)) best = Math.max(best, p.length);
  }
  return best;
}

/** Decide whether `path` is crawlable for our UA given a robots.txt body. */
function evaluateRobots(text: string, path: string): RobotsDecision {
  const groups = parseRobotsGroups(text);
  // Prefer a group that names our product token; else the wildcard group.
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && UA_TOKEN.includes(a)));
  const wildcard = groups.filter((g) => g.agents.includes("*"));
  const applicable = specific.length > 0 ? specific : wildcard;
  if (applicable.length === 0) return { allowed: true, reason: "no applicable robots rules" };

  const allows = applicable.flatMap((g) => g.allows);
  const disallows = applicable.flatMap((g) => g.disallows);
  const bestAllow = bestMatchLength(allows, path);
  const bestDisallow = bestMatchLength(disallows, path);

  if (bestDisallow === -1) return { allowed: true, reason: "not disallowed" };
  // Allow wins ties (more or equally specific Allow overrides a Disallow).
  if (bestAllow >= bestDisallow) return { allowed: true, reason: "allow overrides disallow" };
  return { allowed: false, reason: `disallowed by robots.txt (${path})` };
}

async function checkRobots(targetUrl: string): Promise<RobotsDecision> {
  let origin: string;
  let path: string;
  try {
    const u = new URL(targetUrl);
    origin = u.origin;
    path = u.pathname + (u.search || "");
  } catch {
    return { allowed: false, reason: "invalid URL" };
  }
  try {
    const res = await fetchText(`${origin}/robots.txt`, 5000);
    if (res.status === 404) return { allowed: true, reason: "no robots.txt" };
    if (!res.ok) return { allowed: false, reason: `robots.txt HTTP ${res.status}` };
    return evaluateRobots(res.text, path);
  } catch {
    // Can't verify → stay off the site (conservative).
    return { allowed: false, reason: "robots.txt fetch failed" };
  }
}

// ---------------------------------------------------------------------------
// Feed parsing (RSS + Atom)
// ---------------------------------------------------------------------------
function text(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    const t = (v as Record<string, unknown>)["#text"];
    if (typeof t === "string") return t.trim() || null;
    if (typeof t === "number") return String(t);
  }
  return null;
}

function toIso(v: unknown): string | null {
  const s = text(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Pick the best href from an Atom <link> (single, array, or href attribute). */
function atomLink(link: unknown): string | null {
  const links = asArray(link as Record<string, unknown> | Record<string, unknown>[]);
  if (links.length === 0) return typeof link === "string" ? link : null;
  const alt = links.find((l) => l["@_rel"] === "alternate" && l["@_href"]);
  const chosen = alt ?? links.find((l) => l["@_href"]) ?? links[0];
  return (chosen?.["@_href"] as string) ?? null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

export function parseFeed(xml: string): NormalisedFeedItem[] {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const items: NormalisedFeedItem[] = [];

  // RSS 2.0
  const rss = doc.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  if (channel) {
    for (const item of asArray(channel.item as Record<string, unknown> | Record<string, unknown>[])) {
      const guid = text(item.guid) ?? text(item.link);
      const url = text(item.link);
      const externalId = guid ?? url ?? text(item.title);
      if (!externalId) continue;
      items.push({
        externalId,
        title: text(item.title),
        url,
        summary: text(item.description),
        publishedAt: toIso(item.pubDate),
      });
    }
  }

  // Atom
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (feed) {
    for (const entry of asArray(feed.entry as Record<string, unknown> | Record<string, unknown>[])) {
      const url = atomLink(entry.link);
      const externalId = text(entry.id) ?? url ?? text(entry.title);
      if (!externalId) continue;
      items.push({
        externalId,
        title: text(entry.title),
        url,
        summary: text(entry.summary) ?? text(entry.content),
        publishedAt: toIso(entry.updated) ?? toIso(entry.published),
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Ingestion
// ---------------------------------------------------------------------------
type SourceRow = {
  id: string;
  source_name: string;
  source_url: string | null;
  feed_url: string | null;
  access_method: string;
  source_status: string;
};

async function recordRun(
  sourceId: string,
  patch: { items_found: number; items_new: number; status: string; error: string | null },
) {
  const sb = adminClient();
  await sb.from("ingestion_runs").insert({
    source_id: sourceId,
    finished_at: new Date().toISOString(),
    ...patch,
  });
}

/** Fetch one source's feed, stage new items, and log the run. */
export async function ingestSource(sourceId: string): Promise<IngestSummary> {
  const sb = adminClient();
  const empty = (over: Partial<IngestSummary>): IngestSummary => ({
    sourceId,
    found: 0,
    inserted: 0,
    skipped: 0,
    blocked: false,
    error: null,
    ...over,
  });

  const { data: source } = await sb
    .from("content_sources")
    .select("id, source_name, source_url, feed_url, access_method, source_status")
    .eq("id", sourceId)
    .maybeSingle<SourceRow>();

  if (!source) return empty({ error: "source not found" });

  const feedUrl = source.feed_url || source.source_url;
  if (!feedUrl) {
    await sb.from("content_sources").update({ source_status: "error", last_checked_at: new Date().toISOString() }).eq("id", sourceId);
    await recordRun(sourceId, { items_found: 0, items_new: 0, status: "error", error: "no feed_url" });
    return empty({ error: "no feed URL configured" });
  }

  try {
    const robots = await checkRobots(feedUrl);
    if (!robots.allowed) {
      await sb
        .from("content_sources")
        .update({ source_status: "blocked", robots_allowed: false, last_checked_at: new Date().toISOString() })
        .eq("id", sourceId);
      await recordRun(sourceId, { items_found: 0, items_new: 0, status: "blocked", error: robots.reason });
      return empty({ blocked: true, error: robots.reason });
    }

    const res = await fetchText(feedUrl);
    if (!res.ok) {
      await sb.from("content_sources").update({ source_status: "error", robots_allowed: true, last_checked_at: new Date().toISOString() }).eq("id", sourceId);
      await recordRun(sourceId, { items_found: 0, items_new: 0, status: "error", error: `feed HTTP ${res.status}` });
      return empty({ error: `feed HTTP ${res.status}` });
    }

    const items = parseFeed(res.text);
    let inserted = 0;
    if (items.length > 0) {
      const rows = items.map((i) => ({
        source_id: sourceId,
        external_id: i.externalId,
        title: i.title,
        url: i.url,
        summary: i.summary,
        published_at: i.publishedAt,
        raw: i,
      }));
      // ignoreDuplicates => only genuinely new (source_id, external_id) rows are
      // inserted and returned, which is our dedup + "new" count.
      const { data: insertedRows, error } = await sb
        .from("source_items")
        .upsert(rows, { onConflict: "source_id,external_id", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(error.message);
      inserted = insertedRows?.length ?? 0;
    }

    await sb
      .from("content_sources")
      .update({ source_status: "active", robots_allowed: true, last_checked_at: new Date().toISOString() })
      .eq("id", sourceId);
    await recordRun(sourceId, { items_found: items.length, items_new: inserted, status: "ok", error: null });

    return empty({ found: items.length, inserted, skipped: items.length - inserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await sb.from("content_sources").update({ source_status: "error", last_checked_at: new Date().toISOString() }).eq("id", sourceId);
    await recordRun(sourceId, { items_found: 0, items_new: 0, status: "error", error: message });
    return empty({ error: message });
  }
}

/** Ingest every active RSS source. */
export async function ingestAllActive(): Promise<IngestSummary[]> {
  const sb = adminClient();
  const { data } = await sb
    .from("content_sources")
    .select("id")
    .eq("access_method", "rss")
    .eq("source_status", "active");

  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
  const summaries: IngestSummary[] = [];
  for (const id of ids) summaries.push(await ingestSource(id));
  return summaries;
}
