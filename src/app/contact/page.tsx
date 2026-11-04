import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Contact Us
      </h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          A contact form and a support email address will be available here. The
          form and email configuration are set up in a later phase.
        </p>
        <p className="text-sm italic">
          This page is a draft and will be expanded before launch.
        </p>
      </div>
    </div>
  );
}
