-- ============================================================================
-- AvsarPath — initial schema (Phase 2)
-- Indian Exam & Opportunities Tracker
--
-- Translatable opportunity text lives in `opportunity_translations` so Hindi
-- (and other locales) can be added by INSERTing rows, with no schema change.
-- Row Level Security is enabled on every table. Public clients (anon +
-- authenticated) see only published, verified public content and their own
-- private rows. Privileged writes happen server-side with the service-role
-- key, which bypasses RLS; these policies are the defence-in-depth guard.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;      -- case-insensitive email

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role            as enum ('user', 'admin');
create type opportunity_type     as enum ('job', 'exam', 'admission', 'scholarship', 'apprenticeship', 'internship');
create type verification_status  as enum ('pending_verification', 'verified', 'needs_review', 'updated', 'expired', 'cancelled');
create type opportunity_status   as enum ('upcoming', 'open', 'closed', 'expired', 'cancelled');
create type application_status   as enum ('interested', 'planning_to_apply', 'applied', 'admit_card_released', 'examination_completed', 'result_declared');
create type exam_event_type      as enum ('application_start', 'application_end', 'exam', 'admit_card', 'result', 'answer_key', 'interview', 'notice', 'other');
create type date_status          as enum ('official', 'tentative', 'expected');
create type source_access_method as enum ('manual', 'rss', 'api', 'dataset');
create type source_status        as enum ('active', 'paused', 'blocked', 'error');
create type audit_action         as enum ('create', 'update', 'publish', 'unpublish', 'verify', 'date_change', 'delete');

-- ----------------------------------------------------------------------------
-- Shared helper functions
-- ----------------------------------------------------------------------------

-- Keep updated_at current on UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles  (extends auth.users; we never store passwords ourselves)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  role               user_role not null default 'user',
  display_name       text,
  locale_preference  text not null default 'en',
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Is the current user an admin? SECURITY DEFINER so it reads `profiles`
-- without triggering that table's own RLS (prevents policy recursion). Defined
-- after `profiles` exists so the SQL function body validates at creation time.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile row automatically when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change a role (blocks self-promotion to admin).
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ----------------------------------------------------------------------------
-- organisations
-- ----------------------------------------------------------------------------
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  website     text,
  description text,
  created_at  timestamptz not null default now()
);
create index organisations_slug_idx on public.organisations (slug);

-- ----------------------------------------------------------------------------
-- categories  (self-referential tree: Government Jobs -> Banking, etc.)
-- ----------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  parent_id  uuid references public.categories (id) on delete set null,
  sort_order integer not null default 0
);
create index categories_parent_idx on public.categories (parent_id);

-- ----------------------------------------------------------------------------
-- states
-- ----------------------------------------------------------------------------
create table public.states (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  slug text not null unique
);

-- ----------------------------------------------------------------------------
-- qualifications  (lookup; drives filtering + the Eligibility Finder)
-- ----------------------------------------------------------------------------
create table public.qualifications (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  rank       smallint not null default 0,  -- display ordering only (10th < 12th < ...)
  sort_order integer not null default 0
);

-- ----------------------------------------------------------------------------
-- opportunities  (structured fields; translatable text lives in translations)
-- ----------------------------------------------------------------------------
create table public.opportunities (
  id                     uuid primary key default gen_random_uuid(),
  organisation_id        uuid references public.organisations (id) on delete set null,
  category_id            uuid not null references public.categories (id) on delete restrict,
  state_id               uuid references public.states (id) on delete set null, -- null = central/all-India
  opportunity_type       opportunity_type not null,
  vacancies              integer check (vacancies is null or vacancies >= 0),
  application_start_date date,
  application_end_date    date,
  publication_date       date,  -- exam/admit/result dates live in exam_events (date_status aware)
  notification_url       text,
  application_url        text,
  source_url             text,
  source_name            text,
  verification_status    verification_status not null default 'pending_verification',
  opportunity_status     opportunity_status not null default 'upcoming',
  is_published           boolean not null default false,
  published_at           timestamptz,
  last_verified_at       timestamptz,
  created_by             uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- A row may only be published once it is verified/updated.
  constraint published_requires_verification check (
    not is_published or verification_status in ('verified', 'updated')
  ),
  constraint application_dates_ordered check (
    application_start_date is null
    or application_end_date is null
    or application_end_date >= application_start_date
  )
);
create index opportunities_category_idx       on public.opportunities (category_id);
create index opportunities_state_idx          on public.opportunities (state_id);
create index opportunities_organisation_idx   on public.opportunities (organisation_id);
create index opportunities_type_idx           on public.opportunities (opportunity_type);
create index opportunities_verification_idx   on public.opportunities (verification_status);
create index opportunities_status_idx         on public.opportunities (opportunity_status);
create index opportunities_end_date_idx       on public.opportunities (application_end_date);
create index opportunities_publication_idx    on public.opportunities (publication_date desc);
-- Fast path for the public listing (published + newest first).
create index opportunities_published_idx
  on public.opportunities (is_published, published_at desc);

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- opportunity_translations  (one row per locale; 'en' is required for v1)
-- ----------------------------------------------------------------------------
create table public.opportunity_translations (
  id                       uuid primary key default gen_random_uuid(),
  opportunity_id           uuid not null references public.opportunities (id) on delete cascade,
  locale                   text not null,
  slug                     text not null,
  title                    text not null,
  description              text,
  qualification            text,
  eligibility              text,
  age_limit                text,
  application_fee          text,
  salary                   text,
  selection_process        text,
  application_instructions text,
  required_documents       text,
  -- Full-text search vector (title + description + qualification), maintained
  -- by Postgres so it can never drift. 'simple' config keeps acronyms/proper
  -- nouns intact (e.g. "SSC CGL") and stays correct for future Hindi rows.
  search_tsv tsvector generated always as (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(qualification, ''))
  ) stored,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (opportunity_id, locale),
  unique (locale, slug)
);
create index opportunity_translations_slug_idx on public.opportunity_translations (locale, slug);
create index opportunity_translations_search_idx on public.opportunity_translations using gin (search_tsv);

create trigger opportunity_translations_set_updated_at
  before update on public.opportunity_translations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- exam_events  (calendar + results/admit-cards/answer-keys/notices)
-- ----------------------------------------------------------------------------
create table public.exam_events (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  event_type     exam_event_type not null,
  title          text,
  event_date     date,
  date_status    date_status not null default 'tentative',
  source_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index exam_events_opportunity_idx on public.exam_events (opportunity_id);
create index exam_events_type_date_idx   on public.exam_events (event_type, event_date);
create index exam_events_date_idx        on public.exam_events (event_date);

create trigger exam_events_set_updated_at
  before update on public.exam_events
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- opportunity_qualifications  (join: qualifications that make a person eligible)
-- Drives qualification filtering and the Eligibility Finder.
-- ----------------------------------------------------------------------------
create table public.opportunity_qualifications (
  opportunity_id   uuid not null references public.opportunities (id) on delete cascade,
  qualification_id uuid not null references public.qualifications (id) on delete cascade,
  primary key (opportunity_id, qualification_id)
);
create index opportunity_qualifications_qual_idx on public.opportunity_qualifications (qualification_id);

-- ----------------------------------------------------------------------------
-- saved_opportunities  (owner-only)
-- ----------------------------------------------------------------------------
create table public.saved_opportunities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
create index saved_opportunities_user_idx on public.saved_opportunities (user_id);

-- ----------------------------------------------------------------------------
-- application_tracking  (owner-only)
-- ----------------------------------------------------------------------------
create table public.application_tracking (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  opportunity_id     uuid not null references public.opportunities (id) on delete cascade,
  application_status application_status not null default 'interested',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
create index application_tracking_user_idx on public.application_tracking (user_id);

create trigger application_tracking_set_updated_at
  before update on public.application_tracking
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- content_sources  (registry for future automation; admin-only)
-- ----------------------------------------------------------------------------
create table public.content_sources (
  id             uuid primary key default gen_random_uuid(),
  source_name    text not null,
  source_url     text not null unique,
  access_method  source_access_method not null default 'manual',
  robots_allowed boolean,
  source_status  source_status not null default 'active',
  last_checked_at timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger content_sources_set_updated_at
  before update on public.content_sources
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- audit_logs  (append-only; admin read only)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  administrator_id uuid references auth.users (id) on delete set null,
  entity_type      text not null default 'opportunity',
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  action           audit_action not null,
  old_values       jsonb,
  new_values       jsonb,
  created_at       timestamptz not null default now()
);
create index audit_logs_opportunity_idx on public.audit_logs (opportunity_id);
create index audit_logs_admin_idx       on public.audit_logs (administrator_id);
create index audit_logs_created_idx     on public.audit_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- newsletter_subscribers  (inserts via server/service-role; admin read)
-- ----------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           citext not null unique,
  confirmed       boolean not null default false,
  confirm_token   uuid not null default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ----------------------------------------------------------------------------
-- contact_messages  (inserts via server/service-role; admin read)
-- ----------------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      citext not null,
  subject    text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles                enable row level security;
alter table public.organisations           enable row level security;
alter table public.categories              enable row level security;
alter table public.states                  enable row level security;
alter table public.qualifications          enable row level security;
alter table public.opportunities           enable row level security;
alter table public.opportunity_qualifications enable row level security;
alter table public.opportunity_translations enable row level security;
alter table public.exam_events             enable row level security;
alter table public.saved_opportunities     enable row level security;
alter table public.application_tracking    enable row level security;
alter table public.content_sources         enable row level security;
alter table public.audit_logs              enable row level security;
alter table public.newsletter_subscribers  enable row level security;
alter table public.contact_messages        enable row level security;

-- profiles: a user sees/updates only their own row; admins see all.
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Reference tables: public read, admin write.
create policy organisations_read on public.organisations
  for select using (true);
create policy organisations_admin_write on public.organisations
  for all using (public.is_admin()) with check (public.is_admin());

create policy categories_read on public.categories
  for select using (true);
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy states_read on public.states
  for select using (true);
create policy states_admin_write on public.states
  for all using (public.is_admin()) with check (public.is_admin());

create policy qualifications_read on public.qualifications
  for select using (true);
create policy qualifications_admin_write on public.qualifications
  for all using (public.is_admin()) with check (public.is_admin());

-- opportunities: public sees only published + verified; admins manage all.
create policy opportunities_public_read on public.opportunities
  for select using (
    is_published and verification_status in ('verified', 'updated')
  );
create policy opportunities_admin_all on public.opportunities
  for all using (public.is_admin()) with check (public.is_admin());

-- Helper predicate reused by translations/events: is the parent opportunity
-- publicly visible?
create or replace function public.opportunity_is_public(opp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.opportunities o
    where o.id = opp_id
      and o.is_published
      and o.verification_status in ('verified', 'updated')
  );
$$;

create policy opportunity_translations_public_read on public.opportunity_translations
  for select using (public.opportunity_is_public(opportunity_id));
create policy opportunity_translations_admin_all on public.opportunity_translations
  for all using (public.is_admin()) with check (public.is_admin());

create policy exam_events_public_read on public.exam_events
  for select using (public.opportunity_is_public(opportunity_id));
create policy exam_events_admin_all on public.exam_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy opportunity_qualifications_public_read on public.opportunity_qualifications
  for select using (public.opportunity_is_public(opportunity_id));
create policy opportunity_qualifications_admin_all on public.opportunity_qualifications
  for all using (public.is_admin()) with check (public.is_admin());

-- Private user data: owner-only.
create policy saved_opportunities_owner on public.saved_opportunities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy application_tracking_owner on public.application_tracking
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin-only operational tables.
create policy content_sources_admin_all on public.content_sources
  for all using (public.is_admin()) with check (public.is_admin());

-- Audit logs: admins read; writes happen server-side with the service role.
create policy audit_logs_admin_read on public.audit_logs
  for select using (public.is_admin());

-- Newsletter / contact: admins read; inserts happen server-side (service role).
create policy newsletter_admin_read on public.newsletter_subscribers
  for select using (public.is_admin());
create policy contact_messages_admin_read on public.contact_messages
  for select using (public.is_admin());

-- ============================================================================
-- Role grants
--
-- RLS (above) decides which ROWS a role may touch, but PostgreSQL still needs
-- table-level privileges before a role may touch a table at all. Supabase's
-- API keys map to database roles: the publishable/anon key -> `anon`, a
-- signed-in user -> `authenticated`, the secret/service_role key ->
-- `service_role` (which bypasses RLS for trusted server-side work). Granting
-- here plus the RLS policies above is the standard Supabase model: a grant only
-- lets a role *attempt* an operation; the policies then allow it per-row or
-- deny it. No policy permits anon or non-admin writes, so the broad grants
-- below cannot leak — RLS is the real gate. (Supabase normally auto-grants
-- these, but relying on that is non-portable; we grant explicitly.)
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;

-- anon is read-only; RLS restricts which rows are returned.
grant select on all tables in schema public to anon;

-- authenticated users read and write; RLS limits writes to their own rows
-- (owner policies) or to admins (is_admin policies).
grant select, insert, update, delete on all tables in schema public to authenticated;

-- service_role performs privileged server-side work (and bypasses RLS).
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Give tables/sequences/functions added by later migrations the same grants.
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
