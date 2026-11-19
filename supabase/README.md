# Supabase setup & migrations

This folder holds the database schema and seed data for AvsarPath.

```
supabase/
  migrations/0001_initial_schema.sql   # tables, enums, indexes, triggers, RLS
  migrations/0002_opportunity_posts.sql
  migrations/0003_content_ingestion.sql
  seed-reference.sql                   # REAL reference data — every environment, incl. production
  seed-demo.sql                        # [DEMO] opportunities — development databases ONLY
```

There are two projects: a **dev** project (with demo data) and a separate
**production** project (`avsarpath-prod`, reference data only, zero demo rows).

## 1. Create the free Supabase project

1. Sign in at <https://supabase.com>.
2. **New project** → name (`avsarpath-prod` for production), a strong database
   password (save it in your password manager), plan **Free**.
   Region: **East US (Ohio)** for production. Netlify's free plan runs server
   functions in Ohio (`cmh`) and region choice there is a paid feature, so the
   database sits next to the functions that query it.
3. Wait for the project to finish provisioning (~2 min).

## 2. Keys

Dashboard → **Project Settings → API**:

| Dashboard value            | Variable                          | Exposed to browser? |
| -------------------------- | --------------------------------- | ------------------- |
| Project URL                | `NEXT_PUBLIC_SUPABASE_URL`        | Yes (safe)          |
| `anon` / publishable key   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes (safe)          |
| `service_role` secret key  | `SUPABASE_SERVICE_ROLE_KEY`       | **No — server only**|

Locally these go in `.env.local` (git-ignored). On Netlify, the service-role key
is an environment variable marked **secret**, Production context only.

> The `service_role` key bypasses Row Level Security. Never prefix it with
> `NEXT_PUBLIC` and never use it in client code.

## 3. Apply the schema (SQL Editor → New query)

Run each file as its own query, **in order**:

1. `migrations/0001_initial_schema.sql`
2. `migrations/0002_opportunity_posts.sql`
3. `migrations/0003_content_ingestion.sql`
4. `seed-reference.sql`
5. **Dev only:** `seed-demo.sql`. **Never on production.**

Check that RLS is on for every public table (all rows should say `true`):

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
```

## Important notes

- **`seed-demo.sql` is demonstration data for development only.** Every demo
  row is titled `[DEMO]` and sourced as "Demonstration data". Production gets
  `seed-reference.sql` only.
- Row Level Security is ON for every table. Public visitors can read only
  published, verified opportunities; signed-in users can read and write only
  their own saved items and tracking. Admin and privileged writes run
  server-side with the `service_role` key.
- To make yourself an admin: sign in once (creates your profile), then in the
  SQL editor temporarily disable the `profiles_prevent_role_change` trigger,
  set your `profiles.role` to `admin`, and **re-enable the trigger** — it is
  what blocks users from promoting themselves.
