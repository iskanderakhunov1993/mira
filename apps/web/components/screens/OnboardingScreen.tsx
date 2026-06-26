"use client";

import { useState, useMemo } from "react";
import { Check, ChevronRight, Shield, Lock, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiraLogo } from "@/components/ui/MiraLogo";
import { saveProfile, getCyclePhase, getPhaseLabel } from "@/lib/store";
import { getAgeConfig, getAgeGroup } from "@/lib/ageMode";
import type { MiraLocalData, UserProfile, TrackingCategory, CyclePhase } from "@/lib/types";

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

const phaseColors: Record<CyclePhase, string> = {
  menstruation: "#E8A0B8",
  follicular: "#B8A5D8",
  ovulation: "#D4A0C8",
  luteal: "#D4CCE6",
};

const phaseData: { phase: CyclePhase; name: string; days: string; hormone: string; feeling: string; color: string }[] = [
  { phase: "menstruation", name: "Менструальная", days: "1–5 день", hormone: "Эстроген и прогестерон на минимуме", feeling: "Усталость, возможна боль, хочется отдыха", color: "border-[#E8A0B8] bg-[#F5E0EA]" },
  { phase: "follicular", name: "Фолликулярная", days: "6–13 день", hormone: "Эстроген растёт", feeling: "Энергия, мотивация, ясность мышления", color: "border-[#B8A5D8] bg-[#EDE8F5]" },
  { phase: "ovulation", name: "Овуляторная", days: "14–16 день", hormone: "Пик эстрогена", feeling: "Максимум энергии, уверенности, либидо", color: "border-[#D4A0C8] bg-[#F0E0F0]" },
  { phase: "luteal", name: "Лютеиновая", days: "17–28 день", hormone: "Прогестерон растёт, потом падает", feeling: "ПМС, тревога, тяга к сладкому, плохой сон", color: "border-[#D4CCE6] bg-[#EDE8F5]" },
];

const concerns = [
  { id: "pain", label: "Болезненные месячные", desc: "Спазмы, боль внизу живота", icon: "🔴" },
  { id: "pms", label: "ПМС", desc: "Раздражительность, тревога, тяга к еде", icon: "😤" },
  { id: "irregular", label: "Нерегулярный цикл", desc: "Задержки, разная длина", icon: "📅" },
  { id: "sleep", label: "Проблемы со сном", desc: "Бессонница, плохой сон", icon: "🌙" },
  { id: "energy", label: "Нет энергии", desc: "Усталость, упадок сил", icon: "⚡" },
  { id: "doctor", label: "Подготовка к врачу", desc: "Хочу прийти с фактами", icon: "🩺" },
];

const phaseInsights: Record<CyclePhase, { title: string; body: string; tips: string[] }> = {
  menstruation: {
    title: "Сейчас менструальная фаза",
    body: "Гормоны на минимуме. Энергия может быть ниже — это нормально. Тело обновляется.",
    tips: ["Тёплая еда и питьё", "Продукты с железом: гречка, шпинат", "Лёгкая прогулка или растяжка", "Больше отдыха — ты заслуживаешь"],
  },
  follicular: {
    title: "Сейчас фолликулярная фаза",
    body: "Эстроген растёт. Ты можешь чувствовать прилив сил и мотивации. Хорошее время для активности.",
    tips: ["Силовая тренировка или бег", "Белок и сложные углеводы", "Время для новых начинаний", "Твоё тело сейчас на подъёме"],
  },
  ovulation: {
    title: "Сейчас овуляторная фаза",
    body: "Пик эстрогена. Энергия и уверенность на максимуме. Ты можешь чувствовать себя лучше всего за весь цикл.",
    tips: ["Интенсивная тренировка", "Социальная активность", "Антиоксиданты: ягоды, орехи", "Пик продуктивности — используй это"],
  },
  luteal: {
    title: "Сейчас лютеиновая фаза",
    body: "Прогестерон растёт, потом падает. Могут появиться ПМС-симптомы: раздражительность, тяга к сладкому, плохой сон. Это не ты — это гормоны.",
    tips: ["Магний: бананы, шоколад, орехи", "Ранний сон — прогестерон мешает спать", "Лёгкая активность или йога", "Будь мягче к себе"],
  },
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
  const [age, setAge] = useState<number | undefined>();
  const [periodStart, setPeriodStart] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [privateMarks, setPrivateMarks] = useState(true);
  const [hiddenNotifications, setHiddenNotifications] = useState(false);

  const ageConfig = getAgeConfig(age);
  const totalSteps = 8;

  function next() { setDir(1); setStep(s => Math.min(s + 1, totalSteps - 1)); }
  function back() { setDir(-1); setStep(s => Math.max(s - 1, 0)); }

  const currentPhase = useMemo(() => {
    if (!periodStart) return "follicular" as CyclePhase;
    const start = new Date(periodStart);
    const today = new Date();
    const days = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
    const cycleDay = (days % cycleLength) + 1;
    return getCyclePhase(cycleDay, periodLength, cycleLength);
  }, [periodStart, cycleLength, periodLength]);

  const currentCycleDay = useMemo(() => {
    if (!periodStart) return 14;
    const start = new Date(periodStart);
    const today = new Date();
    const days = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
    return (days % cycleLength) + 1;
  }, [periodStart, cycleLength]);

  function toggleConcern(id: string) {
    setSelectedConcerns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function finish() {
    const trackingPrefs: TrackingCategory[] = ["cycle", "pain", "mood", "energy", "sleep"];
    if (selectedConcerns.includes("doctor")) trackingPrefs.push("nutrition");
    if (selectedConcerns.includes("pain")) trackingPrefs.push("intimacy");

    const profile: UserProfile = {
      name: name.trim() || "Моя Норма",
      age,
      showCalories: false,
      cycleConfig: {
        periodStart: periodStart || new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10),
        cycleLength,
        periodLength,
      },
      trackingPreferences: trackingPrefs,
      additionalMode: "none",
      pinEnabled: false,
      hiddenNotifications,
      privateMarks,
    };
    persist({ ...saveProfile(data, profile), onboardingCompleted: true });
    onComplete();
  }

  const isWelcome = step === 0;
  const isAgeStep = step === 1;
  const isPhaseEducation = step === 2;
  const isResult = step === totalSteps - 1;

  const bgStyle = isWelcome
    ? { background: "linear-gradient(145deg, #D8CCF0 0%, #C4B0E8 20%, #B8A0E0 40%, #A890D0 60%, #9880C8 80%, #8870B8 100%)" }
    : isResult
      ? { background: `linear-gradient(165deg, ${phaseColors[currentPhase]}30 0%, #F8F5FE 50%, #F8F5FE 100%)` }
      : (isPhaseEducation || isAgeStep)
        ? { background: "linear-gradient(165deg, #F8F5FE 0%, #EDE8F5 100%)" }
        : undefined;

  const phaseInsight = phaseInsights[currentPhase];

  function renderStep() {
    switch (step) {
      // ── 0. Welcome ──
      case 0:
        return (
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.1 }}
              className="animate-float"
            >
              <MiraLogo size={110} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-5xl font-bold tracking-tight text-white drop-shadow-lg"
            >
              Моя Норма
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-3 text-base text-white/80">Твоё тело проходит через 4 фазы каждый цикл.</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-1 text-sm text-white/50">Мы поможем тебе понять, что происходит и почему.</motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="mt-10 w-full space-y-3">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Как тебя зовут?"
                className="w-full rounded-2xl border border-white/25 bg-white/15 px-5 py-4 text-sm text-white placeholder:text-white/50 backdrop-blur-md focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all duration-200 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]" />
              <button onClick={next}
                className="w-full rounded-2xl bg-white/20 py-4 text-sm font-bold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/30 hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)] active:scale-[0.97] border border-white/10">
                Узнать свою норму <ChevronRight className="ml-1 inline h-4 w-4" />
              </button>
            </motion.div>
          </div>
        );

      // ── 1. Age ──
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-mira-text text-center">Сколько тебе лет?</h2>
            <p className="mt-1 text-xs text-mira-muted text-center">Мы адаптируем приложение под твой возраст</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { range: "10–14", value: 13, emoji: "🌸", label: "Только начинаю" },
                { range: "15–17", value: 16, emoji: "🌷", label: "Подросток" },
                { range: "18–24", value: 21, emoji: "🌹", label: "Молодая" },
                { range: "25–34", value: 28, emoji: "🌺", label: "Активная" },
                { range: "35–44", value: 38, emoji: "🌻", label: "Зрелая" },
                { range: "45+", value: 48, emoji: "🌼", label: "Мудрая" },
              ].map(opt => (
                <button key={opt.range} onClick={() => { setAge(opt.value); }}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition active:scale-[0.97] ${
                    age === opt.value ? "border-mira-primary bg-mira-lavender-light" : "border-mira-lavender/20"
                  }`}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={`text-sm font-bold ${age === opt.value ? "text-mira-primary" : "text-mira-text"}`}>{opt.range}</span>
                  <span className="text-[10px] text-mira-muted">{opt.label}</span>
                </button>
              ))}
            </div>

            {age && age < 18 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/40 p-3">
                <p className="text-xs text-mira-success">Мы сделаем приложение простым и понятным. Без лишнего — только то, что тебе нужно.</p>
              </motion.div>
            )}

            {age && age >= 45 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-2xl border border-mira-primary/15 bg-mira-lavender-light/30 p-3">
                <p className="text-xs text-mira-primary">Мы добавим отслеживание симптомов перименопаузы — приливы, перепады, изменения цикла.</p>
              </motion.div>
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next} disabled={!age}>Далее</Button>
            </div>
          </Card>
        );

      // ── 2. Biology education — 4 phases ──
      case 2:
        return (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-mira-text">Твой цикл — это 4 фазы</h2>
              <p className="mt-1 text-sm text-mira-muted">Каждая влияет на энергию, настроение, сон и боль</p>
            </div>

            {/* Cycle ring visualization */}
            <div className="flex justify-center mb-6">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Menstruation */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E8A0B8" strokeWidth="10"
                    strokeDasharray={`${(5/28)*251.3} ${251.3 - (5/28)*251.3}`} strokeDashoffset="0" />
                  {/* Follicular */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#B8A5D8" strokeWidth="10"
                    strokeDasharray={`${(8/28)*251.3} ${251.3 - (8/28)*251.3}`} strokeDashoffset={`${-(5/28)*251.3}`} />
                  {/* Ovulation */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#D4A0C8" strokeWidth="10"
                    strokeDasharray={`${(3/28)*251.3} ${251.3 - (3/28)*251.3}`} strokeDashoffset={`${-(13/28)*251.3}`} />
                  {/* Luteal */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#D4CCE6" strokeWidth="10"
                    strokeDasharray={`${(12/28)*251.3} ${251.3 - (12/28)*251.3}`} strokeDashoffset={`${-(16/28)*251.3}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-mira-text">28 дней</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {phaseData.map((p, i) => (
                <motion.div
                  key={p.phase}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-2xl border p-3.5 ${p.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-mira-text">{p.name}</span>
                    <span className="text-[10px] text-mira-muted">{p.days}</span>
                  </div>
                  <p className="mt-1 text-xs text-mira-muted">{p.hormone}</p>
                  <p className="mt-0.5 text-xs font-medium text-mira-text">{p.feeling}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Определить мою фазу <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        );

      // ── 3. Determine current phase ──
      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-mira-text">Определим твою фазу</h2>
            <p className="mt-1 text-xs text-mira-muted">По этим данным мы сразу покажем, что происходит сейчас</p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
                <label className="text-xs font-semibold text-mira-text">Когда начались последние месячные?</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
              </div>

              <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
                <label className="text-xs font-semibold text-mira-text">Сколько дней длятся месячные?</label>
                <div className="mt-2 flex gap-1.5">
                  {[3, 4, 5, 6, 7].map(d => (
                    <button key={d} onClick={() => setPeriodLength(d)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        periodLength === d ? "bg-mira-primary text-white shadow-glow" : "bg-mira-lavender-light text-mira-muted"
                      }`}>{d}</button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
                <label className="text-xs font-semibold text-mira-text">Обычная длина цикла</label>
                <p className="text-[10px] text-mira-muted mt-0.5">Не знаешь точно? Оставь 28 — мы уточним</p>
                <div className="mt-2 flex gap-1.5">
                  {[25, 26, 27, 28, 30, 32, 35].map(d => (
                    <button key={d} onClick={() => setCycleLength(d)}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                        cycleLength === d ? "bg-mira-primary text-white shadow-glow" : "bg-mira-lavender-light text-mira-muted"
                      }`}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Live phase preview */}
              {periodStart && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border-2 border-mira-primary/20 bg-mira-lavender-light/50 p-4 text-center"
                >
                  <p className="text-xs text-mira-muted">Ты сейчас на</p>
                  <p className="text-2xl font-bold text-mira-text">{currentCycleDay} дне цикла</p>
                  <p className="text-sm font-semibold text-mira-primary">{getPhaseLabel(currentPhase)} фаза</p>
                </motion.div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      // ── 4. What concerns you? ──
      case 4:
        return (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-mira-text">Что тебя беспокоит?</h2>
            <p className="mt-1 text-xs text-mira-muted">Мы настроим аналитику под твои потребности</p>

            <div className="mt-4 space-y-2">
              {concerns.filter(c => {
                if (ageConfig.group === "teen") return !["energy", "doctor"].includes(c.id);
                return true;
              }).map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleConcern(c.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.98] ${
                    selectedConcerns.includes(c.id)
                      ? "border-mira-primary bg-mira-lavender-light"
                      : "border-mira-lavender/30 hover:border-mira-primary/20"
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${selectedConcerns.includes(c.id) ? "text-mira-primary" : "text-mira-text"}`}>
                      {c.label}
                    </p>
                    <p className="text-[11px] text-mira-muted">{c.desc}</p>
                  </div>
                  {selectedConcerns.includes(c.id) && (
                    <Check className="h-4 w-4 text-mira-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {selectedConcerns.length > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-mira-primary font-semibold text-center">
                Мы будем особенно внимательно отслеживать {selectedConcerns.length === 1 ? "это" : "это всё"}
              </motion.p>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      // ── 5. Privacy ──
      case 5:
        return (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-mira-success" />
              <h2 className="text-lg font-bold text-mira-text">Приватность</h2>
            </div>
            <p className="text-xs text-mira-muted">Твои данные — только твои. Навсегда.</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-mira-success" />
                  <p className="text-sm font-semibold text-mira-text">Только на твоём устройстве</p>
                </div>
                <p className="text-xs text-mira-muted">Мы не собираем, не передаём и не продаём твои данные. Всё хранится локально.</p>
              </div>

              {[
                { label: "Приватные отметки", desc: "Интимность скрыта по умолчанию", icon: Heart, on: privateMarks, toggle: () => setPrivateMarks(!privateMarks) },
                { label: "Скрытые уведомления", desc: "Без деталей на экране блокировки", icon: Shield, on: hiddenNotifications, toggle: () => setHiddenNotifications(!hiddenNotifications) },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3.5">
                  <item.icon className="h-4 w-4 text-mira-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                    <p className="text-[11px] text-mira-muted">{item.desc}</p>
                  </div>
                  <Toggle on={item.on} onToggle={item.toggle} />
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Далее</Button>
            </div>
          </Card>
        );

      // ── 6. Education: your current phase ──
      case 6:
        return (
          <div>
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: `${phaseColors[currentPhase]}30` }}
              >
                <span className="text-3xl font-bold" style={{ color: phaseColors[currentPhase] }}>{currentCycleDay}</span>
              </motion.div>
              <h2 className="text-xl font-bold text-mira-text">{name ? `${name}, ` : ""}{phaseInsight.title}</h2>
              <p className="mt-2 text-sm text-mira-muted leading-relaxed max-w-xs mx-auto">{phaseInsight.body}</p>
            </div>

            <Card className="p-5 border-mira-success/15 bg-[#E0F5E8]/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-success mb-3">Что может помочь сейчас</p>
              <ul className="space-y-2.5">
                {phaseInsight.tips.map((tip, i) => (
                  <motion.li
                    key={tip}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-mira-text"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-success/60" />
                    {tip}
                  </motion.li>
                ))}
              </ul>
            </Card>

            {selectedConcerns.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Card className="mt-4 p-4 border-mira-primary/10 bg-mira-lavender-light/30">
                  <p className="text-xs text-mira-primary font-semibold">
                    {selectedConcerns.includes("pain") && "Мы будем отслеживать паттерн боли — в какие дни цикла она появляется. "}
                    {selectedConcerns.includes("pms") && "ПМС-симптомы мы свяжем с фазой цикла. "}
                    {selectedConcerns.includes("sleep") && "Сон мы будем сравнивать по фазам. "}
                    {selectedConcerns.includes("doctor") && "Через 3 цикла у тебя будет готовый отчёт для врача. "}
                    {selectedConcerns.includes("irregular") && "Мы покажем реальный диапазон твоего цикла. "}
                    {selectedConcerns.includes("energy") && "Энергию мы свяжем с гормональными фазами. "}
                  </p>
                </Card>
              </motion.div>
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={back}>Назад</Button>
              <Button className="flex-1" onClick={next}>Начать <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        );

      // ── 7. Final — personalized result ──
      case 7:
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
              className="mt-6 text-2xl font-bold text-mira-text">
              {name ? `${name}, всё готово` : "Всё готово"}
            </motion.h2>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mt-5 w-full space-y-3">

              <Card className="p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${phaseColors[currentPhase]}30` }}>
                    <span className="text-lg font-bold" style={{ color: phaseColors[currentPhase] }}>{currentCycleDay}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-mira-text">День {currentCycleDay}, {getPhaseLabel(currentPhase).toLowerCase()} фаза</p>
                    <p className="text-xs text-mira-muted">{phaseInsight.body.split(".")[0]}.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 text-left border-mira-primary/10 bg-mira-lavender-light/30">
                <p className="text-xs font-semibold text-mira-primary">Мы начинаем строить твою личную норму</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-mira-muted">
                    <span className="h-1.5 w-5 rounded-full bg-mira-lavender" />
                    Первые наблюдения — через 1 цикл
                  </div>
                  <div className="flex items-center gap-2 text-xs text-mira-muted">
                    <span className="h-1.5 w-8 rounded-full bg-mira-primary/50" />
                    Предварительная норма — через 3 цикла
                  </div>
                  <div className="flex items-center gap-2 text-xs text-mira-muted">
                    <span className="h-1.5 w-12 rounded-full bg-mira-primary" />
                    Стабильная норма — через 6 циклов
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="mt-6 w-full">
              <Button className="w-full" size="lg" onClick={finish}>
                Начать отслеживание <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        );
    }
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-4 py-8 transition-colors duration-500 ${!isWelcome && !isPhaseEducation && !isResult ? "bg-mira-bg" : ""}`}
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

      <div className="mt-6 flex gap-2">
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
