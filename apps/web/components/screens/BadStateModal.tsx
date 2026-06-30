"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileText, HeartPulse, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateKey, getCheckIn, saveCheckIn } from "@/lib/store";
import type { BadEpisode, BadSymptom, MiraLocalData } from "@/lib/types";

type SymptomOption = {
  id: BadSymptom;
  label: string;
  alert?: boolean;
};

const symptomOptions: SymptomOption[] = [
  { id: "sharp_pain", label: "Сильная боль", alert: true },
  { id: "heavy_bleeding", label: "Очень обильные месячные", alert: true },
  { id: "delay", label: "Задержка" },
  { id: "no_energy", label: "Слабость / нет сил", alert: true },
  { id: "anxiety", label: "Тревога / паника" },
  { id: "nausea", label: "Тошнота" },
  { id: "headache", label: "Головная боль" },
  { id: "other", label: "Другое" },
];

const symptomLabels = Object.fromEntries(symptomOptions.map((symptom) => [symptom.id, symptom.label])) as Partial<Record<BadSymptom, string>>;

type Props = {
  open: boolean;
  onClose: () => void;
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
};

function getSeverity(symptom: BadSymptom | null, intensity: 1 | 2 | 3 | 4 | 5): BadEpisode["severity"] {
  if (!symptom) return "self_care";
  if (symptom === "heavy_bleeding" || symptom === "sharp_pain") return intensity >= 3 ? "doctor" : "watch";
  if (symptom === "no_energy") return intensity >= 4 ? "doctor" : "watch";
  if (symptom === "delay") return intensity >= 4 ? "watch" : "self_care";
  return intensity >= 5 ? "watch" : "self_care";
}

function buildEpisode(symptom: BadSymptom, intensity: 1 | 2 | 3 | 4 | 5): Omit<BadEpisode, "id" | "savedAt"> {
  const severity = getSeverity(symptom, intensity);
  const label = symptomLabels[symptom] ?? "Другое";
  const actions = [
    "Сохранить эпизод в дневник, чтобы не держать детали в голове.",
    "Добавить его в аналитику, чтобы Mira увидела повтор, если это случится снова.",
    "Предложить показать врачу, если симптом сильный или повторяется.",
    "Показать, когда нужна срочная медицинская помощь.",
  ];
  const watch = [
    "Посмотри, усиливается ли симптом в ближайшие 1-2 часа.",
    "Если симптом повторяется несколько циклов подряд, это полезно показать врачу.",
    symptom === "delay" ? "Если была вероятность беременности, сделай тест по инструкции." : "Если состояние необычное для тебя, лучше не ждать несколько дней.",
  ];
  const doctor = [
    "Если боль резкая, есть обморок, очень обильное кровотечение или сильная слабость — лучше обратиться за медицинской помощью.",
    "Если прокладка полностью промокает примерно за час, появляются большие сгустки или трудно стоять — не оставайся одна.",
  ];

  return {
    symptoms: [symptom],
    intensity,
    severity,
    summary: `${label}. Сила: ${intensity} из 5.`,
    actions,
    watch,
    doctor,
  };
}

export function BadStateModal({ open, onClose, data, persist }: Props) {
  const [selected, setSelected] = useState<BadSymptom | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [savedEpisode, setSavedEpisode] = useState<BadEpisode | null>(null);
  const episode = useMemo(() => selected ? buildEpisode(selected, intensity) : null, [selected, intensity]);

  if (!open) return null;

  function resetAndClose() {
    setSavedEpisode(null);
    onClose();
  }

  function saveEpisode() {
    if (!selected || !episode) return;
    const today = dateKey();
    const existing = getCheckIn(data, today);
    const nextEpisode: BadEpisode = {
      ...episode,
      id: `bad-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const noteText = `Мне плохо: ${nextEpisode.summary}`;
    const nextCheckIn = {
      ...(existing ?? {}),
      date: today,
      savedAt: new Date().toISOString(),
      badEpisodes: [...(existing?.badEpisodes ?? []), nextEpisode],
      note: existing?.note ?? { text: noteText },
    };
    persist(saveCheckIn(data, nextCheckIn));
    setSavedEpisode(nextEpisode);
  }

  const content = savedEpisode ? (
    <div>
      <ModalHeader title="Записала" subtitle="Это попадёт в дневник. Если нужно, потом можно показать врачу." onClose={resetAndClose} />

      <div className="rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/45 p-4">
        <div className="mb-2 flex items-center gap-2 text-mira-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-black text-mira-text">Эпизод сохранён</p>
        </div>
        <p className="text-sm leading-relaxed text-mira-muted">{savedEpisode.summary}</p>
      </div>

      {(savedEpisode.severity === "doctor" || savedEpisode.intensity === 5) && (
        <ImportantBlock />
      )}

      <div className="mt-4 grid gap-2">
        <Button onClick={resetAndClose}>Готово</Button>
        <Button variant="outline" onClick={resetAndClose}>
          <FileText className="h-4 w-4" /> Потом добавлю в отчёт
        </Button>
      </div>
    </div>
  ) : (
    <div>
      <ModalHeader title="Что случилось?" subtitle="Выбери главный симптом. Mira сохранит факт и подскажет, когда нужна помощь." onClose={resetAndClose} />

      <div className="grid grid-cols-2 gap-2">
        {symptomOptions.map((symptom) => {
          const active = selected === symptom.id;
          return (
            <button
              key={symptom.id}
              type="button"
              onClick={() => setSelected(symptom.id)}
              className={`min-h-14 rounded-2xl border px-3 py-2 text-left text-sm font-bold transition active:scale-[0.98] ${
                active
                  ? symptom.alert
                    ? "border-mira-cycle bg-[#F8E8EE] text-mira-cycle"
                    : "border-mira-primary bg-mira-lavender-light text-mira-primary"
                  : "border-mira-lavender/25 bg-white text-mira-text hover:border-mira-primary/25"
              }`}
            >
              {symptom.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="text-sm font-black text-mira-text">Насколько сильно?</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(value)}
              className={`h-11 rounded-2xl text-sm font-black transition active:scale-[0.98] ${
                intensity === value ? "bg-mira-primary text-white shadow-glow" : "border border-mira-lavender/25 bg-white text-mira-muted"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-mira-bg p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что Mira сделает</p>
        <ul className="mt-3 space-y-2">
          {[
            "сохранит это в дневник;",
            "добавит в аналитику;",
            "предложит показать врачу;",
            "покажет, когда нужна срочная помощь.",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-mira-text">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {episode?.severity === "doctor" && <ImportantBlock />}

      <Button className="mt-5 w-full" onClick={saveEpisode} disabled={!selected}>
        Сохранить
      </Button>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
        onClick={resetAndClose}
      />
      <motion.div
        initial={{ x: 440 }}
        animate={{ x: 0 }}
        exit={{ x: 440 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 hidden w-[440px] overflow-y-auto border-l border-mira-lavender/20 bg-white p-6 shadow-soft lg:block"
      >
        {content}
      </motion.div>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-mira-lavender/20 bg-white p-5 shadow-soft lg:hidden"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mira-lavender" />
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-cycle">Мне плохо</p>
        <h2 className="mt-1 text-xl font-black text-mira-text">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-mira-muted">{subtitle}</p>
      </div>
      <button onClick={onClose} className="rounded-lg p-2 text-mira-muted hover:bg-mira-lavender-light">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ImportantBlock() {
  return (
    <div className="mt-4 rounded-2xl border border-mira-cycle/20 bg-[#F8E8EE]/45 p-4">
      <div className="mb-2 flex items-center gap-2 text-mira-cycle">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-black text-mira-text">Важно</p>
      </div>
      <p className="text-sm leading-relaxed text-mira-muted">
        Если боль резкая, есть обморок, очень обильное кровотечение или сильная слабость — лучше обратиться за медицинской помощью.
      </p>
    </div>
  );
}
