import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight wiring smoke-test. Does NOT query any tables (none exist until
 * Phase 2). Reports whether Supabase env is configured and, if so, whether a
 * basic auth call reaches the project.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      status: "ok",
      app: "up",
      supabase: "not_configured",
      hint: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser();
    // An unauthenticated "Auth session missing" response still proves we
    // reached the project; only treat transport-level failures as errors.
    return NextResponse.json({
      status: "ok",
      app: "up",
      supabase: error ? "reachable_no_session" : "connected",
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        app: "up",
        supabase: "unreachable",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
