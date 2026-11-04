import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Eligibility Finder" };

export default function Page() {
  return (
    <ComingSoon title="Eligibility Finder" phase="Phase 2 — Opportunity System">
      <p>
        A qualification-based discovery tool — filter by education, state, age
        range, category and preferred department. It shows matching
        opportunities and the relevant official conditions, and does not
        guarantee eligibility.
      </p>
    </ComingSoon>
  );
}
