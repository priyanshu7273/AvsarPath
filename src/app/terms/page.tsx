import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Terms &amp; Conditions
      </h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          These terms will cover website usage, the limitations of information
          accuracy, user responsibilities and intellectual property. Information
          on this site is provided for guidance; always confirm details against
          the official notification.
        </p>
        <p className="text-sm italic">
          Draft placeholder. The full terms will be completed before commercial
          launch.
        </p>
      </div>
    </div>
  );
}
