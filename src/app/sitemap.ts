import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { getPublishedSlugs } from "@/lib/opportunities.server";

/**
 * Dynamic sitemap: the public static pages plus every published opportunity
 * detail URL. The slug query is cached + tagged ("opportunities"), so it stays
 * cheap under crawl traffic and refreshes when an admin publishes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, "");

  const staticPaths = [
    "/",
    "/opportunities",
    "/eligibility",
    "/calendar",
    "/results",
    "/admit-cards",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
  ];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.6,
  }));

  const slugs = await getPublishedSlugs();
  const detailEntries: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${base}/opportunities/${s.slug}`,
    lastModified: s.updatedAt ? new Date(s.updatedAt) : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...detailEntries];
}
