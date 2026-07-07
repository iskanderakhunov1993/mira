# Mira new_mira Setup

## Install

```bash
npm install
```

## Development

```bash
npm run dev --workspace=@mira/web
```

The web app runs on port `4173` by default.

## Checks

```bash
npm run typecheck --workspace=@mira/web
npm run lint --workspace=@mira/web
npm run test --workspace=@mira/web
npm run build --workspace=@mira/web
npm run smoke --workspace=@mira/web
npm run core-flow --workspace=@mira/web
npm run core-flow:cloud --workspace=@mira/web
```

`core-flow` uses Playwright with the system Chrome channel by default. If needed, override it:

```bash
PLAYWRIGHT_CHROME_CHANNEL=chromium npm run core-flow --workspace=@mira/web
```

## Demo Data

Demo data is disabled by default. Enable it only outside production:

```bash
NEXT_PUBLIC_MIRA_DEMO_DATA=true npm run dev --workspace=@mira/web
```

## Supabase Cloud Storage

Mira can save the app data to Supabase. Local storage remains a fallback/cache so the app does not crash when Supabase is unavailable, but new `HealthRepository` writes now push the `healthSnapshot` into the cloud JSON payload when the user is signed in.

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MIRA_DEMO_DATA=false
MIRA_SUPABASE_TEST_EMAIL=mira-test@example.com
MIRA_SUPABASE_TEST_PASSWORD=use-a-long-local-test-password
```

Create the table and RLS policies:

```sql
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  data_version int not null default 1,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_set_updated_at on public.user_data;
create trigger user_data_set_updated_at
before update on public.user_data
for each row execute function public.set_updated_at();

alter table public.user_data enable row level security;

create policy "Users can read own data"
on public.user_data
for select
using (auth.uid() = user_id);

create policy "Users can insert own data"
on public.user_data
for insert
with check (auth.uid() = user_id);

create policy "Users can update own data"
on public.user_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Cloud payload shape:

- `data.healthSnapshot`: new local-first Mira health data used by Today, Add, Calendar, Body, Settings.
- `data.zustand`: legacy/new Zustand mirror.
- remaining `data.*`: legacy Mira local data used by older screens and report bridges.

Verify a real cloud write/read:

```bash
npm run verify:supabase --workspace=@mira/web
```

The verification script signs in or signs up the configured test user, upserts `data.healthSnapshot` into `public.user_data`, reads it back, and fails if the profile, period entry, or daily entry is missing.

Run the full app-to-cloud browser flow:

```bash
npm run core-flow:cloud --workspace=@mira/web
```

This signs in through the app sync UI, completes onboarding, saves a period start and symptom, then reads `public.user_data.data.healthSnapshot` back from Supabase.
