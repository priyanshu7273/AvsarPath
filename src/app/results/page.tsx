import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Results" };

export default function Page() {
  return (
    <ComingSoon title="Results" phase="Phase 4 — Administration">
      <p>
        Examination results, with their official source and publication date,
        will be listed here.
      </p>
    </ComingSoon>
  );
}
