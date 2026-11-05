import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/update-session";

// Next 16 renamed Middleware to Proxy. This keeps the Supabase auth session
// fresh on navigations; it does not gate access (pages/routes do that).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except Next internals, the health check and static files.
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
