import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Exam Calendar" };

export default function Page() {
  return (
    <ComingSoon title="Exam Calendar" phase="Phase 2 — Opportunity System">
      <p>
        An interactive calendar of application opening and closing dates,
        examination dates, admit-card releases and result dates — clearly
        marking official, tentative and expected dates — will live here.
      </p>
    </ComingSoon>
  );
}
