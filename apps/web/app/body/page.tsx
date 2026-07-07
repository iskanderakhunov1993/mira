"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Droplets, HeartPulse, Printer, Share2, ShieldCheck, Sparkles, Stethoscope, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { Toast } from "@/components/ui/Toast";
import { LocalHealthRepository } from "@/data/healthRepository";
import { buildBodyViewModel, buildDoctorSummaryHtml, buildDoctorSummaryText, defaultDoctorSummaryOptions } from "@/features/body/model";
import type { BodyViewModel, DoctorSummaryOptions } from "@/features/body/types";
import type { Cycle, DailyEntry, UserProfile } from "@/types/health";

type BodyState = {
  profile: UserProfile | null;
  cycles: Cycle[];
  entries: DailyEntry[];
};

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BodyPage() {
  const repository = useMemo(() => new LocalHealthRepository(), []);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [state, setState] = useState<BodyState>({ profile: null, cycles: [], entries: [] });
  const [exportOptions, setExportOptions] = useState<DoctorSummaryOptions>(defaultDoctorSummaryOptions);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [profile, cycles, entries] = await Promise.all([
        repository.getProfile(),
        repository.listCycles(),
        repository.listDailyEntries(),
      ]);
      setState({
        profile: profile.ok ? profile.data : null,
        cycles: cycles.ok ? cycles.data : [],
        entries: entries.ok ? entries.data : [],
      });
      setLoading(false);
    }

    void load();
  }, [repository]);

  const model: BodyViewModel = useMemo(() => buildBodyViewModel(state), [state]);
  const summaryText = useMemo(() => buildDoctorSummaryText(model.doctorSummary, exportOptions), [exportOptions, model]);
  const summaryHtml = useMemo(() => buildDoctorSummaryHtml(model.doctorSummary, exportOptions), [exportOptions, model]);
  const lastCycleDate = model.rhythm.lastCycle === "нет данных" ? null : formatDisplayDate(model.rhythm.lastCycle);
  const latestPeriod = model.doctorSummary.periodEntries.at(-1);
  const latestPeriodDate = latestPeriod ? formatDisplayDate(latestPeriod.date) : lastCycleDate;

  function toggleExportOption(key: keyof DoctorSummaryOptions) {
    setExportOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  function downloadTxt() {
    downloadFile(`mira-doctor-summary-${new Date().toISOString().slice(0, 10)}.txt`, summaryText, "text/plain;charset=utf-8");
    setToast("Сводка подготовлена.");
  }

  function printPdf() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setToast("Откройте TXT: браузер заблокировал окно печати.");
      return;
    }
    printWindow.document.write(summaryHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function shareSummary() {
    if (!navigator.share) {
      downloadTxt();
      return;
    }
    await navigator.share({ title: "Mira — сводка для врача", text: summaryText }).catch(() => undefined);
  }

  return (
    <Screen className="mira-track-light bg-[#F7F4F1] pb-32" title="Отчёт цикла" eyebrow="Что Mira уже поняла">
      {toast && <Toast message={toast} tone="success" />}
      {loading ? (
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-[30px] bg-white" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-32 animate-pulse rounded-[26px] bg-white" />
            <div className="h-32 animate-pulse rounded-[26px] bg-white" />
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-3">
            <Card className="overflow-hidden rounded-[34px] border-white bg-[#F0E5E3] p-0 shadow-[0_24px_60px_rgba(109,69,80,0.16)]">
              <div className="relative min-h-[300px] p-5">
                <div className="absolute -right-10 top-10 h-52 w-52 rounded-full bg-white/35" />
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/60 px-2 py-1 text-[12px] font-black text-[#F64F86] shadow-[0_12px_28px_rgba(246,79,134,0.16)]">
                  <span>Цикл</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F64F86] text-white">
                    {(model.rhythm.averageCycleLength ?? model.rhythm.completedCycles) || "?"}
                  </span>
                </div>

                <div className="relative">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8E737D]">cycle report</p>
                  <h2 className="mt-2 max-w-[16rem] text-[42px] font-black leading-[0.98] tracking-tight text-[#111111]">
                    Последний цикл
                  </h2>
                  <p className="mt-4 max-w-[17rem] text-sm font-semibold leading-relaxed text-[#6F6875]">
                    {model.rhythm.completedCycles
                      ? `Mira сравнила ${model.rhythm.completedCycles} завершённых циклов и собрала факты без личных заметок.`
                      : "Добавь 2–3 цикла, и Mira начнёт собирать спокойный отчёт с повторяющимися фактами."}
                  </p>
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-[28px] bg-white p-5 shadow-[0_18px_44px_rgba(109,69,80,0.12)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#111111]">Последние месячные начались</p>
                      <p className="mt-2 text-2xl font-black tracking-tight text-[#F64F86]">{latestPeriodDate ?? "пока нет даты"}</p>
                    </div>
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#FFE4ED] text-[#F64F86]">
                      <Droplets className="h-8 w-8" />
                      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black shadow-sm">
                        {model.rhythm.averagePeriodLength ?? "?"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ReportPill label="Циклы" value={`${model.rhythm.completedCycles}`} />
                    <ReportPill label="Норма" value={model.rhythm.averageCycleLength ? `${model.rhythm.averageCycleLength}д` : "—"} />
                    <ReportPill label="Разброс" value={model.rhythm.cycleRange.replace(" дн.", "д")} />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <BentoStat
                className="min-h-36"
                icon={<CalendarDays className="h-5 w-5" />}
                tint="pink"
                label="Диапазон"
                value={model.rhythm.cycleRange}
                note="между стартами"
              />
              <BentoStat
                className="min-h-36"
                icon={<TrendingUp className="h-5 w-5" />}
                tint="green"
                label="Сравнение"
                value={model.comparison.length ? `${model.comparison.length}` : "0"}
                note="последних циклов"
              />
            </div>
          </section>

          <section className="mt-6">
            <SectionHeader title="Mira заметила" meta={model.hasEnoughForInsights ? "по данным" : "первые данные"} />
            {model.insights.length ? (
              <div className="grid gap-3">
                {model.insights.map((insight) => (
                  <Card key={insight.title} className="overflow-hidden rounded-[30px] border-white bg-white p-0 shadow-[0_16px_38px_rgba(45,36,32,0.08)]">
                    <div className="grid grid-cols-[1fr_auto] gap-3 p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1E9FF] text-[#A65DC2]">
                            <Sparkles className="h-5 w-5" />
                          </span>
                          <Chip>{insight.sample}</Chip>
                        </div>
                        <h3 className="mt-4 text-xl font-black text-[#1A1A1A]">{insight.title}</h3>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#6F6875]">{insight.body}</p>
                      </div>
                      <MiniPatternDots />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-[30px] border-white bg-white p-5 shadow-[0_16px_38px_rgba(45,36,32,0.08)]">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#F64F86]">пока мало данных</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A]">Инсайтов пока мало</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#6F6875]">
                  Отметь месячные, боль или симптомы в нескольких циклах, и Mira покажет повторения в формате отчёта.
                </p>
                <MiniCycleRail className="mt-5" />
              </Card>
            )}
          </section>

          <section className="mt-6 grid gap-3">
            <SectionHeader title="Что попало в отчёт" meta={`${model.changes.length} фактов`} />
            <div className="grid gap-3">
              {model.changes.map((change) => (
                <ReportRow key={change.label} label={change.label} value={change.value} />
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
              <Card className="rounded-[30px] border-white bg-white p-5 shadow-[0_16px_38px_rgba(45,36,32,0.08)]">
                <SectionHeader title="Сравнение циклов" meta={model.comparison.length ? "последние" : "ожидаем"} compact />
                {model.comparison.length ? (
                  <CycleHistory items={model.comparison} />
                ) : (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6F6875]">Сравнение появится после 2–3 завершённых циклов.</p>
                )}
              </Card>

              <Card className="rounded-[30px] border-white bg-[#E9F5F2] p-5 shadow-[0_16px_38px_rgba(45,36,32,0.07)]">
                <Stethoscope className="h-6 w-6 text-[#127A7A]" />
                <h2 className="mt-4 text-lg font-black text-[#1A1A1A]">Для врача</h2>
                {model.importantChanges.length ? (
                  <div className="mt-3 space-y-3">
                    {model.importantChanges.map((change) => (
                      <div key={change.label}>
                        <p className="text-sm font-black text-[#1A1A1A]">{change.label}</p>
                        <p className="mt-1 text-xs font-bold leading-relaxed text-[#6F6875]">{change.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6F6875]">Повторяющихся важных изменений пока не видно.</p>
                )}
              </Card>
            </div>
          </section>

          <Card className="mt-6 rounded-[32px] border-white bg-white p-5 shadow-[0_18px_44px_rgba(45,36,32,0.10)]">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#F1E9FF] text-[#7863A8]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8E93]">приватность</p>
                <h2 className="mt-1 text-xl font-black text-[#1A1A1A]">Сводка для врача</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-[#6F6875]">
                  Личные заметки и секс не добавляются по умолчанию. Выбери только нужные разделы.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              <ExportToggle label="Даты циклов" checked={exportOptions.cycleDates} onToggle={() => toggleExportOption("cycleDates")} />
              <ExportToggle label="Длины циклов" checked={exportOptions.cycleLengths} onToggle={() => toggleExportOption("cycleLengths")} />
              <ExportToggle label="Месячные" checked={exportOptions.periodEntries} onToggle={() => toggleExportOption("periodEntries")} />
              <ExportToggle label="Боль и влияние на обычную жизнь" checked={exportOptions.pain} onToggle={() => toggleExportOption("pain")} />
              <ExportToggle label="Симптомы" checked={exportOptions.symptoms} onToggle={() => toggleExportOption("symptoms")} />
              <ExportToggle label="Настроение и энергия" checked={exportOptions.moodEnergy} onToggle={() => toggleExportOption("moodEnergy")} />
              <ExportToggle label="Сон" checked={exportOptions.sleep} onToggle={() => toggleExportOption("sleep")} />
              <ExportToggle label="Личные заметки" checked={exportOptions.notes} onToggle={() => toggleExportOption("notes")} />
              <ExportToggle label="Секс" checked={false} disabled note="В новом хранилище не экспортируется." onToggle={() => undefined} />
            </div>
            <pre className="mt-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-[22px] bg-[#F7F4F1] p-4 text-xs font-semibold leading-relaxed text-[#4A4542]">
              {summaryText}
            </pre>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button type="button" className="rounded-full bg-[#F64F86] px-2 text-white" onClick={downloadTxt}>
                <Download className="h-4 w-4" /> TXT
              </Button>
              <Button type="button" variant="secondary" className="rounded-full px-2" onClick={printPdf}>
                <Printer className="h-4 w-4" /> PDF
              </Button>
              <Button type="button" variant="secondary" className="rounded-full px-2" onClick={shareSummary}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </Card>
        </>
      )}
    </Screen>
  );
}

function ExportToggle({ label, checked, disabled, note, onToggle }: { label: string; checked: boolean; disabled?: boolean; note?: string; onToggle: () => void }) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-[18px] border border-[#ECE7E3] bg-[#F1F1F1] px-4 py-3 ${disabled ? "opacity-60" : ""}`}>
      <span>
        <span className="block text-sm font-black text-[#1A1A1A]">{label}</span>
        {note && <span className="mt-1 block text-xs font-semibold text-[#8E8E93]">{note}</span>}
      </span>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="h-5 w-5 accent-[var(--mira-token-primary)]"
      />
    </label>
  );
}

function ReportPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#F7F4F1] px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8E8E93]">{label}</p>
      <p className="mt-1 truncate text-base font-black leading-none text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function SectionHeader({ title, meta, compact = false }: { title: string; meta?: string; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center justify-between gap-3" : "mb-3 flex items-center justify-between gap-3"}>
      <h2 className="text-lg font-black tracking-tight text-[#1A1A1A]">{title}</h2>
      {meta && <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#8E8E93]">{meta}</span>}
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white bg-white px-4 py-4 shadow-[0_12px_30px_rgba(45,36,32,0.06)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFE4ED] text-[#F64F86]">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-[#1A1A1A]">{label}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#8E8E93]">за выбранный период</p>
        </div>
      </div>
      <p className="max-w-[45%] text-right text-sm font-black leading-tight text-[#6F6875]">{value}</p>
    </div>
  );
}

function MiniCycleRail({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[24px] bg-[#F7F4F1] p-4 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.12em] text-[#8E8E93]">
        <span>старт</span>
        <span>овуляция</span>
        <span>пмс</span>
      </div>
      <div className="mt-3 grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }).map((_, index) => (
          <span
            key={index}
            className={`h-3 rounded-full ${
              index < 3 ? "bg-[#F64F86]" : index === 5 ? "bg-[#1B9A9A]" : "bg-[#E4DED9]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function MiniPatternDots() {
  return (
    <div className="hidden w-20 shrink-0 grid-cols-3 gap-1 self-center sm:grid">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className={`h-4 rounded-full ${index % 4 === 0 ? "bg-[#F64F86]" : index % 5 === 0 ? "bg-[#1B9A9A]" : "bg-[#F1E9FF]"}`}
        />
      ))}
    </div>
  );
}

function CycleHistory({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="mt-4 grid gap-4">
      {items.map((item, index) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[#1A1A1A]">{item.label}</span>
            <span className="text-sm font-black text-[#1A1A1A]">{item.value}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 16 }).map((_, dot) => (
              <span
                key={dot}
                className={`h-2 flex-1 rounded-full ${
                  dot < 4 ? "bg-[#F64F86]" : dot >= 8 && dot <= 10 + index ? "bg-[#1B9A9A]" : "bg-[#E7E1DD]"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date).replace(".", "");
}

function BentoStat({
  label,
  value,
  note,
  icon,
  tint = "neutral",
  className = "",
}: {
  label: string;
  value: string;
  note: string;
  icon?: React.ReactNode;
  tint?: "neutral" | "pink" | "green";
  className?: string;
}) {
  const tintClass = tint === "pink"
    ? "bg-[#FFF1F6] text-[#C93D72]"
    : tint === "green"
      ? "bg-[#EEFBF3] text-[#258653]"
      : "bg-white text-[#1A1A1A]";

  return (
    <div className={`rounded-[28px] border border-white p-4 shadow-[0_14px_34px_rgba(45,36,32,0.07)] ${tintClass} ${className}`}>
      {icon && <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75">{icon}</div>}
      <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-60">{label}</p>
      <p className="mt-2 text-xl font-black leading-tight tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-bold opacity-60">{note}</p>
    </div>
  );
}
