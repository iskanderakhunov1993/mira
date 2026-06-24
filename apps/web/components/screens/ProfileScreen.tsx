"use client";

import { useState } from "react";
import {
  UserRound, Calendar, Shield, Salad, Star,
  Download, Trash2, ChevronRight, Lock, Bell,
  Heart, Eye, Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveProfile, clearData } from "@/lib/store";
import type { ScreenProps } from "./types";
import type { UserProfile, AdditionalMode } from "@/lib/types";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-mira-primary" : "bg-mira-lavender"}`}>
      <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function ProfileScreen({ data, persist }: ScreenProps) {
  const profile = data.profile;
  const [section, setSection] = useState<string | null>(null);

  if (!profile) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Профиль</h1>
        <Card className="p-6">
          <p className="text-sm text-mira-muted">Пройдите онбординг чтобы настроить профиль</p>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { icon: UserRound, label: "Мои данные", desc: "Рост, вес, возраст, активность", id: "data" },
    { icon: Calendar, label: "Настройки цикла", desc: `${profile.cycleConfig.cycleLength} дн., период ${profile.cycleConfig.periodLength} дн.`, id: "cycle" },
    { icon: Shield, label: "Приватность", desc: "PIN, уведомления, отметки", id: "privacy" },
    { icon: Salad, label: "Питание", desc: profile.showCalories ? "Калории включены" : "Калории выключены", id: "nutrition" },
    { icon: Star, label: "Дополнительный режим", desc: profile.additionalMode === "islam" ? "Ислам · активен" : "Не выбран", id: "mode" },
    { icon: Download, label: "Экспорт данных", desc: "Скачать свои данные", id: "export" },
  ];

  if (section === "export") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Экспорт данных</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary">← Назад</button>
        <Card className="max-w-lg p-6">
          <p className="mb-4 text-sm text-mira-muted">Скачайте свои данные в формате JSON. Файл содержит все ваши записи, профиль и настройки.</p>
          <Button className="w-full" onClick={() => {
            const exported = { ...data, exportedAt: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mira-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4" /> Скачать JSON
          </Button>
          <p className="mt-4 text-xs text-mira-muted">Данные сохраняются только на вашем устройстве. Экспорт создаёт копию для резервного хранения.</p>
        </Card>
      </div>
    );
  }

  if (section === "data") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Мои данные</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="space-y-3">
            {[
              { label: "Имя", value: profile.name, onChange: (v: string) => persist(saveProfile(data, { ...profile, name: v })), type: "text" },
              { label: "Рост (см)", value: profile.height ?? "", onChange: (v: string) => persist(saveProfile(data, { ...profile, height: v ? +v : undefined })), type: "number" },
              { label: "Вес (кг)", value: profile.weight ?? "", onChange: (v: string) => persist(saveProfile(data, { ...profile, weight: v ? +v : undefined })), type: "number" },
              { label: "Возраст", value: profile.age ?? "", onChange: (v: string) => persist(saveProfile(data, { ...profile, age: v ? +v : undefined })), type: "number" },
            ].map(f => (
              <div key={f.label} className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                <label className="text-xs text-mira-muted">{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
              </div>
            ))}
            <div>
              <p className="mb-2 text-xs text-mira-muted">Уровень активности</p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map(v => (
                  <button key={v} onClick={() => persist(saveProfile(data, { ...profile, activityLevel: v }))}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      profile.activityLevel === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/40 bg-white text-mira-muted"
                    }`}>{{ low: "Низкий", medium: "Средний", high: "Высокий" }[v]}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "cycle") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Настройки цикла</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary">← Назад</button>
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

  if (section === "privacy") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Приватность</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary">← Назад</button>
        <Card className="max-w-lg p-6">
          <div className="space-y-4">
            {[
              { icon: Lock, label: "PIN-код", desc: "Защита входа в приложение", key: "pinEnabled" as const },
              { icon: Bell, label: "Скрытые уведомления", desc: "Без деталей на экране блокировки", key: "hiddenNotifications" as const },
              { icon: Heart, label: "Приватные отметки", desc: "Интимность скрыта по умолчанию", key: "privateMarks" as const },
              { icon: Eye, label: "Калории", desc: "Показывать калории в питании", key: "showCalories" as const },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                  <p className="text-xs text-mira-muted">{item.desc}</p>
                </div>
                <Toggle on={!!profile[item.key]} onToggle={() => {
                  persist(saveProfile(data, { ...profile, [item.key]: !profile[item.key] }));
                }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (section === "mode") {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-mira-text">Дополнительный режим</h1>
        <button onClick={() => setSection(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary">← Назад</button>
        <Card className="max-w-lg p-6">
          <p className="mb-4 text-sm text-mira-muted">
            Mira может добавить специальные отметки и настройки. Это необязательно, приватно и можно изменить позже.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Без режима", value: "none" as AdditionalMode, enabled: true },
              { label: "Ислам", value: "islam" as AdditionalMode, enabled: true },
              { label: "Христианство", value: null, enabled: false },
              { label: "Иудаизм", value: null, enabled: false },
              { label: "Буддизм", value: null, enabled: false },
            ].map(opt => (
              <button
                key={opt.label}
                disabled={!opt.enabled}
                onClick={() => opt.value && persist(saveProfile(data, { ...profile, additionalMode: opt.value }))}
                className={`rounded-2xl border p-4 text-left transition ${
                  profile.additionalMode === opt.value
                    ? "border-mira-primary bg-mira-lavender-light shadow-card"
                    : opt.enabled
                      ? "border-mira-lavender/30 bg-white hover:border-mira-primary/30"
                      : "border-mira-lavender/20 bg-mira-bg opacity-50"
                }`}
              >
                <p className={`text-sm font-semibold ${profile.additionalMode === opt.value ? "text-mira-primary" : "text-mira-text"}`}>
                  {opt.label}
                </p>
                {!opt.enabled && <p className="mt-1 text-[10px] text-mira-muted">Скоро</p>}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/50 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-mira-success" />
            <p className="text-xs text-mira-success">Mira не является источником фетв. В спорных вопросах лучше обратиться к знающему специалисту.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-mira-text">Профиль</h1>

      <Card className="max-w-lg p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mira-rose-light to-mira-lavender-light text-2xl font-bold text-mira-primary">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-mira-text">{profile.name}</p>
            {profile.email && <p className="text-sm text-mira-muted">{profile.email}</p>}
          </div>
        </div>

        <div className="space-y-1">
          {menuItems.map(item => (
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

          <button
            onClick={() => { if (confirm("Удалить все данные? Это действие нельзя отменить.")) { clearData(); window.location.reload(); } }}
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
