"use client";

import { useState } from "react";
import {
  Droplets, Activity, Brain, Flame, BedDouble, Heart,
  Sparkles, Salad, BookOpen, RotateCcw, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveCheckIn, dateKey, getCheckIn } from "@/lib/store";
import { IslamicScreen } from "./IslamicScreen";
import type { ScreenProps } from "./types";
import type {
  DailyCheckIn, PeriodIntensity, PeriodType, PainKind, PainLevel,
  MoodValue, EnergyValue, SleepQuality, IntimacyProtection, IntimacyFeeling,
} from "@/lib/types";

type Category = "period" | "pain" | "mood" | "energy" | "sleep" | "intimacy" | "pms" | "nutrition_note" | "note";

const categories: { id: Category; label: string; icon: typeof Droplets; color: string }[] = [
  { id: "period", label: "Месячные", icon: Droplets, color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { id: "pain", label: "Боль", icon: Activity, color: "text-[#C4A07E] bg-[#F5ECE0]" },
  { id: "mood", label: "Настроение", icon: Brain, color: "text-[#9B8EC4] bg-[#EDE8F5]" },
  { id: "energy", label: "Энергия", icon: Flame, color: "text-[#C4B07E] bg-[#F5F0E0]" },
  { id: "sleep", label: "Сон", icon: BedDouble, color: "text-[#7E8EC4] bg-[#E0E8F5]" },
  { id: "intimacy", label: "Интимность", icon: Heart, color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { id: "pms", label: "ПМС", icon: Sparkles, color: "text-[#A07EC4] bg-[#EDE0F5]" },
  { id: "nutrition_note", label: "Питание", icon: Salad, color: "text-[#7BAF8D] bg-[#E0F5E8]" },
  { id: "note", label: "Заметка", icon: BookOpen, color: "text-mira-muted bg-mira-lavender-light" },
];

function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-mira-primary bg-mira-lavender-light text-mira-primary"
          : "border-mira-lavender/40 bg-white text-mira-muted hover:border-mira-primary/30"
      }`}
    >
      {label}
    </button>
  );
}

export function DiaryScreen({ data, persist, onCheckIn }: ScreenProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [tab, setTab] = useState<"tracking" | "islamic">("tracking");
  const existing = getCheckIn(data);
  const isIslamic = data.profile?.additionalMode === "islam";

  // Local form state
  const [periodIntensity, setPeriodIntensity] = useState<PeriodIntensity | null>(existing?.period?.intensity ?? null);
  const [periodType, setPeriodType] = useState<PeriodType | null>(existing?.period?.type ?? null);
  const [painKinds, setPainKinds] = useState<PainKind[]>(existing?.pain?.kinds ?? []);
  const [painLevel, setPainLevel] = useState<PainLevel | null>(existing?.pain?.level ?? null);
  const [mood, setMood] = useState<MoodValue | null>(existing?.mood?.value ?? null);
  const [energy, setEnergy] = useState<EnergyValue | null>(existing?.energy?.value ?? null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(existing?.sleep?.quality ?? null);
  const [sleepHours, setSleepHours] = useState<number | null>(existing?.sleep?.hours ?? null);
  const [intimacyHappened, setIntimacyHappened] = useState<boolean>(existing?.intimacy?.happened ?? false);
  const [intimacyProtection, setIntimacyProtection] = useState<IntimacyProtection | null>(existing?.intimacy?.protection ?? null);
  const [intimacyFeeling, setIntimacyFeeling] = useState<IntimacyFeeling | null>(existing?.intimacy?.feeling ?? null);
  const [noteText, setNoteText] = useState(existing?.note?.text ?? "");

  function save() {
    const date = dateKey();
    const checkIn: DailyCheckIn = {
      date,
      savedAt: new Date().toISOString(),
      ...(existing ?? {}),
    };

    if (periodIntensity) checkIn.period = { intensity: periodIntensity, type: periodType ?? undefined };
    if (painKinds.length > 0) checkIn.pain = { kinds: painKinds, level: painLevel ?? undefined };
    if (mood) checkIn.mood = { value: mood };
    if (energy) checkIn.energy = { value: energy };
    if (sleepQuality) checkIn.sleep = { quality: sleepQuality, hours: sleepHours ?? undefined };
    if (intimacyHappened || existing?.intimacy) {
      checkIn.intimacy = { happened: intimacyHappened, protection: intimacyProtection ?? undefined, feeling: intimacyFeeling ?? undefined };
    }
    if (noteText.trim()) checkIn.note = { text: noteText.trim() };

    persist(saveCheckIn(data, checkIn));
    setActiveCategory(null);
  }

  if (isIslamic && tab === "islamic") {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-mira-text">Дневник</h1>
        <div className="mb-6 flex gap-1 rounded-2xl bg-mira-bg p-1">
          <button onClick={() => setTab("tracking")} className="flex-1 rounded-xl py-2 text-xs font-semibold text-mira-muted">Трекинг</button>
          <button className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold text-mira-primary shadow-card">Исламский режим</button>
        </div>
        <IslamicScreen data={data} persist={persist} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-mira-text">Дневник</h1>

      {isIslamic && (
        <div className="mb-6 flex gap-1 rounded-2xl bg-mira-bg p-1">
          <button className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold text-mira-primary shadow-card">Трекинг</button>
          <button onClick={() => setTab("islamic")} className="flex-1 rounded-xl py-2 text-xs font-semibold text-mira-muted">Исламский режим</button>
        </div>
      )}

      {activeCategory === null ? (
        <div>
          <p className="mb-4 text-sm text-mira-muted">Выберите что отметить</p>

          <Button variant="secondary" size="sm" className="mb-4 w-full sm:w-auto">
            <RotateCcw className="h-3.5 w-3.5" /> Повторить вчерашние отметки
          </Button>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-4 shadow-card transition hover:shadow-soft active:scale-[0.98]"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-mira-text">{cat.label}</span>
                {hasData(existing, cat.id) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-mira-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Show existing data summary */}
          {existing && (
            <Card className="mt-6 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Отмечено сегодня</p>
              <div className="mt-3 space-y-2">
                {existing.mood && <DataRow label="Настроение" value={moodL(existing.mood.value)} />}
                {existing.energy && <DataRow label="Энергия" value={energyL(existing.energy.value)} />}
                {existing.sleep && <DataRow label="Сон" value={sleepL(existing.sleep)} />}
                {existing.period && <DataRow label="Месячные" value={periodL(existing.period.intensity)} />}
                {existing.pain && <DataRow label="Боль" value={existing.pain.kinds.join(", ")} />}
                {existing.note && <DataRow label="Заметка" value={existing.note.text} />}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveCategory(null)} className="mb-4 flex items-center gap-2 text-sm text-mira-muted hover:text-mira-primary">
            ← Назад к категориям
          </button>

          <Card className="max-w-md p-6">
            {activeCategory === "period" && (
              <>
                <h3 className="mb-4 text-lg font-bold text-mira-text">Месячные</h3>
                <p className="mb-2 text-sm font-semibold text-mira-text">Интенсивность</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["light", "moderate", "heavy", "very_heavy"] as PeriodIntensity[]).map(v => (
                    <Chip key={v} label={periodL(v)} active={periodIntensity === v} onClick={() => setPeriodIntensity(v)} />
                  ))}
                </div>
                <p className="mb-2 text-sm font-semibold text-mira-text">Тип выделений</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["normal", "spotting", "brown", "clots"] as PeriodType[]).map(v => (
                    <Chip key={v} label={periodTL(v)} active={periodType === v} onClick={() => setPeriodType(v)} />
                  ))}
                </div>
                {periodIntensity === "very_heavy" && (
                  <div className="mb-4 rounded-2xl border border-[#C4B07E]/20 bg-[#F5F0E0]/50 p-3">
                    <p className="text-xs text-[#A09060]">
                      Если это необычно для вас или сопровождается сильной слабостью, лучше обратиться к специалисту.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeCategory === "pain" && (
              <>
                <h3 className="mb-4 text-lg font-bold text-mira-text">Боль</h3>
                <p className="mb-2 text-sm font-semibold text-mira-text">Тип</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["none", "cramps", "lower_abdomen", "headache", "breast", "back", "ovulatory"] as PainKind[]).map(v => (
                    <Chip key={v} label={painKL(v)} active={painKinds.includes(v)}
                      onClick={() => setPainKinds(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} />
                  ))}
                </div>
                <p className="mb-2 text-sm font-semibold text-mira-text">Сила</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["light", "medium", "strong"] as PainLevel[]).map(v => (
                    <Chip key={v} label={painLL(v)} active={painLevel === v} onClick={() => setPainLevel(v)} />
                  ))}
                </div>
              </>
            )}

            {activeCategory === "mood" && (
              <>
                <h3 className="mb-4 text-lg font-bold text-mira-text">Настроение</h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["normal", "joy", "sadness", "anger", "anxiety", "swings"] as MoodValue[]).map(v => (
                    <Chip key={v} label={moodL(v)} active={mood === v} onClick={() => setMood(v)} />
                  ))}
                </div>
              </>
            )}

            {activeCategory === "energy" && (
              <>
                <h3 className="mb-4 text-lg font-bold text-mira-text">Энергия</h3>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {(["exhausted", "low", "normal", "high"] as EnergyValue[]).map(v => (
                    <button key={v} onClick={() => setEnergy(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                      energy === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
                    }`}>{energyL(v)}</button>
                  ))}
                </div>
              </>
            )}

            {activeCategory === "sleep" && (
              <>
                <h3 className="mb-4 text-lg font-bold text-mira-text">Сон</h3>
                <p className="mb-2 text-sm font-semibold text-mira-text">Качество</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["good", "normal", "bad", "little", "insomnia"] as SleepQuality[]).map(v => (
                    <Chip key={v} label={sleepQL(v)} active={sleepQuality === v} onClick={() => setSleepQuality(v)} />
                  ))}
                </div>
                <p className="mb-2 text-sm font-semibold text-mira-text">Продолжительность</p>
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-mira-lavender/30 bg-mira-bg p-1">
                  {[5, 6, 7, 8].map(h => (
                    <button key={h} onClick={() => setSleepHours(h)} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                      sleepHours === h ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
                    }`}>{h} ч</button>
                  ))}
                </div>
              </>
            )}

            {activeCategory === "intimacy" && (
              <>
                <h3 className="mb-1 text-lg font-bold text-mira-text">Интимность</h3>
                <p className="mb-4 text-xs text-mira-muted">Данные приватны и скрыты по умолчанию</p>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setIntimacyHappened(false)} className={`rounded-2xl border p-3 text-sm font-semibold ${
                    !intimacyHappened ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
                  }`}>Не было</button>
                  <button onClick={() => setIntimacyHappened(true)} className={`rounded-2xl border p-3 text-sm font-semibold ${
                    intimacyHappened ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
                  }`}>Была</button>
                </div>
                {intimacyHappened && (
                  <>
                    <p className="mb-2 text-sm font-semibold text-mira-text">Детали</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {(["protected", "unprotected", "interrupted", "masturbation", "toy"] as IntimacyProtection[]).map(v => (
                        <Chip key={v} label={intimPL(v)} active={intimacyProtection === v} onClick={() => setIntimacyProtection(v)} />
                      ))}
                    </div>
                    <p className="mb-2 text-sm font-semibold text-mira-text">Ощущения</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {(["good", "normal", "discomfort", "pain"] as IntimacyFeeling[]).map(v => (
                        <Chip key={v} label={intimFL(v)} active={intimacyFeeling === v} onClick={() => setIntimacyFeeling(v)} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeCategory === "note" && (
              <>
                <h3 className="mb-4 text-lg font-bold text-mira-text">Заметка</h3>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Запишите что-нибудь..."
                  className="w-full rounded-2xl border border-mira-lavender/30 bg-mira-bg p-3 text-sm text-mira-text placeholder:text-mira-muted focus:border-mira-primary focus:outline-none"
                  rows={4}
                />
              </>
            )}

            {(activeCategory === "pms" || activeCategory === "nutrition_note") && (
              <p className="text-sm text-mira-muted">Скоро будет доступно</p>
            )}

            <Button className="mt-4 w-full" onClick={save}>Сохранить</Button>
          </Card>
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="h-2 w-2 rounded-full bg-mira-lavender" />
      <span className="text-mira-muted">{label}:</span>
      <span className="text-mira-text">{value}</span>
    </div>
  );
}

function hasData(checkIn: DailyCheckIn | undefined, cat: Category): boolean {
  if (!checkIn) return false;
  const map: Record<Category, boolean> = {
    period: !!checkIn.period,
    pain: !!checkIn.pain,
    mood: !!checkIn.mood,
    energy: !!checkIn.energy,
    sleep: !!checkIn.sleep,
    intimacy: !!checkIn.intimacy,
    pms: !!checkIn.pms,
    nutrition_note: (checkIn.meals?.length ?? 0) > 0,
    note: !!checkIn.note,
  };
  return map[cat];
}

function moodL(v: string) { return ({ normal: "Нормально", joy: "Радость", sadness: "Грусть", anger: "Злость", anxiety: "Тревога", swings: "Перепады" } as Record<string, string>)[v] ?? v; }
function energyL(v: string) { return ({ exhausted: "Истощение", low: "Мало сил", normal: "Нормально", high: "Много сил" } as Record<string, string>)[v] ?? v; }
function sleepQL(v: string) { return ({ good: "Хороший", normal: "Нормальный", bad: "Плохой", little: "Мало сна", insomnia: "Бессонница" } as Record<string, string>)[v] ?? v; }
function sleepL(s: { quality: string; hours?: number }) { const q = sleepQL(s.quality); return s.hours ? `${s.hours} ч, ${q}` : q; }
function periodL(v: string) { return ({ light: "Скудная", moderate: "Умеренная", heavy: "Обильная", very_heavy: "Очень сильная" } as Record<string, string>)[v] ?? v; }
function periodTL(v: string) { return ({ normal: "Обычные", spotting: "Мажущие", brown: "Коричневые", clots: "Сгустки" } as Record<string, string>)[v] ?? v; }
function painKL(v: string) { return ({ none: "Нет боли", cramps: "Спазмы", lower_abdomen: "Низ живота", headache: "Голова", breast: "Грудь", back: "Спина", ovulatory: "Овуляторная" } as Record<string, string>)[v] ?? v; }
function painLL(v: string) { return ({ light: "Лёгкая", medium: "Средняя", strong: "Сильная" } as Record<string, string>)[v] ?? v; }
function intimPL(v: string) { return ({ protected: "С защитой", unprotected: "Без защиты", interrupted: "Прерванный акт", masturbation: "Мастурбация", toy: "Секс-игрушка" } as Record<string, string>)[v] ?? v; }
function intimFL(v: string) { return ({ good: "Хорошо", normal: "Нормально", discomfort: "Дискомфорт", pain: "Боль" } as Record<string, string>)[v] ?? v; }
