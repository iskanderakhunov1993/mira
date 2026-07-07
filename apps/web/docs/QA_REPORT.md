# Mira Web MVP QA Report

Date: 2026-07-08
Scope: current `@mira/web` Next/PWA implementation on branch `new_mira`.

## Executive Summary

The current web MVP passes TypeScript, unit tests, route smoke, interaction smoke, and visual/accessibility QA in mobile light/dark viewports. The implementation covers the staged Mira web foundation: onboarding mappers, Today model states, Add mappers, Calendar model, Body model, Settings model, repository persistence, report privacy checks, and bridge coverage for legacy screens.

This is not yet the full Expo/React Native production MVP described in the original master prompt. Mobile-only requirements such as Expo SQLite, SecureStore, Notifications, Local Authentication, Expo Print/Sharing, React Native component tests, and iOS/Android manual QA remain open.

## Commands Run

```bash
npm run lint --workspace=@mira/web
npm run test --workspace=@mira/web
npm run smoke --workspace=@mira/web
npm run core-flow --workspace=@mira/web
npm run visual-qa --workspace=@mira/web
curl -I --max-time 8 http://127.0.0.1:4173/today
kill 84503 && sleep 1 && npm run dev --workspace=@mira/web
npm run smoke --workspace=@mira/web
```

## Results

- TypeScript: passed via `npm run lint --workspace=@mira/web`.
- Unit tests: passed, 43/43.
- First smoke run: failed because an existing `next-server` process was listening on port `4173` but timed out on every route.
- Dev server restart: succeeded, Next ready on `http://127.0.0.1:4173`.
- Second smoke run: passed for `/onboarding`, `/today`, `/calendar`, `/body`, `/add`, `/settings`, `/track`, `/profile`, `/report`, and `/analysis`.
- Core flow: passed for onboarding -> Add validation -> Today -> quick period start -> quick symptom -> Calendar -> Analytics -> Report privacy TXT export -> Body TXT/PDF export -> Settings validation -> Offline -> dark-theme mobile route. The saved `healthSnapshot` contained a completed profile, cycles, today's period start, and symptom.
- Visual QA: passed for 14 mobile screenshots across light and dark modes. Checks cover horizontal overflow, accessible control names, minimum touch targets, and nonblank route rendering.

Node `MODULE_TYPELESS_PACKAGE_JSON` warnings were removed by marking `@mira/web` as an ES module package.

## Coverage By Prompt Area

### Prompt 1: Project Foundation

Status: mostly done as a web/Next adaptation.

Covered:
- Routes exist for onboarding, Today, Calendar, Body, Add, Settings, Track, Profile, Report, and Analysis.
- Foundation folders exist under `apps/web`: `app`, `components`, `features`, `data`, `db`, `lib`, `types`, `constants`, `docs`, `tests`.
- UI primitives exist: Button, IconButton, Card, Chip, BottomSheet, Screen, EmptyState, Toast.
- Theme tokens exist for light/dark direction.
- Local repository interface and `LocalHealthRepository` exist.
- Demo seed is separated and gated.
- Docs exist for architecture, setup, product spec, and this QA report.
- Repository tests exist.

Open:
- Storage is browser snapshot/local storage style, not Expo SQLite.
- No mobile Expo Router structure is present.

### Prompt 2: Onboarding And Profile

Status: partially done.

Covered:
- Onboarding route exists.
- Onboarding options and mappers cover goals, period date unknown, current period, irregular cycle, tracker defaults, and privacy defaults.
- Unit tests cover mapper paths.

Open:
- Native screen-reader manual QA still remains for VoiceOver/TalkBack.
- Persistence after browser restart is covered indirectly by repository and interaction tests, not by a dedicated restart E2E.

### Prompt 3: Today

Status: partially to mostly done for web model.

Covered:
- Today model supports empty state, ordinary day, first period day, period soon range, and long cycle cautious copy.
- Quick tracker selection supports water, sleep, and basal temperature fallback.
- Tests cover core Today states.
- Route smoke passed.

Open:
- Forecast logic in Today should be audited against the Calendar median/range algorithm so cycle-day, delay, and next-period logic stay consistent across screens.
- Loading/offline states need visual/manual QA.
- Dark theme contrast was not manually verified.

### Prompt 4: Add

Status: partially done.

Covered:
- Add route exists.
- Mappers cover period start, water, sleep, pain, symptoms, and context events.
- Tests cover saving partial records and non-diagnostic pain handling.

Open:
- Full rendered bottom-sheet flow was not browser-tested.
- Need verification that every Add scenario immediately updates Today, Calendar, Body, Analytics, and Report where applicable.
- Need validation/error-state UI QA.

### Prompt 5: Calendar And Cycle Algorithm

Status: partially to mostly done in model tests.

Covered:
- Calendar route exists.
- Tests cover median, forecast range, irregular cycle copy, no data, early period start overriding forecast, and ignoring multiple starts inside one cycle.

Open:
- Need browser/manual QA for month navigation, selected-day card, density, localization, and dark mode.
- Need integration audit that Calendar algorithm is the single source or is consistently mirrored by Today/Analytics/Report.

### Prompt 6: My Body, Insights, PDF

Status: partially done.

Covered:
- Body route/model exists.
- Body tests cover rhythm summary, insight gating by cycles/sample size, and doctor summary without sensitive defaults.
- Report route smoke passed and existing Report screen includes privacy controls.

Open:
- PDF generation and share fallback need dedicated tests.
- Need audit that insights always include sample size/reliability and never imply diagnosis or causality.
- Need verify sexual data, personal notes, nutrition, and calories are off by default in all export paths.

### Prompt 7: Notifications, Settings, Privacy

Status: partially done for settings model, mostly open for mobile capabilities.

Covered:
- Settings route/model exists.
- Tests cover tracker toggles without deleting old data, water target clamping, custom symptoms, and JSON export.
- Privacy defaults exist in health settings.

Open:
- No Expo Notifications implementation.
- No Expo Local Authentication / Face ID / PIN lock.
- No SecureStore for sensitive settings.
- Need full local data delete confirmation QA.
- Need permission-denied behavior for notifications/biometrics in mobile build.

### Prompt 8: QA, Accessibility, Final Acceptance

Status: started.

Covered:
- TypeScript, unit tests, and smoke route checks were run.
- This QA report documents current coverage and risks.

Open:
- No Playwright interaction smoke for onboarding -> add period -> calendar -> insight.
- No iOS/Android manual checks.
- No screen reader, Dynamic Type, or touch-target audit.
- No component visual regression or screenshot checks.

## Test Cases

### Automated Currently Covered

- Add mapper saves period start and creates a cycle.
- Add mapper increments water and validates custom water amount.
- Add mapper saves sleep with optional hours.
- Add mapper saves pain without medical diagnosis.
- Add mapper saves symptoms and context events.
- Body model summarizes rhythm.
- Body model gates insights by completed cycles and sample size.
- Body model builds doctor summary without sensitive defaults.
- Calendar model computes median from completed cycles.
- Calendar forecast uses range and sample size.
- Calendar handles irregular cycles with wider copy.
- Calendar handles absence of data.
- Calendar lets user data override forecast for early period start.
- Calendar ignores multiple period starts inside one cycle.
- Health snapshot bridge exposes repository profile and daily data to legacy screens.
- Onboarding mapper handles full path with period date.
- Onboarding mapper allows unknown date.
- Onboarding mapper treats current period as today.
- Onboarding mapper stores irregular cycle without forcing prediction precision.
- Onboarding mapper keeps default and optional trackers.
- Onboarding mapper preserves privacy defaults.
- Repository creates and updates profile locally.
- Repository upserts daily entries and cycles.
- Repository tolerates empty/broken storage and resets.
- Settings toggles trackers without deleting old data.
- Settings clamps water target.
- Settings manages custom symptoms.
- Settings JSON export includes local snapshot.
- Today model renders empty state without profile.
- Today model detects first period day.
- Today model shows period soon as a range.
- Today model notices long cycle cautiously.
- Today model picks water quick tracker and insight sample.
- Route smoke returns 200 for primary routes.
- Browser core flow saves onboarding, period start, and symptom into `mira-new-health-v1`, then verifies Calendar and Body.

### Manual Checks Still Needed

- Onboarding can be completed from UI, skipped where allowed, and does not block Today when last period date is unknown.
- Settings can restart onboarding.
- Add UI supports every quick tracker and shows short "Записано." toast.
- Repeated same-day entries are allowed and do not overwrite unrelated fields.
- Today updates after Add without refresh.
- Calendar month navigation and selected-day card work on mobile widths.
- Body/Analytics insight copy includes sample size and cautious language.
- Report privacy controls keep sex and personal notes off by default.
- Export buttons work without backend.
- JSON export and full local delete work with confirmation.
- Offline route and offline runtime behavior are usable.
- Dark theme contrast is acceptable.
- Screen reader labels and focus order are acceptable.

## iOS And Android Manual Checks

These remain open because the current checked target is `@mira/web`, not an Expo native build.

- Install and launch native app with no network.
- Complete onboarding with and without last period date.
- Add period start, symptom, pain, mood, sleep, water, basal temperature, and context event.
- Verify Calendar forecast and user-confirmed days.
- Verify Face ID/PIN setup, denial, failure, and fallback.
- Verify notification permission denied/granted paths.
- Verify no notification contains intimate data.
- Export PDF and share through native share sheet.
- Delete all local data and relaunch.
- Test dynamic text size, VoiceOver/TalkBack, contrast, and 44px touch targets.

## Remaining Risks

- Current implementation is a Next/PWA web MVP, not the requested final Expo/React Native app.
- Local storage snapshot is not the normalized table schema from the master prompt.
- Native Expo-only capabilities remain out of scope for this web/PWA MVP.
- Supabase/cloud sync is staged optional, not release-critical production sync.
- VoiceOver/TalkBack and Dynamic Type still need manual device validation.

## Recommended Next Actions

1. Run manual VoiceOver/TalkBack and Dynamic Type checks on real devices.
2. Decide whether to commit the current web/PWA MVP as one foundation commit or split it by feature area.
3. If cloud sync becomes release-critical, run a separate production-readiness pass for auth, RLS, conflict handling, logout, and multi-device sync.
