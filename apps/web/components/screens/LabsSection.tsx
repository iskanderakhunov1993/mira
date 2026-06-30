"use client";

import { useState } from "react";
import { FlaskConical, Plus, Trash2, Stethoscope, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dateKey } from "@/lib/store";
import {
  labCatalog, getLabRange, evaluateLab, labStatusMeta,
  getLabRecommendations, getHormoneCheckup45, addLabResult, removeLabResult,
} from "@/lib/labs";
import type { MiraLocalData } from "@/lib/types";

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
};

export function LabsSection({ data, persist }: Props) {
  const recs = getLabRecommendations(data);
  const hormoneCheckup = getHormoneCheckup45(data);
  const labs = data.labs ?? [];

  const [adding, setAdding] = useState(false);
  const [testId, setTestId] = useState(labCatalog[0].id);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(dateKey());

  const range = getLabRange(testId);

  function save() {
    const num = parseFloat(value.replace(",", "."));
    if (!range || isNaN(num)) return;
    persist(addLabResult(data, { testId, value: num, unit: range.unit, date }));
    setValue("");
    setAdding(false);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-mira-primary" />
        <p className="text-sm font-semibold text-mira-text">Анализы</p>
      </div>

      {hormoneCheckup.show && (
        <div className="mb-5 rounded-2xl border border-mira-primary/15 bg-mira-lavender-light/25 p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-mira-primary" />
            <p className="text-sm font-bold text-mira-text">{hormoneCheckup.title}</p>
          </div>
          <p className="text-xs leading-relaxed text-mira-muted">{hormoneCheckup.body}</p>
          <div className="mt-3 rounded-xl bg-white/75 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Прогестерон</p>
            <p className="mt-0.5 text-xs leading-relaxed text-mira-text">
              Для твоей длины цикла ориентир — примерно {hormoneCheckup.progesteroneDay}-й день, то есть за 7 дней до ожидаемых месячных. При нерегулярном цикле день лучше согласовать с врачом.
            </p>
          </div>
          <div className="mt-3 space-y-1.5">
            {hormoneCheckup.doctorQuestions.slice(0, 3).map((question) => (
              <p key={question} className="text-[11px] leading-relaxed text-mira-text">• {question}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Часть 1: какие анализы обсудить ── */}
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-mira-muted">
        Что стоит обсудить с врачом
      </p>
      {recs.length === 0 ? (
        <div className="mb-5 rounded-2xl border border-mira-lavender/20 bg-mira-bg/60 p-3.5">
          <p className="text-xs text-mira-muted">
            Пока явных поводов нет. Продолжай отмечать состояние — если что-то начнёт повторяться,
            я подскажу, какие анализы имеет смысл обсудить.
          </p>
        </div>
      ) : (
        <div className="mb-5 space-y-2.5">
          {recs.map((r) => (
            <div key={r.id} className="rounded-2xl border border-mira-primary/15 bg-mira-lavender-light/20 p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 shrink-0 text-mira-primary" />
                <p className="text-sm font-semibold text-mira-text">{r.title}</p>
              </div>
              <p className="mb-2 text-xs text-mira-muted">{r.why}</p>
              {r.action ? (
                <span className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-mira-primary">
                  {r.action}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {r.testIds.map((id) => (
                    <span key={id} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-mira-primary">
                      {getLabRange(id)?.name ?? id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="text-[10px] text-mira-muted">
            Это не назначение. Необходимость анализов определяет врач.
          </p>
        </div>
      )}

      {/* ── Часть 2: мои анализы ── */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Мои анализы</p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-mira-primary transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Добавить
          </button>
        )}
      </div>

      {/* Форма добавления */}
      {adding && (
        <div className="mb-3 rounded-2xl border border-mira-lavender/30 bg-mira-bg/60 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-mira-text">Новый результат</p>
            <button onClick={() => setAdding(false)} className="text-mira-muted hover:text-mira-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="mb-2 block">
            <span className="mb-1 block text-[10px] font-semibold text-mira-muted">Показатель</span>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full rounded-xl border border-mira-lavender/30 bg-white px-3 py-2 text-sm text-mira-text outline-none focus:border-mira-primary"
            >
              {labCatalog.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.unit})</option>
              ))}
            </select>
          </label>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1 block text-[10px] font-semibold text-mira-muted">Значение, {range?.unit}</span>
              <input
                type="text" inputMode="decimal" value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={range ? `${range.low}–${range.high}` : ""}
                className="w-full rounded-xl border border-mira-lavender/30 bg-white px-3 py-2 text-sm text-mira-text outline-none focus:border-mira-primary"
              />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold text-mira-muted">Дата сдачи</span>
              <input
                type="date" value={date} max={dateKey()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-mira-lavender/30 bg-white px-3 py-2 text-sm text-mira-text outline-none focus:border-mira-primary"
              />
            </label>
          </div>
          {range && (
            <p className="mb-2 text-[10px] text-mira-muted">Референс: {range.low}–{range.high} {range.unit}</p>
          )}
          <Button className="w-full" onClick={save} disabled={!value.trim()}>Сохранить</Button>
        </div>
      )}

      {/* Список результатов */}
      {labs.length === 0 && !adding ? (
        <p className="mb-3 text-xs text-mira-muted">
          Внеси результаты — я сравню их с референсом и помечу, что стоит обсудить с врачом.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          {labs.map((lab) => {
            const r = getLabRange(lab.testId);
            const evalResult = evaluateLab(lab.testId, lab.value);
            const meta = evalResult ? labStatusMeta[evalResult.status] : null;
            return (
              <div
                key={lab.id}
                className="rounded-2xl border p-3"
                style={meta ? { borderColor: `${meta.color}33`, background: `${meta.bg}66` } : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-mira-text">{r?.name ?? lab.testId}</p>
                    <p className="text-[10px] text-mira-muted">
                      {new Date(lab.date).toLocaleDateString("ru-RU")}
                      {r && ` · референс ${r.low}–${r.high} ${r.unit}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-mira-text">{lab.value} <span className="text-xs font-normal text-mira-muted">{lab.unit}</span></p>
                      {meta && (
                        <span className="text-[10px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                      )}
                    </div>
                    <button
                      onClick={() => persist(removeLabResult(data, lab.id))}
                      className="rounded-lg p-1.5 text-mira-muted transition hover:text-mira-cycle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {evalResult && evalResult.status !== "ok" && (
                  <p className="mt-2 text-[11px]" style={{ color: meta?.color }}>{evalResult.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Дисклеймер */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/20 p-3">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mira-success" />
        <p className="text-[10px] text-mira-success">
          Это не диагноз и не замена консультации. Референсы общие — в разных лабораториях
          они отличаются, ориентируйтесь на бланк своей лаборатории и решение врача.
        </p>
      </div>
    </Card>
  );
}
