create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'ru',
  goal text,
  training_level text,
  training_place text,
  available_minutes smallint check (available_minutes in (12, 25, 40)),
  cycle_tracking_enabled boolean not null default true,
  cycle_length_days smallint check (cycle_length_days between 15 and 60),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  event_type text not null check (event_type in ('period_start', 'period_end', 'spotting', 'prediction_note')),
  flow_level text check (flow_level in ('light', 'medium', 'heavy', 'not_recorded')),
  confidence text check (confidence in ('low', 'medium', 'high')),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_date, event_type)
);

create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  symptom text not null,
  severity smallint check (severity between 0 and 10),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  energy smallint not null check (energy between 1 and 10),
  mood smallint not null check (mood between 1 and 10),
  sleep_quality text not null check (sleep_quality in ('poor', 'normal', 'good')),
  stress smallint not null check (stress between 1 and 10),
  pain_level smallint not null default 0 check (pain_level between 0 and 10),
  pain_areas jsonb not null default '[]'::jsonb,
  symptoms jsonb not null default '[]'::jsonb,
  workload text not null check (workload in ('light', 'normal', 'heavy')),
  note text,
  resource_level text check (resource_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_date)
);

create table public.work_context_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  workload text not null check (workload in ('light', 'normal', 'heavy')),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_date)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'complete', 'stopped', 'abandoned')),
  intent text not null check (intent in ('recovery', 'light_movement', 'strength', 'progression')),
  duration_minutes smallint not null check (duration_minutes in (12, 25, 40)),
  intensity text not null check (intensity in ('low', 'moderate')),
  rationale text not null,
  policy_version text not null default 'demo-policy-v1',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position smallint not null check (position > 0),
  exercise_name text not null,
  prescription text not null,
  rest text,
  technique_cue text,
  status text not null default 'planned' check (status in ('planned', 'complete', 'skipped', 'replaced', 'stopped_for_pain')),
  replacement_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workout_id, position)
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  image_path text,
  foods jsonb not null default '[]'::jsonb,
  calories_range jsonb,
  macros_range jsonb,
  confidence numeric(3, 2) check (confidence between 0 and 1),
  uncertainty_factors jsonb not null default '[]'::jsonb,
  user_correction jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null check (insight_type in ('cycle', 'symptom', 'workload', 'workout', 'nutrition', 'daily')),
  title text not null,
  explanation text not null,
  confidence text not null check (confidence in ('low', 'medium')),
  period_start date,
  period_end date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.health_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('observe', 'consider', 'urgent')),
  title text not null,
  explanation text not null,
  status text not null default 'active' check (status in ('active', 'dismissed', 'resolved')),
  source_window_start date,
  source_window_end date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.doctor_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_data jsonb not null,
  generated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  source text not null check (source in ('demo', 'fallback', 'ai')),
  model text,
  prompt_version text,
  schema_version text not null,
  policy_version text not null,
  safety_outcome text,
  latency_ms integer check (latency_ms >= 0),
  estimated_cost_usd numeric(10, 6) check (estimated_cost_usd >= 0),
  fallback_reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms', 'privacy', 'cycle_tracking', 'body_scan', 'wearables', 'doctor_report')),
  version text not null,
  granted boolean not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, consent_type, version)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text not null check (provider in ('app_store', 'stripe', 'manual')),
  product_id text,
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index cycle_logs_user_date_idx on public.cycle_logs (user_id, local_date desc);
create index symptom_logs_user_date_idx on public.symptom_logs (user_id, local_date desc);
create index daily_checkins_user_date_idx on public.daily_checkins (user_id, local_date desc);
create index work_context_logs_user_date_idx on public.work_context_logs (user_id, local_date desc);
create index workouts_user_date_idx on public.workouts (user_id, local_date desc);
create index workout_exercises_user_workout_idx on public.workout_exercises (user_id, workout_id);
create index meal_logs_user_date_idx on public.meal_logs (user_id, local_date desc);
create index insights_user_created_idx on public.insights (user_id, created_at desc);
create index health_flags_user_created_idx on public.health_flags (user_id, created_at desc);
create index doctor_reports_user_created_idx on public.doctor_reports (user_id, created_at desc);
create index ai_runs_user_created_idx on public.ai_runs (user_id, created_at desc);
create index consents_user_type_idx on public.consents (user_id, consent_type);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger cycle_logs_set_updated_at before update on public.cycle_logs for each row execute function public.set_updated_at();
create trigger symptom_logs_set_updated_at before update on public.symptom_logs for each row execute function public.set_updated_at();
create trigger daily_checkins_set_updated_at before update on public.daily_checkins for each row execute function public.set_updated_at();
create trigger work_context_logs_set_updated_at before update on public.work_context_logs for each row execute function public.set_updated_at();
create trigger workouts_set_updated_at before update on public.workouts for each row execute function public.set_updated_at();
create trigger workout_exercises_set_updated_at before update on public.workout_exercises for each row execute function public.set_updated_at();
create trigger meal_logs_set_updated_at before update on public.meal_logs for each row execute function public.set_updated_at();
create trigger insights_set_updated_at before update on public.insights for each row execute function public.set_updated_at();
create trigger health_flags_set_updated_at before update on public.health_flags for each row execute function public.set_updated_at();
create trigger doctor_reports_set_updated_at before update on public.doctor_reports for each row execute function public.set_updated_at();
create trigger consents_set_updated_at before update on public.consents for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.cycle_logs enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.work_context_logs enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.meal_logs enable row level security;
alter table public.insights enable row level security;
alter table public.health_flags enable row level security;
alter table public.doctor_reports enable row level security;
alter table public.ai_runs enable row level security;
alter table public.consents enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users manage own profiles" on public.profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own cycle logs" on public.cycle_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own symptom logs" on public.symptom_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own daily checkins" on public.daily_checkins for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own work context" on public.work_context_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own workouts" on public.workouts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own workout exercises" on public.workout_exercises for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own meal logs" on public.meal_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own insights" on public.insights for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own health flags" on public.health_flags for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own doctor reports" on public.doctor_reports for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own AI runs" on public.ai_runs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own consents" on public.consents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own subscriptions" on public.subscriptions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
