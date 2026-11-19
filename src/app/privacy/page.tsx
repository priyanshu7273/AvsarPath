import type { Metadata } from "next";
import Link from "next/link";

import { ContactEmail, GrievanceOfficer, LegalPage, List, Section } from "@/components/legal";
import { legalLastUpdated, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What personal data ${site.name} collects, why, and how to delete your account.`,
};

const linkClass = "font-medium text-primary hover:underline";

export default function Page() {
  return (
    <LegalPage title="Privacy Policy" updated={legalLastUpdated}>
      <p>
        This policy explains what personal data {site.name} collects, why we collect it
        and what you can do about it. {site.name} is an independent information platform
        about Indian government jobs and exams. You can read everything on the site
        without creating an account.
      </p>

      <Section title="What we collect">
        <List>
          <li>
            <strong className="text-foreground">If you just browse:</strong> we don&apos;t
            ask for any personal information. We don&apos;t use analytics, advertising or
            tracking cookies, and we don&apos;t run third-party trackers. Our hosting
            provider handles technical request data (such as your IP address and browser
            type) to deliver pages and protect the site.
          </li>
          <li>
            <strong className="text-foreground">If you sign in with GitHub or Google:</strong>{" "}
            we receive your email address and name, plus the other basic profile details
            the provider includes with sign-in, such as your profile picture link, your
            GitHub username and an account identifier. We never see or store your GitHub
            or Google password. We also record when your account was created and when you
            last signed in.
          </li>
          <li>
            <strong className="text-foreground">Saved opportunities:</strong> which
            listings you save, and when.
          </li>
          <li>
            <strong className="text-foreground">Application tracking:</strong> the status
            you choose for a listing (for example &ldquo;Applied&rdquo; or &ldquo;Admit
            card released&rdquo;) and when you last changed it.
          </li>
          <li>
            <strong className="text-foreground">If you email us:</strong> your email
            address and whatever you write, which arrive in our email inbox.
          </li>
        </List>
        <p>
          We do <strong className="text-foreground">not</strong> collect your phone
          number, postal address, date of birth, identity numbers (such as Aadhaar or
          PAN), exam roll numbers or results, payment details or location. The newsletter
          box on the homepage is not active yet: it does not store or send anything you
          type into it. There is no contact form; you can contact us by email only.
        </p>
      </Section>

      <Section title="Why we use it">
        <List>
          <li>To sign you in and keep your account secure.</li>
          <li>To show your saved opportunities and application tracking back to you.</li>
          <li>To reply when you contact us.</li>
          <li>To keep the service running and protect it from abuse.</li>
        </List>
        <p>
          We don&apos;t sell or rent your data, we don&apos;t use it for advertising and
          we don&apos;t send marketing emails.
        </p>
      </Section>

      <Section title="Who can see it">
        <List>
          <li>
            Your saved opportunities and application tracking are private to your
            account. Other users can&apos;t see them.
          </li>
          <li>
            The person who runs {site.name} can access the database to operate, secure
            and support the service.
          </li>
          <li>
            Service providers that process data for us: Supabase (database and sign-in),
            Netlify (hosting and server code), and GitHub or Google for the sign-in you
            choose, under their own privacy policies. Our database and server code run in
            the United States; pages may be delivered from Netlify&apos;s global network.
          </li>
          <li>We may disclose data if the law requires it.</li>
        </List>
      </Section>

      <Section title="Cookies">
        <p>
          We use only cookies that are strictly necessary for signing in: a session
          cookie that keeps you signed in, and a short-lived cookie used during the
          sign-in process itself. If you never sign in, we set no cookies of our own.
        </p>
      </Section>

      <Section title="How long we keep it">
        <List>
          <li>
            Your account details, saved opportunities and application tracking: until you
            delete your account.
          </li>
          <li>Emails you send us: only as long as we need them to deal with your message.</li>
          <li>
            Security and technical logs kept by our hosting and sign-in providers follow
            those providers&apos; retention policies, and may remain for a limited period
            after you delete your account.
          </li>
        </List>
      </Section>

      <Section title="Deleting your account and data">
        <p>
          You can delete your account yourself at any time from your{" "}
          <Link href="/account" className={linkClass}>
            Account
          </Link>{" "}
          page (type DELETE to confirm). This immediately and permanently deletes your
          account, your sign-in details, your saved opportunities and your application
          tracking, and signs you out. It cannot be undone.
        </p>
      </Section>

      <Section title="Your choices">
        <List>
          <li>
            <strong className="text-foreground">See your data:</strong> your{" "}
            <Link href="/account" className={linkClass}>
              Account
            </Link>{" "}
            page shows your email, sign-in provider and the date you joined;{" "}
            <Link href="/saved" className={linkClass}>
              Saved
            </Link>{" "}
            and{" "}
            <Link href="/dashboard" className={linkClass}>
              Dashboard
            </Link>{" "}
            show your saved opportunities and tracking.
          </li>
          <li>
            <strong className="text-foreground">Change it:</strong> you can unsave
            opportunities and change or clear a tracking status at any time.
          </li>
          <li>
            <strong className="text-foreground">Delete it:</strong> delete your account as
            described above.
          </li>
          <li>
            For a copy of your data, a correction, a question or a complaint, email{" "}
            <ContactEmail />.
          </li>
        </List>
      </Section>

      <Section title="Age">
        <p>
          Accounts are intended for people aged 18 or over. You don&apos;t need an account
          to read anything on {site.name}.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If what we collect or how we use it changes, we&apos;ll update this page and the
          &ldquo;last updated&rdquo; date at the top.
        </p>
      </Section>

      <Section title="Contact and grievances">
        <p>
          Questions or complaints about your personal data: <ContactEmail />. Grievance
          contact: <GrievanceOfficer />. See also our{" "}
          <Link href="/contact" className={linkClass}>
            Contact
          </Link>{" "}
          page.
        </p>
      </Section>
    </LegalPage>
  );
}
