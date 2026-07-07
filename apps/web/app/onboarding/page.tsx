"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { LocalHealthRepository } from "@/data/healthRepository";
import {
  checkInOptions,
  factorOptions,
  goalOptions,
  onboardingCopy,
  optionalTrackerOptions,
  periodStartOptions,
  regularityOptions,
  trackerLabels,
} from "@/features/onboarding/options";
import {
  buildHealthSnapshotUpdates,
  createInitialOnboardingDraft,
  periodStartForDraft,
} from "@/features/onboarding/mappers";
import type { CycleRegularity, InitialCheckIn, OnboardingDraft, OnboardingFactor, OnboardingGoal, PeriodStartMode } from "@/features/onboarding/types";
import { syncDerivedStoresFromHealthSnapshot } from "@/lib/healthSnapshotClientSync";
import type { TrackerPreference } from "@/types/health";

const totalSteps = 7;

function isoDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function optionButtonClass(active: boolean) {
  return [
    "flex min-h-[64px] w-full items-center justify-between gap-3 rounded-[18px] border px-4 text-left transition active:scale-[0.99]",
    active
      ? "border-[var(--mira-token-accent)] bg-[color-mix(in_srgb,var(--mira-token-accent)_12%,var(--mira-token-card))]"
      : "border-[var(--mira-token-border)] bg-[var(--mira-token-card)]",
  ].join(" ");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>(() => createInitialOnboardingDraft());
  const repository = useMemo(() => new LocalHealthRepository(), []);

  const progress = ((step + 1) / totalSteps) * 100;
  const selectedPeriodStart = periodStartForDraft(draft);

  function patchDraft(patch: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleFactor(id: OnboardingFactor) {
    setDraft((current) => {
      if (id === "none" || id === "prefer_not") return { ...current, factors: [id] };
      const withoutExclusive = current.factors.filter((factor) => factor !== "none" && factor !== "prefer_not");
      const next = withoutExclusive.includes(id) ? withoutExclusive.filter((factor) => factor !== id) : [...withoutExclusive, id];
      return { ...current, factors: next };
    });
  }

  function toggleTracker(id: TrackerPreference) {
    setDraft((current) => {
      const required = ["cycle", "wellbeing", "mood", "energy", "water"];
      if (required.includes(id)) return current;
      const next = current.trackers.includes(id)
        ? current.trackers.filter((tracker) => tracker !== id)
        : [...current.trackers, id];
      return { ...current, trackers: next };
    });
  }

  async function completeOnboarding() {
    setSaving(true);
    const updates = buildHealthSnapshotUpdates(draft);
    await repository.saveProfile(updates.profile);
    await repository.saveSettings(updates.settings);
    if (updates.cycle) await repository.saveCycle(updates.cycle);
    if (updates.dailyEntry) await repository.saveDailyEntry(updates.dailyEntry);

    const snapshot = await repository.getSnapshot();
    if (snapshot.ok) syncDerivedStoresFromHealthSnapshot(snapshot.data);

    setSaving(false);
    router.replace("/today");
  }

  function goNext() {
    if (step === totalSteps - 1) {
      void completeOnboarding();
      return;
    }
    setStep((current) => Math.min(totalSteps - 1, current + 1));
  }

  function skipOptional() {
    if (step === 3) patchDraft({ regularity: draft.regularity ?? "unknown" });
    if (step === 4) patchDraft({ factors: draft.factors.length ? draft.factors : ["prefer_not"] });
    if (step === 6) patchDraft({ initialCheckIn: draft.initialCheckIn ?? "normal" });
    goNext();
  }

  return (
    <main className="min-h-screen bg-[var(--mira-token-background)] px-5 py-6 text-[var(--mira-token-foreground)]">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-md flex-col">
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] ${step === 0 ? "invisible" : ""}`}
            aria-label="Назад"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--mira-token-card-muted)]"
            role="progressbar"
            aria-label="Прогресс онбординга"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step + 1}
            aria-valuetext={`Шаг ${step + 1} из ${totalSteps}`}
          >
            <div className="h-full rounded-full bg-[var(--mira-token-accent)]" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-black text-[var(--mira-token-muted)]">{step + 1}/{totalSteps}</span>
        </header>

        <section className="flex flex-1 flex-col pt-7">
          {step === 0 && (
            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--mira-token-card)] text-[var(--mira-token-accent)]">
                <Sparkles className="h-8 w-8" />
              </div>
              <h1 className="text-[44px] font-black leading-none">{onboardingCopy.welcomeTitle}</h1>
              <p className="mt-3 text-2xl font-black">{onboardingCopy.welcomeSubtitle}</p>
              <p className="mt-4 text-base font-semibold leading-relaxed text-[var(--mira-token-muted)]">{onboardingCopy.welcomeBody}</p>
            </div>
          )}

          {step === 1 && (
            <>
              <h1 className="text-[32px] font-black leading-none">Что хочется получить от Mira?</h1>
              <div className="mt-6 space-y-3">
                {goalOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Цель: ${option.label}`}
                    onClick={() => patchDraft({ goal: option.id as OnboardingGoal })}
                    className={optionButtonClass(draft.goal === option.id)}
                  >
                    <span className="font-black">{option.label}</span>
                    {draft.goal === option.id && <Check className="h-5 w-5 text-[var(--mira-token-accent)]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[32px] font-black leading-none">Последние месячные</h1>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">Можно продолжить без даты. Mira не будет делать точный прогноз, пока данных мало.</p>
              <div className="mt-6 space-y-3">
                <label className="block rounded-[18px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] p-4">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--mira-token-muted)]">Дата первого дня</span>
                  <input
                    aria-label="Дата первого дня последних месячных"
                    type="date"
                    value={draft.lastPeriodStart}
                    onChange={(event) => patchDraft({ lastPeriodStart: event.target.value, periodStartMode: "date" })}
                    className="mt-3 h-12 w-full rounded-[14px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 text-base font-black outline-none"
                  />
                </label>
                {periodStartOptions.filter((option) => option.id !== "date").map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Последние месячные: ${option.label}`}
                    onClick={() => patchDraft({ periodStartMode: option.id as PeriodStartMode })}
                    className={optionButtonClass(draft.periodStartMode === option.id)}
                  >
                    <span className="font-black">{option.label}</span>
                    {draft.periodStartMode === option.id && <Check className="h-5 w-5 text-[var(--mira-token-accent)]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[32px] font-black leading-none">Регулярность</h1>
              <div className="mt-6 space-y-3">
                {regularityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Регулярность: ${option.label}`}
                    onClick={() => patchDraft({ regularity: option.id as CycleRegularity })}
                    className={optionButtonClass(draft.regularity === option.id)}
                  >
                    <span className="font-black">{option.label}</span>
                    {draft.regularity === option.id && <Check className="h-5 w-5 text-[var(--mira-token-accent)]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-[32px] font-black leading-none">Есть ли важные факторы?</h1>
              <div className="mt-6 space-y-3">
                {factorOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Фактор: ${option.label}`}
                    onClick={() => toggleFactor(option.id as OnboardingFactor)}
                    className={optionButtonClass(draft.factors.includes(option.id as OnboardingFactor))}
                  >
                    <span className="font-black">{option.label}</span>
                    {draft.factors.includes(option.id as OnboardingFactor) && <Check className="h-5 w-5 text-[var(--mira-token-accent)]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="text-[32px] font-black leading-none">Что отслеживать?</h1>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">Базовые трекеры уже включены. Остальные можно менять позже.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[...draft.trackers.filter((tracker) => ["cycle", "wellbeing", "mood", "energy", "water"].includes(tracker)), ...optionalTrackerOptions.map((option) => option.id)].map((tracker) => {
                  const active = draft.trackers.includes(tracker);
                  const required = ["cycle", "wellbeing", "mood", "energy", "water"].includes(tracker);
                  return (
                    <button
                      key={tracker}
                      type="button"
                      aria-label={`Трекер: ${trackerLabels[tracker]}`}
                      aria-pressed={active}
                      onClick={() => toggleTracker(tracker)}
                      className={`min-h-[70px] rounded-[18px] border p-3 text-left transition ${
                        active ? "border-[var(--mira-token-accent)] bg-[color-mix(in_srgb,var(--mira-token-accent)_12%,var(--mira-token-card))]" : "border-[var(--mira-token-border)] bg-[var(--mira-token-card)]"
                      }`}
                    >
                      <span className="block text-sm font-black">{trackerLabels[tracker]}</span>
                      {required && <span className="mt-1 block text-[11px] font-bold text-[var(--mira-token-muted)]">по умолчанию</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className="text-[32px] font-black leading-none">Как ты сегодня?</h1>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {checkInOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Первый check-in: ${option.label}`}
                    onClick={() => patchDraft({ initialCheckIn: option.id as InitialCheckIn })}
                    className={optionButtonClass(draft.initialCheckIn === option.id)}
                  >
                    <span className="font-black">{option.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-[18px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] p-4">
                <p className="text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">
                  {selectedPeriodStart ? `Старт цикла: ${selectedPeriodStart}` : "Дата не указана. Приложение откроется без точного прогноза."}
                </p>
              </div>
            </>
          )}
        </section>

        <footer className="sticky bottom-0 mt-auto bg-[var(--mira-token-background)]/92 py-4 backdrop-blur">
          {(step === 3 || step === 4 || step === 6) && (
            <button
              type="button"
              className="mb-3 w-full rounded-full px-4 py-3 text-sm font-black text-[var(--mira-token-muted)]"
              onClick={skipOptional}
              aria-label="Пропустить необязательный шаг"
            >
              Пропустить
            </button>
          )}
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--mira-token-accent)] text-base font-black text-white disabled:opacity-60"
            onClick={goNext}
            disabled={saving}
            aria-label={step === totalSteps - 1 ? "Завершить онбординг" : "Продолжить онбординг"}
          >
            {saving ? "Сохраняем..." : step === totalSteps - 1 ? "Открыть Today" : "Продолжить"}
            {!saving && <ChevronRight className="h-5 w-5" />}
          </button>
        </footer>
      </div>
    </main>
  );
}
