"use client";

import { useEffect } from "react";

/**
 * Removes a spent OAuth `code` (and the `next` that travels with it) from the
 * address bar.
 *
 * /auth/callback exchanges the code and redirects to a clean `next` path, but on
 * Netlify that redirect arrives with the callback's own query copied on
 * (e.g. /dashboard?code=…&next=%2Fdashboard). The code is single-use and already
 * exchanged, so it's harmless, but it shouldn't sit in the URL, history or
 * anything the user copies. No page uses a `code` param, so stripping it is safe;
 * `next` is only dropped when it arrived with a code (/login?next=… is untouched).
 */
export function CleanAuthParams() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code")) return;
    url.searchParams.delete("code");
    url.searchParams.delete("next");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return null;
}
