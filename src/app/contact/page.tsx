import type { Metadata } from "next";
import Link from "next/link";

import { ContactEmail, GrievanceOfficer, LegalPage, List, Section } from "@/components/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `How to contact ${site.name} about a listing, your data or a complaint.`,
};

const linkClass = "font-medium text-primary hover:underline";

export default function Page() {
  return (
    <LegalPage title="Contact Us">
      <p>
        {site.name} is run independently. The best way to reach us is by email:{" "}
        <ContactEmail />. There is no contact form; we don&apos;t store messages anywhere
        other than our email inbox.
      </p>

      <Section title="Write to us about">
        <List>
          <li>
            A mistake or out-of-date detail in a listing. Please include the link to our
            page and to the official notification.
          </li>
          <li>
            Your personal data: questions, a copy of your data or a correction. (You can
            delete your account yourself from your{" "}
            <Link href="/account" className={linkClass}>
              Account
            </Link>{" "}
            page.)
          </li>
          <li>A complaint about the site.</li>
        </List>
      </Section>

      <Section title="What we can't help with">
        <p>
          Applications, application status, fee payments, admit cards and results are
          handled only by the official recruiting or examining body. Please contact them
          through their official website. {site.name} will never ask you for money,
          passwords or OTPs.
        </p>
      </Section>

      <Section title="Grievance contact">
        <p>
          <GrievanceOfficer />, reachable at <ContactEmail />.
        </p>
      </Section>
    </LegalPage>
  );
}
