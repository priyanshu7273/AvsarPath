# Supabase setup & migrations

This folder holds the database schema and seed data for AvsarPath.

```
supabase/
  migrations/0001_initial_schema.sql   # tables, enums, indexes, triggers, RLS
  seed.sql                             # reference data (real) + demo data (dev only)
```

## 1. Create the free Supabase project

1. Sign up / sign in at <https://supabase.com> (GitHub login works).
2. **New project** → pick a name (e.g. `avsarpath`), a strong database
   password (save it in your password manager), and the region closest to
   India (e.g. **South Asia (Mumbai)**). Free plan is fine.
3. Wait for the project to finish provisioning (~2 min).

## 2. Put the keys into `.env.local`

In the project dashboard → **Project Settings → API**, copy:

| Dashboard value            | `.env.local` variable             | Exposed to browser? |
| -------------------------- | --------------------------------- | ------------------- |
| Project URL                | `NEXT_PUBLIC_SUPABASE_URL`        | Yes (safe)          |
| `anon` `public` key        | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes (safe)          |
| `service_role` `secret` key| `SUPABASE_SERVICE_ROLE_KEY`       | **No — server only**|

> The `service_role` key bypasses Row Level Security. Never prefix it with
> `NEXT_PUBLIC` and never use it in client code. `.env.local` is git-ignored.

Restart `npm run dev` after editing `.env.local`. Visit `/api/health` — it
should report `"supabase":"connected"`.

## 3. Apply the schema

**Option A — SQL editor (simplest, no install):**
1. Dashboard → **SQL Editor → New query**.
2. Paste the entire contents of `migrations/0001_initial_schema.sql`, run it.
3. (Dev only) Paste `seed.sql` and run it to load reference + demo data.

**Option B — Supabase CLI (version-controlled, recommended longer-term):**
```bash
npm install -D supabase
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies migrations/
```
Seed in dev with:
```bash
npx supabase db execute --file supabase/seed.sql
```

## Important notes

- **`seed.sql` Part B is demonstration data for local development only.** Every
  demo row is prefixed `[DEMO]` and sourced as "Demonstration data". Do **not**
  run Part B against production — those are not real notifications.
- Row Level Security is ON for every table. Public visitors can read only
  published, verified opportunities and their own private rows. Admin and
  privileged writes run server-side with the `service_role` key.
- To make yourself an admin after signing up (later phases), set your
  `profiles.role` to `admin` via the SQL editor.
