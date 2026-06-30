"use client";

import { useState, useEffect } from "react";
import {
  UserRound, Calendar, Shield, Download, Trash2,
  ChevronRight, Lock, Bell, Heart, Users, Database, Eye, Moon, Award, Cloud, ScanFace, EyeOff, BellRing, BookOpen, HeartPulse, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SyncSettings } from "@/components/sync/SyncSettings";
import { madhabs, type Madhab } from "@/lib/islamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PagePurposeCard } from "@/components/ui/PagePurposeCard";
import { saveProfile, clearData } from "@/lib/store";
import { clearPin, cloudSyncCategories, defaultPartnerShare, hasPin, savePin } from "@/lib/privacy";
import { notificationsSupported, notificationsEnabled, requestNotifications, setNotificationsPref } from "@/lib/notifications";
import { getPersonalReminders, getReminderSettings, personalReminderCatalog } from "@/lib/personalReminders";
import { getUnlockedCount } from "@/lib/gamification";
import { AchievementsCard } from "./AchievementsCard";
import type { ScreenProps } from "./types";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-mira-primary" : "bg-mira-lavender"}`}>
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
    <div className={`flex items-center gap-3 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4 ${disabled ? "opacity-55" : ""}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-mira-text">{label}</p>
        <p className="text-xs text-mira-muted">{desc}</p>
      </div>
      <Toggle on={on} onToggle={() => { if (!disabled) onToggle(); }} />
    </div>
  );
}

export function ProfileScreen({ data, persist }: ScreenProps) {
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
        <Card className="p-6">
          <p className="text-sm text-mira-muted">Пройди онбординг чтобы настроить профиль</p>
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

  if (section === "partner") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Режим партнёра</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary transition">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mira-lavender-light">
              <Users className="h-6 w-6 text-mira-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-mira-text">Покажи партнёру, что происходит</p>
              <p className="text-xs text-mira-muted">Без интимных деталей — только фаза и советы</p>
            </div>
          </div>
          <p className="text-sm text-mira-muted mb-4">
            Партнёр увидит: текущую фазу цикла, что это значит для настроения и энергии, и что лучше делать / не делать. Никаких личных данных, симптомов или деталей.
          </p>
          <Button className="w-full" onClick={() => {
            const url = `${window.location.origin}/partner`;
            if (navigator.share) {
              navigator.share({ title: "Mira — Режим партнёра", url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url).catch(() => {});
              alert("Ссылка скопирована!");
            }
          }}>
            <Users className="h-4 w-4" /> Поделиться ссылкой
          </Button>
          <div className="mt-4 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-3">
            <p className="text-xs text-mira-success">Партнёр должен открыть ссылку на том же устройстве. Данные не передаются на сервер.</p>
          </div>
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
    const partnerShare = profile.partnerShare ?? defaultPartnerShare;

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

            <div className="rounded-2xl border border-mira-cycle/10 bg-[#F8E8EE]/25 p-4">
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

            <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-mira-primary" />
                <p className="text-sm font-bold text-mira-text">Что видит партнёр</p>
              </div>
              {[
                { key: "phase" as const, label: "Фаза цикла", desc: "день и общее состояние фазы" },
                { key: "moodEnergy" as const, label: "Настроение и энергия", desc: "без личных записей и симптомов" },
                { key: "tips" as const, label: "Советы поддержки", desc: "что лучше делать / не делать" },
              ].map((item) => (
                <div key={item.key} className="mt-2 flex items-center gap-3 rounded-xl bg-white px-3 py-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-mira-text">{item.label}</p>
                    <p className="text-[11px] text-mira-muted">{item.desc}</p>
                  </div>
                  <Toggle on={partnerShare[item.key]} onToggle={() => {
                    persist(saveProfile(data, { ...profile, partnerShare: { ...partnerShare, [item.key]: !partnerShare[item.key] } }));
                  }} />
                </div>
              ))}
              <p className="mt-3 text-[11px] leading-relaxed text-mira-muted">
                Партнёр не видит секс, беременность, заметки, лекарства, анализы, задержки и дневник.
              </p>
            </div>

            <div className="rounded-2xl border border-mira-lavender/20 bg-white p-4">
              <p className="text-sm font-bold text-mira-text">Политика приватности простыми словами</p>
              <div className="mt-2 space-y-1 text-xs leading-relaxed text-mira-muted">
                <p>1. Локальные данные хранятся в браузере этого устройства.</p>
                <p>2. Облако используется только для резервной копии после входа.</p>
                <p>3. Чувствительные категории можно исключить из облака.</p>
                <p>4. Партнёрский режим показывает только выбранные общие подсказки.</p>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mira-text">Профиль</h1>
        <p className="mt-1 text-sm leading-relaxed text-mira-muted">
          Управление циклом, приватностью, напоминаниями и тем, какие данные Mira учитывает.
        </p>
      </div>

      <div className="mb-5">
        <PagePurposeCard
          items={[
            { label: "Зачем", title: "Настроить Mira", body: "Возраст, цикл и режимы делают советы точнее." },
            { label: "Что сделать", title: "Проверь разделы", body: "Начни с цикла, приватности и напоминаний." },
            { label: "Что получишь", title: "Контроль данных", body: "Ты выбираешь, что хранить, защищать и синхронизировать." },
          ]}
        />
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mira-rose-light to-mira-lavender-light text-2xl font-bold text-mira-primary">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-mira-text">{profile.name}</p>
            <p className="text-xs text-mira-muted">Mira</p>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-mira-primary/10 bg-mira-lavender-light/25 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Database className="h-4 w-4 text-mira-primary" />
            <p className="text-sm font-bold text-mira-text">Где хранятся данные</p>
          </div>
          <p className="text-xs leading-relaxed text-mira-muted">
            Сейчас данные хранятся только на этом устройстве. Если очистить браузер или удалить данные сайта, записи могут пропасть.
          </p>
          {!syncEmail && (
            <Button className="mt-3 w-full" onClick={() => setSection("sync")}>
              <Cloud className="h-4 w-4" /> Включить резервную копию
            </Button>
          )}
        </div>

        <div className="mb-5 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-mira-bg px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Данные</p>
            <p className="mt-1 text-xs font-semibold text-mira-text">на устройстве</p>
          </div>
          <div className="rounded-2xl bg-mira-bg px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Синхронизация</p>
            <p className="mt-1 text-xs font-semibold text-mira-text">{syncEmail ? "включена" : "локально"}</p>
          </div>
          <div className="rounded-2xl bg-mira-bg px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Защита</p>
            <p className="mt-1 text-xs font-semibold text-mira-text">{profile.pinEnabled ? "PIN включён" : "PIN выключен"}</p>
          </div>
        </div>

        <div className="space-y-5">
          {menuGroups.map(group => (
            <div key={group.title}>
              <p className="px-1 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-mira-muted">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-mira-bg"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                      <p className="text-xs text-mira-muted">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-mira-lavender" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={confirmAndClearAllData}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-red-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-500">Удалить данные</p>
              <p className="text-xs text-mira-muted">Безвозвратно удалить всё</p>
            </div>
            <ChevronRight className="h-4 w-4 text-mira-lavender" />
          </button>
        </div>
      </Card>
    </div>
  );
}
