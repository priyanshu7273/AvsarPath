import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * robots.txt — allow crawling of the public site, but keep the admin area, API,
 * and per-user account routes out of the index (no SEO value, and not for bots).
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.siteUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/dashboard", "/account", "/saved", "/login"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
