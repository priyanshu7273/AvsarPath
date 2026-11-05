import { NextResponse } from "next/server";

import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

/**
 * Self-service account deletion. Verifies the session server-side, requires an
 * explicit typed confirmation, then deletes the auth user with the service-role
 * admin client (FK cascades remove the profile, saved items and tracking).
 * Finally clears the session.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  }

  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The user is gone; drop the now-orphaned session cookies.
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
