-- ============================================================================
-- AvsarPath — Phase 5 (Part 2): assisted ingestion
--
-- Registered content sources (RSS/Atom feeds) are fetched on demand, and each
-- feed item is STAGED here in `source_items`. Staging is admin-only: ingestion
-- never writes to any public-readable table and never publishes. An admin
-- reviews staged items and imports chosen ones into draft opportunities, which
-- then go through the normal verify + publish workflow.
-- ============================================================================

-- RSS/Atom endpoint for a source (source_url stays the human-facing site URL).
alter table public.content_sources add column if not exists feed_url text;

create type source_item_status as enum ('new', 'dismissed', 'imported');

-- ----------------------------------------------------------------------------
-- source_items  (staging; admin-only)
-- ----------------------------------------------------------------------------
create table public.source_items (
  id                      uuid primary key default gen_random_uuid(),
  source_id               uuid not null references public.content_sources (id) on delete cascade,
  external_id             text not null,            -- feed guid/link; dedup key
  title                   text,
  url                     text,
  summary                 text,
  published_at            timestamptz,
  item_status             source_item_status not null default 'new',
  imported_opportunity_id uuid references public.opportunities (id) on delete set null,
  raw                     jsonb,
  fetched_at              timestamptz not null default now(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (source_id, external_id)
);
create index source_items_status_idx on public.source_items (item_status);
create index source_items_source_idx on public.source_items (source_id);

create trigger source_items_set_updated_at
  before update on public.source_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ingestion_runs  (observability; admin-only)
-- ----------------------------------------------------------------------------
create table public.ingestion_runs (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references public.content_sources (id) on delete cascade,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  items_found  integer not null default 0,
  items_new    integer not null default 0,
  status       text not null default 'ok',
  error        text
);
create index ingestion_runs_source_idx  on public.ingestion_runs (source_id);
create index ingestion_runs_started_idx on public.ingestion_runs (started_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security — admin-only on both (writes happen via the service role)
-- ----------------------------------------------------------------------------
alter table public.source_items   enable row level security;
alter table public.ingestion_runs enable row level security;

create policy source_items_admin_all on public.source_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy ingestion_runs_admin_all on public.ingestion_runs
  for all using (public.is_admin()) with check (public.is_admin());

-- Grants: authenticated (RLS limits to admins) + service_role. anon is not
-- granted here; these staging tables are never public.
grant select, insert, update, delete on public.source_items   to authenticated;
grant select, insert, update, delete on public.ingestion_runs to authenticated;
grant all on public.source_items   to service_role;
grant all on public.ingestion_runs to service_role;
