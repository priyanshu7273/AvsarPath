-- ============================================================================
-- AvsarPath — Phase 5 (Part 1): opportunity_posts
--
-- A recruitment notification is really many POSTS (e.g. Clerk, Field Assistant),
-- each with its own vacancy count and conditions. Posts are the SOURCE OF TRUTH
-- for vacancy counts: the app sums post vacancies at read time rather than
-- trusting a (drift-prone) single total on the opportunity. `opportunities.vacancies`
-- stays only as a fallback for opportunities that have no post breakdown.
--
-- RLS mirrors opportunity_translations / exam_events exactly: public read only
-- when the parent opportunity is published + verified; admins manage all.
-- ============================================================================

create table public.opportunity_posts (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  name           text not null,
  department     text,
  vacancies      integer check (vacancies is null or vacancies >= 0),
  pay_level      text,          -- pay level / salary (free text)
  eligibility    text,
  age_limit      text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index opportunity_posts_opportunity_idx on public.opportunity_posts (opportunity_id);

create trigger opportunity_posts_set_updated_at
  before update on public.opportunity_posts
  for each row execute function public.set_updated_at();

-- Row Level Security --------------------------------------------------------
alter table public.opportunity_posts enable row level security;

create policy opportunity_posts_public_read on public.opportunity_posts
  for select using (public.opportunity_is_public(opportunity_id));
create policy opportunity_posts_admin_all on public.opportunity_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Grants (explicit, mirroring 0001; RLS above is the real row gate) ---------
grant select on public.opportunity_posts to anon;
grant select, insert, update, delete on public.opportunity_posts to authenticated;
grant all on public.opportunity_posts to service_role;
