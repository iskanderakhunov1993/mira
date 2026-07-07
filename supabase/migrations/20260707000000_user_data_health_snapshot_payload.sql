-- Ensure the simple cloud blob used by the current web MVP can store
-- the HealthRepository snapshot under data.healthSnapshot.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  data_version integer not null default 3,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_data
  alter column data set default '{}'::jsonb,
  alter column data_version set default 3;

alter table public.user_data enable row level security;

drop trigger if exists user_data_set_updated_at on public.user_data;
create trigger user_data_set_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();

drop policy if exists "Users manage own data blob" on public.user_data;
create policy "Users manage own data blob"
  on public.user_data
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.user_data is 'Single-user Mira cloud payload. data.healthSnapshot stores the current HealthRepository snapshot.';
comment on column public.user_data.data is 'JSON payload with healthSnapshot, zustand mirror, and legacy MiraLocalData.';
