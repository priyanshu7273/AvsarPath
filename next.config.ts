import type { NextConfig } from "next";

// Preview builds (NEXT_PUBLIC_SITE_NOINDEX=1) send X-Robots-Tag on every route,
// alongside the disallow-all robots.txt and noindex meta (see src/lib/env.ts).
const noIndex = process.env.NEXT_PUBLIC_SITE_NOINDEX === "1";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return noIndex
      ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
      : [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
