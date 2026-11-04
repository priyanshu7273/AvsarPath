import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Opportunities" };

export default function Page() {
  return (
    <ComingSoon title="Opportunities" phase="Phase 2 — Opportunity System">
      <p>
        A searchable, filterable listing of verified opportunities — with
        qualification, state, department, type, status and deadline filters —
        will live here. Each opportunity will have its own detailed page.
      </p>
    </ComingSoon>
  );
}
