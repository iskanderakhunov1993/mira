"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { LocalHealthRepository } from "@/data/healthRepository";
import {
  addActions,
  contextOptions,
  energyOptions,
  moodOptions,
  periodOptions,
  sleepOptions,
  symptomOptions,
  waterOptions,
  wellbeingOptions,
} from "@/features/add/options";
import {
  buildRepositoryCycle,
  buildRepositoryEntry,
  createInitialAddDraft,
  todayKey,
  validateAddDraft,
} from "@/features/add/mappers";
import type { AddAction } from "@/features/add/types";
import { syncDerivedStoresFromHealthSnapshot } from "@/lib/healthSnapshotClientSync";

function choiceClass(active: boolean) {
  return `min-h-12 rounded-[8px] border px-3 text-sm font-black transition active:scale-[0.98] ${
    active
      ? "border-[var(--mira-token-accent)] bg-[color-mix(in_srgb,var(--mira-token-accent)_14%,var(--mira-token-card))]"
      : "border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] text-[var(--mira-token-muted)]"
  }`;
}

function isAddAction(value: string | null): value is AddAction {
  return addActions.some((action) => action.id === value);
}

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repository = useMemo(() => new LocalHealthRepository(), []);
  const [draft, setDraft] = useState(() => {
    const initial = createInitialAddDraft();
    const requestedAction = searchParams.get("action");
    return isAddAction(requestedAction) ? { ...initial, action: requestedAction } : initial;
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const error = validateAddDraft(draft);

  function patch(patchDraft: Partial<typeof draft>) {
    setDraft((current) => ({ ...current, ...patchDraft }));
  }

  async function save() {
    const validation = validateAddDraft(draft);
    if (validation) {
      setToast(validation);
      return;
    }

    setSaving(true);
    const entries = await repository.listDailyEntries();
    const existing = entries.ok ? entries.data.find((entry) => entry.date === todayKey()) : undefined;
    const entry = buildRepositoryEntry(existing, draft);
    await repository.saveDailyEntry(entry);
    const cycle = buildRepositoryCycle(draft);
    if (cycle) await repository.saveCycle(cycle);

    const snapshot = await repository.getSnapshot();
    if (snapshot.ok) syncDerivedStoresFromHealthSnapshot(snapshot.data);

    setSaving(false);
    setToast("Записано.");
    window.setTimeout(() => router.push("/today"), 550);
  }

  function renderDetails() {
    if (!draft.action) return null;

    if (draft.action === "period") {
      return (
        <OptionGrid>
          {periodOptions.map((option) => (
            <button key={option.id} type="button" className={choiceClass(draft.periodState === option.id)} onClick={() => patch({ periodState: option.id })}>
              {option.label}
            </button>
          ))}
        </OptionGrid>
      );
    }

    if (draft.action === "wellbeing") {
      return (
        <OptionGrid>
          {wellbeingOptions.map((option) => (
            <button key={option.id} type="button" className={choiceClass(draft.wellbeing === option.id)} onClick={() => patch({ wellbeing: option.id })}>
              {option.label}
            </button>
          ))}
        </OptionGrid>
      );
    }

    if (draft.action === "water") {
      return (
        <>
          <OptionGrid>
            {waterOptions.map((option) => (
              <button key={option.id} type="button" className={choiceClass(draft.waterAmount === option.id)} onClick={() => patch({ waterAmount: option.id })}>
                {option.label}
              </button>
            ))}
          </OptionGrid>
          {draft.waterAmount === "custom" && (
            <input
              aria-label="Свой объём воды в миллилитрах"
              inputMode="numeric"
              value={draft.customWaterMl}
              onChange={(event) => patch({ customWaterMl: event.target.value })}
              className="mt-3 h-12 w-full rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 font-black outline-none"
              placeholder="например 300"
            />
          )}
        </>
      );
    }

    if (draft.action === "energy") {
      return (
        <OptionGrid>
          {energyOptions.map((option) => (
            <button key={option.id} type="button" className={choiceClass(draft.energy === option.id)} onClick={() => patch({ energy: option.id })}>
              {option.label}
            </button>
          ))}
        </OptionGrid>
      );
    }

    if (draft.action === "sleep") {
      return (
        <>
          <OptionGrid>
            {sleepOptions.map((option) => (
              <button key={option.id} type="button" className={choiceClass(draft.sleepQuality === option.id)} onClick={() => patch({ sleepQuality: option.id })}>
                {option.label}
              </button>
            ))}
          </OptionGrid>
          <input
            aria-label="Часы сна, необязательно"
            inputMode="decimal"
            value={draft.sleepHours}
            onChange={(event) => patch({ sleepHours: event.target.value })}
            className="mt-3 h-12 w-full rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 font-black outline-none"
            placeholder="часы сна, необязательно"
          />
        </>
      );
    }

    if (draft.action === "pain") {
      return (
        <div className="space-y-3">
          <input
            aria-label="Место боли"
            value={draft.painLocation}
            onChange={(event) => patch({ painLocation: event.target.value })}
            className="h-12 w-full rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 font-black outline-none"
            placeholder="место боли"
          />
          <label className="block rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] p-3">
            <span className="text-xs font-black text-[var(--mira-token-muted)]">Интенсивность: {draft.painIntensity}/5</span>
            <input
              aria-label="Интенсивность боли"
              type="range"
              min={1}
              max={5}
              value={draft.painIntensity}
              onChange={(event) => patch({ painIntensity: Number(event.target.value) as typeof draft.painIntensity })}
              className="mt-3 w-full"
            />
          </label>
          <OptionGrid>
            {[
              ["none", "Не влияет"],
              ["slightly", "Немного"],
              ["moderately", "Заметно"],
              ["cancelled_plans", "Отменила планы"],
              ["bedridden", "Нужен отдых"],
            ].map(([id, label]) => (
              <button key={id} type="button" className={choiceClass(draft.painAffectedLife === id)} onClick={() => patch({ painAffectedLife: id as typeof draft.painAffectedLife })}>
                {label}
              </button>
            ))}
          </OptionGrid>
        </div>
      );
    }

    if (draft.action === "mood") {
      return (
        <OptionGrid>
          {moodOptions.map((option) => (
            <button key={option.id} type="button" className={choiceClass(draft.mood === option.id)} onClick={() => patch({ mood: option.id })}>
              {option.label}
            </button>
          ))}
        </OptionGrid>
      );
    }

    if (draft.action === "symptom") {
      return (
        <>
          <OptionGrid>
            {symptomOptions.map((option) => (
              <button key={option} type="button" className={choiceClass(draft.symptom === option)} onClick={() => patch({ symptom: option })}>
                {option}
              </button>
            ))}
          </OptionGrid>
          {draft.symptom === "другое" && (
            <input
              aria-label="Свой симптом"
              value={draft.customSymptom}
              onChange={(event) => patch({ customSymptom: event.target.value })}
              className="mt-3 h-12 w-full rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 font-black outline-none"
              placeholder="напишите симптом"
            />
          )}
        </>
      );
    }

    return (
      <div className="space-y-3">
        <OptionGrid>
          {contextOptions.map((option) => (
            <button key={option} type="button" className={choiceClass(draft.context === option)} onClick={() => patch({ context: option })}>
              {option}
            </button>
          ))}
        </OptionGrid>
        <textarea
          aria-label="Заметка, необязательно"
          value={draft.note}
          onChange={(event) => patch({ note: event.target.value })}
          className="min-h-24 w-full rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] p-3 font-semibold outline-none"
          placeholder="детали, необязательно"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--mira-token-background)] text-[var(--mira-token-foreground)]">
      {toast && <Toast message={toast} tone={toast === "Записано." ? "success" : "error"} />}
      <BottomSheet open title={draft.action ? "Уточнить запись" : "Что хотите отметить?"} onClose={() => router.back()}>
        {draft.action && (
          <button type="button" className="mb-3 flex items-center gap-1 text-sm font-black text-[var(--mira-token-muted)]" onClick={() => patch({ action: null })}>
            <ChevronLeft className="h-4 w-4" /> Назад
          </button>
        )}
        {!draft.action ? (
          <div className="grid grid-cols-2 gap-3">
            {addActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button key={action.id} type="button" variant="secondary" className="h-20 flex-col gap-2" aria-label={action.label} onClick={() => patch({ action: action.id as AddAction })}>
                  <Icon className="h-5 w-5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        ) : (
          <div>
            {renderDetails()}
            {error && <p className="mt-3 text-sm font-bold text-[var(--mira-token-accent)]">{error}</p>}
            <Button type="button" className="mt-5 w-full" onClick={save} loading={saving}>
              Записать
            </Button>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
