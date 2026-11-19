import { contact } from "@/lib/site";

/** Shared layout for the Privacy, Terms, Contact and Disclaimer pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {updated ? (
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
      ) : null}
      <div className="mt-6 space-y-8 text-muted-foreground">{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

/** A gap that must be filled before launch, shown loudly rather than hidden. */
function Pending({ what }: { what: string }) {
  return (
    <span className="rounded bg-amber-500/15 px-1 font-medium text-amber-700 dark:text-amber-300">
      [{what} — to be added]
    </span>
  );
}

export function ContactEmail() {
  return contact.email ? (
    <a href={`mailto:${contact.email}`} className="font-medium text-primary hover:underline">
      {contact.email}
    </a>
  ) : (
    <Pending what="contact email" />
  );
}

export function GrievanceOfficer() {
  return contact.grievanceOfficer ? (
    <span className="text-foreground">{contact.grievanceOfficer}</span>
  ) : (
    <Pending what="grievance contact" />
  );
}
