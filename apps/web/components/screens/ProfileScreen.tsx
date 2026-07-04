"use client";

import { useState, useEffect } from "react";
import {
  UserRound, Calendar, Shield, Download, Trash2,
  ChevronRight, Lock, Bell, Heart, Database, Eye, Moon, Award, Cloud, ScanFace, EyeOff, BellRing, BookOpen, HeartPulse, Plus,
  Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SyncSettings } from "@/components/sync/SyncSettings";
import { madhabs, type Madhab } from "@/lib/islamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveProfile, clearData } from "@/lib/store";
import { getCycleNorm } from "@/lib/cycleEngine";
import { clearPin, cloudSyncCategories, hasPin, savePin } from "@/lib/privacy";
import { notificationsSupported, notificationsEnabled, requestNotifications, setNotificationsPref } from "@/lib/notifications";
import { getPersonalReminders, getReminderSettings, personalReminderCatalog } from "@/lib/personalReminders";
import { getUnlockedCount } from "@/lib/gamification";
import { AchievementsCard } from "./AchievementsCard";
import type { ScreenProps } from "./types";

const darkCardClass = "border-[#2E2826] bg-[#1D1816] shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
const darkInsetClass = "border-[#342D2A] bg-[#2A2523]";
const limeButtonClass = "bg-[#84E600] text-[#11100F] shadow-[0_12px_30px_rgba(132,230,0,0.20)] hover:bg-[#73CC00]";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-[#84E600]" : "bg-[#342D2A]"}`}>
      <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function PrivacyRow({
  icon: Icon,
  label,
  desc,
  on,
  onToggle,
  disabled,
}: {
  icon: typeof UserRound;
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-[18px] border p-4 ${darkInsetClass} ${disabled ? "opacity-55" : ""}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#302927] text-[#F9359E]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-[#F5F0ED]">{label}</p>
        <p className="text-xs font-semibold text-[#B7AAA4]">{desc}</p>
      </div>
      <Toggle on={on} onToggle={() => { if (!disabled) onToggle(); }} />
    </div>
  );
}

export function ProfileScreen({ data, persist, navigate }: ScreenProps) {
  const profile = data.profile;
  const [section, setSection] = useState<string | null>(null);
  const [notifOn, setNotifOn] = useState(false);
  const [syncEmail, setSyncEmail] = useState<string | null>(null);
  const [pinReady, setPinReady] = useState(false);
  useEffect(() => { setNotifOn(notificationsEnabled()); }, []);
  useEffect(() => { setPinReady(hasPin()); }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: u }) => setSyncEmail(u.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSyncEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function toggleNotifications() {
    if (notifOn) {
      setNotificationsPref(false);
      setNotifOn(false);
    } else {
      const granted = await requestNotifications();
      setNotifOn(granted);
      if (!granted) alert("Разреши уведомления в настройках браузера, чтобы получать напоминания.");
    }
  }

  async function togglePin() {
    if (!profile) return;
    if (profile?.pinEnabled) {
      if (!confirm("Отключить PIN-защиту на этом устройстве?")) return;
      clearPin();
      setPinReady(false);
      persist(saveProfile(data, { ...profile, pinEnabled: false, deviceUnlockEnabled: false }));
      return;
    }

    const pin = prompt("Придумай PIN от 4 до 6 цифр. Он хранится только на этом устройстве.");
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      alert("PIN должен состоять из 4–6 цифр.");
      return;
    }
    await savePin(pin);
    setPinReady(true);
    persist(saveProfile(data, { ...profile, pinEnabled: true }));
  }

  function confirmAndClearAllData() {
    if (confirm("Это действие нельзя отменить. Все записи, симптомы, заметки и отчёты будут удалены.")) {
      clearPin();
      clearData();
      window.location.reload();
    }
  }

  if (!profile) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Профиль</h1>
        <Card className={`p-6 ${darkCardClass}`}>
          <p className="text-sm text-[#B7AAA4]">Пройди онбординг чтобы настроить профиль</p>
        </Card>
      </div>
    );
  }

  const unlockedCount = getUnlockedCount(data);

  const menuGroups: { title: string; items: { icon: typeof UserRound; label: string; desc: string; id: string }[] }[] = [
    {
      title: "Личное и цикл",
      items: [
        { icon: UserRound, label: "О себе", desc: profile.age ? `${profile.name}, ${profile.age} лет` : profile.name, id: "data" },
        { icon: Calendar, label: "Настройки цикла", desc: `${profile.cycleConfig.cycleLength} дн., период ${profile.cycleConfig.periodLength} дн.`, id: "cycle" },
      ],
    },
    {
      title: "Приватность и данные",
      items: [
        { icon: Shield, label: "Приватность", desc: "PIN, скрытый режим, доступ", id: "privacy" },
        { icon: Cloud, label: "Синхронизация", desc: syncEmail ? `Включена · ${syncEmail}` : "Резервная копия между устройствами", id: "sync" },
        { icon: BellRing, label: "Напоминания", desc: "Вода, симптомы, аптечка, врач", id: "reminders" },
        { icon: Database, label: "Хранение данных", desc: "Что храним и где", id: "mydata" },
        { icon: Download, label: "Экспорт данных", desc: "Скачать свою копию", id: "export" },
      ],
    },
    {
      title: "Помощь и прогресс",
      items: [
        { icon: BookOpen, label: "Как работает Mira", desc: "Что делать на главной и где искать данные", id: "education" },
        { icon: Award, label: "Достижения", desc: `${unlockedCount.unlocked} из ${unlockedCount.total} открыто`, id: "achievements" },
      ],
    },
  ];

  if (section === "sync") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Синхронизация</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <SyncSettings data={data} persist={persist} />
      </div>
    );
  }

  if (section === "islamic") {
    const currentMadhab = profile.madhab ?? "hanafi";
    const isActive = profile.additionalMode === "islam";
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Режим мусульманки</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-mira-primary" />
              <div>
                <p className="text-sm font-bold text-mira-text">Исламский режим</p>
                <p className="text-xs text-mira-muted">Хайд, истихада, каза, дуа</p>
              </div>
            </div>
            <Toggle on={isActive} onToggle={() => {
              persist(saveProfile(data, { ...profile, additionalMode: isActive ? "none" : "islam" }));
            }} />
          </div>

          {isActive && (
            <>
              <p className="text-sm font-semibold text-mira-text mb-3">Выбери мазхаб</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(["hanafi", "shafii", "maliki", "hanbali"] as Madhab[]).map(m => (
                  <button key={m} onClick={() => persist(saveProfile(data, { ...profile, madhab: m }))}
                    className={`rounded-2xl border-2 p-3.5 text-left transition active:scale-[0.97] ${
                      currentMadhab === m ? "border-mira-primary bg-mira-lavender-light" : "border-mira-lavender/20"
                    }`}>
                    <p className={`text-sm font-semibold ${currentMadhab === m ? "text-mira-primary" : "text-mira-text"}`}>
                      {madhabs[m].name}
                    </p>
                    <p className="text-[10px] text-mira-muted">{madhabs[m].nameAr}</p>
                    <p className="mt-1 text-[10px] text-mira-muted">Хайд: {madhabs[m].haydMin}–{madhabs[m].haydMax} дн.</p>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-3">
                <p className="text-xs text-mira-success">Приложение не является источником фетв. В спорных вопросах обращайся к знающему учёному.</p>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  if (section === "mydata") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Мои данные</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-mira-success" />
                <p className="text-sm font-bold text-mira-success">Где хранятся данные</p>
              </div>
              <p className="text-xs leading-relaxed text-mira-muted">
                Сейчас данные хранятся только на этом устройстве. Если очистить браузер или удалить данные сайта, записи могут пропасть.
              </p>
              <Button className="mt-3 w-full" onClick={() => setSection("sync")}>
                <Cloud className="h-4 w-4" /> Включить резервную копию
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-mira-text">Что мы храним</p>
              {[
                { label: "Профиль", desc: "Имя, настройки цикла" },
                { label: "Ежедневные отметки", desc: "Боль, настроение, сон, энергия, ПМС" },
                { label: "Водный баланс", desc: "Стаканы воды по дням" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl bg-mira-bg p-3">
                  <Eye className="h-4 w-4 text-mira-muted shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-mira-text">{item.label}</p>
                    <p className="text-[11px] text-mira-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-mira-text">Зачем мы это используем</p>
              <p className="text-xs text-mira-muted">Только для расчёта твоей личной нормы, прогнозов и аналитики. Ничего не покидает устройство.</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-mira-text">Как удалить</p>
              <p className="text-xs leading-relaxed text-mira-muted">
                Перед удалением Mira предупредит: это действие нельзя отменить. Все записи, симптомы, заметки и отчёты будут удалены.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-mira-text">Как экспортировать</p>
              <p className="text-xs text-mira-muted">Профиль → «Экспорт данных» — скачивает JSON-файл со всеми твоими записями.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "export") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Экспорт данных</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <p className="mb-4 text-sm text-mira-muted">Скачай свои данные в формате JSON. Файл содержит все записи, профиль и настройки.</p>
          <div className="mb-4 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
            <p className="text-sm font-bold text-mira-text">Копия твоих данных</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Ты можешь скачать копию своих данных в любой момент. Это удобно для резервного хранения или переноса.
            </p>
          </div>
          <Button className="w-full" onClick={() => {
            const exported = { ...data, exportedAt: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `moya-norma-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4" /> Скачать JSON
          </Button>
          <p className="mt-4 text-xs leading-relaxed text-mira-muted">
            Файл останется у тебя. Mira не отправляет экспорт врачу или партнёру автоматически.
          </p>
        </Card>
      </div>
    );
  }

  if (section === "achievements") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Достижения</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <div className="max-w-lg">
          <AchievementsCard data={data} />
        </div>
      </div>
    );
  }

  if (section === "education") {
    const steps = [
      {
        n: 1,
        title: "Посмотри день цикла",
        body: "На главной сверху есть календарь и большая карточка дня. Там Mira показывает фазу, прогноз месячных и почему сегодня может меняться энергия.",
        icon: Calendar,
      },
      {
        n: 2,
        title: "Отметь состояние",
        body: "Нажми «Отметить состояние» и сохрани боль, настроение, сон или симптомы. Так Mira начинает понимать, что для тебя обычно.",
        icon: Plus,
      },
      {
        n: 3,
        title: "Если плохо — нажми «Мне плохо»",
        body: "Mira быстро спросит симптомы и даст спокойный план: что сделать сейчас, за чем наблюдать и когда лучше обратиться к врачу.",
        icon: HeartPulse,
      },
    ];

    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Обучение</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="mb-5 rounded-2xl border border-mira-primary/10 bg-mira-lavender-light/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-bold text-mira-text">Как пользоваться главной</p>
            </div>
            <p className="text-xs leading-relaxed text-mira-muted">
              Смотри сверху вниз: понять день, отметить себя, получить поддержку. Главная должна отвечать на вопрос: что со мной сегодня и что делать дальше.
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-3 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-mira-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Шаг {step.n}</p>
                  <p className="mt-0.5 text-sm font-bold text-mira-text">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mira-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (section === "data") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">О себе</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6 space-y-3">
          <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
            <label className="text-xs text-mira-muted">Имя</label>
            <input type="text" value={profile.name}
              onChange={e => persist(saveProfile(data, { ...profile, name: e.target.value }))}
              className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
          </div>
          <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
            <label className="text-xs text-mira-muted">Возраст</label>
            <input type="number" min={10} max={90} value={profile.age ?? ""} placeholder="не указан"
              onChange={e => persist(saveProfile(data, { ...profile, age: e.target.value ? +e.target.value : undefined }))}
              className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
            <p className="mt-1 text-[10px] text-mira-muted">Нужен для более аккуратного отчёта врачу и возрастных подсказок.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "cycle") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Настройки цикла</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="space-y-3">
            <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
              <label className="text-xs text-mira-muted">Дата последних месячных</label>
              <input type="date" value={profile.cycleConfig.periodStart}
                onChange={e => persist(saveProfile(data, { ...profile, cycleConfig: { ...profile.cycleConfig, periodStart: e.target.value } }))}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
            </div>
            <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
              <label className="text-xs text-mira-muted">Длина цикла (дни)</label>
              <input type="number" min={20} max={45} value={profile.cycleConfig.cycleLength}
                onChange={e => persist(saveProfile(data, { ...profile, cycleConfig: { ...profile.cycleConfig, cycleLength: +e.target.value } }))}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
            </div>
            <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
              <label className="text-xs text-mira-muted">Длительность месячных (дни)</label>
              <input type="number" min={2} max={10} value={profile.cycleConfig.periodLength}
                onChange={e => persist(saveProfile(data, { ...profile, cycleConfig: { ...profile.cycleConfig, periodLength: +e.target.value } }))}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "reminders") {
    const settings = getReminderSettings(data);
    const activeReminders = getPersonalReminders(data);

    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Напоминания</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-mira-primary/10 bg-mira-lavender-light/25 p-4">
              <div className="mb-2 flex items-center gap-2">
                <BellRing className="h-4 w-4 text-mira-primary" />
                <p className="text-sm font-bold text-mira-text">Мягко, без давления</p>
              </div>
              <p className="text-xs leading-relaxed text-mira-muted">
                Mira напоминает только о том, что помогает: отметить состояние, выпить воды, подготовиться к месячным или не забыть важное для врача.
              </p>
            </div>

            {notificationsSupported() && (
              <PrivacyRow
                icon={Bell}
                label="Системные уведомления"
                desc={notifOn ? "Включены" : "Нужно разрешение браузера"}
                on={notifOn}
                onToggle={toggleNotifications}
              />
            )}

            <PrivacyRow
              icon={BellRing}
              label="Персональные напоминания"
              desc="Включить или выключить все подсказки Mira"
              on={settings.enabled}
              onToggle={() => persist(saveProfile(data, { ...profile, reminders: { ...settings, enabled: !settings.enabled } }))}
            />

            <PrivacyRow
              icon={EyeOff}
              label="Тихий текст"
              desc="На экране блокировки без слов про месячные, секс и здоровье"
              on={settings.quietText}
              onToggle={() => persist(saveProfile(data, { ...profile, reminders: { ...settings, quietText: !settings.quietText } }))}
            />

            <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
              <p className="mb-3 text-sm font-bold text-mira-text">Что напоминать</p>
              <div className="space-y-2">
                {personalReminderCatalog.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-mira-text">{item.label}</p>
                      <p className="text-[11px] text-mira-muted">{item.desc}</p>
                    </div>
                    <Toggle on={settings.items[item.id]} onToggle={() => {
                      persist(saveProfile(data, {
                        ...profile,
                        reminders: {
                          ...settings,
                          items: { ...settings.items, [item.id]: !settings.items[item.id] },
                        },
                      }));
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-4">
              <p className="text-sm font-bold text-mira-success">Активно сегодня</p>
              {activeReminders.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {activeReminders.slice(0, 4).map((reminder) => (
                    <div key={reminder.id} className="rounded-xl bg-white/70 px-3 py-2">
                      <p className="text-xs font-semibold text-mira-text">{reminder.title}</p>
                      <p className="text-[11px] leading-relaxed text-mira-muted">{reminder.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-mira-muted">На сегодня нет важных напоминаний.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "privacy") {
    const cloudExcluded = new Set(profile.cloudSyncExclude ?? []);
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Приватность</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/35 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-mira-success" />
                <p className="text-sm font-bold text-mira-success">Ты управляешь данными</p>
              </div>
              <p className="text-xs leading-relaxed text-mira-muted">
                Mira хранит дневник локально на устройстве. Облако включается только после входа, а чувствительные категории можно исключить из синхронизации.
              </p>
            </div>

            <div className="rounded-2xl border border-mira-cycle/10 bg-[#F1ECF8]/25 p-4">
              <p className="text-sm font-bold text-mira-text">Чувствительные данные под твоим контролем</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                Секс, задержки, анализы, личные заметки, лекарства и врачебный отчёт не показываются партнёру. Их можно исключить из облака ниже, а в отчёте интимные данные скрыты по умолчанию.
              </p>
            </div>

            <PrivacyRow
              icon={Lock}
              label="PIN-код"
              desc={pinReady ? "PIN защищает вход в приложение на этом устройстве" : "PIN защищает вход в приложение на этом устройстве"}
              on={!!profile.pinEnabled && pinReady}
              onToggle={() => void togglePin()}
            />

            <PrivacyRow
              icon={ScanFace}
              label="Face ID / разблокировка устройством"
              desc="Будет использоваться там, где браузер PWA это поддержит"
              on={!!profile.deviceUnlockEnabled}
              disabled={!profile.pinEnabled}
              onToggle={() => persist(saveProfile(data, { ...profile, deviceUnlockEnabled: !profile.deviceUnlockEnabled }))}
            />

            <PrivacyRow
              icon={EyeOff}
              label="Скрытый режим"
              desc="Скрывает чувствительные формулировки в интерфейсе"
              on={!!profile.hiddenMode}
              onToggle={() => persist(saveProfile(data, { ...profile, hiddenMode: !profile.hiddenMode }))}
            />

            {notificationsSupported() && (
              <PrivacyRow
                icon={Bell}
                label="Напоминания"
                desc="Отметиться, подготовиться к месячным"
                on={notifOn}
                onToggle={toggleNotifications}
              />
            )}

            <PrivacyRow
              icon={Bell}
              label="Скрытые уведомления"
              desc="Без деталей на экране блокировки"
              on={!!profile.hiddenNotifications}
              onToggle={() => persist(saveProfile(data, { ...profile, hiddenNotifications: !profile.hiddenNotifications }))}
            />

            <PrivacyRow
              icon={Heart}
              label="Приватные отметки"
              desc="Интимность скрыта по умолчанию"
              on={!!profile.privateMarks}
              onToggle={() => persist(saveProfile(data, { ...profile, privateMarks: !profile.privateMarks }))}
            />

            <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
              <div className="mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4 text-mira-primary" />
                <p className="text-sm font-bold text-mira-text">Не хранить в облаке</p>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-mira-muted">
                Эти данные останутся только на устройстве. Локальный дневник не удаляется.
              </p>
              <div className="space-y-2">
                {cloudSyncCategories.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-mira-text">{item.label}</p>
                      <p className="text-[11px] text-mira-muted">{item.desc}</p>
                    </div>
                    <Toggle on={cloudExcluded.has(item.id)} onToggle={() => {
                      const next = new Set(cloudExcluded);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      persist(saveProfile(data, { ...profile, cloudSyncExclude: Array.from(next) }));
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mira-lavender/20 bg-white p-4">
              <p className="text-sm font-bold text-mira-text">Политика приватности простыми словами</p>
              <div className="mt-2 space-y-1 text-xs leading-relaxed text-mira-muted">
                <p>1. Локальные данные хранятся в браузере этого устройства.</p>
                <p>2. Облако используется только для резервной копии после входа.</p>
                <p>3. Чувствительные категории можно исключить из облака.</p>
                <p>4. Секс и личные заметки выключены в отчёте врачу по умолчанию.</p>
                <p>5. Удаление данных очищает локальный дневник без восстановления.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={confirmAndClearAllData}
              className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-left transition hover:bg-red-100"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-500">Удалить все данные</p>
                <p className="text-xs text-mira-muted">Профиль, дневник, симптомы и локальный PIN</p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {(() => {
        const norm = getCycleNorm(profile);
        const checkInDates = Object.keys(data.checkIns ?? {}).sort();
        const entriesCount = checkInDates.length;
        const storageLabel = syncEmail ? "облако включено" : "только устройство";
        const protectionLabel = profile.pinEnabled && pinReady ? "PIN включён" : "PIN выключен";

        return (
          <>
            <header className={`mb-5 rounded-[22px] p-5 ${darkCardClass}`}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Настройки и доверие</p>
              <h1 className="mt-1 text-[34px] font-black tracking-tight text-[#F5F0ED]">Профиль</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-[#B7AAA4]">
                Здесь настраиваются цикл, приватность, напоминания и то, какие данные Mira может использовать для Анализа и Отчёта.
              </p>
            </header>

            <Card className={`mb-5 overflow-hidden rounded-[22px] p-5 text-white ${darkCardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#84E600] text-2xl font-black text-[#11100F]">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-tight">{profile.name || "Mira"}</p>
                    <p className="mt-1 text-sm font-semibold text-white/70">
                      {norm.cycleDay ? `День ${norm.cycleDay} цикла` : "Цикл ещё нужно настроить"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSection("data")}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#302927] px-3 py-2 text-xs font-black text-[#F9359E] transition hover:bg-[#3A302D]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Изменить
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Записей", `${entriesCount}`],
                  ["Данные", storageLabel],
                  ["Защита", protectionLabel],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-[18px] border px-3 py-3 ${darkInsetClass}`}>
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#8D817B]">{label}</p>
                    <p className="mt-1 text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <button
              type="button"
              onClick={() => navigate("report")}
              className="mb-5 flex w-full items-center justify-between gap-4 rounded-[22px] border border-[#84E600]/25 bg-[#252318] p-5 text-left shadow-[0_18px_48px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2B2A1E]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#84E600] text-[#11100F]">
                  <Download className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-lg font-black text-[#F5F0ED]">Отчёт врачу</p>
                  <p className="mt-1 text-sm font-semibold text-[#B7AAA4]">Экспорт данных и приватность</p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 shrink-0 text-[#84E600]" />
            </button>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {[
                { icon: Calendar, title: "Цикл", body: `${profile.cycleConfig.cycleLength} дн., месячные ${profile.cycleConfig.periodLength} дн.`, id: "cycle" },
                { icon: Shield, title: "Приватность", body: "PIN, облако, скрытые категории", id: "privacy" },
                { icon: Download, title: "Отчёт и экспорт", body: "Копия данных и подготовка врачу", id: "export" },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 ${darkCardClass}`}
                >
                  <item.icon className="h-5 w-5 text-[#F9359E]" />
                  <p className="mt-3 text-sm font-black text-[#F5F0ED]">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#B7AAA4]">{item.body}</p>
                </button>
              ))}
            </div>

            <Card className={`mb-5 rounded-[20px] p-5 ${darkCardClass}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
                  <Database className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-[#F5F0ED]">Данные под твоим контролем</h2>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
                    Локальные данные остаются на устройстве. Секс и личные заметки не включаются в отчёт по умолчанию.
                  </p>
                  {!syncEmail && (
                    <Button className={`mt-4 h-12 w-full rounded-[18px] ${limeButtonClass}`} onClick={() => setSection("sync")}>
                      <Cloud className="h-4 w-4" /> Включить резервную копию
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card className={`rounded-[20px] p-5 ${darkCardClass}`}>
              <div className="space-y-5">
          {menuGroups.map(group => (
            <div key={group.title}>
              <p className="px-1 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8D817B]">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className="flex w-full items-center gap-3 rounded-[18px] p-3 text-left transition hover:bg-[#2A2523]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#302927] text-[#F9359E]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-[#F5F0ED]">{item.label}</p>
                      <p className="text-xs font-semibold text-[#B7AAA4]">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8D817B]" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={confirmAndClearAllData}
            className="flex w-full items-center gap-3 rounded-[18px] p-3 text-left transition hover:bg-[#33201F]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#33201F] text-red-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-500">Удалить данные</p>
              <p className="text-xs text-[#B7AAA4]">Безвозвратно удалить всё</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8D817B]" />
          </button>
              </div>
            </Card>
          </>
        );
      })()}
    </div>
  );
}
