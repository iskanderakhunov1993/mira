"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CalendarClock, CheckCircle2, Stethoscope, TestTube2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateKey, getCheckIn, saveCheckIn } from "@/lib/store";
import type { DelayCheck, DelayReason, MiraLocalData } from "@/lib/types";

const reasonOptions: Array<{ id: DelayReason; label: string; hint: string; tone?: "watch" }> = [
  { id: "sex", label: "Был секс", hint: "Любой секс в этом цикле" },
  { id: "unprotected", label: "Без защиты", hint: "Незащищённый или прерванный", tone: "watch" },
  { id: "stress", label: "Стресс", hint: "Сильная нагрузка, тревога, недосып" },
  { id: "illness", label: "Болезнь", hint: "Температура, инфекция, восстановление" },
  { id: "weight_change", label: "Смена веса", hint: "Резкое похудение или набор" },
  { id: "travel", label: "Перелёты", hint: "Дорога, смена часового пояса" },
  { id: "medications", label: "Лекарства", hint: "Новые препараты или отмена" },
  { id: "irregular_cycle", label: "Нерегулярный цикл", hint: "Цикл часто приходит по-разному" },
];

const reasonLabels = Object.fromEntries(reasonOptions.map((reason) => [reason.id, reason.label.toLowerCase()])) as Record<DelayReason, string>;

function buildDelayCheck(selected: DelayReason[], delayDays: number): Omit<DelayCheck, "id" | "savedAt"> {
  const has = (reason: DelayReason) => selected.includes(reason);
  const possibleCauses = [
    has("unprotected") || has("sex") ? "Беременность возможна, если в этом цикле был секс. Это не диагноз, но тест поможет убрать неопределённость." : "",
    has("stress") ? "Стресс, недосып и высокая нагрузка могут сдвигать цикл." : "",
    has("illness") ? "Болезнь или восстановление после неё иногда задерживают месячные." : "",
    has("weight_change") ? "Резкое изменение веса или питания может влиять на цикл." : "",
    has("travel") ? "Перелёты, смена режима и часовых поясов могут сбивать ритм." : "",
    has("medications") ? "Некоторые лекарства или их отмена могут влиять на цикл — лучше сверить это с врачом или инструкцией." : "",
    has("irregular_cycle") ? "Если цикл обычно нерегулярный, задержка может быть частью твоего обычного разброса." : "",
  ].filter(Boolean);

  const summary = selected.length > 0
    ? `Задержка ${delayDays} ${delayDays === 1 ? "день" : "дн."}. Возможные факторы: ${selected.map((reason) => reasonLabels[reason]).join(", ")}.`
    : `Задержка ${delayDays} ${delayDays === 1 ? "день" : "дн."}. Пока отметь возможные факторы и наблюдай динамику.`;

  const testAdvice = has("unprotected") || has("sex")
    ? delayDays >= 1
      ? "Если был секс и месячные уже задерживаются, тест можно сделать сейчас. Если он отрицательный, но месячные не приходят, повтори через несколько дней."
      : "Если был секс, тест обычно информативнее после задержки или примерно через 10-14 дней после секса."
    : "Если секса не было, беременность маловероятна. Фокус — стресс, болезнь, режим и обычная длина цикла.";

  const doctorAdvice = delayDays >= 14
    ? "Если задержка держится около 2 недель и тест отрицательный или причины неясны, лучше обсудить это с врачом."
    : "Если задержки повторяются, цикл стал резко нерегулярным, есть сильная боль, необычные выделения или положительный тест — лучше обратиться к врачу.";

  return {
    delayDays,
    reasons: selected,
    summary,
    possibleCauses: possibleCauses.length > 0 ? possibleCauses : ["Иногда цикл сдвигается из-за нагрузки, сна, питания или обычного разброса. Mira не ставит диагноз, но помогает собрать факты."],
    testAdvice,
    doctorAdvice,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  delayDays: number;
};

export function DelayCheckModal({ open, onClose, data, persist, delayDays }: Props) {
  const [selected, setSelected] = useState<DelayReason[]>([]);
  const [saved, setSaved] = useState(false);
  const delayCheck = useMemo(() => buildDelayCheck(selected, Math.max(1, delayDays)), [selected, delayDays]);

  if (!open) return null;

  function toggle(reason: DelayReason) {
    setSaved(false);
    setSelected((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]);
  }

  function save() {
    const today = dateKey();
    const existing = getCheckIn(data, today);
    const nextCheck: DelayCheck = {
      ...delayCheck,
      id: `delay-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    persist(saveCheckIn(data, {
      ...(existing ?? {}),
      date: today,
      savedAt: new Date().toISOString(),
      delayChecks: [...(existing?.delayChecks ?? []), nextCheck],
      note: existing?.note ?? { text: delayCheck.summary },
    }));
    setSaved(true);
  }

  const content = (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-cycle">Задержка</p>
          <h2 className="mt-1 text-xl font-bold text-mira-text">Почему задержка?</h2>
          <p className="mt-1 text-sm leading-relaxed text-mira-muted">Ответь на короткие вопросы. Mira покажет возможные причины и спокойный следующий шаг.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-mira-muted hover:bg-mira-lavender-light">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 rounded-lg border border-mira-cycle/15 bg-[#F8E8EE]/45 p-3">
        <div className="flex items-center gap-2 text-mira-cycle">
          <CalendarClock className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-widest">Сейчас задержка {Math.max(1, delayDays)} дн.</p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-mira-text">{delayCheck.summary}</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        {reasonOptions.map((reason) => {
          const active = selected.includes(reason.id);
          return (
            <button
              key={reason.id}
              type="button"
              onClick={() => toggle(reason.id)}
              className={`rounded-lg border p-3 text-left transition active:scale-[0.98] ${
                active
                  ? reason.tone === "watch"
                    ? "border-mira-cycle bg-[#F8E8EE] text-mira-cycle"
                    : "border-mira-primary bg-mira-lavender-light text-mira-primary"
                  : "border-mira-lavender/30 bg-white text-mira-muted"
              }`}
            >
              <span className="block text-xs font-bold text-mira-text">{reason.label}</span>
              <span className="mt-1 block text-[11px] leading-snug">{reason.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <PlanBlock title="Возможные причины" icon={<AlertCircle className="h-4 w-4" />} items={delayCheck.possibleCauses} />
        <PlanBlock title="Когда сделать тест" icon={<TestTube2 className="h-4 w-4" />} items={[delayCheck.testAdvice]} />
        <PlanBlock title="Когда к врачу" icon={<Stethoscope className="h-4 w-4" />} items={[delayCheck.doctorAdvice]} />
        <div className="rounded-lg border border-mira-lavender/20 bg-mira-bg p-3">
          <p className="text-xs leading-relaxed text-mira-muted">Mira не ставит диагноз и не подтверждает беременность. Этот разбор нужен, чтобы снизить тревогу и собрать факты.</p>
        </div>
        <Button className="w-full" onClick={save}>
          <CheckCircle2 className="h-4 w-4" />
          {saved ? "Сохранено в дневник" : "Сохранить разбор"}
        </Button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 hidden w-[440px] overflow-y-auto border-l border-mira-lavender/20 bg-white p-6 shadow-soft lg:block">
        {content}
      </motion.div>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-mira-lavender/20 bg-white p-5 shadow-soft lg:hidden">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mira-lavender" />
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function PlanBlock({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-mira-lavender/20 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-mira-primary">
        {icon}
        <p className="text-xs font-bold uppercase tracking-widest">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-mira-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-lavender" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
