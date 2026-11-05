import "server-only";

import { getSessionUser } from "@/lib/auth";
import type { ApplicationStatus, OpportunitySummary } from "@/lib/opportunities";
import { getOpportunitiesByIds } from "@/lib/opportunities.server";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-user reads of saved items and application tracking. All queries use the
 * cookie-bound client, so RLS scopes them to the signed-in user; the display
 * data is fetched separately with the public client (published rows only).
 */

export async function getSavedOpportunities(): Promise<OpportunitySummary[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const sb = await createClient();
  const { data } = await sb
    .from("saved_opportunities")
    .select("opportunity_id, created_at")
    .order("created_at", { ascending: false });

  const ids = (data ?? []).map((r) => r.opportunity_id as string);
  return orderByIds(ids, await getOpportunitiesByIds(ids));
}

export async function isSaved(opportunityId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const sb = await createClient();
  const { data } = await sb
    .from("saved_opportunities")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  return Boolean(data);
}

export type TrackedOpportunity = {
  opportunity: OpportunitySummary;
  status: ApplicationStatus;
};

export async function getTrackedOpportunities(): Promise<TrackedOpportunity[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const sb = await createClient();
  const { data } = await sb
    .from("application_tracking")
    .select("opportunity_id, application_status, updated_at")
    .order("updated_at", { ascending: false });

  const rows = data ?? [];
  const summaries = await getOpportunitiesByIds(
    rows.map((r) => r.opportunity_id as string),
  );
  const byId = new Map(summaries.map((s) => [s.id, s]));

  return rows
    .map((r) => {
      const opportunity = byId.get(r.opportunity_id as string);
      return opportunity
        ? { opportunity, status: r.application_status as ApplicationStatus }
        : null;
    })
    .filter((t): t is TrackedOpportunity => t !== null);
}

export async function getTrackingStatus(
  opportunityId: string,
): Promise<ApplicationStatus | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const sb = await createClient();
  const { data } = await sb
    .from("application_tracking")
    .select("application_status")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  return (data?.application_status as ApplicationStatus | undefined) ?? null;
}

function orderByIds(
  ids: string[],
  summaries: OpportunitySummary[],
): OpportunitySummary[] {
  const byId = new Map(summaries.map((s) => [s.id, s]));
  return ids
    .map((id) => byId.get(id))
    .filter((s): s is OpportunitySummary => Boolean(s));
}
