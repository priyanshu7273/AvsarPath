import { NextResponse } from "next/server";

import { ingestAllActive } from "@/lib/ingest.server";

/**
 * Machine-to-machine ingestion trigger (for Phase 6's Cloudflare Cron).
 * Authenticated by a shared secret in the `x-ingest-secret` header — NOT a user
 * session. Runs every active RSS source and returns a summary. Like the admin
 * "Fetch now", it only stages items; it never publishes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Ingestion is not configured (INGEST_SECRET unset)." }, { status: 503 });
  }
  if (request.headers.get("x-ingest-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summaries = await ingestAllActive();
  const totals = summaries.reduce(
    (acc, s) => ({
      found: acc.found + s.found,
      inserted: acc.inserted + s.inserted,
      blocked: acc.blocked + (s.blocked ? 1 : 0),
      errors: acc.errors + (s.error ? 1 : 0),
    }),
    { found: 0, inserted: 0, blocked: 0, errors: 0 },
  );

  return NextResponse.json({ status: "ok", sources: summaries.length, totals, summaries });
}
