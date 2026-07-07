"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { Toast } from "@/components/ui/Toast";
import { LocalHealthRepository } from "@/data/healthRepository";
import { forbiddenNotificationCopy, reminderOptions, trackerOptions } from "@/features/settings/options";
import { addCustomSymptom, buildJsonExport, removeCustomSymptom, setWaterTarget, toggleTracker } from "@/features/settings/model";
import { clearPin, savePin } from "@/lib/privacy";
import type { HealthSettings } from "@/types/health";

function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const repository = useMemo(() => new LocalHealthRepository(), []);
  const [settings, setSettings] = useState<HealthSettings | null>(null);
  const [symptom, setSymptom] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    repository.getSettings().then((result) => {
      if (result.ok) setSettings(result.data);
    });
  }, [repository]);

  async function save(next: HealthSettings) {
    setSettings(next);
    await repository.saveSettings(next);
  }

  async function exportJson() {
    const snapshot = await repository.getSnapshot();
    if (!snapshot.ok) return;
    downloadFile(`mira-export-${new Date().toISOString().slice(0, 10)}.json`, buildJsonExport(snapshot.data));
    setToast("Экспорт подготовлен.");
  }

  async function deleteAll() {
    if (!confirm("Удалить все локальные данные Mira? Это действие нельзя отменить.")) return;
    clearPin();
    await repository.resetLocalData();
    localStorage.removeItem("mira:data");
    setToast("Локальные данные удалены.");
    window.setTimeout(() => window.location.assign("/onboarding?restart=1"), 700);
  }

  async function togglePin() {
    if (!settings) return;
    if (settings.privacy.pinEnabled) {
      clearPin();
      await save({ ...settings, privacy: { ...settings.privacy, pinEnabled: false, biometricsEnabled: false }, updatedAt: new Date().toISOString() });
      return;
    }
    const pin = prompt("Придумайте PIN из 4–6 цифр. Он хранится только на этом устройстве.");
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      setToast("PIN должен состоять из 4–6 цифр.");
      return;
    }
    await savePin(pin);
    await save({ ...settings, privacy: { ...settings.privacy, pinEnabled: true }, updatedAt: new Date().toISOString() });
  }

  function addSymptom() {
    if (!settings) return;
    const normalized = symptom.trim();
    if (!normalized) {
      setToast("Напишите симптом перед добавлением.");
      return;
    }
    void save(addCustomSymptom(settings, normalized));
    setSymptom("");
    setToast("Симптом добавлен.");
  }

  if (!settings) {
    return <Screen title="Настройки" eyebrow="Privacy"><div className="h-40 animate-pulse rounded-[8px] bg-[var(--mira-token-card)]" /></Screen>;
  }

  return (
    <Screen title="Настройки" eyebrow="Privacy и данные">
      {toast && <Toast message={toast} tone={toast.includes("PIN") || toast.includes("Напишите") ? "error" : "success"} />}
      <Card className="p-5">
        <h2 className="text-lg font-black">Что отслеживать</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {trackerOptions.map((option) => {
            const active = settings.trackerPreferences.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => save(toggleTracker(settings, option.id))}
                className={`min-h-12 rounded-[8px] border px-3 text-left text-sm font-black ${active ? "border-[var(--mira-token-accent)] bg-[color-mix(in_srgb,var(--mira-token-accent)_14%,var(--mira-token-card))]" : "border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] text-[var(--mira-token-muted)]"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-lg font-black">Уведомления</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["important_only", "custom", "off"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => save({ ...settings, notificationsMode: mode, updatedAt: new Date().toISOString() })}
              className={`rounded-[8px] px-3 py-3 text-xs font-black ${settings.notificationsMode === mode ? "bg-[var(--mira-token-primary)] text-[var(--mira-token-primary-contrast)]" : "bg-[var(--mira-token-card-muted)] text-[var(--mira-token-muted)]"}`}
            >
              {mode === "important_only" ? "Только важное" : mode === "custom" ? "Выбор" : "Выкл."}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {reminderOptions.map((option) => {
            const active = settings.reminders[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => save({ ...settings, reminders: { ...settings.reminders, [option.id]: !active }, updatedAt: new Date().toISOString() })}
                className="flex w-full items-center justify-between rounded-[8px] bg-[var(--mira-token-card-muted)] px-3 py-3 text-left"
              >
                <span className="text-sm font-black">{option.label}</span>
                <Chip tone={active ? "success" : "neutral"}>{active ? "on" : "off"}</Chip>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs font-semibold leading-relaxed text-[var(--mira-token-muted)]">{forbiddenNotificationCopy[0]}</p>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-lg font-black">Цель воды и БТ</h2>
        <label className="mt-3 block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--mira-token-muted)]">Цель воды, мл</span>
          <input
            aria-label="Цель воды в миллилитрах"
            type="number"
            value={settings.waterTargetMl}
            onChange={(event) => save(setWaterTarget(settings, Number(event.target.value)))}
            className="mt-2 h-12 w-full rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 font-black outline-none"
          />
        </label>
        <button
          type="button"
          aria-pressed={settings.basalTemperature.enabled}
          aria-label="Базальная температура"
          onClick={() => save({ ...settings, basalTemperature: { ...settings.basalTemperature, enabled: !settings.basalTemperature.enabled }, updatedAt: new Date().toISOString() })}
          className="mt-3 flex w-full items-center justify-between rounded-[8px] bg-[var(--mira-token-card-muted)] px-3 py-3 text-left"
        >
          <span className="text-sm font-black">Базальная температура</span>
          <Chip>{settings.basalTemperature.enabled ? "on" : "off"}</Chip>
        </button>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-lg font-black">Свои симптомы</h2>
        <div className="mt-3 flex gap-2">
          <input aria-label="Новый пользовательский симптом" value={symptom} onChange={(event) => setSymptom(event.target.value)} className="h-12 min-w-0 flex-1 rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-3 font-black outline-none" placeholder="например озноб" />
          <Button type="button" onClick={addSymptom}>Добавить</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.customSymptoms.map((item) => (
            <button key={item} type="button" aria-label={`Удалить симптом ${item}`} onClick={() => save(removeCustomSymptom(settings, item))}>
              <Chip>{item} ×</Chip>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-1 h-5 w-5 text-[var(--mira-token-primary)]" />
          <div>
            <h2 className="text-lg font-black">Защита данных</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--mira-token-muted)]">PIN хранится локально. Биометрия на web отмечается как fallback и не блокирует вход, если разрешение не дано.</p>
          </div>
        </div>
        <Button type="button" variant="secondary" className="mt-4 w-full" onClick={togglePin}>
          {settings.privacy.pinEnabled ? "Отключить PIN" : "Включить PIN"}
        </Button>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-lg font-black">Экспорт и удаление</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">Перед экспортом проверьте файл. Он может содержать чувствительные локальные записи.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={exportJson}><Download className="h-4 w-4" /> JSON</Button>
          <Button type="button" variant="danger" onClick={deleteAll}><Trash2 className="h-4 w-4" /> Удалить</Button>
        </div>
        <Link href="/onboarding?restart=1" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-[var(--mira-token-card-muted)] px-3 text-sm font-black">
          <RotateCcw className="h-4 w-4" /> Перезапуск онбординга
        </Link>
      </Card>
    </Screen>
  );
}
