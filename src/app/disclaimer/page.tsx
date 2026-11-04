import type { Metadata } from "next";

import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Disclaimer
      </h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>{site.independenceNotice}</p>
        <p>
          {site.name} is not an official government website and does not conduct
          recruitment. We provide editorial summaries and link to official
          notifications. While we verify information against official sources and
          record a last-verified date, dates and details can change — always
          confirm against the official notification before acting.
        </p>
        <p>
          Tentative or expected dates are clearly distinguished from officially
          confirmed dates and should not be treated as final.
        </p>
      </div>
    </div>
  );
}
