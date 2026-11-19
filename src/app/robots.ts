import type { MetadataRoute } from "next";

import { env, isNoIndexBuild } from "@/lib/env";

/**
 * robots.txt — production: allow crawling of the public site, but keep the admin
 * area, API, and per-user account routes out of the index. Preview builds
 * (NEXT_PUBLIC_SITE_NOINDEX=1) disallow everything, since they may point at the
 * dev database and its demo rows.
 */
export default function robots(): MetadataRoute.Robots {
  if (isNoIndexBuild) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

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
