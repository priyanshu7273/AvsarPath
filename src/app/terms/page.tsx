import type { Metadata } from "next";
import Link from "next/link";

import { ContactEmail, LegalPage, List, Section } from "@/components/legal";
import { legalLastUpdated, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms for using ${site.name}, an independent information service.`,
};

const linkClass = "font-medium text-primary hover:underline";

export default function Page() {
  return (
    <LegalPage title="Terms & Conditions" updated={legalLastUpdated}>
      <p>
        By using {site.name} you agree to these terms. If you don&apos;t agree, please
        don&apos;t use the site.
      </p>

      <Section title="What AvsarPath is">
        <p>
          {site.name} is a free, independent information service. We summarise publicly
          available official notifications about government jobs and exams and link to
          the official sources. {site.independenceNotice} We do not conduct recruitment,
          accept applications, collect fees, issue admit cards or publish results: those
          happen only on the official websites of the bodies concerned.
        </p>
      </Section>

      <Section title="Always verify on the official source">
        <p>
          We work to keep listings accurate and show when each one was last verified,
          but notifications change and mistakes can happen. Our pages are summaries for
          convenience; the official notification is the only authoritative source.
          Before you apply or pay any fee, check every detail (eligibility, age limits,
          dates, fees and vacancies) on the official website. If anything on{" "}
          {site.name} differs from the official notification, the official notification
          is correct. Please tell us so we can fix it.
        </p>
      </Section>

      <Section title="Beware of fraud">
        <p>
          {site.name} is free. We will never ask you for money, application fees, bank
          details, passwords or OTPs. Pay application fees only on the official portal of
          the recruiting body.
        </p>
      </Section>

      <Section title="Accounts">
        <List>
          <li>
            An account is optional. You sign in with GitHub or Google, and you are
            responsible for keeping that account secure.
          </li>
          <li>Accounts are intended for people aged 18 or over.</li>
          <li>
            You can delete your account at any time from your{" "}
            <Link href="/account" className={linkClass}>
              Account
            </Link>{" "}
            page. See the{" "}
            <Link href="/privacy" className={linkClass}>
              Privacy Policy
            </Link>{" "}
            for what that removes.
          </li>
          <li>We may suspend or delete accounts used to abuse the service.</li>
        </List>
      </Section>

      <Section title="Acceptable use">
        <p>Please don&apos;t:</p>
        <List>
          <li>attack, disrupt or overload the site, or try to break its security;</li>
          <li>try to access other people&apos;s accounts or the site&apos;s admin areas;</li>
          <li>present {site.name} or its content as an official government source.</li>
        </List>
      </Section>

      <Section title="Links to other websites">
        <p>
          We link to official and other external websites. They are run by others, and
          we aren&apos;t responsible for their content, availability or how they handle
          your data.
        </p>
      </Section>

      <Section title="Content">
        <p>
          Official notifications belong to the authorities that issue them. The design
          of {site.name}, the text we write and our software belong to us. You&apos;re
          welcome to share links to any page.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          {site.name} is provided free of charge and &ldquo;as is&rdquo;. To the extent
          the law allows, we are not liable for any loss that results from relying on
          information on the site, including missed deadlines, ineligibility or fees
          paid. That is why you should always verify details on the official source.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may change these terms or change or stop the service. Changes to these terms
          take effect when we post them here with a new &ldquo;last updated&rdquo; date.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of India.</p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms: <ContactEmail />.
        </p>
      </Section>
    </LegalPage>
  );
}
