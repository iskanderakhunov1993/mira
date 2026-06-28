"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, HeartPulse, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateKey, getCheckIn, saveCheckIn } from "@/lib/store";
import type { BadEpisode, BadSymptom, MiraLocalData } from "@/lib/types";

const symptoms: Array<{ id: BadSymptom; label: string; tone?: "alert" }> = [
  { id: "abdominal_pain", label: "Болит живот" },
  { id: "heavy_bleeding", label: "Сильно льёт", tone: "alert" },
  { id: "dizziness", label: "Кружится голова", tone: "alert" },
  { id: "fainting", label: "Обморок", tone: "alert" },
  { id: "nausea", label: "Тошнит" },
  { id: "no_energy", label: "Нет сил" },
  { id: "anxiety", label: "Тревога" },
  { id: "crying", label: "Плачу" },
  { id: "sharp_pain", label: "Резкая боль", tone: "alert" },
  { id: "pain_after_sex", label: "Боль после секса", tone: "alert" },
  { id: "delay", label: "Задержка" },
  { id: "mid_cycle_bleeding", label: "Кровь между месячными", tone: "alert" },
];

const labels = Object.fromEntries(symptoms.map((symptom) => [symptom.id, symptom.label])) as Record<BadSymptom, string>;

function buildEpisode(selected: BadSymptom[]): Omit<BadEpisode, "id" | "savedAt"> {
  const has = (symptom: BadSymptom) => selected.includes(symptom);
  const doctorSignals = [
    has("heavy_bleeding") && has("dizziness"),
    has("fainting"),
    has("sharp_pain"),
    has("pain_after_sex"),
    has("mid_cycle_bleeding"),
  ].some(Boolean);
  const watchSignals = [
    has("heavy_bleeding"),
    has("dizziness"),
    has("no_energy"),
    has("delay"),
    has("abdominal_pain"),
  ].some(Boolean);

  const severity: BadEpisode["severity"] = doctorSignals ? "doctor" : watchSignals ? "watch" : "self_care";
  const selectedLabels = selected.map((symptom) => labels[symptom].toLowerCase()).join(", ");

  const summary = doctorSignals
    ? "Есть симптомы, которые лучше не объяснять только циклом."
    : watchSignals
      ? "Это может быть связано с циклом, ПМС или началом месячных, но за состоянием стоит понаблюдать."
      : "Похоже на состояние, которое часто бывает на фоне цикла, стресса или усталости.";

  const actions = [
    "Снизь нагрузку на ближайшие часы и не заставляй себя через силу.",
    "Выпей воды, поешь что-то тёплое или сытное, если давно не ела.",
    has("abdominal_pain") ? "Если обычно помогает тепло, приложи тёплую грелку к животу." : "Сделай паузу: тихое место, медленное дыхание, меньше экрана.",
    has("anxiety") || has("crying") ? "Назови вслух: “мне сейчас плохо, но это состояние пройдёт”. Напиши пару строк в дневник." : "Запиши симптомы в дневник, чтобы Mira увидела повтор.",
  ];

  const watch = [
    "Отметь, усиливается или снижается симптом в течение 1-2 часов.",
    "Если появилась новая необычная боль, слабость или температура, не жди несколько дней.",
    has("delay") ? "Если был секс и есть задержка, сделай тест. При повторяющихся задержках лучше обсудить цикл со специалистом." : "Если такое повторяется несколько циклов подряд, это полезно вынести в отчёт врачу.",
  ];

  const doctor = [
    has("heavy_bleeding") ? "Если прокладка полностью промокает примерно за час или есть большие сгустки, лучше обратиться за медицинской помощью." : "",
    has("dizziness") ? "Если кружится голова, темнеет в глазах или трудно стоять, лучше не оставаться одной." : "",
    has("fainting") ? "Обморок во время месячных или кровотечения лучше не списывать на цикл — стоит обратиться за медицинской помощью." : "",
    has("sharp_pain") ? "Резкая необычная боль — повод обратиться к врачу, особенно если она усиливается или появилась внезапно." : "",
    has("pain_after_sex") ? "Боль после секса, особенно с кровью или повтором, лучше обсудить с врачом." : "",
    has("mid_cycle_bleeding") ? "Кровь между месячными, если повторяется или сопровождается болью, лучше обсудить с врачом." : "",
    "Если боль очень сильная, необычная для тебя или не проходит, лучше обратиться к врачу.",
  ].filter(Boolean);

  return {
    symptoms: selected,
    severity,
    summary: selectedLabels ? `${summary} Сейчас отмечено: ${selectedLabels}.` : summary,
    actions,
    watch,
    doctor,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
};

export function BadStateModal({ open, onClose, data, persist }: Props) {
  const [selected, setSelected] = useState<BadSymptom[]>([]);
  const [saved, setSaved] = useState(false);
  const episode = useMemo(() => buildEpisode(selected), [selected]);

  if (!open) return null;

  function toggle(symptom: BadSymptom) {
    setSaved(false);
    setSelected((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]);
  }

  function saveEpisode() {
    if (selected.length === 0) return;
    const today = dateKey();
    const existing = getCheckIn(data, today);
    const nextEpisode: BadEpisode = {
      ...episode,
      id: `bad-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const nextCheckIn = {
      ...(existing ?? {}),
      date: today,
      savedAt: new Date().toISOString(),
      badEpisodes: [...(existing?.badEpisodes ?? []), nextEpisode],
      note: existing?.note ?? { text: `Мне плохо: ${selected.map((symptom) => labels[symptom]).join(", ")}` },
    };
    persist(saveCheckIn(data, nextCheckIn));
    setSaved(true);
  }

  const severityTone = episode.severity === "doctor"
    ? "border-mira-cycle/25 bg-[#F8E8EE]/65 text-mira-cycle"
    : episode.severity === "watch"
      ? "border-[#C4B07E]/25 bg-[#F5F0E0]/55 text-[#9A7B2F]"
      : "border-mira-success/20 bg-[#E0F5E8]/45 text-mira-success";

  const content = (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-cycle">Быстрая помощь</p>
          <h2 className="mt-1 text-xl font-bold text-mira-text">Мне плохо</h2>
          <p className="mt-1 text-sm leading-relaxed text-mira-muted">Выбери, что сейчас беспокоит. Mira даст короткий план, но не заменяет врача.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-mira-muted hover:bg-mira-lavender-light">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {symptoms.map((symptom) => {
          const active = selected.includes(symptom.id);
          return (
            <button
              key={symptom.id}
              onClick={() => toggle(symptom.id)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                active
                  ? symptom.tone === "alert"
                    ? "border-mira-cycle bg-[#F8E8EE] text-mira-cycle"
                    : "border-mira-primary bg-mira-lavender-light text-mira-primary"
                  : "border-mira-lavender/30 bg-white text-mira-muted"
              }`}
            >
              {symptom.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <div className="space-y-3">
          <div className={`rounded-lg border p-3 ${severityTone}`}>
            <div className="mb-2 flex items-center gap-2">
              {episode.severity === "doctor" ? <Stethoscope className="h-4 w-4" /> : <HeartPulse className="h-4 w-4" />}
              <p className="text-xs font-bold uppercase tracking-widest">
                {episode.severity === "doctor" ? "Лучше не игнорировать" : episode.severity === "watch" ? "Наблюдать внимательно" : "Самопомощь"}
              </p>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-mira-text">{episode.summary}</p>
          </div>

          <PlanBlock title="Что сделать сейчас" items={episode.actions} icon={<CheckCircle2 className="h-4 w-4" />} />
          <PlanBlock title="Когда наблюдать" items={episode.watch} icon={<AlertCircle className="h-4 w-4" />} />
          <PlanBlock title="Когда лучше к врачу" items={episode.doctor} icon={<Stethoscope className="h-4 w-4" />} />

          <Button className="w-full" onClick={saveEpisode}>
            {saved ? "Сохранено в дневник" : "Сохранить эпизод"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-mira-lavender/40 bg-mira-bg p-4 text-center">
          <p className="text-sm font-bold text-mira-text">Выбери хотя бы один симптом</p>
          <p className="mt-1 text-xs text-mira-muted">План появится сразу, без длинной анкеты.</p>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 hidden w-[440px] overflow-y-auto border-l border-mira-lavender/20 bg-white p-6 shadow-soft lg:block">
        {content}
      </motion.div>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-mira-lavender/20 bg-white p-5 shadow-soft lg:hidden">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mira-lavender" />
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function PlanBlock({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-mira-lavender/20 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-mira-primary">
        {icon}
        <p className="text-xs font-bold uppercase tracking-widest">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-mira-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-lavender" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
