"use client";

import React, { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type PainStep = "question" | "result" | "saved";

interface PainData {
  symptoms: string[];
  intensity: number | null;
  actions: string[];
}

type SavedPainData = {
  symptoms: string[];
  intensity: number;
  actions: string[];
};

type PainModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenDoctorReport?: () => void;
  onSave?: (data: SavedPainData) => void;
  dateLabel?: string;
  cycleDayLabel?: string;
};

const symptomOptions = ["Сильная боль", "Очень обильные месячные", "Задержка", "Слабость / нет сил", "Тревога / паника", "Тошнота", "Головная боль", "Другое"];
const actionOptions = ["Приняла обезболивающее", "Приложила грелку", "Отдыхаю", "Ничего не помогает"];
const intensityLabels: Record<number, string> = {
  1: "Легко",
  2: "Терпимо",
  3: "Мешает",
  4: "Сильно",
  5: "Очень сильно",
};

function getRecommendation(data: SavedPainData) {
  const tookPainkiller = data.actions.includes("Приняла обезболивающее");
  const nothingHelps = data.actions.includes("Ничего не помогает");

  if (nothingHelps) {
    return "Если обезболивающее не помогает, это может быть признаком серьёзной проблемы. Обратись к врачу без записи.";
  }

  if (data.intensity <= 2) {
    return "Это лёгкая боль. Отдохни и выпей тёплый чай. Если боль не пройдёт — прими обезболивающее.";
  }

  if (data.intensity <= 4 && !tookPainkiller) {
    return "Это умеренная боль. Прими обезболивающее, которое тебе обычно можно, и отдохни. Если боль не пройдёт через 2 часа — покажи этот отчёт врачу.";
  }

  if (data.intensity <= 4 && tookPainkiller) {
    return "Обезболивающее должно помочь через 30–60 минут. Отдохни в тихом месте. Если боль не уменьшится через 2 часа — обратись к врачу.";
  }

  return "Это сильная боль. Пожалуйста, обратись к врачу без записи. Если есть обморок, резкая боль или очень обильное кровотечение — лучше не ждать.";
}

function ToggleChip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
        selected
          ? "border-[#E872A0] bg-[#E872A0] text-white shadow-[0_8px_18px_rgba(232,114,160,0.22)]"
          : "border-[#E8DDE3] bg-white text-[#1A1A1A] hover:border-[#E872A0]/50"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CheckboxRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-left text-sm font-bold text-[#1A1A1A]"
      onClick={onClick}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${checked ? "border-[#E872A0] bg-[#E872A0] text-white" : "border-[#D8CBD2] bg-white"}`}>
        {checked ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

function PainModalComponent({
  open,
  onClose,
  onOpenDoctorReport,
  onSave,
  dateLabel = "30 июня",
  cycleDayLabel = "15-й день цикла",
}: PainModalProps) {
  const [step, setStep] = useState<PainStep>("question");
  const [data, setData] = useState<PainData>({ symptoms: [], intensity: null, actions: [] });

  const completeData = useMemo<SavedPainData>(() => ({
    symptoms: data.symptoms,
    intensity: data.intensity ?? 0,
    actions: data.actions,
  }), [data]);

  const canSubmit = data.symptoms.length > 0 && data.intensity !== null;
  const recommendation = canSubmit ? getRecommendation(completeData) : "";

  if (!open) return null;

  function toggleSymptom(symptom: string) {
    setData((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));
  }

  function toggleAction(action: string) {
    setData((current) => ({
      ...current,
      actions: current.actions.includes(action)
        ? current.actions.filter((item) => item !== action)
        : [...current.actions, action],
    }));
  }

  function resetAndClose() {
    setStep("question");
    setData({ symptoms: [], intensity: null, actions: [] });
    onClose();
  }

  function saveEntry() {
    if (!canSubmit) return;
    onSave?.(completeData);
    setStep("saved");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[20px] bg-white p-5 text-[#1A1A1A] shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
        style={{ animation: "painModalIn 300ms ease both" }}
      >
        <style jsx global>{`
          @keyframes painModalIn {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {step === "question" && (
          <div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1A]">🆘 Мне больно</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-[#8E8E93]">
                  Не волнуйся, я помогу. Ответь на 3 вопроса.
                </p>
              </div>
              <button type="button" className="rounded-full bg-[#FAF8F5] px-3 py-1 text-sm font-black text-[#8E8E93]" onClick={resetAndClose}>
                ×
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <p className="mb-3 text-sm font-black uppercase tracking-widest text-[#1A1A1A]">❓ 1. Что случилось?</p>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map((symptom) => (
                    <ToggleChip key={symptom} selected={data.symptoms.includes(symptom)} onClick={() => toggleSymptom(symptom)}>
                      {symptom}
                    </ToggleChip>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-3 text-sm font-black uppercase tracking-widest text-[#1A1A1A]">❓ 2. Насколько сильно?</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = data.intensity === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`rounded-2xl border px-2 py-3 text-center transition ${
                          active ? "border-[#E872A0] bg-[#FFF0F5] text-[#E872A0]" : "border-[#E8DDE3] bg-white text-[#8E8E93]"
                        }`}
                        onClick={() => setData((current) => ({ ...current, intensity: value }))}
                      >
                        <span className="block text-lg font-black">{value}</span>
                        <span className="mt-1 block text-[10px] font-bold leading-tight">{intensityLabels[value]}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <p className="mb-3 text-sm font-black uppercase tracking-widest text-[#1A1A1A]">❓ 3. Что ты уже сделала?</p>
                <div className="space-y-2">
                  {actionOptions.map((action) => (
                    <CheckboxRow key={action} checked={data.actions.includes(action)} label={action} onClick={() => toggleAction(action)} />
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-[#FAF8F5] p-4">
                <p className="text-sm font-black text-[#1A1A1A]">Что Mira сделает</p>
                <ul className="mt-2 space-y-1 text-sm font-semibold leading-relaxed text-[#8E8E93]">
                  <li>— сохранит это в дневник;</li>
                  <li>— добавит в аналитику;</li>
                  <li>— предложит показать врачу;</li>
                  <li>— подскажет, когда нужна срочная помощь.</li>
                </ul>
              </section>
            </div>

            <Button
              type="button"
              disabled={!canSubmit}
              className="mt-6 h-12 w-full rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E] disabled:bg-[#E5E5EA] disabled:text-[#8E8E93]"
              onClick={() => setStep("result")}
            >
              🔍 Узнать, что делать
            </Button>
            <p className="mt-3 text-center text-xs font-semibold text-[#8E8E93]">
              🔒 Всё сохранится в дневнике и попадёт в аналитику.
            </p>
          </div>
        )}

        {step === "result" && (
          <div>
            <h2 className="text-2xl font-black text-[#1A1A1A]">🩺 Рекомендация</h2>
            <div className="mt-5 rounded-2xl bg-[#FAF8F5] p-4 text-sm font-semibold leading-relaxed text-[#1A1A1A]">
              <p className="font-black">Ты отметила:</p>
              <p className="mt-2">• Симптомы: {completeData.symptoms.join(", ")}</p>
              <p>• Интенсивность: {completeData.intensity} из 5 — {intensityLabels[completeData.intensity]}</p>
              <p>• Что делала: {completeData.actions.length ? completeData.actions.join(", ") : "ничего"}</p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#FFF0F5] p-4">
              <p className="text-sm font-black text-[#1A1A1A]">Что делать:</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#1A1A1A]">{recommendation}</p>
            </div>

            <p className="mt-4 rounded-2xl bg-[#FFF7DE] px-4 py-3 text-sm font-bold leading-relaxed text-[#8A6500]">
              ⚠️ Если боль резкая, есть обморок, очень обильное кровотечение или сильная слабость — лучше обратиться за медицинской помощью.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={onOpenDoctorReport}>
                📋 Открыть отчёт врачу
              </Button>
              <Button type="button" className="rounded-2xl bg-[#34C759] text-white hover:bg-[#2DA84A]" onClick={saveEntry}>
                ✅ Понятно, спасибо
              </Button>
            </div>
          </div>
        )}

        {step === "saved" && (
          <div>
            <h2 className="text-2xl font-black text-[#1A1A1A]">📌 Сохранено в дневнике</h2>
            <div className="mt-5 rounded-2xl bg-[#FAF8F5] p-4 text-sm font-semibold leading-relaxed text-[#1A1A1A]">
              <p>{dateLabel}, {cycleDayLabel}</p>
              <p className="mt-2">
                Симптомы: {completeData.symptoms.join(", ")}, сила {completeData.intensity}/5,{" "}
                {completeData.actions.length ? completeData.actions.join(", ") : "действий не отмечено"}
              </p>
            </div>
            <Button type="button" className="mt-5 w-full rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E]" onClick={resetAndClose}>
              Закрыть
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export const PainModal = memo(PainModalComponent);
PainModal.displayName = "PainModal";

export default PainModal;
