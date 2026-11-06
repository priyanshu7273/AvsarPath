"use client";

import { useActionState, useId, useState } from "react";

import type { FormState } from "@/app/admin/actions";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
  VERIFICATION_STATUSES,
  VERIFICATION_STATUS_LABELS,
  slugify,
  type LookupOption,
  type QualificationOption,
  type StateOption,
} from "@/lib/opportunities";

export type OpportunityFormOptions = {
  categories: LookupOption[];
  states: StateOption[];
  organisations: LookupOption[];
  qualifications: QualificationOption[];
};

export type OpportunityFormDefaults = {
  id?: string;
  opportunity_type: string;
  opportunity_status: string;
  verification_status: string;
  category_id: string;
  organisation_id: string;
  state_id: string;
  vacancies: string;
  application_start_date: string;
  application_end_date: string;
  publication_date: string;
  notification_url: string;
  application_url: string;
  source_url: string;
  source_name: string;
  slug: string;
  title: string;
  description: string;
  qualification: string;
  eligibility: string;
  age_limit: string;
  application_fee: string;
  salary: string;
  selection_process: string;
  application_instructions: string;
  required_documents: string;
  qualificationIds: string[];
};

export const BLANK_DEFAULTS: OpportunityFormDefaults = {
  opportunity_type: "job",
  opportunity_status: "upcoming",
  verification_status: "pending_verification",
  category_id: "",
  organisation_id: "",
  state_id: "central",
  vacancies: "",
  application_start_date: "",
  application_end_date: "",
  publication_date: "",
  notification_url: "",
  application_url: "",
  source_url: "",
  source_name: "",
  slug: "",
  title: "",
  description: "",
  qualification: "",
  eligibility: "",
  age_limit: "",
  application_fee: "",
  salary: "",
  selection_process: "",
  application_instructions: "",
  required_documents: "",
  qualificationIds: [],
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className={`${inputClass} resize-y`}
      />
    </label>
  );
}

export function OpportunityForm({
  action,
  options,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  options: OpportunityFormOptions;
  defaults: OpportunityFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const errorId = useId();

  const isNew = !defaults.id;
  // On a new record, keep the slug in step with the title until the admin edits
  // the slug themselves.
  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugEdited, setSlugEdited] = useState(!isNew && defaults.slug !== "");

  const effectiveSlug = isNew && !slugEdited ? slugify(title) : slug;

  return (
    <form action={formAction} className="space-y-8">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      {state.error ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      {/* Classification */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Classification</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>
              Type<span className="text-primary"> *</span>
            </span>
            <select name="opportunity_type" defaultValue={defaults.opportunity_type} className={inputClass}>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>
              Category<span className="text-primary"> *</span>
            </span>
            <select name="category_id" defaultValue={defaults.category_id} required className={inputClass}>
              <option value="">Select a category…</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Organisation / department</span>
            <select name="organisation_id" defaultValue={defaults.organisation_id} className={inputClass}>
              <option value="">— None —</option>
              {options.organisations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Region</span>
            <select name="state_id" defaultValue={defaults.state_id} className={inputClass}>
              <option value="central">All India / Central</option>
              {options.states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Status</span>
            <select name="opportunity_status" defaultValue={defaults.opportunity_status} className={inputClass}>
              {OPPORTUNITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Verification</span>
            <select
              name="verification_status"
              defaultValue={defaults.verification_status}
              className={inputClass}
            >
              {VERIFICATION_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {VERIFICATION_STATUS_LABELS[v]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* English content */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">English content</h2>
        <label className="block">
          <span className={labelClass}>
            Title<span className="text-primary"> *</span>
          </span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>
            Slug<span className="text-primary"> *</span>
          </span>
          <input
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
            className={`${inputClass} font-mono`}
            placeholder="url-friendly-identifier"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            {isNew
              ? "Auto-filled from the title; edit if you need to."
              : "Changing this changes the public URL."}
          </span>
        </label>
        <TextArea label="Description" name="description" defaultValue={defaults.description} rows={3} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Qualification (short)" name="qualification" defaultValue={defaults.qualification} placeholder="e.g. Graduate" />
          <Field label="Age limit" name="age_limit" defaultValue={defaults.age_limit} placeholder="e.g. 21–32 years" />
          <Field label="Application fee" name="application_fee" defaultValue={defaults.application_fee} />
          <Field label="Salary / pay scale" name="salary" defaultValue={defaults.salary} />
        </div>
        <TextArea label="Eligibility" name="eligibility" defaultValue={defaults.eligibility} rows={2} />
        <TextArea label="Selection process" name="selection_process" defaultValue={defaults.selection_process} rows={2} />
        <TextArea label="How to apply" name="application_instructions" defaultValue={defaults.application_instructions} rows={2} />
        <TextArea label="Required documents" name="required_documents" defaultValue={defaults.required_documents} rows={2} />
      </section>

      {/* Key fields */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Dates, vacancies &amp; links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vacancies" name="vacancies" type="number" defaultValue={defaults.vacancies} />
          <Field label="Publication date" name="publication_date" type="date" defaultValue={defaults.publication_date} />
          <Field label="Application starts" name="application_start_date" type="date" defaultValue={defaults.application_start_date} />
          <Field label="Last date to apply" name="application_end_date" type="date" defaultValue={defaults.application_end_date} />
          <Field label="Notification URL" name="notification_url" type="url" defaultValue={defaults.notification_url} />
          <Field label="Application URL" name="application_url" type="url" defaultValue={defaults.application_url} />
          <Field label="Source URL" name="source_url" type="url" defaultValue={defaults.source_url} />
          <Field label="Source name" name="source_name" defaultValue={defaults.source_name} placeholder="e.g. Official notification" />
        </div>
      </section>

      {/* Eligible qualifications */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Eligible qualifications</h2>
        <p className="text-xs text-muted-foreground">
          Drives qualification filtering and the Eligibility Finder.
        </p>
        <div className="flex flex-wrap gap-3">
          {options.qualifications.map((q) => (
            <label
              key={q.id}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
            >
              <input
                type="checkbox"
                name="qualifications"
                value={q.id}
                defaultChecked={defaults.qualificationIds.includes(q.id)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {q.name}
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <span className="text-xs text-muted-foreground">
          Saving keeps this as a draft — publish it from the edit page.
        </span>
      </div>
    </form>
  );
}
