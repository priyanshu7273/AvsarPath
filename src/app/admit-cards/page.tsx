import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Admit Cards" };

export default function Page() {
  return (
    <ComingSoon title="Admit Cards" phase="Phase 4 — Administration">
      <p>
        Admit cards, answer keys, examination notices and interview schedules —
        each with its official source and publication date — will be listed
        here.
      </p>
    </ComingSoon>
  );
}
