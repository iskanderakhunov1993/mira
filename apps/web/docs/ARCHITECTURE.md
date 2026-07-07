# Mira Web/PWA Architecture

The current MVP is a Next App Router PWA with local-first persistence and optional Supabase sync. It is not yet the native Expo app.

## Runtime

- App shell: Next App Router under `apps/web/app`.
- Main user routes: `/onboarding`, `/today`, `/add`, `/calendar`, `/analysis`, `/body`, `/track`, `/report`, `/profile`, `/settings`.
- The app must run without Supabase environment variables.
- Supabase/cloud sync is a staged optional feature for backup and cross-device testing, not a production-critical dependency for the MVP.

## Data Layers

Mira currently has two local data shapes:

- New health snapshot: `HealthRepository` and `LocalHealthRepository`, stored under `mira-new-health-v1`.
- Legacy Mira local data: `MiraLocalData`, stored under `mira:data`, still used by older report/diary screens.

The bridge files keep these shapes aligned:

- `lib/healthSnapshotBridge.ts`: snapshot to/from legacy data.
- `lib/healthSnapshotClientSync.ts`: syncs repository snapshots into legacy/Zustand views.
- `lib/miraStoreBridge.ts`: merges Zustand state into legacy report data.
- `lib/localDataToStore.ts`: hydrates Zustand from legacy data.

Do not add a third persistence layer. New facts should flow through the repository, legacy store, or these bridges.

## Cycle Logic

Cycle semantics must stay consistent across screens:

- New route models use `features/cycle/model.ts`.
- Legacy helpers use `lib/cycleEngine.ts`, which mirrors the same rules: sorted unique period starts, close-start collapse inside a bleeding window, median completed cycle length, delay when the current cycle exceeds the effective length.
- Store hydration in `lib/localDataToStore.ts` uses `getCycleNorm` for current day and delay-aware `daysUntilPeriod`.

Any change to cycle day, delay, period forecast, or deduplication needs tests for both new route models and legacy bridge behavior.

## Report And Privacy

There are two report surfaces:

- `/body`: new health snapshot doctor summary.
- `/report`: legacy-compatible doctor report and TXT export.

Both must keep sensitive data opt-in:

- sex and contraception off by default;
- personal notes off by default;
- nutrition/calories excluded by default unless an explicit opt-in section is added;
- labs included only when selected in the relevant report surface.

## Verification

Use these checks for P0 work:

```bash
npm run lint --workspace=@mira/web
npm run test --workspace=@mira/web
npm run smoke --workspace=@mira/web
npm run core-flow --workspace=@mira/web
```

`smoke` and `core-flow` require a running app on `http://127.0.0.1:4173` unless `MIRA_BASE_URL` is set.

Use this check only when Supabase test credentials are configured:

```bash
npm run verify:supabase --workspace=@mira/web
```

Passing this script means the staged cloud path can authenticate, upsert, and read back one test snapshot. It does not by itself make cloud sync production-ready; that requires release-level auth, RLS, conflict, logout, and multi-device manual QA.
