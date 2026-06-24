"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiraLogo, MiraFeatureIcons } from "@/components/ui/MiraLogo";
import { saveProfile } from "@/lib/store";
import type { MiraLocalData, UserProfile, TrackingCategory, AdditionalMode, ActivityLevel } from "@/lib/types";

function Chip({ label, active, onClick, disabled }: { label: string; active?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
      active ? "border-mira-primary bg-mira-lavender-light text-mira-primary"
        : disabled ? "border-mira-lavender/20 text-mira-muted opacity-50"
        : "border-mira-lavender/40 bg-white text-mira-muted hover:border-mira-primary/30"
    }`}>{label}</button>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-mira-primary" : "bg-mira-lavender"}`}>
      <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  onComplete: () => void;
};

export function OnboardingScreen({ data, persist, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [tracking, setTracking] = useState<TrackingCategory[]>(["cycle", "pain", "mood", "energy", "sleep"]);
  const [height, setHeight] = useState<number | undefined>();
  const [weight, setWeight] = useState<number | undefined>();
  const [age, setAge] = useState<number | undefined>();
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("medium");
  const [additionalMode, setAdditionalMode] = useState<AdditionalMode>("none");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [hiddenNotifications, setHiddenNotifications] = useState(false);
  const [privateMarks, setPrivateMarks] = useState(true);

  const totalSteps = 7;

  function next() { setDir(1); setStep(s => Math.min(s + 1, totalSteps - 1)); }
  function back() { setDir(-1); setStep(s => Math.max(s - 1, 0)); }
  function toggleTracking(t: TrackingCategory) {
    setTracking(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function finish() {
    const profile: UserProfile = {
      name: name.trim() || "Mira",
      showCalories: true,
      cycleConfig: {
        periodStart: periodStart || new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10),
        cycleLength,
        periodLength,
      },
      trackingPreferences: tracking,
      additionalMode,
      pinEnabled,
      hiddenNotifications,
      privateMarks,
      height,
      weight,
      age,
      activityLevel,
    };
    persist({ ...saveProfile(data, profile), onboardingCompleted: true });
    onComplete();
  }

  const isWelcome = step === 0;
  const isDone = step === totalSteps - 1;

  // Background — gradient for welcome, mira-bg for steps, success-tint for done
  const bgStyle = isWelcome
    ? { background: "linear-gradient(165deg, #E0D4F0 0%, #C8B8E4 25%, #B8A5D8 50%, #A898CC 75%, #9B8EC4 100%)" }
    : isDone
      ? { background: "linear-gradient(165deg, #E8F5EC 0%, #D8EDE0 50%, #F8F5FE 100%)" }
      : undefined;

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-6">
              <MiraLogo size={120} />
              <div className="text-left">
                <h1 className="text-5xl font-bold tracking-tight text-white">Mira</h1>
                <p className="mt-1.5 text-lg text-white/70">понимай свой ритм</p>
              </div>
            </div>
            <div className="mt-10 w-full overflow-x-auto px-2">
              <MiraFeatureIcons light />
            </div>
            <div className="mt-10 w-full space-y-3">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя"
                className="w-full rounded-2xl border border-white/20 bg-white/15 px-4 py-3.5 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white/40 focus:outline-none" />
              <button onClick={next}
                className="w-full rounded-2xl bg-white/20 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30 active:scale-[0.98]">
                Начать
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <Card className="p-6">
            <Badge className="mb-3">2 / {totalSteps}</Badge>
            <h2 className="text-lg font-bold text-mira-text">Настройка цикла</h2>
            <div className="mt-4 space-y-3">
              <Field label="Дата последних месячных">
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
              </Field>
              <Field label="Длина цикла (дни)">
                <input type="number" min={20} max={45} value={cycleLength} onChange={e => setCycleLength(+e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
              </Field>
              <Field label="Длительность месячных (дни)">
                <input type="number" min={2} max={10} value={periodLength} onChange={e => setPeriodLength(+e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card className="p-6">
            <Badge className="mb-3">3 / {totalSteps}</Badge>
            <h2 className="text-lg font-bold text-mira-text">Что отслеживать</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {([
                { id: "cycle" as TrackingCategory, label: "Цикл" },
                { id: "pain" as TrackingCategory, label: "Боль" },
                { id: "mood" as TrackingCategory, label: "Настроение" },
                { id: "energy" as TrackingCategory, label: "Энергия" },
                { id: "sleep" as TrackingCategory, label: "Сон" },
                { id: "nutrition" as TrackingCategory, label: "Питание" },
                { id: "workout" as TrackingCategory, label: "Тренировка" },
                { id: "intimacy" as TrackingCategory, label: "Интимность" },
              ]).map(item => (
                <button key={item.id} onClick={() => toggleTracking(item.id)} className={`rounded-2xl border p-2.5 text-xs font-semibold transition ${
                  tracking.includes(item.id) ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
                }`}>
                  {tracking.includes(item.id) && <Check className="mr-1 inline h-3 w-3" />}{item.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      case 3:
        return (
          <Card className="p-6">
            <Badge className="mb-3">4 / {totalSteps}</Badge>
            <h2 className="text-lg font-bold text-mira-text">Данные для питания</h2>
            <p className="mt-1 text-xs text-mira-muted">Можно пропустить</p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Рост (см)", value: height, set: (v: string) => setHeight(v ? +v : undefined) },
                { label: "Вес (кг)", value: weight, set: (v: string) => setWeight(v ? +v : undefined) },
                { label: "Возраст", value: age, set: (v: string) => setAge(v ? +v : undefined) },
              ].map(f => (
                <Field key={f.label} label={f.label}>
                  <input type="number" value={f.value ?? ""} onChange={e => f.set(e.target.value)}
                    className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
                </Field>
              ))}
              <div>
                <p className="mb-2 text-xs text-mira-muted">Уровень активности</p>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as ActivityLevel[]).map(v => (
                    <Chip key={v} label={{ low: "Низкий", medium: "Средний", high: "Высокий" }[v]} active={activityLevel === v} onClick={() => setActivityLevel(v)} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button variant="ghost" className="flex-1" onClick={next}>Пропустить</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      case 4:
        return (
          <Card className="p-6">
            <Badge className="mb-3">5 / {totalSteps}</Badge>
            <h2 className="text-lg font-bold text-mira-text">Дополнительный режим</h2>
            <p className="mt-1 text-xs text-mira-muted">Необязательно и приватно</p>
            <div className="mt-4 space-y-2">
              {[
                { label: "Без режима", value: "none" as AdditionalMode, enabled: true },
                { label: "Ислам", value: "islam" as AdditionalMode, enabled: true },
                { label: "Христианство · скоро", value: null, enabled: false },
                { label: "Иудаизм · скоро", value: null, enabled: false },
                { label: "Буддизм · скоро", value: null, enabled: false },
              ].map(opt => (
                <button key={opt.label} disabled={!opt.enabled}
                  onClick={() => opt.value && setAdditionalMode(opt.value)}
                  className={`w-full rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                    additionalMode === opt.value ? "border-mira-primary bg-mira-lavender-light text-mira-primary"
                      : opt.enabled ? "border-mira-lavender/30 text-mira-text" : "border-mira-lavender/20 text-mira-muted opacity-50"
                  }`}>{opt.label}</button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      case 5:
        return (
          <Card className="p-6">
            <Badge className="mb-3">6 / {totalSteps}</Badge>
            <h2 className="text-lg font-bold text-mira-text">Приватность</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "PIN-код", desc: "Защита входа", on: pinEnabled, toggle: () => setPinEnabled(!pinEnabled) },
                { label: "Скрытые уведомления", desc: "Без деталей", on: hiddenNotifications, toggle: () => setHiddenNotifications(!hiddenNotifications) },
                { label: "Приватные отметки", desc: "Интимность скрыта", on: privateMarks, toggle: () => setPrivateMarks(!privateMarks) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                  <div>
                    <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                    <p className="text-xs text-mira-muted">{item.desc}</p>
                  </div>
                  <Toggle on={item.on} onToggle={item.toggle} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      case 6:
        return (
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-mira-success/15"
            >
              <Check className="h-10 w-10 text-mira-success" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mt-6 text-3xl font-bold text-mira-text">Mira настроена</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mt-2 text-sm text-mira-muted">Всё готово для отслеживания</motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="mt-8 w-full">
              <Button className="w-full" size="lg" onClick={finish}>Начать</Button>
            </motion.div>
          </div>
        );
    }
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-4 transition-colors duration-500 ${!isWelcome && !isDone ? "bg-mira-bg" : ""}`}
      style={bgStyle}
    >
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="mt-8 flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === step ? 24 : 8 }}
            className={`h-2 rounded-full ${
              isWelcome ? (i === step ? "bg-white" : "bg-white/30")
                : i === step ? "bg-mira-primary" : "bg-mira-lavender"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
      <label className="text-xs text-mira-muted">{label}</label>
      {children}
    </div>
  );
}
