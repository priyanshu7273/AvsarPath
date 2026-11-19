import type { Metadata } from "next";

import { LegalPage } from "@/components/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer" };

export default function Page() {
  return (
    <LegalPage title="Disclaimer">
      <div className="space-y-4">
        <p>{site.independenceNotice}</p>
        <p>
          {site.name} is not an official government website and does not conduct
          recruitment. We provide editorial summaries and link to official
          notifications. While we verify information against official sources and
          record a last-verified date, dates and details can change. Always confirm
          every detail on the official notification before applying or paying any fee.
        </p>
        <p>
          Applications, fee payments, admit cards and results are available only on
          official websites. {site.name} shows announcements and links to them; it does
          not accept applications or host result lookups.
        </p>
        <p>
          Tentative or expected dates are clearly distinguished from officially
          confirmed dates and should not be treated as final.
        </p>
      </div>
    </LegalPage>
  );
}
