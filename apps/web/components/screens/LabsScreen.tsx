"use client";

import { AlertTriangle, CheckCircle2, FlaskConical, FileText, Shield, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PagePurposeCard } from "@/components/ui/PagePurposeCard";
import { evaluateLab, getLabRange, getLabRecommendations, labStatusMeta } from "@/lib/labs";
import { LabsSection } from "./LabsSection";
import type { ScreenProps } from "./types";

export function LabsScreen({ data, persist, navigate }: ScreenProps) {
  const labs = data.labs ?? [];
  const recommendations = getLabRecommendations(data);
  const abnormalLabs = labs.filter((lab) => {
    const result = evaluateLab(lab.testId, lab.value);
    return result && result.status !== "ok";
  });
  const latestLab = [...labs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const labGroups = Array.from(new Set(labs.map((lab) => getLabRange(lab.testId)?.group ?? "Другое")));

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Медицинские данные</p>
        <h1 className="mt-1 text-2xl font-bold text-mira-text">Анализы</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mira-muted">
          Страница для хранения результатов и подготовки спокойных вопросов врачу.
        </p>
      </div>

      <div className="mb-5">
        <PagePurposeCard
          items={[
            { label: "Зачем", title: "Собрать результаты", body: "Храни важные показатели рядом с симптомами и циклом." },
            { label: "Что сделать", title: "Добавь анализ", body: "Введи показатель, дату, единицы и значение из бланка лаборатории." },
            { label: "Что получишь", title: "Вопросы врачу", body: "Mira покажет, что стоит обсудить, без диагнозов и запугивания." },
          ]}
        />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
            <FlaskConical className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-mira-text">{labs.length}</p>
          <p className="text-xs text-mira-muted">результатов сохранено</p>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E8EE] text-mira-cycle">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-mira-text">{abnormalLabs.length}</p>
          <p className="text-xs text-mira-muted">показателей вне референса</p>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E0F5E8] text-mira-success">
            <Stethoscope className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-mira-text">{recommendations.length}</p>
          <p className="text-xs text-mira-muted">тем для обсуждения</p>
        </Card>
      </div>

      <Card className="mb-5 border-mira-success/15 bg-[#E0F5E8]/20 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-mira-success">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-mira-text">Спокойно: анализы не являются диагнозом</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Референсы отличаются между лабораториями. Mira помогает собрать историю и вопросы, а решение остаётся за врачом и вашим бланком анализа.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-5 border-mira-lavender/20 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mira-bg text-mira-primary">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-mira-text">Это чувствительные медицинские данные</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Анализы попадают в отчёт врачу только как часть твоей истории. Синхронизацию анализов можно отключить в профиле, если хочешь хранить их только на устройстве.
            </p>
          </div>
        </div>
      </Card>

      {labs.length > 0 && (
        <Card className="mb-5 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Группы показателей</p>
          <div className="flex flex-wrap gap-2">
            {labGroups.map((group) => (
              <span key={group} className="rounded-full bg-mira-bg px-3 py-1.5 text-xs font-semibold text-mira-text">
                {group}: {labs.filter((lab) => (getLabRange(lab.testId)?.group ?? "Другое") === group).length}
              </span>
            ))}
          </div>
        </Card>
      )}

      {latestLab && (
        <Card className="mb-5 border-mira-primary/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Последний результат</p>
              <p className="mt-1 text-sm font-bold text-mira-text">
                {getLabRange(latestLab.testId)?.name ?? latestLab.testId}: {latestLab.value} {latestLab.unit}
              </p>
              <p className="mt-0.5 text-xs text-mira-muted">{new Date(latestLab.date).toLocaleDateString("ru-RU")}</p>
            </div>
            {(() => {
              const evaluation = evaluateLab(latestLab.testId, latestLab.value);
              const meta = evaluation ? labStatusMeta[evaluation.status] : null;
              return meta ? (
                <span
                  className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ color: meta.color, background: meta.bg }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              ) : null;
            })()}
          </div>
        </Card>
      )}

      <LabsSection data={data} persist={persist} />

      <Card className="mt-5 border-mira-lavender/20 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-mira-text">Для врача</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Все сохранённые анализы автоматически попадают в отчёт врача вместе с симптомами и датами.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("report")}>
            <FileText className="h-4 w-4" /> Открыть отчёт
          </Button>
        </div>
      </Card>
    </div>
  );
}
