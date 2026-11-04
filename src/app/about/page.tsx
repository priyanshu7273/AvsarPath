import type { Metadata } from "next";

import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About Us" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        About {site.name}
      </h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          {site.name} is an independent information platform that helps
          students, graduates and job seekers across India discover and track
          exams, government jobs, admissions and scholarships.
        </p>
        <p>
          We summarise opportunities in plain language and always link to the
          original official notification. Every published opportunity carries
          its source and a last-verified date. {site.independenceNotice}
        </p>
        <p className="text-sm italic">
          This page is a draft and will be expanded before launch.
        </p>
      </div>
    </div>
  );
}
