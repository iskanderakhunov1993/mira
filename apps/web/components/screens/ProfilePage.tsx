"use client";

import React, { memo, useState } from "react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { readReminderSettings, saveReminderSettings } from "@/services/reminder.service";

type LabStatus = "below" | "normal" | "above";

type ProfileData = {
  user: {
    name: string;
    age: number;
    avatar: string;
    trackingMonths: number;
    totalCycles: number;
  };
  weight: {
    current: number;
    change: string;
    period: string;
  };
  tests: Array<{ name: string; value: string; status: LabStatus; date: string }>;
  notes: Array<{ date: string; text: string }>;
  achievements: {
    unlocked: number;
    total: number;
    streak: number;
    cyclesRecorded: number;
  };
  settings: {
    cycleLength: number;
    periodLength: number;
    pin: boolean;
    dataStorage: "device" | "cloud";
    reminders: {
      water: boolean;
      log: boolean;
      vitamins: boolean;
    };
  };
};

type ProfilePageProps = {
  data?: ProfileData;
};

const mockProfileData: ProfileData = {
  user: {
    name: "Елена",
    age: 52,
    avatar: "ЕЛ",
    trackingMonths: 3,
    totalCycles: 6,
  },
  weight: {
    current: 65.9,
    change: "+1.1",
    period: "3 месяца",
  },
  tests: [
    { name: "Ферритин", value: "12 нг/мл", status: "below", date: "25.06" },
    { name: "Эстрадиол", value: "18 нг/мл", status: "below", date: "25.06" },
  ],
  notes: [
    { date: "30 июня", text: "Спазмы мешали работать." },
    { date: "28 июня", text: "Хороший сон, энергии много." },
    { date: "25 июня", text: "Начался ПМС, вздутие." },
  ],
  achievements: {
    unlocked: 6,
    total: 7,
    streak: 30,
    cyclesRecorded: 3,
  },
  settings: {
    cycleLength: 35,
    periodLength: 5,
    pin: false,
    dataStorage: "device",
    reminders: {
      water: true,
      log: true,
      vitamins: false,
    },
  },
};

const articleGroups = [
  {
    title: "🔴 Основы",
    items: ["Что такое цикл? (2 мин)", "Фазы цикла: что происходит в каждый день (3 мин)"],
  },
  {
    title: "🟡 Симптомы и ПМС",
    items: ["ПМС: 7 симптомов и как с ними жить (3 мин)", "Как снять спазмы: 5 способов (2 мин)"],
  },
  {
    title: "🟣 Кожа и волосы",
    items: ["Почему перед месячными выскакивают прыщи (2 мин)", "Цинк и ПМС: как он помогает при акне (2 мин)"],
  },
  {
    title: "❤️ Желание и гормоны",
    items: ["Почему меняется желание в разные фазы цикла (2 мин)"],
  },
  {
    title: "🩺 Когда идти к врачу",
    items: ["Обильные месячные: когда это норма? (2 мин)", "5 признаков, что пора к гинекологу (2 мин)"],
  },
];

function SectionCard({ title, children, delay = 0 }: { title?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Card
      className="rounded-2xl border-0 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.07)]"
      style={{ animation: `miraProfileIn 420ms ease ${delay}ms both` }}
    >
      {title && <h2 className="mb-4 text-lg font-black text-[#1A1A1A]">{title}</h2>}
      {children}
    </Card>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#34C759]" : "bg-[#E5E5EA]"}`}
      onClick={onChange}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-[#1A1A1A]">{title}</h2>
          <button type="button" className="rounded-full bg-[#FAF8F5] px-3 py-1 text-sm font-black text-[#8E8E93]" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionLink({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="text-sm font-black text-[#E872A0]">
      {children}
    </button>
  );
}

function ProfilePageComponent({ data = mockProfileData }: ProfilePageProps) {
  const [settings, setSettings] = useState(data.settings);
  const push = usePushNotifications();
  const [smartReminders, setSmartReminders] = useState(() => {
    if (typeof window === "undefined") return { pms: true, missedLogs: true, water: true, vitamins: true };
    return readReminderSettings();
  });
  const [cycleOpen, setCycleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cycleLength, setCycleLength] = useState(String(settings.cycleLength));
  const [periodLength, setPeriodLength] = useState(String(settings.periodLength));

  function exportData() {
    const payload = JSON.stringify({ ...data, settings }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "profile-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveCycle() {
    setSettings((current) => ({
      ...current,
      cycleLength: Number.parseInt(cycleLength, 10) || current.cycleLength,
      periodLength: Number.parseInt(periodLength, 10) || current.periodLength,
    }));
    setCycleOpen(false);
  }

  function toggleSmartReminder(name: keyof typeof smartReminders) {
    setSmartReminders((current) => {
      const next = { ...current, [name]: !current[name] };
      saveReminderSettings(next);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-6 text-[#1A1A1A]">
      <style jsx global>{`
        @keyframes miraProfileIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">⚙️ Профиль</h1>
        </header>

        <SectionCard delay={30}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] text-xl font-black text-[#E872A0]">
              {data.user.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A]">{data.user.name}, {data.user.age} года</h2>
              <p className="mt-1 text-sm font-semibold text-[#8E8E93]">
                Трекинг: {data.user.trackingMonths} месяца | {data.user.totalCycles} циклов записано
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="mt-6 space-y-6">
          <section>
            <h2 className="mb-4 text-lg font-black uppercase tracking-widest text-[#8E8E93]">📁 Мои данные</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard title="📊 Мой вес и тело" delay={70}>
                <p className="text-sm font-semibold text-[#1A1A1A]">Текущий вес: {data.weight.current} кг</p>
                <p className="mt-2 text-sm font-semibold text-[#8E8E93]">Динамика: {data.weight.change} кг за {data.weight.period}</p>
                <div className="mt-4"><ActionLink>➜ Смотреть график</ActionLink></div>
              </SectionCard>

              <SectionCard title="🩸 Мои анализы" delay={100}>
                {data.tests.length ? (
                  <div className="space-y-2">
                    {data.tests.map((test) => (
                      <p key={test.name} className="text-sm font-semibold text-[#1A1A1A]">
                        {test.name}: {test.value} {test.status === "below" ? "(↓ ниже нормы)" : ""} — {test.date}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-[#8E8E93]">Ты ещё не добавила анализы. Добавь результаты, чтобы показать врачу.</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <ActionLink>➕ Добавить анализ</ActionLink>
                  <ActionLink>➜ Смотреть все</ActionLink>
                </div>
              </SectionCard>

              <SectionCard title="📋 Мои заметки" delay={130}>
                {data.notes.length ? (
                  <div className="space-y-2">
                    {data.notes.slice(0, 3).map((note) => (
                      <p key={`${note.date}-${note.text}`} className="text-sm font-semibold text-[#1A1A1A]">
                        {note.date} — “{note.text}”
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-[#8E8E93]">У тебя пока нет заметок. Начни вести дневник!</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <ActionLink>➕ Добавить заметку</ActionLink>
                  <ActionLink>➜ Все заметки</ActionLink>
                </div>
              </SectionCard>

              <SectionCard title="🏆 Мои достижения" delay={160}>
                <p className="text-sm font-semibold text-[#1A1A1A]">{data.achievements.unlocked} из {data.achievements.total} открыто</p>
                <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">🔥 {data.achievements.streak} дней подряд</p>
                <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">📊 {data.achievements.cyclesRecorded} цикла записано</p>
                <div className="mt-4"><ActionLink>➜ Смотреть все достижения</ActionLink></div>
              </SectionCard>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-black uppercase tracking-widest text-[#8E8E93]">⚙️ Настройки</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard title="📊 Настройки цикла" delay={190}>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Средняя длина: {settings.cycleLength} дн. | Период: {settings.periodLength} дн.
                </p>
                <Button type="button" className="mt-4 rounded-2xl bg-[#E872A0] text-white" onClick={() => setCycleOpen(true)}>Изменить</Button>
              </SectionCard>

              <SectionCard title="🔒 Приватность" delay={220}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-[#1A1A1A]">PIN-код</p>
                  <Switch checked={settings.pin} onChange={() => setSettings((current) => ({ ...current, pin: !current.pin }))} />
                </div>
                <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#8E8E93]">
                  Данные: {settings.dataStorage === "device" ? "Только на устройстве" : "С резервной копией"}
                </p>
              </SectionCard>

              <SectionCard title="🔔 Напоминания" delay={250}>
                {[
                  ["water", "💧 Вода"],
                  ["log", "📝 Отметить состояние"],
                  ["vitamins", "💊 Витамины"],
                ].map(([key, label]) => (
                  <div key={key} className="mb-4 flex items-center justify-between gap-4 last:mb-0">
                    <p className="text-sm font-bold text-[#1A1A1A]">{label}</p>
                    <Switch
                      checked={settings.reminders[key as keyof typeof settings.reminders]}
                      onChange={() => setSettings((current) => ({
                        ...current,
                        reminders: {
                          ...current.reminders,
                          [key]: !current.reminders[key as keyof typeof current.reminders],
                        },
                      }))}
                    />
                  </div>
                ))}
                <div className="mt-5 border-t border-[#F0E6EA] pt-5">
                  <p className="mb-3 text-sm font-black text-[#1A1A1A]">Умные PWA-напоминания</p>
                  {[
                    ["pms", "🌸 ПМС за 3 дня"],
                    ["missedLogs", "📝 Пропуск 2 дней"],
                    ["water", "💧 Вода в полдень"],
                    ["vitamins", "🌙 Витамины вечером"],
                  ].map(([key, label]) => (
                    <div key={key} className="mb-4 flex items-center justify-between gap-4 last:mb-0">
                      <p className="text-sm font-bold text-[#1A1A1A]">{label}</p>
                      <Switch checked={smartReminders[key as keyof typeof smartReminders]} onChange={() => toggleSmartReminder(key as keyof typeof smartReminders)} />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full rounded-2xl bg-white"
                    disabled={!push.isSupported}
                    onClick={() => push.isSubscribed ? push.unsubscribe() : push.subscribe()}
                  >
                    {push.isSubscribed ? "Отключить уведомления" : "Включить уведомления"}
                  </Button>
                  <p className="mt-2 text-xs font-semibold text-[#8E8E93]">
                    Статус: {push.permission === "granted" ? "разрешены" : push.permission === "denied" ? "запрещены в браузере" : "не настроены"}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="📁 Управление данными" delay={280}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={exportData}>📤 Экспорт данных</Button>
                  <Button type="button" className="rounded-2xl bg-[#FF6B6B] text-white hover:bg-[#F25353]" onClick={() => setDeleteOpen(true)}>🗑️ Удалить все</Button>
                </div>
              </SectionCard>
            </div>
          </section>

          <SectionCard title="📚 Библиотека статей" delay={310}>
            <p className="mb-5 text-sm font-semibold text-[#8E8E93]">
              Простые и понятные статьи о том, что происходит в твоём теле.
            </p>
            <div className="space-y-5">
              {articleGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-sm font-black text-[#1A1A1A]">{group.title}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3">
                        <p className="text-sm font-semibold text-[#1A1A1A]">• {item}</p>
                        <ActionLink>Читать</ActionLink>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5"><ActionLink>➜ Смотреть все статьи</ActionLink></div>
          </SectionCard>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="❓ О приложении" delay={340}>
              <p className="text-sm font-semibold text-[#8E8E93]">
                Версия 2.0 | <button type="button" className="font-black text-[#E872A0]">Политика конфиденциальности</button>
              </p>
              <div className="mt-4">
                <InstallPrompt />
              </div>
            </SectionCard>

            <SectionCard title="💬 Обратная связь" delay={370}>
              <p className="text-sm font-semibold text-[#8E8E93]">Напиши нам, если нашла баг или есть идея.</p>
              <Button type="button" className="mt-4 rounded-2xl bg-[#E872A0] text-white">📝 Написать сообщение</Button>
            </SectionCard>
          </div>
        </div>
      </div>

      {cycleOpen && (
        <Dialog title="Настройки цикла" onClose={() => setCycleOpen(false)}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-[#8E8E93]">Длина цикла</span>
              <input value={cycleLength} onChange={(event) => setCycleLength(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-[#E8DDE3] px-4 font-bold outline-none focus:border-[#E872A0]" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#8E8E93]">Длительность месячных</span>
              <input value={periodLength} onChange={(event) => setPeriodLength(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-[#E8DDE3] px-4 font-bold outline-none focus:border-[#E872A0]" />
            </label>
            <Button type="button" className="w-full rounded-2xl bg-[#E872A0] text-white" onClick={saveCycle}>Сохранить</Button>
          </div>
        </Dialog>
      )}

      {deleteOpen && (
        <Dialog title="Удалить все данные?" onClose={() => setDeleteOpen(false)}>
          <p className="text-sm font-semibold leading-relaxed text-[#8E8E93]">
            Это действие нельзя отменить. Все записи, симптомы, заметки и отчёты будут удалены.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={() => setDeleteOpen(false)}>Отмена</Button>
            <Button type="button" className="rounded-2xl bg-[#FF6B6B] text-white hover:bg-[#F25353]" onClick={() => setDeleteOpen(false)}>Удалить</Button>
          </div>
        </Dialog>
      )}
    </main>
  );
}

export const ProfilePage = memo(ProfilePageComponent);
ProfilePage.displayName = "ProfilePage";

export default ProfilePage;
