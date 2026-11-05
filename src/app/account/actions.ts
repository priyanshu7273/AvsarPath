"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/opportunities";
import { createClient } from "@/lib/supabase/server";

/**
 * Save or un-save an opportunity for the current user. The session is
 * re-checked here (never trust the client), `user_id` is taken from it, and
 * RLS owner policies back it up.
 */
export async function toggleSave(opportunityId: string): Promise<void> {
  const user = await requireUser();
  const sb = await createClient();

  const { data: existing } = await sb
    .from("saved_opportunities")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    await sb.from("saved_opportunities").delete().eq("opportunity_id", opportunityId);
  } else {
    await sb
      .from("saved_opportunities")
      .insert({ user_id: user.id, opportunity_id: opportunityId });
  }

  revalidatePath("/saved");
  revalidatePath("/dashboard");
}

/** Set (or clear, with null) the application-tracking status for an opportunity. */
export async function setTracking(
  opportunityId: string,
  status: ApplicationStatus | null,
): Promise<void> {
  const user = await requireUser();
  const sb = await createClient();

  if (status === null) {
    await sb.from("application_tracking").delete().eq("opportunity_id", opportunityId);
  } else {
    if (!APPLICATION_STATUSES.includes(status)) return;
    await sb
      .from("application_tracking")
      .upsert(
        { user_id: user.id, opportunity_id: opportunityId, application_status: status },
        { onConflict: "user_id,opportunity_id" },
      );
  }

  revalidatePath("/dashboard");
}
