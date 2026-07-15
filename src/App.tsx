import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookHeart,
  BellRing,
  Bookmark,
  BookmarkCheck,
  CalendarRange,
  ChartSpline,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Database,
  Droplet,
  Droplets,
  ExternalLink,
  FileDown,
  FileUp,
  Footprints,
  Frown,
  Gauge,
  House,
  Info,
  LibraryBig,
  ListChecks,
  LockKeyhole,
  Laugh,
  Lightbulb,
  Minus,
  MoonStar,
  NotebookPen,
  NotebookText,
  PanelsTopLeft,
  Plus,
  ScanHeart,
  ShieldCheck,
  Smile,
  Settings2,
  Search,
  Sparkles,
  TriangleAlert,
  Thermometer,
  Utensils,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import {
  addDays,
  createBackupPayload,
  createDayEntry,
  defaultProfile,
  daysBetween,
  isValidPastOrTodayIsoDate,
  loadState,
  parseImportedState,
  parseIsoDate,
  resetState,
  saveState,
  todayIso,
  toIsoDate,
} from './data';
import {
  formatRuDate,
  filterPeriodRangesForAnalytics,
  getCycleAnalyticsEmptyGuidance,
  getCycleStats,
  getCycleDay,
  getCycleDelayDays,
  getCycloscope,
  getHormonoscope,
  getMonthDays,
  getPredictedPeriodDays,
  getSymptomSeveritySummary,
  contextOptions,
  detailedMoodOptions,
  digestionOptions,
  dischargeOptions,
  moodIcons,
  moodLabels,
  quickSymptomOptions,
  symptomGroups,
  symptomOptions,
} from './cycle';
import type { AnalyticsPeriodFilter } from './cycle';
import type { AppState, DailyMetric, DayEntry, Mood, ReportOption, Tab, TrackingModule } from './types';
import { knowledgeArticles } from './knowledge';
import type { KnowledgeArticle } from './knowledge';

const tabs: Array<{ id: Tab; label: string; icon: typeof House; tone: string }> = [
  { id: 'today', label: 'Сегодня', icon: House, tone: 'bg-violet-50 text-violet-600' },
  { id: 'diary', label: 'Дневник', icon: NotebookPen, tone: 'bg-rose-50 text-rose-500' },
  { id: 'insights', label: 'Аналитика', icon: ChartSpline, tone: 'bg-orange-50 text-orange-500' },
  { id: 'articles', label: 'Знания', icon: LibraryBig, tone: 'bg-cyan-50 text-cyan-600' },
];

const moods = Object.keys(moodLabels) as Mood[];

type CalendarFilter = 'all' | 'cycle' | 'symptoms' | 'wellbeing' | 'sleep' | 'notes';

const calendarFilterOptions: ReadonlyArray<{ id: CalendarFilter; label: string; emptyLabel: string }> = [
  { id: 'all', label: 'Все', emptyLabel: 'записей' },
  { id: 'cycle', label: 'Цикл', emptyLabel: 'отметок цикла' },
  { id: 'symptoms', label: 'Симптомы', emptyLabel: 'отметок симптомов' },
  { id: 'wellbeing', label: 'Самочувствие', emptyLabel: 'отметок самочувствия' },
  { id: 'sleep', label: 'Сон', emptyLabel: 'записей сна' },
  { id: 'notes', label: 'Заметки', emptyLabel: 'заметок' },
];

function readCalendarFilter(): CalendarFilter {
  if (typeof window === 'undefined') return 'all';
  const stored = window.sessionStorage.getItem('luna-calendar-filter');
  return calendarFilterOptions.some(({ id }) => id === stored) ? stored as CalendarFilter : 'all';
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [symptomsOpen, setSymptomsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [profileReturnTab, setProfileReturnTab] = useState<'today' | 'diary'>('today');
  const [calendarReturnTab, setCalendarReturnTab] = useState<'today' | 'diary'>('today');
  const [diaryReturnToCalendar, setDiaryReturnToCalendar] = useState(false);
  const [diaryInitialSection, setDiaryInitialSection] = useState<'cycle' | null>(null);
  const [knowledgeStartView, setKnowledgeStartView] = useState<'for-you' | 'saved'>('for-you');

  useEffect(() => {
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      try {
        saveState(state);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [state]);

  const selectedEntry = state.entries[selectedDate] ?? createDayEntry(selectedDate);

  const updateEntry = (date: string, updater: (entry: DayEntry) => DayEntry) => {
    setState((current) => ({
      ...current,
      entries: {
        ...current.entries,
        [date]: updater(current.entries[date] ?? createDayEntry(date)),
      },
    }));
  };

  const togglePeriodDay = (date: string) => {
    if (!isValidPastOrTodayIsoDate(date)) return;
    setState((current) => {
      if (current.periodDays.includes(date)) return current;
      return {
        ...current,
        periodDays: [...current.periodDays, date].sort(),
      };
    });
  };

  const removePeriodDay = (date: string) => {
    if (!isValidPastOrTodayIsoDate(date)) return;
    if (!window.confirm(`Удалить отметку месячных за ${formatRuDate(date)}? Остальные записи дня сохранятся.`)) return;
    setState((current) => ({
      ...current,
      periodDays: current.periodDays.filter((item) => item !== date),
    }));
  };

  const predictedDays = useMemo(() => getPredictedPeriodDays(state), [state]);

  if (!state.onboardingComplete) {
    return <OnboardingView state={state} onComplete={setState} />;
  }

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8">
        <div className="grid flex-1 gap-5">
          <section key={activeTab} className="app-screen min-w-0">
            {activeTab === 'today' && (
              <TodayView
                state={state}
                entry={state.entries[todayIso()] ?? createDayEntry(todayIso())}
                predictedDays={predictedDays}
                onMood={(mood) =>
                  updateEntry(todayIso(), (entry) => ({ ...entry, mood }))
                }
                onTogglePeriod={() => togglePeriodDay(todayIso())}
                onOpenTrack={() => {
                  setSelectedDate(todayIso());
                  setDiaryReturnToCalendar(false);
                  setDiaryInitialSection(null);
                  setActiveTab('diary');
                }}
                onEditPeriod={() => {
                  setSelectedDate(todayIso());
                  setDiaryReturnToCalendar(false);
                  setDiaryInitialSection('cycle');
                  setActiveTab('diary');
                }}
                onOpenSymptoms={() => setSymptomsOpen(true)}
                onOpenProfile={() => { setProfileReturnTab('today'); setActiveTab('profile'); }}
                onOpenAnalytics={() => setActiveTab('insights')}
                onOpenCalendar={(date = todayIso()) => {
                  setSelectedDate(date);
                  setMonthCursor(parseIsoDate(date));
                  setCalendarReturnTab('today');
                  setActiveTab('calendar');
                }}
              />
            )}
            {activeTab === 'calendar' && (
              <CalendarView
                monthCursor={monthCursor}
                selectedDate={selectedDate}
                entry={selectedEntry}
                state={state}
                predictedDays={predictedDays}
                onMonthChange={setMonthCursor}
                onSelect={(date) => setSelectedDate(date)}
                onTogglePeriod={togglePeriodDay}
                onBack={() => setActiveTab(calendarReturnTab)}
                onOpenDiary={() => { setDiaryReturnToCalendar(true); setActiveTab('diary'); }}
              />
            )}
            {activeTab === 'diary' && (
              <TrackView
                date={selectedDate}
                entry={selectedEntry}
                waterGoalMl={state.profile.waterGoalMl}
                trackingModules={state.profile.trackingModules}
                dailyMetrics={state.profile.dailyMetrics}
                saveStatus={saveStatus}
                isPeriod={state.periodDays.includes(selectedDate)}
                initialSection={diaryInitialSection}
                onInitialSectionHandled={() => setDiaryInitialSection(null)}
                onDateChange={setSelectedDate}
                onTogglePeriod={() => togglePeriodDay(selectedDate)}
                onRemovePeriod={() => removePeriodDay(selectedDate)}
                onUpdate={(updater) => updateEntry(selectedDate, updater)}
                onOpenSettings={() => { setProfileReturnTab('diary'); setActiveTab('profile'); }}
                onOpenCalendar={() => { setMonthCursor(parseIsoDate(selectedDate)); setCalendarReturnTab('diary'); setActiveTab('calendar'); }}
                onBackToCalendar={diaryReturnToCalendar ? () => { setMonthCursor(parseIsoDate(selectedDate)); setActiveTab('calendar'); } : undefined}
              />
            )}
            {activeTab === 'insights' && <AnalyticsView state={state} onChange={setState} onOpenDiary={() => { setSelectedDate(todayIso()); setDiaryReturnToCalendar(false); setActiveTab('diary'); }} onOpenReport={() => setActiveTab('report')} />}
            {activeTab === 'report' && <ReportView state={state} onChange={setState} onBack={() => setActiveTab('insights')} />}
            {activeTab === 'articles' && <KnowledgeView initialView={knowledgeStartView} state={state} onChange={setState} onOpenDiary={() => { setSelectedDate(todayIso()); setDiaryReturnToCalendar(false); setActiveTab('diary'); }} onOpenReport={() => setActiveTab('report')} />}
            {activeTab === 'profile' && (
              <ProfileView
                state={state}
                onChange={setState}
                onBack={() => setActiveTab(profileReturnTab)}
                onOpenSavedArticles={() => { setKnowledgeStartView('saved'); setActiveTab('articles'); }}
                onRestartOnboarding={() =>
                  setState((current) => ({ ...current, onboardingComplete: false }))
                }
                onReset={() => {
                  resetState();
                  setState(loadState());
                  setSelectedDate(todayIso());
                  setActiveTab('today');
                }}
              />
            )}
          </section>
        </div>
      </main>
      {symptomsOpen && (
        <SymptomsModal
          entry={state.entries[todayIso()] ?? createDayEntry(todayIso())}
          onClose={() => setSymptomsOpen(false)}
          onSave={(nextEntry) => {
            updateEntry(todayIso(), () => nextEntry);
            setSymptomsOpen(false);
          }}
        />
      )}
      {activeTab !== 'report' && activeTab !== 'profile' && <BottomNav activeTab={activeTab} onChange={(tab) => { if (tab === 'diary') { setSelectedDate(todayIso()); setDiaryReturnToCalendar(false); } if (tab === 'articles') setKnowledgeStartView('for-you'); setActiveTab(tab); }} />}
    </div>
  );
}

function OnboardingView({
  state,
  onComplete,
}: {
  state: AppState;
  onComplete: (state: AppState) => void;
}) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [step, setStep] = useState(0);
  const [cycleLength, setCycleLength] = useState(state.profile.cycleLength);
  const [periodLength, setPeriodLength] = useState(state.profile.periodLength);
  const [lastPeriodStart, setLastPeriodStart] = useState('');

  const steps = [
    {
      title: 'Поймите свой цикл без лишнего шума',
      text: 'Отмечайте месячные и самочувствие за несколько секунд. Mira постепенно соберёт историю и покажет осторожные персональные наблюдения.',
      icon: ScanHeart,
    },
    {
      title: 'Настроим прогноз',
      text: 'Укажите первый день последних месячных и примерную длину цикла. Данные останутся только в этом браузере, а настройки можно изменить позже.',
      icon: CalendarRange,
    },
  ];
  const current = steps[step];
  const Icon = current.icon;

  const complete = () => {
    const validLastPeriodStart = isValidPastOrTodayIsoDate(lastPeriodStart)
      ? lastPeriodStart
      : '';
    const firstPeriodDays = validLastPeriodStart
      ? Array.from({ length: periodLength }, (_, index) => addDays(validLastPeriodStart, index))
          .filter((date) => isValidPastOrTodayIsoDate(date))
      : state.periodDays;

    onComplete({
      ...state,
      onboardingComplete: true,
      profile: {
        ...state.profile,
        cycleLength,
        periodLength,
      },
      periodDays: Array.from(new Set([...state.periodDays, ...firstPeriodDays])).sort(),
    });
  };

  return (
    <div className="min-h-screen bg-blush px-4 py-5 text-ink">
      <main className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-lg flex-col">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-rosewood/70">Mira</p>
            <h1 className="mt-1 text-3xl font-semibold">Давайте настроим</h1>
          </div>
          <MiraMark className="h-12 w-12 shadow-soft" label="Mira" />
        </div>

        <section className="flex flex-1 flex-col rounded-[32px] bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            {steps.map((item, index) => (
              <div
                key={item.title}
                className={`h-2 flex-1 rounded-full ${index <= step ? 'bg-petal' : 'bg-blush'}`}
              />
            ))}
          </div>

          <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-[28px] bg-blush">
            <Icon className="h-9 w-9 text-petal" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">{current.title}</h2>
          <p className="mt-3 text-base leading-7 text-rosewood/75">{current.text}</p>

          {step === 0 && <div className="mt-7 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/75">Первая полезная отметка займёт меньше минуты. Можно начать без точных дат и заполнить их позже.</div>}

          {step === 1 && (
            <div className="mt-7 grid gap-4">
              <Field label="Первый день последних месячных">
                <input
                  type="date"
                  className="input"
                  max={todayIso()}
                  value={lastPeriodStart}
                  onChange={(event) => setLastPeriodStart(event.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Цикл, дней">
                  <input
                    type="number"
                    min={18}
                    max={60}
                    className="input"
                    value={cycleLength}
                    onChange={(event) => setCycleLength(Number(event.target.value))}
                  />
                </Field>
                <Field label="Месячные, дней">
                  <input
                    type="number"
                    min={1}
                    max={14}
                    className="input"
                    value={periodLength}
                    onChange={(event) => setPeriodLength(Number(event.target.value))}
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="mt-auto pt-8">
            <div className="flex gap-3">
              {step > 0 && (
                <button className="pill-button flex-1" onClick={() => setStep((currentStep) => currentStep - 1)}>
                  Назад
                </button>
              )}
              <button
                className="pill-button primary flex-1"
                onClick={() => (step === steps.length - 1 ? complete() : setStep((currentStep) => currentStep + 1))}
              >
                {step === steps.length - 1 ? 'Начать' : 'Дальше'}
              </button>
            </div>
            <button className="mt-3 w-full py-3 text-sm font-semibold text-rosewood/60" onClick={complete}>
              Пропустить
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function TodayView({
  state,
  entry,
  predictedDays,
  onMood,
  onTogglePeriod,
  onOpenTrack,
  onEditPeriod,
  onOpenSymptoms,
  onOpenProfile,
  onOpenAnalytics,
  onOpenCalendar,
}: {
  state: AppState;
  entry: DayEntry;
  predictedDays: string[];
  onMood: (mood: Mood) => void;
  onTogglePeriod: () => void;
  onOpenTrack: () => void;
  onEditPeriod: () => void;
  onOpenSymptoms: () => void;
  onOpenProfile: () => void;
  onOpenAnalytics: () => void;
  onOpenCalendar: (date?: string) => void;
}) {
  const cycleDay = getCycleDay(state);
  const delayDays = getCycleDelayDays(state);
  const cycleStats = getCycleStats(state);
  const today = todayIso();
  const nextPeriod = predictedDays[0];
  const trackedCycleCount = cycleStats.cycleLengths.length;
  const daysToPeriod = nextPeriod ? Math.max(0, daysBetween(today, nextPeriod)) : null;
  const lastRange = cycleStats.ranges[cycleStats.ranges.length - 1];
  const predictionStart = lastRange && cycleStats.cycleLengths.length >= 2
    ? addDays(lastRange.start, cycleStats.minCycleLength)
    : nextPeriod
      ? addDays(nextPeriod, -2)
      : undefined;
  const predictionEnd = lastRange && cycleStats.cycleLengths.length >= 2
    ? addDays(lastRange.start, cycleStats.maxCycleLength)
    : nextPeriod
      ? addDays(nextPeriod, 2)
      : undefined;
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(today, index - 3));
  const weekdayLabels = ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'];
  const showInAppReminder = state.profile.reminderEnabled && new Date().toTimeString().slice(0, 5) >= state.profile.reminderTime && !hasTrackedData(entry) && !state.periodDays.includes(today);
  const nextStep = cycleStats.ranges.length === 0
    ? null
    : !hasTrackedData(entry) && !state.periodDays.includes(today)
      ? { title: 'Короткой отметки достаточно', text: 'Выберите только то, что действительно важно сегодня. Остальные поля можно оставить пустыми.', label: 'Открыть дневник', action: onOpenTrack }
      : (entry.symptoms.length > 0 || (entry.pain ?? 0) > 0) && trackedCycleCount >= 1
        ? { title: 'Отметка сохранена в историю', text: 'После повторения в разных циклах приложение покажет исходные даты и надёжность наблюдения.', label: 'Посмотреть аналитику', action: onOpenAnalytics }
        : trackedCycleCount >= 2
          ? { title: 'История стала сопоставимой', text: 'Можно посмотреть диапазон циклов и первые осторожные наблюдения.', label: 'Открыть аналитику', action: onOpenAnalytics }
          : null;

  return (
    <div className="space-y-4">
      <section className="surface-hero relative overflow-hidden rounded-[32px] p-4 sm:p-6">

        <div className="relative flex items-center justify-between">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-petal shadow-sm sm:h-12 sm:w-12"
            onClick={onOpenProfile}
            aria-label="Открыть профиль"
          >
            <CircleUserRound className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-rosewood/60"><MiraMark className="h-6 w-6" />Mira</p>
            <h2 className="text-2xl font-semibold">{formatRuDate(today)}</h2>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ink shadow-sm sm:h-12 sm:w-12"
            onClick={() => onOpenCalendar()}
            aria-label="Открыть календарь"
          >
            <CalendarRange className="h-6 w-6" />
          </button>
        </div>

        <div className="relative mt-4 grid grid-cols-7 gap-1">
          {weekDays.map((date) => {
            const parsed = parseIsoDate(date);
            const isToday = date === today;
            const isPeriod = state.periodDays.includes(date);
            const hasEntry = state.entries[date] ? hasTrackedData(state.entries[date]) : false;
            const labelIndex = (parsed.getDay() + 6) % 7;
            return (
              <button
                key={date}
                className={`today-strip-day ${isToday ? 'today' : ''} ${isPeriod ? 'period' : ''}`}
                onClick={date === today ? onOpenTrack : () => onOpenCalendar(date)}
              >
                <span className="text-xs font-semibold text-rosewood/55">
                  {weekdayLabels[labelIndex]}
                </span>
                <strong>{parsed.getDate()}</strong>
                <small>{isPeriod ? '♥' : hasEntry ? '•' : ''}</small>
              </button>
            );
          })}
        </div>

        <div className="relative mx-auto mt-3 max-w-md text-center">
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-rosewood/65">
            {state.periodDays.includes(today) ? 'Сегодня отмечены месячные' : delayDays ? `Задержка: ${delayDays} ${pluralDays(delayDays)}` : cycleDay ? `День цикла: ${cycleDay}` : 'Цикл пока не отмечен'}
          </span>
          <p className="mt-3 text-xl font-semibold">
            {delayDays
              ? `Месячные задерживаются на ${delayDays} ${pluralDays(delayDays)}`
              : daysToPeriod === null
              ? 'Прогноз появится после отслеживания следующего цикла'
              : daysToPeriod === 0
                ? 'Месячные ожидаются сегодня'
                : 'Месячные через'}
          </p>
          {!delayDays && daysToPeriod !== null && (
            <>
              <h3 className="mt-3 text-5xl font-semibold tracking-normal min-[380px]:text-6xl">
                {`${daysToPeriod} ${pluralDays(daysToPeriod)}`}
              </h3>
              <p className="mt-3 text-base font-medium text-rosewood/70">
                {predictionStart && predictionEnd
                  ? `Окно прогноза: ${formatRuDate(predictionStart)} – ${formatRuDate(predictionEnd)}`
                  : `Ориентировочно ${formatRuDate(nextPeriod)}`}
              </p>
              <p className="mt-1 text-xs font-semibold text-rosewood/50">
                {trackedCycleCount >= 3
                  ? `Персональный прогноз · ${trackedCycleCount} циклов`
                  : trackedCycleCount > 0
                    ? `Предварительный прогноз · ${trackedCycleCount + 1} периода`
                    : 'Предварительная оценка · по настройкам профиля'}
              </p>
            </>
          )}
          {!delayDays && daysToPeriod === null && (
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-rosewood/65">
              Отметьте первый день месячных, чтобы получить предварительную оценку по настройкам цикла.
            </p>
          )}
          {Boolean(delayDays) && (
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-rosewood/65">Цикл не начинается автоматически. Отметьте первый день месячных, когда они начнутся.</p>
          )}
        </div>

        <div className="quick-actions relative mt-5 grid grid-cols-3 gap-2 text-center">
          <QuickAction
            active={state.periodDays.includes(today)}
            icon={<Droplet className="h-8 w-8" />}
            label={state.periodDays.includes(today) ? 'Месячные отмечены' : 'Отметить месячные'}
            onClick={state.periodDays.includes(today) ? onEditPeriod : onTogglePeriod}
          />
          <QuickAction
            active={Boolean(entry.symptomsChecked || entry.symptoms.length || entry.moods?.length || entry.discharge?.length || entry.digestion?.length)}
            icon={<ScanHeart className="h-8 w-8" />}
            label="Симптомы"
            onClick={onOpenSymptoms}
          />
          <QuickAction active={Boolean(entry.pain || entry.dayRating)} icon={<Smile className="h-8 w-8" />} label="Оценить день" onClick={onOpenTrack} />
        </div>
      </section>

      {state.profile.showHormonoscope && <HormonoscopeCard state={state} onOpenTrack={onOpenTrack} />}
      {state.profile.showCycloscope && <CycloscopeCard state={state} />}

      <div className="bento-grid">
      {showInAppReminder && <section className="bento-card bento-peach flex items-center justify-between gap-4 p-4 md:col-span-12"><div><p className="text-sm font-semibold">Небольшое напоминание</p><p className="mt-1 text-xs leading-5 text-rosewood/55">Если хотите, добавьте короткую запись о сегодняшнем дне.</p></div><button className="pill-button shrink-0" onClick={onOpenTrack}>Открыть</button></section>}

      {state.profile.trackingModules.includes('wellbeing') && <div className="md:col-span-7"><FeelingsCheckIn value={entry.mood} onChange={onMood} /></div>}

      {!showInAppReminder && nextStep && <section className="bento-card bento-violet flex min-h-40 flex-col justify-between gap-4 p-5 md:col-span-7"><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Следующий шаг</p><h2 className="mt-2 text-xl font-semibold">{nextStep.title}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/70">{nextStep.text}</p></div><button className="relative self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-petal shadow-sm" onClick={nextStep.action}>{nextStep.label}</button></section>}

      <div className={nextStep && !showInAppReminder ? 'md:col-span-5' : 'md:col-span-12'}><DiaryProgressCard entry={entry} isPeriod={state.periodDays.includes(today)} trackingModules={state.profile.trackingModules} onOpen={onOpenTrack} /></div>

      <div className="md:col-span-12"><CycleOverviewCard state={state} onOpenAnalytics={onOpenAnalytics} /></div>
      </div>

    </div>
  );
}

function HormonoscopeCard({ state, onOpenTrack }: { state: AppState; onOpenTrack: () => void }) {
  const phase = getHormonoscope(state);
  const phases = [
    { id: 'menstrual', label: 'Месячные' },
    { id: 'follicular', label: 'Рост' },
    { id: 'ovulatory', label: 'Окно' },
    { id: 'luteal', label: 'После' },
  ] as const;
  const tone = phase?.id === 'menstrual'
    ? 'from-rose-100 via-pink-50 to-white'
    : phase?.id === 'follicular'
      ? 'from-emerald-100 via-teal-50 to-white'
      : phase?.id === 'ovulatory'
        ? 'from-amber-100 via-orange-50 to-white'
        : 'from-violet-100 via-fuchsia-50 to-white';

  if (!phase) {
    return <section className="overflow-hidden rounded-[30px] border border-white/90 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white p-5 shadow-soft sm:p-6"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-petal shadow-sm"><Sparkles className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-petal">Гормоноскоп</p><h2 className="mt-2 text-2xl font-semibold">Появится после начала цикла</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rosewood/65">Отметьте первый день месячных — и здесь появится спокойный календарный ориентир по фазам. Это не анализ гормонов.</p></div></div></section>;
  }

  return (
    <section className={`relative overflow-hidden rounded-[30px] border border-white/90 bg-gradient-to-br ${tone} p-5 shadow-soft sm:p-6`}>
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/60 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-petal">Гормоноскоп · не анализ</p>
            <h2 className="mt-2 text-2xl font-semibold">{phase.label}</h2>
            <p className="mt-1 text-sm font-semibold text-rosewood/50">{phase.eyebrow}</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/90 text-petal shadow-sm"><Sparkles className="h-6 w-6" /></span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-gradient-to-r from-petal to-fuchsia-400 transition-all" style={{ width: `${phase.progress}%` }} /></div>
        <div className="mt-2 grid grid-cols-4 gap-1">{phases.map((item) => <span key={item.id} className={`text-center text-[10px] font-semibold ${phase.id === item.id ? 'text-petal' : 'text-rosewood/35'}`}>{item.label}</span>)}</div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] bg-white/75 p-4">
            <p className="text-sm leading-6 text-rosewood/70">{phase.description}</p>
            <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-petal shadow-sm">{phase.hormoneNote}</p>
          </div>
          <div className="rounded-[24px] bg-white/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-rosewood/45">Что полезно сегодня</p>
            <p className="mt-2 text-sm leading-6 text-rosewood/65">{phase.support}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <details className="group text-xs leading-5 text-rosewood/50"><summary className="cursor-pointer font-semibold text-rosewood/60">Как это считается</summary><p className="mt-2 max-w-xl">{phase.confidence}. Фазы рассчитаны по датам цикла и могут не совпадать с фактическими уровнями гормонов или днём овуляции.</p></details>
          <button className="pill-button shrink-0" onClick={onOpenTrack}>Отметить самочувствие</button>
        </div>
      </div>
    </section>
  );
}

function CycloscopeCard({ state }: { state: AppState }) {
  const reading = getCycloscope(state);

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#251d3d] via-[#493766] to-[#87659f] p-5 text-white shadow-soft sm:p-6">
      <div className="absolute -left-12 -top-16 h-40 w-40 rounded-full bg-violet-300/15 blur-2xl" />
      <div className="absolute -bottom-20 -right-12 h-48 w-48 rounded-full bg-rose-300/15 blur-3xl" />
      <span className="absolute right-8 top-7 text-xs text-white/30">✦</span>
      <span className="absolute right-20 top-16 text-[8px] text-white/35">✧</span>
      <span className="absolute bottom-14 right-9 text-[10px] text-white/25">✦</span>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Cycloscope · для настроения</p>
            <h2 className="mt-2 text-2xl font-semibold">{reading.title}</h2>
          </div>
          <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/10 shadow-sm backdrop-blur"><span className="text-2xl leading-none">{reading.symbol}</span><span className="mt-1 text-[9px] font-semibold text-white/55">{reading.sign}</span></span>
        </div>

        <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">{reading.message}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Фокус дня</p><p className="mt-2 text-sm font-semibold text-white/85">{reading.focus}</p></div>
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Счастливая деталь</p><p className="mt-2 text-sm font-semibold text-white/85">{reading.luckyDetail}</p></div>
        </div>

        <p className="mt-4 text-xs leading-5 text-white/38">Развлекательная подсказка на день, не прогноз здоровья или событий.</p>
      </div>
    </section>
  );
}

function SymptomsModal({
  entry,
  onClose,
  onSave,
}: {
  entry: DayEntry;
  onClose: () => void;
  onSave: (entry: DayEntry) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [draft, setDraft] = useState<DayEntry>(() => ({
    ...entry,
    moods: [...(entry.moods ?? [])],
    symptoms: [...entry.symptoms],
    symptomSeverity: { ...(entry.symptomSeverity ?? {}) },
    discharge: [...(entry.discharge ?? [])],
    digestion: [...(entry.digestion ?? [])],
    contextTags: [...(entry.contextTags ?? [])],
  }));
  const hasDraftChanges = JSON.stringify(draft) !== JSON.stringify(entry);
  const visibleSymptomOptions = showAllSymptoms
    ? symptomOptions
    : Array.from(new Set([...quickSymptomOptions, ...draft.symptoms]));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const toggle = (key: 'moods' | 'symptoms' | 'discharge' | 'digestion' | 'contextTags', value: string) => {
    setDraft((current) => {
      const values = current[key] ?? [];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return {
        ...current,
        [key]: nextValues,
        ...(key === 'symptoms' ? { symptomsChecked: true } : {}),
        ...(key === 'symptoms' && !nextValues.includes(value)
          ? { symptomSeverity: Object.fromEntries(Object.entries(current.symptomSeverity ?? {}).filter(([symptom]) => symptom !== value)) }
          : {}),
      };
    });
  };

  const setDischarge = (value: string) => {
    setDraft((current) => {
      const values = current.discharge ?? [];
      if (value === 'Нет выделений') {
        return { ...current, discharge: values.includes(value) ? [] : [value] };
      }
      const withoutNone = values.filter((item) => item !== 'Нет выделений');
      return {
        ...current,
        discharge: withoutNone.includes(value)
          ? withoutNone.filter((item) => item !== value)
          : [...withoutNone, value],
      };
    });
  };

  const setMeasurement = (key: 'basalTemperature' | 'weightKg', value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value === '' ? undefined : Number(value),
    }));
  };

  const save = () => {
    if (!hasDraftChanges) return;
    const basalTemperature = draft.basalTemperature;
    const weightKg = draft.weightKg;
    onSave({
      ...draft,
      basalTemperature:
        basalTemperature !== undefined && basalTemperature >= 34 && basalTemperature <= 43
          ? basalTemperature
          : undefined,
      weightKg: weightKg !== undefined && weightKg >= 20 && weightKg <= 300 ? weightKg : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="relative flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[30px] bg-[#f7f5fb] shadow-2xl sm:max-h-[92dvh] sm:rounded-[30px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="symptoms-modal-title"
      >
        <header className="sticky top-0 z-10 border-b border-rosewood/10 bg-[#f7f5fb]/95 px-5 pb-4 pt-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-rosewood/20 sm:hidden" />
          <div className="flex items-center justify-between gap-4">
            <button ref={closeButtonRef} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm" onClick={onClose} aria-label="Закрыть без сохранения">
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 id="symptoms-modal-title" className="text-xl font-semibold">Подробная запись</h2>
              <p className={`text-sm ${hasDraftChanges ? 'font-semibold text-amber-600' : 'text-rosewood/55'}`}>{entry.date === todayIso() ? 'Сегодня' : formatRuDate(entry.date)}{hasDraftChanges ? ' · черновик изменён' : ''}</p>
            </div>
            <span className="h-11 w-11" aria-hidden="true" />
          </div>
        </header>

        <div className="overflow-y-auto px-4 pb-28 pt-4 sm:px-5">
          <LogCategory title="Настроение" subtitle="Что ближе всего к вашему состоянию" icon={<Smile className="h-5 w-5" />}>
            <ChoiceCards variant="mood" options={detailedMoodOptions} selected={draft.moods ?? []} onToggle={(value) => toggle('moods', value)} />
          </LogCategory>

          <LogCategory title="Симптомы" subtitle="Что ощущается сегодня" icon={<ScanHeart className="h-5 w-5" />}>
            <p className="mb-3 text-xs leading-5 text-rosewood/55">Выберите несколько пунктов, если нужно. Для динамики важны выраженность и влияние на обычные дела.</p>
            <button
              className={`mb-3 flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 text-left text-sm font-semibold transition ${draft.symptomsChecked === true && draft.symptoms.length === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rosewood/10 bg-white text-rosewood/60'}`}
              onClick={() => setDraft((current) => current.symptomsChecked === true && current.symptoms.length === 0
                ? { ...current, symptomsChecked: undefined }
                : { ...current, symptomsChecked: true, symptoms: [], symptomSeverity: {}, symptomsAffectDailyLife: undefined })}
              aria-pressed={draft.symptomsChecked === true && draft.symptoms.length === 0}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm"><Check className="h-4 w-4" /></span>
              Симптомов сегодня нет
            </button>
            {showAllSymptoms ? (
              <div className="space-y-5">
                {symptomGroups.map((group) => (
                  <section key={group.id} aria-labelledby={`symptom-group-${group.id}`}>
                    <div className="mb-2">
                      <h3 id={`symptom-group-${group.id}`} className="text-sm font-semibold">{group.title}</h3>
                      <p className="mt-0.5 text-xs text-rosewood/45">{group.description}</p>
                    </div>
                    <ChoiceCards variant="symptom" options={group.options} selected={draft.symptoms} onToggle={(value) => toggle('symptoms', value)} />
                  </section>
                ))}
              </div>
            ) : (
              <ChoiceCards variant="symptom" options={visibleSymptomOptions} selected={draft.symptoms} onToggle={(value) => toggle('symptoms', value)} />
            )}
            <button className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-petal" onClick={() => setShowAllSymptoms((value) => !value)}>{showAllSymptoms ? 'Показать основные' : `Все категории · ещё ${symptomOptions.length - quickSymptomOptions.length}`}</button>
            {draft.symptoms.length > 0 && (
              <div className="mt-4 space-y-3 rounded-2xl bg-blush p-4">
                <p className="text-sm font-semibold">Насколько выражены симптомы?</p>
                {draft.symptoms.map((symptom) => (
                  <div key={symptom} className="rounded-2xl bg-white p-3">
                    <p className="text-sm font-medium">{symptom}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {([['Слабо', 1], ['Средне', 2], ['Сильно', 3]] as const).map(([label, severity]) => (
                        <button key={label} className={`chip justify-center ${draft.symptomSeverity?.[symptom] === severity ? 'active' : ''}`} onClick={() => setDraft((current) => ({ ...current, symptomSeverity: { ...(current.symptomSeverity ?? {}), [symptom]: severity } }))}>{label}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-sm font-semibold">Мешали обычным делам?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button className={`chip justify-center ${draft.symptomsAffectDailyLife === false ? 'active' : ''}`} onClick={() => setDraft((current) => ({ ...current, symptomsAffectDailyLife: false }))}>Нет</button>
                    <button className={`chip justify-center ${draft.symptomsAffectDailyLife === true ? 'active' : ''}`} onClick={() => setDraft((current) => ({ ...current, symptomsAffectDailyLife: true }))}>Да</button>
                  </div>
                </div>
              </div>
            )}
          </LogCategory>

          <LogCategory title="Выделения и кровотечение" subtitle="Видимые изменения — без попытки поставить диагноз" icon={<Droplets className="h-5 w-5" />}>
            <ChoiceCards variant="discharge" options={Array.from(new Set([...dischargeOptions, ...(draft.discharge ?? [])]))} selected={draft.discharge ?? []} onToggle={setDischarge} />
          </LogCategory>

          <LogCategory title="Пищеварение" subtitle="Отметьте только заметные изменения" icon={<Utensils className="h-5 w-5" />}>
            <ChoiceCards variant="digestion" options={Array.from(new Set([...digestionOptions, ...(draft.digestion ?? [])]))} selected={draft.digestion ?? []} onToggle={(value) => toggle('digestion', value)} />
          </LogCategory>

          <LogCategory title="Показатели" subtitle="Температура и вес — необязательно" icon={<Gauge className="h-5 w-5" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl bg-blush p-4">
                <span className="flex items-center gap-2 font-semibold"><Thermometer className="h-5 w-5 text-petal" />Базальная температура</span>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="input bg-white"
                    type="number"
                    inputMode="decimal"
                    min={34}
                    max={43}
                    step={0.01}
                    value={draft.basalTemperature ?? ''}
                    onChange={(event) => setMeasurement('basalTemperature', event.target.value)}
                    placeholder="36,60"
                  />
                  <span className="font-semibold text-rosewood/60">°C</span>
                </div>
                <span className="mt-2 block text-xs leading-5 text-rosewood/55">Измеряйте утром одним способом для сопоставимой динамики.</span>
              </label>
              <label className="rounded-2xl bg-blush p-4">
                <span className="flex items-center gap-2 font-semibold"><Weight className="h-5 w-5 text-petal" />Вес</span>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="input bg-white"
                    type="number"
                    inputMode="decimal"
                    min={20}
                    max={300}
                    step={0.1}
                    value={draft.weightKg ?? ''}
                    onChange={(event) => setMeasurement('weightKg', event.target.value)}
                    placeholder="Например, 58,5"
                  />
                  <span className="font-semibold text-rosewood/60">кг</span>
                </div>
              </label>
            </div>
          </LogCategory>

          <LogCategory title="Другие факторы" subtitle="Контекст дня" icon={<Sparkles className="h-5 w-5" />}>
            <ChoiceChips options={contextOptions} selected={draft.contextTags ?? []} onToggle={(value) => toggle('contextTags', value)} />
          </LogCategory>

          <LogCategory title="Заметка" icon={<NotebookText className="h-5 w-5" />}>
            <textarea
              className="input min-h-28 resize-none bg-blush"
              value={draft.note}
              onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              placeholder="Что ещё важно запомнить про этот день?"
            />
          </LogCategory>
        </div>

        <footer className="absolute inset-x-0 bottom-0 border-t border-rosewood/10 bg-white/95 p-4 backdrop-blur sm:rounded-b-[30px]">
          <button className="pill-button primary w-full disabled:cursor-default disabled:opacity-45" disabled={!hasDraftChanges} onClick={save}>
            <Check className="h-5 w-5" /> {hasDraftChanges ? `Сохранить за ${formatRuDate(entry.date)}` : 'Изменений пока нет'}
          </button>
          <p className="mt-2 text-center text-[11px] leading-4 text-rosewood/50">Изменения применятся только после сохранения и останутся на этом устройстве.</p>
        </footer>
      </section>
    </div>
  );
}

function LogCategory({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(title === 'Настроение' || title === 'Симптомы');
  return (
    <details className="group mb-3 overflow-hidden rounded-[22px] bg-white shadow-sm" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">{icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-petal/10 text-petal">{icon}</span>}<span className="min-w-0 flex-1"><strong className="block text-base">{title}</strong>{subtitle && <small className="mt-0.5 block truncate text-xs font-normal text-rosewood/50">{subtitle}</small>}</span><ChevronRight className="h-5 w-5 text-rosewood/30 transition group-open:rotate-90" /></summary>
      <div className="border-t border-rosewood/10 px-4 pb-4 pt-4 sm:px-5">{children}</div>
    </details>
  );
}

type ChoiceCardVariant = 'mood' | 'symptom' | 'discharge' | 'digestion';

function ChoiceCards({ options, selected, onToggle, variant }: { options: readonly string[]; selected: string[]; onToggle: (value: string) => void; variant: ChoiceCardVariant }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button key={option} type="button" className={`relative flex min-h-[66px] items-center gap-2.5 rounded-[18px] border p-2.5 text-left transition ${active ? 'border-petal/30 bg-petal/12 text-petal shadow-sm' : 'border-rosewood/8 bg-[#fbfaff] text-rosewood/70 hover:border-petal/20 hover:bg-petal/5'}`} onClick={() => onToggle(option)} aria-pressed={active}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] ${active ? 'bg-white text-petal shadow-sm' : 'bg-white text-rosewood/45'}`}><ChoiceStateIcon option={option} variant={variant} /></span>
            <span className="text-xs font-semibold leading-4">{option}</span>
            {active && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-petal text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceStateIcon({ option, variant }: { option: string; variant: ChoiceCardVariant }) {
  const lower = option.toLowerCase();
  if (variant === 'mood') {
    if (lower.includes('радост') || lower.includes('игрив')) return <Sparkles className="h-[18px] w-[18px]" />;
    if (lower.includes('энерг')) return <Zap className="h-[18px] w-[18px]" />;
    if (lower.includes('груст') || lower.includes('подав') || lower.includes('апати')) return <Frown className="h-[18px] w-[18px]" />;
    if (lower.includes('тревог') || lower.includes('раздраж') || lower.includes('перепад')) return <TriangleAlert className="h-[18px] w-[18px]" />;
    return <Smile className="h-[18px] w-[18px]" />;
  }
  if (variant === 'discharge') return lower.includes('нет ') ? <Check className="h-[18px] w-[18px]" /> : <Droplets className="h-[18px] w-[18px]" />;
  if (variant === 'digestion') return lower.includes('тошнот') ? <Frown className="h-[18px] w-[18px]" /> : lower.includes('вздут') ? <Gauge className="h-[18px] w-[18px]" /> : <Utensils className="h-[18px] w-[18px]" />;
  if (lower.includes('бол') || lower.includes('мигр') || lower.includes('голов') || lower.includes('забыв')) return <ScanHeart className="h-[18px] w-[18px]" />;
  if (lower.includes('устал') || lower.includes('бессон') || lower.includes('сонлив') || lower.includes('ночн')) return <MoonStar className="h-[18px] w-[18px]" />;
  if (lower.includes('груд')) return <ScanHeart className="h-[18px] w-[18px]" />;
  if (lower.includes('мочеисп') || lower.includes('позыв')) return <Droplet className="h-[18px] w-[18px]" />;
  if (lower.includes('запах') || lower.includes('отёч')) return <Droplets className="h-[18px] w-[18px]" />;
  if (lower.includes('прилив') || lower.includes('жжение')) return <Thermometer className="h-[18px] w-[18px]" />;
  if (lower.includes('температур')) return <Thermometer className="h-[18px] w-[18px]" />;
  if (lower.includes('аппетит')) return <Utensils className="h-[18px] w-[18px]" />;
  if (lower.includes('высып') || lower.includes('зуд') || lower.includes('сухост')) return <Sparkles className="h-[18px] w-[18px]" />;
  return <Zap className="h-[18px] w-[18px]" />;
}

function ChoiceChips({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option} className={`chip ${selected.includes(option) ? 'active' : ''}`} onClick={() => onToggle(option)} aria-pressed={selected.includes(option)}>
          {selected.includes(option) && <Check className="h-3.5 w-3.5" />}
          {option}
        </button>
      ))}
    </div>
  );
}

function DiaryProgressCard({ entry, isPeriod, trackingModules, onOpen }: { entry: DayEntry; isPeriod: boolean; trackingModules: TrackingModule[]; onOpen: () => void }) {
  const completion: Record<TrackingModule, boolean> = {
    wellbeing: Boolean(entry.dayRating || entry.mood || entry.moods?.length || entry.energy),
    cycle: Boolean(isPeriod || entry.symptomsChecked || entry.symptoms.length || entry.discharge?.length || entry.digestion?.length || entry.pain !== undefined || entry.flow !== undefined),
    sleep: Boolean((entry.sleepHours ?? 0) > 0 || entry.sleepQuality),
    body: Boolean(entry.waterMl > 0 || (entry.steps ?? 0) > 0 || entry.activity || entry.appetite || entry.weightKg || entry.basalTemperature),
    personal: Boolean(entry.note.trim() || entry.hadSex),
  };
  const sections = trackingModules.map((module) => completion[module]);
  const completed = sections.filter(Boolean).length;
  const percent = Math.round((completed / sections.length) * 100);
  const hasAnySavedData = isPeriod || hasTrackedData(entry);

  return (
    <section className="bento-card bento-mint flex h-full flex-col justify-between p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rosewood/60">Сегодня отмечено</p>
          <h2 className="mt-1 text-xl font-semibold">{completed ? `${completed} из ${sections.length} разделов` : hasAnySavedData ? 'Есть отметки вне выбранных разделов' : 'Пока нет записей'}</h2>
        </div>
        <button className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-petal shadow-sm" onClick={onOpen} aria-label={hasAnySavedData ? 'Открыть дневник' : 'Добавить запись'}>{percent}%</button>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-blush">
        <div className="h-full rounded-full bg-petal transition-all" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}

function CycleOverviewCard({ state, onOpenAnalytics }: { state: AppState; onOpenAnalytics: () => void }) {
  const stats = getCycleStats(state);
  const completedCycles = stats.cycleLengths.length;
  const currentRange = stats.ranges[stats.ranges.length - 1];

  return (
    <section className="bento-card bento-peach p-5 sm:p-6">
      <p className="text-sm font-semibold text-rosewood/60">Последний цикл</p>
      {completedCycles ? (
        <>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold">{stats.previousCycleLength} {pluralDays(stats.previousCycleLength)}</p>
              <p className="mt-1 text-sm text-rosewood/60">Месячные: {stats.previousPeriodLength} {pluralDays(stats.previousPeriodLength)}</p>
            </div>
            <span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-petal">
              {completedCycles} {completedCycles === 1 ? 'цикл' : 'цикла'}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-rosewood/65">
            {completedCycles >= 3
              ? `Ваш диапазон: ${stats.minCycleLength}–${stats.maxCycleLength} дней.`
              : 'Нужно минимум три цикла, чтобы оценить ваш персональный диапазон.'}
          </p>
        </>
      ) : (
        <div className="mt-2">
          <p className="text-base font-semibold">{currentRange ? `Начало: ${formatRuDate(currentRange.start)}` : 'Месячные пока не отмечены'}</p>
          <p className="mt-2 text-sm leading-6 text-rosewood/65">{currentRange ? 'После начала следующих месячных появится длина первого завершённого цикла.' : 'Отметьте первый день месячных, чтобы начать историю цикла.'}</p>
        </div>
      )}
      <button className="mt-4 text-sm font-semibold text-petal" onClick={onOpenAnalytics}>
        Посмотреть аналитику
      </button>
    </section>
  );
}

function TodayQuickMetrics({ entry, trackingModules, onOpenTrack }: { entry: DayEntry; trackingModules: TrackingModule[]; onOpenTrack: () => void }) {
  const metrics = [
    ...(trackingModules.includes('body') ? [
      { label: 'Вода', value: entry.waterMl ? `${entry.waterMl} мл` : 'Добавить', icon: Droplets, tone: 'bg-white/75 text-water', tile: 'metric-water' },
      { label: 'Шаги', value: entry.steps ? entry.steps.toLocaleString('ru-RU') : 'Добавить', icon: Footprints, tone: 'bg-white/75 text-mint', tile: 'metric-steps' },
    ] : []),
    ...(trackingModules.includes('sleep') ? [{ label: 'Сон', value: entry.sleepHours ? `${entry.sleepHours} ч` : 'Добавить', icon: MoonStar, tone: 'bg-white/75 text-indigo-500', tile: 'metric-sleep' }] : []),
    ...(trackingModules.includes('wellbeing') ? [{ label: 'Энергия', value: entry.energy ? `${entry.energy} из 5` : 'Добавить', icon: Zap, tone: 'bg-white/75 text-amber-500', tile: 'metric-energy' }] : []),
  ];
  if (!metrics.length) return null;
  return <section className={`grid h-full gap-3 ${metrics.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>{metrics.map(({ label, value, icon: Icon, tone, tile }) => <button key={label} className={`metric-tile ${tile}`} onClick={onOpenTrack}><span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${tone}`}><Icon className="h-5 w-5" /></span><span className="relative z-10 mt-4"><strong className="block text-sm font-semibold text-ink">{label}</strong><span className="mt-0.5 block text-xs font-medium text-rosewood/60">{value}</span></span></button>)}</section>;
}

function FeelingsCheckIn({
  value,
  onChange,
}: {
  value?: Mood;
  onChange: (mood: Mood) => void;
}) {
  const options: Array<{
    mood: Mood;
    label: string;
    icon: typeof Smile;
  }> = [
    { mood: 'great', label: 'Хорошее', icon: Laugh },
    { mood: 'calm', label: 'Обычное', icon: Smile },
    { mood: 'low', label: 'Плохое', icon: Frown },
  ];

  return (
    <section className="bento-card bento-peach h-full p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Как вы себя чувствуете?</h2>
        <span className="text-2xl text-petal">✿</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.mood;
          return (
            <button
              key={option.mood}
              className="flex min-w-0 flex-col items-center gap-2"
              onClick={() => onChange(option.mood)}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  active ? 'bg-petal text-white' : 'bg-blush text-petal'
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="w-full text-center text-[11px] font-medium leading-4 text-rosewood/75">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function QuickAction({
  active = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="group flex min-w-0 flex-col items-center gap-2" onClick={onClick}>
      <span
        className={`quick-action-icon flex h-14 w-14 items-center justify-center rounded-full text-white shadow-soft transition sm:h-20 sm:w-20 ${active ? 'ring-4 ring-white/70' : 'group-hover:-translate-y-1'}`}
      >
        {icon}
      </span>
      <span className="text-[11px] font-medium leading-4 sm:text-sm sm:leading-5">{label}</span>
    </button>
  );
}

function pluralDays(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

function pluralCycles(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'цикл';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'цикла';
  return 'циклов';
}

function WaterTracker({
  waterMl,
  goalMl,
  percent,
  onChange,
}: {
  waterMl: number;
  goalMl: number;
  percent: number;
  onChange: (amount: number) => void;
}) {
  return (
    <section className="bento-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-rosewood/70">Вода</p>
          <h2 className="mt-1 text-3xl font-semibold">{waterMl} мл</h2>
        </div>
        <Droplets className="h-7 w-7 text-mint" />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-blush">
        <div className="h-full rounded-full bg-mint" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button className="pill-button" onClick={() => onChange(-250)}>
          <Minus className="h-4 w-4" /> 250
        </button>
        <span className="text-sm text-rosewood/70">цель {goalMl} мл</span>
        <button className="pill-button primary" onClick={() => onChange(250)}>
          <Plus className="h-4 w-4" /> 250
        </button>
      </div>
    </section>
  );
}

function MoodPicker({ value, onChange }: { value?: Mood; onChange: (mood?: Mood) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-5">
      {moods.map((mood) => (
        <button
          key={mood}
          className={`mood-button ${value === mood ? 'active' : ''}`}
          onClick={() => onChange(value === mood ? undefined : mood)}
          title={moodLabels[mood]}
          aria-pressed={value === mood}
        >
          <span className="text-xl">{moodIcons[mood]}</span>
          <span className="truncate text-[11px] font-medium">{moodLabels[mood]}</span>
        </button>
      ))}
    </div>
  );
}

function CalendarView({
  monthCursor,
  selectedDate,
  entry,
  state,
  predictedDays,
  onMonthChange,
  onSelect,
  onTogglePeriod,
  onBack,
  onOpenDiary,
}: {
  monthCursor: Date;
  selectedDate: string;
  entry: DayEntry;
  state: AppState;
  predictedDays: string[];
  onMonthChange: (date: Date) => void;
  onSelect: (date: string) => void;
  onTogglePeriod: (date: string) => void;
  onBack: () => void;
  onOpenDiary: () => void;
}) {
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>(readCalendarFilter);
  const days = getMonthDays(monthCursor);
  const monthLabel = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(monthCursor);
  const monthNumber = monthCursor.getMonth();
  const currentMonthDates = days.filter((date) => parseIsoDate(date).getMonth() === monthNumber);
  const trackedMonthDays = currentMonthDates.filter((date) => Boolean(state.entries[date] && hasTrackedData(state.entries[date]))).length;
  const periodMonthDays = currentMonthDates.filter((date) => state.periodDays.includes(date)).length;
  const symptomMonthDays = currentMonthDates.filter((date) => Boolean(state.entries[date] && (state.entries[date].symptoms.length || (state.entries[date].pain ?? 0) > 0))).length;
  const sleepMonthDays = currentMonthDates.filter((date) => Boolean(state.entries[date] && (state.entries[date].sleepHours !== undefined || state.entries[date].sleepQuality))).length;
  const daySignals = (date: string) => {
    const dayEntry = state.entries[date];
    const period = state.periodDays.includes(date);
    const predicted = predictedDays.includes(date);
    const symptoms = Boolean(dayEntry?.symptoms.length);
    const pain = Boolean(dayEntry && dayEntry.pain !== undefined && dayEntry.pain > 0);
    const wellbeing = Boolean(dayEntry && (dayEntry.dayRating || dayEntry.mood || dayEntry.energy || dayEntry.moods?.length));
    const sleep = Boolean(dayEntry && (dayEntry.sleepHours !== undefined || dayEntry.sleepQuality));
    const note = Boolean(dayEntry?.note.trim());
    return { dayEntry, period, predicted, symptoms, pain, wellbeing, sleep, note };
  };
  const matchesCalendarFilter = (date: string) => {
    const signals = daySignals(date);
    if (calendarFilter === 'all') return true;
    if (calendarFilter === 'cycle') return signals.period || signals.predicted;
    if (calendarFilter === 'symptoms') return signals.pain || signals.symptoms;
    if (calendarFilter === 'wellbeing') return signals.wellbeing;
    if (calendarFilter === 'sleep') return signals.sleep;
    return signals.note;
  };
  const matchingMonthDays = currentMonthDates.filter(matchesCalendarFilter).length;
  const activeFilter = calendarFilterOptions.find(({ id }) => id === calendarFilter) ?? calendarFilterOptions[0];
  const today = parseIsoDate(todayIso());
  const showingToday = monthCursor.getFullYear() === today.getFullYear() && monthCursor.getMonth() === today.getMonth() && selectedDate === todayIso();
  const isFuture = selectedDate > todayIso();
  const isPeriod = state.periodDays.includes(selectedDate);
  const selectedHasData = hasTrackedData(entry);
  const selectedFacts = [
    isPeriod ? 'Месячные' : '',
    entry.dayRating ? `Оценка дня ${entry.dayRating}/5` : '',
    entry.mood ? moodLabels[entry.mood] : '',
    entry.symptoms.length ? `${entry.symptoms.length} ${pluralSymptoms(entry.symptoms.length)}` : '',
    entry.pain !== undefined ? `Боль: ${['нет', 'лёгкая', 'средняя', 'сильная'][entry.pain]}` : '',
    entry.flow !== undefined ? `Обильность: ${['нет', 'слабая', 'средняя', 'сильная'][entry.flow]}` : '',
    entry.sleepHours !== undefined ? `Сон ${entry.sleepHours} ч` : '',
    entry.sleepQuality ? `Сон: ${entry.sleepQuality === 'good' ? 'хорошо' : entry.sleepQuality === 'poor' ? 'плохо' : 'нормально'}` : '',
    entry.energy ? `Энергия ${entry.energy}/5` : '',
    entry.note.trim() ? 'Есть заметка' : '',
  ].filter(Boolean);

  const shiftMonth = (amount: number) => {
    const nextMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + amount, 1);
    const selectedDay = parseIsoDate(selectedDate).getDate();
    const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const nextSelectedDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(selectedDay, lastDayOfNextMonth));
    onMonthChange(nextMonth);
    onSelect(toIsoDate(nextSelectedDate));
  };
  const jumpToToday = () => {
    onMonthChange(parseIsoDate(todayIso()));
    onSelect(todayIso());
  };
  useEffect(() => {
    window.sessionStorage.setItem('luna-calendar-filter', calendarFilter);
  }, [calendarFilter]);
  return (
    <div className="space-y-4">
      <section className="surface-hero rounded-[28px] p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3"><button className="inline-flex min-h-10 items-center gap-1 rounded-2xl bg-white/80 px-3 text-sm font-semibold text-rosewood/65 shadow-sm" onClick={onBack}><ChevronLeft className="h-4 w-4" />Назад</button><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-rosewood/45">История по дням</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Календарь</h1></div></div>
        <div className="mb-4 flex items-center justify-between">
          <button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
            ‹
          </button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
          <button className="icon-button" onClick={() => shiftMonth(1)} aria-label="Следующий месяц">
            ›
          </button>
        </div>
        {!showingToday && <button className="mx-auto mb-4 flex min-h-9 items-center gap-2 rounded-full bg-white/75 px-3 text-xs font-semibold text-petal shadow-sm" onClick={jumpToToday}><CalendarRange className="h-4 w-4" />К сегодняшнему дню</button>}
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Фильтр календаря">{calendarFilterOptions.map(({ id, label }) => <button key={id} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${calendarFilter === id ? 'bg-petal text-white shadow-sm' : 'bg-white/70 text-rosewood/55'}`} aria-pressed={calendarFilter === id} onClick={() => setCalendarFilter(id)}>{label}</button>)}</div>
        {calendarFilter !== 'all' && matchingMonthDays === 0 && (
          <div className="calendar-filter-empty mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/65 px-3 py-2.5" role="status">
            <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-petal"><Search className="h-4 w-4" /></span><p className="text-xs leading-5 text-rosewood/65">За этот месяц нет {activeFilter.emptyLabel}.</p></div>
            <button className="shrink-0 rounded-xl px-2 py-2 text-xs font-semibold text-petal transition hover:bg-violet-50" onClick={() => setCalendarFilter('all')}>Показать все</button>
          </div>
        )}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-rosewood/60">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div key={`${monthCursor.getFullYear()}-${monthNumber}`} className="calendar-month-grid grid grid-cols-7 gap-1">
          {days.map((date) => {
            const parsed = parseIsoDate(date);
            const isCurrentMonth = parsed.getMonth() === monthNumber;
            const isToday = date === todayIso();
            const isSelected = date === selectedDate;
            const signals = daySignals(date);
            const { period: isPeriod, predicted: isPredicted, symptoms: hasSymptoms, pain: hasPain, wellbeing: hasWellbeing, sleep: hasSleep, note: hasNote } = signals;
            const matchesFilter = matchesCalendarFilter(date);
            const dayFacts = [isPeriod ? 'месячные' : '', hasPain ? 'боль' : '', hasSymptoms ? 'симптомы' : '', hasWellbeing ? 'самочувствие' : '', hasSleep ? 'сон' : '', hasNote ? 'заметка' : '', isPredicted ? 'прогноз' : ''].filter(Boolean).join(', ');
            return (
              <button
                key={date}
                aria-label={`${formatRuDate(date)}${dayFacts ? `: ${dayFacts}` : ''}`}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isPeriod ? 'period' : ''} ${
                  isPredicted ? 'predicted' : ''
                } ${!isCurrentMonth ? 'muted' : ''} ${calendarFilter !== 'all' && !matchesFilter && !isSelected ? 'opacity-25' : ''}`}
                onClick={() => onSelect(date)}
              >
                <span>{parsed.getDate()}</span>
                {isToday && <small>сег</small>}
                {(hasPain || hasSymptoms || hasWellbeing || hasSleep || hasNote) && <span className="absolute bottom-1 flex items-center justify-center gap-0.5" aria-hidden="true">{(hasPain || hasSymptoms) && <i className="h-1.5 w-1.5 rounded-full bg-orange-400 ring-1 ring-white/70" />}{hasWellbeing && <i className="h-1.5 w-1.5 rounded-full bg-violet-400 ring-1 ring-white/70" />}{hasSleep && <i className="h-1.5 w-1.5 rounded-full bg-indigo-400 ring-1 ring-white/70" />}{hasNote && <i className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-1 ring-white/70" />}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-rosewood/60"><span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-petal" />Месячные</span>{predictedDays.length > 0 && <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border-2 border-mint" />Прогноз</span>}<span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-400" />Боль и симптомы</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-400" />Самочувствие</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-indigo-400" />Сон</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" />Заметка</span></div>
      </section>

      <section className="bento-card p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-rosewood/50">{monthLabel}</p><h2 className="mt-1 text-xl font-semibold">Месяц в записях</h2></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-petal">{trackedMonthDays} {pluralDays(trackedMonthDays)}</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><CalendarMonthMetric icon={<ListChecks className="h-4 w-4" />} label="С записями" value={trackedMonthDays} tone="violet" /><CalendarMonthMetric icon={<Droplet className="h-4 w-4" />} label="Месячные" value={periodMonthDays} tone="rose" /><CalendarMonthMetric icon={<ScanHeart className="h-4 w-4" />} label="Симптомы" value={symptomMonthDays} tone="orange" /><CalendarMonthMetric icon={<MoonStar className="h-4 w-4" />} label="Сон" value={sleepMonthDays} tone="indigo" /></div></section>

      <section key={selectedDate} className="bento-card calendar-selection-card p-5" aria-live="polite" aria-atomic="true">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-rosewood/55">Выбранный день</p><h2 className="mt-1 text-2xl font-semibold">{formatRuDate(selectedDate)}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${isFuture ? 'bg-blush text-rosewood/55' : selectedHasData || isPeriod ? 'bg-petal/10 text-petal' : 'bg-blush text-rosewood/55'}`}>{isFuture ? 'будущая дата' : selectedHasData || isPeriod ? 'есть отметки' : 'пустой день'}</span></div>
        {isFuture ? <p className="mt-4 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/65">На будущую дату нельзя добавлять месячные или дневниковые записи. Можно только посмотреть прогноз.</p> : <>{selectedFacts.length ? <div className="mt-4 flex flex-wrap gap-2">{selectedFacts.map((fact) => <span key={fact} className="rounded-full bg-blush px-3 py-2 text-xs font-semibold text-rosewood/70">{fact}</span>)}</div> : <p className="mt-4 text-sm leading-6 text-rosewood/60">За этот день пока ничего не отмечено.</p>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><button className="pill-button primary flex-1" onClick={onOpenDiary}>{selectedHasData || isPeriod ? 'Редактировать запись' : 'Добавить запись'} <ChevronRight className="h-4 w-4" /></button>{!isPeriod && <button className="pill-button flex-1" onClick={() => onTogglePeriod(selectedDate)}><Droplet className="h-4 w-4" />Отметить месячные</button>}</div></>}
      </section>
    </div>
  );
}

function CalendarMonthMetric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: 'violet' | 'rose' | 'orange' | 'indigo' }) {
  const tones = {
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-500',
    orange: 'bg-orange-50 text-orange-500',
    indigo: 'bg-indigo-50 text-indigo-500',
  };
  return <div className="rounded-[20px] bg-blush/55 p-3"><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span><strong className="mt-3 block text-xl font-semibold tabular-nums">{value}</strong><span className="mt-0.5 block text-xs font-medium text-rosewood/50">{label}</span></div>;
}

function TrackView({
  date,
  entry,
  waterGoalMl,
  trackingModules,
  dailyMetrics,
  saveStatus,
  isPeriod,
  initialSection,
  onInitialSectionHandled,
  onDateChange,
  onTogglePeriod,
  onRemovePeriod,
  onUpdate,
  onOpenSettings,
  onOpenCalendar,
  onBackToCalendar,
}: {
  date: string;
  entry: DayEntry;
  waterGoalMl: number;
  trackingModules: TrackingModule[];
  dailyMetrics: DailyMetric[];
  saveStatus: 'saving' | 'saved' | 'error';
  isPeriod: boolean;
  initialSection: 'cycle' | null;
  onInitialSectionHandled: () => void;
  onDateChange: (date: string) => void;
  onTogglePeriod: () => void;
  onRemovePeriod: () => void;
  onUpdate: (updater: (entry: DayEntry) => DayEntry) => void;
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
  onBackToCalendar?: () => void;
}) {
  const [symptomsOpen, setSymptomsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'cycle' | 'wellbeing' | 'sleep' | 'body' | 'personal' | null>(null);
  const cycleSectionRef = useRef<HTMLElement>(null);
  const isFuture = date > todayIso();
  const dayLabels = ['Очень тяжело', 'Тяжело', 'Обычно', 'Хорошо', 'Отлично'];
  const canMoveForward = date < todayIso();
  const cycleFilled = isPeriod || entry.flow !== undefined || entry.pain !== undefined || entry.symptomsChecked === true || entry.symptoms.length > 0;
  const wellbeingFilled = Boolean(entry.dayRating || entry.mood || entry.moods?.length || entry.energy);
  const sleepFilled = Boolean((entry.sleepHours ?? 0) > 0 || entry.sleepQuality);
  const bodyFilled = Boolean(
    (dailyMetrics.includes('water') && entry.waterMl > 0) ||
    (dailyMetrics.includes('steps') && (entry.steps ?? 0) > 0) ||
    (dailyMetrics.includes('nutrition') && entry.appetite),
  );
  const personalFilled = Boolean(entry.hadSex || entry.note.trim());
  const detailedCategoryCount = [
    Boolean(entry.moods?.length),
    Boolean(entry.symptomsChecked || entry.symptoms.length),
    Boolean(entry.discharge?.length),
    Boolean(entry.digestion?.length),
    Boolean(entry.contextTags?.length),
    entry.basalTemperature !== undefined || entry.weightKg !== undefined,
    Boolean(entry.note.trim()),
  ].filter(Boolean).length;
  const openCycleEditor = () => {
    setOpenSection('cycle');
    window.requestAnimationFrame(() => cycleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  useEffect(() => {
    if (initialSection !== 'cycle') return;
    openCycleEditor();
    onInitialSectionHandled();
  }, [initialSection]);
  const setDiarySection = (section: NonNullable<typeof openSection>, open: boolean) => {
    setOpenSection((current) => open ? section : current === section ? null : current);
  };

  const setNumber = (key: 'steps' | 'basalTemperature' | 'weightKg', rawValue: string) => {
    onUpdate((current) => ({ ...current, [key]: rawValue === '' ? undefined : Number(rawValue) }));
  };
  const savedFacts = [
    isPeriod ? 'Месячные' : '',
    entry.dayRating ? `Оценка: ${dayLabels[entry.dayRating - 1].toLowerCase()}` : '',
    entry.mood ? `Настроение: ${moodLabels[entry.mood].toLowerCase()}` : '',
    entry.moods?.length ? `${entry.moods.length} ${pluralMarks(entry.moods.length)}` : '',
    entry.energy ? `Энергия ${entry.energy}/5` : '',
    entry.symptoms.length ? `${entry.symptoms.length} ${pluralSymptoms(entry.symptoms.length)}` : '',
    entry.symptomsChecked && entry.symptoms.length === 0 ? 'Симптомов нет' : '',
    entry.pain !== undefined ? `Боль: ${['нет', 'лёгкая', 'средняя', 'сильная'][entry.pain]}` : '',
    entry.flow !== undefined ? `Обильность: ${['нет', 'слабая', 'средняя', 'сильная'][entry.flow]}` : '',
    entry.sleepHours !== undefined ? `Сон ${entry.sleepHours} ч` : '',
    entry.sleepQuality ? `Сон: ${entry.sleepQuality === 'good' ? 'хорошо' : entry.sleepQuality === 'poor' ? 'плохо' : 'нормально'}` : '',
    entry.discharge?.length ? 'Выделения отмечены' : '',
    entry.digestion?.length ? 'Пищеварение отмечено' : '',
    entry.contextTags?.length ? `${entry.contextTags.length} ${pluralFactors(entry.contextTags.length)}` : '',
    dailyMetrics.includes('water') && entry.waterMl ? `Вода ${entry.waterMl} мл` : '',
    dailyMetrics.includes('steps') && entry.steps ? `${entry.steps.toLocaleString('ru-RU')} шагов` : '',
    dailyMetrics.includes('nutrition') && entry.appetite ? `Аппетит: ${entry.appetite === 'low' ? 'меньше' : entry.appetite === 'high' ? 'больше' : 'обычно'}` : '',
    entry.basalTemperature !== undefined ? `Температура ${entry.basalTemperature} °C` : '',
    entry.weightKg !== undefined ? `Вес ${entry.weightKg} кг` : '',
    trackingModules.includes('personal') && (entry.hadSex || entry.note.trim()) ? 'Есть личная запись' : '',
  ].filter(Boolean);
  const cycleSummary = [
    isPeriod ? 'Месячные' : '',
    entry.pain !== undefined ? `боль: ${['нет', 'лёгкая', 'средняя', 'сильная'][entry.pain]}` : '',
    entry.flow !== undefined ? `обильность: ${['нет', 'слабая', 'средняя', 'сильная'][entry.flow]}` : '',
    entry.symptoms.length ? `${entry.symptoms.length} ${pluralSymptoms(entry.symptoms.length)}` : '',
  ].filter(Boolean).join(' · ') || 'Месячные, боль, обильность и симптомы';
  const wellbeingSummary = [
    entry.mood ? moodLabels[entry.mood] : '',
    entry.energy ? `энергия ${entry.energy}/5` : '',
    entry.moods?.length ? `${entry.moods.length} подробных` : '',
  ].filter(Boolean).join(' · ') || 'Настроение, энергия и состояния';
  const bodySummary = [
    dailyMetrics.includes('water') && entry.waterMl ? `${entry.waterMl} мл воды` : '',
    dailyMetrics.includes('steps') && entry.steps ? `${entry.steps.toLocaleString('ru-RU')} шагов` : '',
    dailyMetrics.includes('nutrition') && entry.appetite ? 'аппетит отмечен' : '',
  ].filter(Boolean).join(' · ') || 'Выбранные ежедневные показатели';
  const personalSummary = [entry.hadSex ? 'Интимная жизнь' : '', entry.note.trim() ? 'Есть заметка' : ''].filter(Boolean).join(' · ') || 'Интимная жизнь и личная заметка';
  const visibleSectionCount = Number(trackingModules.includes('cycle') || isPeriod)
    + Number(trackingModules.includes('wellbeing'))
    + Number(trackingModules.includes('sleep'))
    + Number(dailyMetrics.length > 0)
    + Number(trackingModules.includes('personal'));

  if (isFuture) {
    return <div className="space-y-4"><section className="surface-hero rounded-[28px] p-5"><div className="flex items-center justify-between gap-3"><button className="icon-button" onClick={() => onDateChange(addDays(date, -1))} aria-label="Предыдущий день"><ChevronLeft className="h-5 w-5" /></button><div className="text-center"><p className="text-sm font-semibold text-rosewood/55">Будущая дата</p><h1 className="mt-1 text-2xl font-semibold">{formatRuDate(date)}</h1></div><span className="h-11 w-11" /></div></section><section className="bento-card p-6 text-center"><CalendarRange className="mx-auto h-9 w-9 text-petal" /><h2 className="mt-4 text-xl font-semibold">Запись ещё недоступна</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rosewood/60">На будущую дату можно посмотреть прогноз в календаре, но нельзя сохранять фактические данные.</p><button className="pill-button primary mt-5" onClick={() => onDateChange(todayIso())}>Вернуться к сегодняшнему дню</button></section></div>;
  }

  return (
    <div className="space-y-4">
      <section className="surface-hero rounded-[26px] p-4 sm:p-5">
        {onBackToCalendar && <button className="mb-3 inline-flex min-h-10 items-center gap-1 rounded-2xl bg-white/75 px-3 text-sm font-semibold text-rosewood/65 shadow-sm" onClick={onBackToCalendar}><ChevronLeft className="h-4 w-4" />К календарю</button>}
        <div className="flex items-center justify-between gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ink shadow-sm" onClick={() => onDateChange(addDays(date, -1))} aria-label="Предыдущий день"><ChevronLeft className="h-5 w-5" /></button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rosewood/45">{date === todayIso() ? 'Сегодня' : 'Запись за день'}</p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{formatRuDate(date)}</h1>
          </div>
          <button disabled={!canMoveForward} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ink shadow-sm disabled:opacity-35" onClick={() => onDateChange(addDays(date, 1))} aria-label="Следующий день"><ChevronRight className="h-5 w-5" /></button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white bg-white/75 px-3 text-xs font-semibold text-rosewood/65 shadow-sm transition hover:bg-white" onClick={onOpenCalendar}>
            <CalendarRange className="h-4 w-4 text-petal" />
            Открыть календарь
          </button>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${saveStatus === 'error' ? 'text-rose-600' : saveStatus === 'saving' ? 'text-amber-600' : 'text-rosewood/50'}`} role="status" aria-live="polite">{saveStatus === 'error' ? <TriangleAlert className="h-4 w-4" /> : <span className={`h-2 w-2 rounded-full ${saveStatus === 'saving' ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'}`} aria-hidden="true" />}{saveStatus === 'error' ? 'Не сохранено' : saveStatus === 'saving' ? 'Сохраняем…' : 'Автосохранение'}</span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(trackingModules.includes('cycle') || isPeriod) && <DiaryQuickButton active={isPeriod} label={isPeriod ? 'Месячные отмечены' : 'Отметить месячные'} icon={<Droplet className="h-5 w-5" />} tone="rose" onClick={isPeriod ? openCycleEditor : onTogglePeriod} disabled={isFuture} />}
          <DiaryQuickButton active={detailedCategoryCount > 0} label={detailedCategoryCount > 0 ? `Подробная запись · ${detailedCategoryCount} ${pluralSections(detailedCategoryCount)}` : 'Подробная запись'} icon={<ListChecks className="h-5 w-5" />} tone="violet" onClick={() => setSymptomsOpen(true)} />
        </div>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="bento-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rosewood/60">Быстрая отметка</p>
            <h2 className="mt-1 text-xl font-semibold">Как прошёл день?</h2>
          </div>
          <span className="text-sm font-semibold text-petal">
            {entry.dayRating ? dayLabels[entry.dayRating - 1] : 'Не отмечено'}
          </span>
        </div>
        <div className="mx-auto mt-5 flex max-w-md items-start justify-between gap-2">
          {dayLabels.map((label, index) => {
            const rating = (index + 1) as DayEntry['dayRating'];
            return (
              <button
                key={label}
                type="button"
                className={`group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl py-1 text-center transition ${entry.dayRating === rating ? 'text-petal' : 'text-rosewood/45 hover:text-rosewood/70'}`}
                onClick={() => onUpdate((current) => ({ ...current, dayRating: current.dayRating === rating ? undefined : rating }))}
                aria-label={label}
                aria-pressed={entry.dayRating === rating}
              >
                <span className={`diary-rating-face flex h-12 w-12 items-center justify-center rounded-full border transition sm:h-14 sm:w-14 ${entry.dayRating === rating ? 'is-selected border-petal/30 bg-petal/15 shadow-[0_6px_18px_rgba(119,91,209,0.16)]' : 'border-rosewood/10 bg-blush/60 group-hover:border-petal/20 group-hover:bg-petal/10'}`}>
                  <DayRatingFace rating={index + 1} />
                </span>
                <span className="hidden text-[11px] font-semibold leading-4 sm:block">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[26px] border border-white/80 bg-white/75 p-4 shadow-sm sm:p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{savedFacts.length ? 'Что отмечено за день' : 'Можно начать с одной отметки'}</p>{savedFacts.length > 0 && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{savedFacts.length}</span>}</div>{savedFacts.length ? <div className="mt-3 flex flex-wrap gap-2">{savedFacts.map((fact) => <span key={fact} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rosewood/65 shadow-sm">{fact}</span>)}</div> : <p className="mt-2 text-sm leading-6 text-rosewood/55">Выберите оценку дня или добавьте только то, что важно сейчас.</p>}</div></div></section>
      </div>

      <section className="flex items-end justify-between gap-4 pt-1"><div><p className="text-sm font-semibold text-rosewood/50">Заполните только нужное</p><h2 className="mt-1 text-xl font-semibold">Разделы дня</h2></div><button className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white/75 px-3 text-xs font-semibold text-petal shadow-sm" onClick={onOpenSettings}><Settings2 className="h-4 w-4" />Настроить <span className="hidden min-[420px]:inline">· {visibleSectionCount}</span></button></section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(trackingModules.includes('cycle') || isPeriod) && <DiarySection sectionRef={cycleSectionRef} open={openSection === 'cycle'} onOpenChange={(open) => setDiarySection('cycle', open)} order={Math.max(0, trackingModules.indexOf('cycle'))} icon={<Droplet className="h-5 w-5" />} tone="rose" title="Цикл и симптомы" description={cycleSummary} completed={cycleFilled}>
        <button disabled={isFuture || isPeriod} className={`w-full pill-button ${isPeriod ? 'primary' : ''} disabled:opacity-70`} onClick={onTogglePeriod}>{isPeriod ? 'День месячных отмечен' : 'Отметить день месячных'}</button>
        {isPeriod && <button className="mt-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50" onClick={onRemovePeriod}>Удалить отметку месячных за этот день</button>}
        <ScalePicker label="Боль" value={entry.pain} labels={['Нет', 'Лёгкая', 'Средняя', 'Сильная']} onChange={(value) => onUpdate((current) => ({ ...current, pain: value as DayEntry['pain'] }))} onClear={() => onUpdate((current) => ({ ...current, pain: undefined }))} />
        <ScalePicker label="Обильность" value={entry.flow} labels={['Нет', 'Слабая', 'Средняя', 'Сильная']} onChange={(value) => onUpdate((current) => ({ ...current, flow: value as DayEntry['flow'] }))} onClear={() => onUpdate((current) => ({ ...current, flow: undefined }))} />
        {entry.symptoms.length > 0 && <div className="flex flex-wrap gap-2">{entry.symptoms.map((symptom) => <span key={symptom} className="chip active">{symptom}</span>)}</div>}
      </DiarySection>}

      {trackingModules.includes('wellbeing') && <DiarySection open={openSection === 'wellbeing'} onOpenChange={(open) => setDiarySection('wellbeing', open)} order={trackingModules.indexOf('wellbeing')} icon={<Smile className="h-5 w-5" />} tone="violet" title="Настроение и энергия" description={wellbeingSummary} completed={wellbeingFilled}>
        <MoodPicker value={entry.mood} onChange={(mood) => onUpdate((current) => ({ ...current, mood }))} />
        <ScalePicker label="Энергия" value={entry.energy} labels={['Очень низкая', 'Низкая', 'Средняя', 'Хорошая', 'Высокая']} onChange={(value) => onUpdate((current) => ({ ...current, energy: value as DayEntry['energy'] }))} onClear={() => onUpdate((current) => ({ ...current, energy: undefined }))} />
        {entry.moods?.length ? <div className="flex flex-wrap gap-2">{entry.moods.map((mood) => <span key={mood} className="chip active">{mood}</span>)}</div> : null}
      </DiarySection>}

      {trackingModules.includes('sleep') && <DiarySection open={openSection === 'sleep'} onOpenChange={(open) => setDiarySection('sleep', open)} order={trackingModules.indexOf('sleep')} icon={<MoonStar className="h-5 w-5" />} tone="indigo" title="Сон" description={sleepFilled ? `${entry.sleepHours === undefined ? '—' : entry.sleepHours.toLocaleString('ru-RU')} ч · ${entry.sleepQuality === 'good' ? 'хорошее качество' : entry.sleepQuality === 'poor' ? 'плохое качество' : entry.sleepQuality === 'okay' ? 'нормальное качество' : 'качество не отмечено'}` : 'Длительность и качество сна'} completed={sleepFilled}>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <div>
            <div className="flex items-center justify-between gap-3"><span className="label mb-0">Длительность</span>{entry.sleepHours !== undefined && <button type="button" className="text-xs font-semibold text-rosewood/45 transition hover:text-petal" onClick={() => onUpdate((current) => ({ ...current, sleepHours: undefined }))}>Сбросить</button>}</div>
            <div className="mt-2 flex items-center justify-between rounded-[22px] bg-blush/55 p-2">
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rosewood shadow-sm transition active:scale-95 disabled:opacity-35" disabled={entry.sleepHours === 0} aria-label="Уменьшить сон на 30 минут" onClick={() => onUpdate((current) => ({ ...current, sleepHours: Math.max(0, (current.sleepHours ?? 8.5) - 0.5) }))}><Minus className="h-4 w-4" /></button>
              <div className="text-center"><p className="text-2xl font-semibold tabular-nums">{entry.sleepHours === undefined ? '—' : entry.sleepHours.toLocaleString('ru-RU')}</p><p className="text-xs font-medium text-rosewood/45">часов</p></div>
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rosewood shadow-sm transition active:scale-95 disabled:opacity-35" disabled={entry.sleepHours === 24} aria-label="Увеличить сон на 30 минут" onClick={() => onUpdate((current) => ({ ...current, sleepHours: Math.min(24, (current.sleepHours ?? 7.5) + 0.5) }))}><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div>
            <span className="label">Как спалось?</span>
            <div className="grid grid-cols-3 gap-2">
              {([['poor', 'Плохо'], ['okay', 'Нормально'], ['good', 'Хорошо']] as const).map(([quality, label]) => <button key={quality} type="button" aria-pressed={entry.sleepQuality === quality} className={`min-h-14 rounded-2xl px-2 text-xs font-semibold transition ${entry.sleepQuality === quality ? 'bg-indigo-500 text-white shadow-sm' : 'border border-rosewood/8 bg-white text-rosewood/60 hover:border-indigo-200 hover:bg-indigo-50'}`} onClick={() => onUpdate((current) => ({ ...current, sleepQuality: current.sleepQuality === quality ? undefined : quality }))}>{label}</button>)}
            </div>
          </div>
        </div>
      </DiarySection>}

      {dailyMetrics.length > 0 && <DiarySection open={openSection === 'body'} onOpenChange={(open) => setDiarySection('body', open)} order={3} icon={<Footprints className="h-5 w-5" />} tone="mint" title="Каждый день" description={bodySummary} completed={bodyFilled}>
        {dailyMetrics.includes('water') && <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-white p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-rosewood/60">Вода</p><p className="mt-1 text-2xl font-semibold">{entry.waterMl} мл</p><p className="text-xs text-rosewood/50">цель {waterGoalMl} мл</p></div><div className="flex gap-2"><button className="icon-button bg-white" onClick={() => onUpdate((current) => ({ ...current, waterMl: Math.max(0, current.waterMl - 250) }))}><Minus className="h-4 w-4" /></button><button className="icon-button bg-white" onClick={() => onUpdate((current) => ({ ...current, waterMl: current.waterMl + 250 }))}><Plus className="h-4 w-4" /></button></div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-petal" style={{ width: `${Math.min(100, Math.round((entry.waterMl / waterGoalMl) * 100))}%` }} /></div>
        </div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {dailyMetrics.includes('steps') && <Field label="Шаги"><input className="input" type="number" min={0} max={100000} step={100} value={entry.steps ?? ''} onChange={(event) => setNumber('steps', event.target.value)} placeholder="Например, 6000" /></Field>}
        </div>
        {dailyMetrics.includes('nutrition') && <div className="mt-4"><span className="label">Питание и аппетит</span><div className="grid grid-cols-3 gap-2">{(['low', 'normal', 'high'] as const).map((level) => <button key={level} className={`min-h-11 rounded-2xl px-2 text-xs font-semibold transition ${entry.appetite === level ? 'bg-petal text-white shadow-sm' : 'bg-blush text-rosewood/65'}`} onClick={() => onUpdate((current) => ({ ...current, appetite: current.appetite === level ? undefined : level }))}>{level === 'low' ? 'Меньше' : level === 'normal' ? 'Обычно' : 'Больше'}</button>)}</div></div>}
      </DiarySection>}

      {trackingModules.includes('personal') && <DiarySection open={openSection === 'personal'} onOpenChange={(open) => setDiarySection('personal', open)} order={trackingModules.indexOf('personal')} icon={<LockKeyhole className="h-5 w-5" />} tone="slate" title="Личное" description={personalSummary} completed={personalFilled}>
        <button className={`w-full pill-button ${entry.hadSex ? 'primary' : ''}`} onClick={() => onUpdate((current) => ({ ...current, hadSex: !current.hadSex }))}>{entry.hadSex ? 'Интимная жизнь отмечена' : 'Отметить интимную жизнь'}</button>
        <p className="mt-3 text-xs leading-5 text-rosewood/55">Личные данные не включаются в экспорт аналитики по умолчанию.</p>
        <label className="label mt-5" htmlFor="note">Заметка</label>
        <textarea id="note" className="input min-h-28 resize-none" value={entry.note} onChange={(event) => onUpdate((current) => ({ ...current, note: event.target.value }))} placeholder="Что важно запомнить про этот день?" />
      </DiarySection>}
      </div>

      <section className="rounded-2xl bg-white/70 p-4 text-center text-sm leading-6 text-rosewood/60">Все сохранённые отметки появятся в «Аналитике» и истории выбранного дня.</section>

      {symptomsOpen && <SymptomsModal entry={entry} onClose={() => setSymptomsOpen(false)} onSave={(nextEntry) => { onUpdate(() => nextEntry); setSymptomsOpen(false); }} />}
    </div>
  );
}

function DiaryQuickButton({ active, label, icon, tone, onClick, disabled = false }: { active: boolean; label: string; icon: ReactNode; tone: 'rose' | 'violet'; onClick: () => void; disabled?: boolean }) {
  const activeClass = tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-violet-200 bg-violet-50 text-violet-700';
  const iconClass = tone === 'rose' ? 'bg-rose-100 text-rose-500' : 'bg-violet-100 text-violet-600';
  return <button disabled={disabled} className={`flex min-h-14 items-center gap-3 rounded-[20px] border px-3 py-2.5 text-left text-sm font-semibold transition disabled:opacity-40 ${active ? activeClass : 'border-white/90 bg-white/85 text-rosewood/70 shadow-sm hover:border-petal/15 hover:bg-white'}`} onClick={onClick}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${iconClass}`}>{icon}</span><span>{label}</span><ChevronRight className="ml-auto h-4 w-4 opacity-35" /></button>;
}

function pluralSymptoms(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'симптом';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'симптома';
  return 'симптомов';
}

function pluralSections(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'раздел';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'раздела';
  return 'разделов';
}

function pluralFactors(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'фактор';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'фактора';
  return 'факторов';
}

function DiarySection({ icon, tone, title, description, completed, order, sectionRef, open, onOpenChange, children }: { icon: ReactNode; tone: 'rose' | 'violet' | 'indigo' | 'mint' | 'slate'; title: string; description: string; completed: boolean; order: number; sectionRef?: React.Ref<HTMLElement>; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  const tones = {
    rose: { icon: 'bg-rose-100 text-rose-500', filled: 'border-rose-100 bg-gradient-to-br from-rose-50/80 to-white', dot: 'bg-rose-400' },
    violet: { icon: 'bg-violet-100 text-violet-600', filled: 'border-violet-100 bg-gradient-to-br from-violet-50/80 to-white', dot: 'bg-violet-400' },
    indigo: { icon: 'bg-indigo-100 text-indigo-500', filled: 'border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white', dot: 'bg-indigo-400' },
    mint: { icon: 'bg-emerald-100 text-emerald-600', filled: 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white', dot: 'bg-emerald-400' },
    slate: { icon: 'bg-slate-100 text-slate-600', filled: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white', dot: 'bg-slate-400' },
  };
  const currentTone = tones[tone];
  return <section ref={sectionRef} className={`overflow-hidden rounded-[24px] border shadow-soft backdrop-blur transition duration-200 ${completed ? currentTone.filled : 'border-white/90 bg-white/90'} ${open ? 'sm:col-span-2' : ''}`} style={{ order }}><button type="button" className="flex min-h-[4.75rem] w-full items-center gap-3 p-3.5 text-left sm:p-4" aria-expanded={open} onClick={() => onOpenChange(!open)}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${currentTone.icon}`}>{icon}</span><span className="min-w-0 flex-1"><strong className="block text-base">{title}</strong><small className="mt-1 block truncate text-xs font-normal text-rosewood/50">{description}</small></span>{completed && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${currentTone.dot}`} aria-label="Есть данные" />}<ChevronRight className={`h-5 w-5 shrink-0 text-rosewood/30 transition ${open ? 'rotate-90' : ''}`} /></button>{open && <div className="diary-section-body border-t border-rosewood/10 px-4 pb-5 pt-4 sm:px-5">{children}</div>}</section>;
}

function ScalePicker({ label, value, labels, onChange, onClear }: { label: string; value?: number; labels: string[]; onChange: (value: number) => void; onClear?: () => void }) {
  const startsAtOne = label === 'Энергия';
  const selectedIndex = value === undefined ? -1 : value - (startsAtOne ? 1 : 0);
  return <div className="border-b border-rosewood/10 py-4 last:border-0"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-rosewood/70">{label}</span><span className="ml-auto text-xs text-rosewood/50">{selectedIndex >= 0 ? labels[selectedIndex] : 'Не отмечено'}</span>{selectedIndex >= 0 && onClear && <button type="button" className="text-xs font-semibold text-petal" onClick={onClear}>Сбросить</button>}</div><div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>{labels.map((item, index) => { const optionValue = index + (startsAtOne ? 1 : 0); return <button key={item} className={`rounded-xl px-1 py-2 text-[11px] font-semibold transition ${value === optionValue ? 'bg-petal text-white' : 'bg-blush text-rosewood/70 hover:bg-petal/20'}`} onClick={() => onChange(optionValue)} aria-pressed={value === optionValue}>{optionValue}</button>; })}</div></div>;
}

function KnowledgeView({ initialView = 'for-you', state, onChange, onOpenDiary, onOpenReport }: { initialView?: 'for-you' | 'saved'; state: AppState; onChange: (state: AppState) => void; onOpenDiary: () => void; onOpenReport: () => void }) {
  const [view, setView] = useState<'for-you' | 'all' | 'saved'>(initialView);
  const [category, setCategory] = useState<'Все' | KnowledgeArticle['category']>('Все');
  const [query, setQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const todayEntry = state.entries[todayIso()] ?? createDayEntry(todayIso());
  const cycleDay = getCycleDay(state);
  const completedCycles = getCycleStats(state).cycleLengths.length;
  const categories: Array<'Все' | KnowledgeArticle['category']> = ['Все', 'Цикл', 'Симптомы', 'Самочувствие', 'Забота о себе'];
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');

  const toggleSaved = (title: string) => {
    const saved = state.savedArticles.includes(title);
    onChange({ ...state, savedArticles: saved ? state.savedArticles.filter((item) => item !== title) : [...state.savedArticles, title] });
  };
  const reasonFor = (article: KnowledgeArticle) => {
    const matchedSymptom = article.relatedSymptoms?.find((symptom) => todayEntry.symptoms.includes(symptom));
    if (matchedSymptom) return `Сегодня отмечено: ${matchedSymptom.toLowerCase()}.`;
    if (article.id === 'cycle-basics' && completedCycles === 0) return 'Поможет правильно завершить первый цикл.';
    if (article.id === 'forecast-confidence' && completedCycles < 3) return 'Объясняет, когда прогноз становится персональным.';
    if (article.id === 'sleep-wellbeing' && (todayEntry.sleepQuality || todayEntry.energy)) return 'Связано с сегодняшней отметкой сна или энергии.';
    if (article.id === 'doctor-report' && (todayEntry.symptoms.length || todayEntry.note.trim())) return 'Поможет подготовить факты из дневника к консультации.';
    if (cycleDay && cycleDay <= state.profile.periodLength && ['cramps-care', 'sleep-wellbeing'].includes(article.id)) return 'Подходит для первых дней текущего цикла.';
    return article.category === 'Цикл' ? 'Помогает понимать расчёты календаря.' : 'Базовый материал для спокойного наблюдения.';
  };
  const scoreArticle = (article: KnowledgeArticle) => {
    let score = 0;
    if (article.relatedSymptoms?.some((symptom) => todayEntry.symptoms.includes(symptom))) score += 10;
    if (article.id === 'cycle-basics' && completedCycles === 0) score += 7;
    if (article.id === 'forecast-confidence' && completedCycles < 3) score += 5;
    if (article.id === 'sleep-wellbeing' && (todayEntry.sleepQuality || todayEntry.energy)) score += 6;
    if (article.id === 'doctor-report' && (todayEntry.symptoms.length || todayEntry.note.trim())) score += 4;
    if (cycleDay && cycleDay <= state.profile.periodLength && ['cramps-care', 'sleep-wellbeing'].includes(article.id)) score += 3;
    return score;
  };
  const recommended = [...knowledgeArticles].sort((left, right) => scoreArticle(right) - scoreArticle(left)).slice(0, 3);
  const featured = recommended[0];
  const matchesSearch = (article: KnowledgeArticle) => !normalizedQuery || `${article.title} ${article.summary} ${article.category} ${article.example} ${article.sections.flatMap((section) => section.paragraphs).join(' ')}`.toLocaleLowerCase('ru-RU').includes(normalizedQuery);
  const shownArticles = view === 'saved'
    ? knowledgeArticles.filter((article) => state.savedArticles.includes(article.title) && matchesSearch(article))
    : view === 'for-you'
      ? recommended.slice(1)
      : knowledgeArticles.filter((article) => (category === 'Все' || article.category === category) && matchesSearch(article));

  if (selectedArticle) {
    const saved = state.savedArticles.includes(selectedArticle.title);
    const openArticleAction = () => selectedArticle.id === 'doctor-report' ? onOpenReport() : onOpenDiary();
    return (
      <article className="mx-auto max-w-3xl pb-6">
        <button className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-petal" onClick={() => setSelectedArticle(null)}><ChevronLeft className="h-5 w-5" />Назад к знаниям</button>
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#34294d] via-[#4a3868] to-[#785ca5] p-6 text-white shadow-soft sm:p-8">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{selectedArticle.category}</p><h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">{selectedArticle.title}</h1></div><button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-petal shadow-sm" aria-label={saved ? 'Убрать из сохраненных' : 'Сохранить материал'} onClick={() => toggleSaved(selectedArticle.title)}>{saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}</button></div>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">{selectedArticle.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">{selectedArticle.readingMinutes} {pluralMinutes(selectedArticle.readingMinutes)}</span><ArticleEvidenceBadge dark /><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">Редакция от {formatRuDate(selectedArticle.updatedAt)}</span></div>
          </div>
        </section>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">{selectedArticle.sections.map((section) => <section key={section.title} className="bento-card p-5 sm:p-6"><h2 className="text-xl font-semibold">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-base leading-7 text-rosewood/75">{paragraph}</p>)}</section>)}</div>
          <div className="space-y-4">
            <section className="rounded-[26px] border border-violet-100 bg-violet-50/80 p-5"><div className="flex items-center gap-2 text-petal"><Lightbulb className="h-5 w-5" /><h2 className="font-semibold">Пример</h2></div><p className="mt-3 text-sm leading-6 text-rosewood/70">{selectedArticle.example}</p></section>
            <section className="rounded-[26px] border border-rose-100 bg-rose-50/80 p-5"><div className="flex items-center gap-2 text-rose-600"><TriangleAlert className="h-5 w-5" /><h2 className="font-semibold">Когда обратиться за помощью</h2></div><p className="mt-3 text-sm leading-6 text-rosewood/70">{selectedArticle.whenToSeekCare}</p></section>
            <section className="rounded-[26px] border border-emerald-100 bg-emerald-50/75 p-5"><h2 className="text-sm font-semibold text-emerald-900">Почему этот материал показан</h2><p className="mt-2 text-sm leading-6 text-emerald-900/70">{reasonFor(selectedArticle)}</p></section>
          </div>
        </div>
        {(selectedArticle.actionLabel || selectedArticle.relatedSymptoms?.length || selectedArticle.id === 'doctor-report') && <button className="mt-5 w-full pill-button primary" onClick={openArticleAction}>{selectedArticle.id === 'doctor-report' ? <FileDown className="h-5 w-5" /> : <NotebookPen className="h-5 w-5" />}{selectedArticle.actionLabel ?? 'Открыть дневник'}</button>}
        <section className="mt-5 rounded-[28px] border border-white/90 bg-white/90 p-5 shadow-soft sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><BookHeart className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">Открытые медицинские первоисточники</h2><p className="text-xs leading-5 text-rosewood/50">Откройте первоисточник, чтобы прочитать медицинскую статью полностью.</p></div></div><p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Редакционный текст основан на указанных источниках, но пока не проходил рецензию медицинским специалистом.</p><ul className="mt-4 grid gap-2 sm:grid-cols-2">{selectedArticle.sources.map((item) => <li key={item.url}><a className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-100" href={item.url} target="_blank" rel="noreferrer"><span><span className="block text-[10px] uppercase tracking-wide text-emerald-700/70">{item.publisher}</span>{item.title}</span><ExternalLink className="h-4 w-4 shrink-0" /></a></li>)}</ul></section>
        <p className="mt-5 rounded-2xl bg-white/50 px-4 py-3 text-center text-xs leading-5 text-rosewood/55">Материал помогает наблюдать за самочувствием, но не ставит диагноз и не заменяет консультацию медицинского специалиста.</p>
      </article>
    );
  }

  return (
    <div className="space-y-5">
      <section className="surface-hero overflow-hidden rounded-[30px] p-5 sm:p-7"><div className="flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:justify-between"><div><p className="text-sm font-semibold text-rosewood/60">Спокойно и по делу</p><h1 className="mt-1 text-3xl font-semibold">Знания о цикле</h1><p className="mt-2 max-w-xl text-sm leading-6 text-rosewood/65">30 коротких ответов на частые вопросы — с понятными примерами, признаками для обращения за помощью и открытыми медицинскими источниками.</p></div><span className="shrink-0 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-petal">{state.savedArticles.length} сохранено</span></div><div className="mt-5 flex flex-wrap gap-2"><ArticleEvidenceBadge /><span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-rosewood/60">Без диагнозов</span></div></section>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white/70 p-1.5 shadow-sm min-[380px]:gap-2">{([['for-you', 'Для вас', 'Для вас'], ['all', 'Все', 'Все материалы'], ['saved', 'Сохранённые', 'Сохранённые']] as const).map(([id, shortLabel, label]) => <button key={id} className={`min-h-11 min-w-0 rounded-xl px-0.5 text-[10px] font-semibold transition min-[380px]:px-2 min-[380px]:text-xs ${view === id ? 'bg-petal text-white shadow-sm' : 'text-rosewood/60'}`} onClick={() => setView(id)}><span className="min-[380px]:hidden">{shortLabel}</span><span className="hidden min-[380px]:inline">{label}</span></button>)}</div>

      {view !== 'for-you' && <label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rosewood/35" /><input className="input bg-white pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: задержка, боль или ПМС" aria-label="Поиск по материалам" /></label>}
      {view === 'all' && <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} className={`chip shrink-0 ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>}

      {view === 'for-you' && featured && <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#302641] via-[#46345f] to-[#74569c] p-5 text-white shadow-soft sm:p-6"><div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-fuchsia-300/15 blur-2xl" /><div className="relative"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-white/50">Для вас сегодня · {featured.category}</p><h2 className="mt-3 max-w-lg text-2xl font-semibold leading-8">{featured.title}</h2></div><button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20" aria-label={state.savedArticles.includes(featured.title) ? 'Убрать из сохраненных' : 'Сохранить материал'} onClick={() => toggleSaved(featured.title)}>{state.savedArticles.includes(featured.title) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}</button></div><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">{featured.summary}</p><p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs leading-5 text-white/75"><strong>Почему сейчас:</strong> {reasonFor(featured)}</p><div className="mt-5 flex flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"><span className="text-xs text-white/60"><BookHeart className="mr-1 inline h-3.5 w-3.5" />{featured.readingMinutes} {pluralMinutes(featured.readingMinutes)} · открытые источники · без медрецензии</span><button className="pill-button border-white/10 bg-white text-ink" onClick={() => setSelectedArticle(featured)}>Читать <ChevronRight className="h-4 w-4" /></button></div></div></section>}

      {shownArticles.length ? <section className="grid gap-3 sm:grid-cols-2">{shownArticles.map((article) => <KnowledgeCard key={article.id} article={article} saved={state.savedArticles.includes(article.title)} reason={view === 'for-you' ? reasonFor(article) : undefined} onToggleSaved={() => toggleSaved(article.title)} onOpen={() => setSelectedArticle(article)} />)}</section> : <section className="bento-card p-5 text-center"><h2 className="text-xl font-semibold">{view === 'saved' && !query ? 'Сохранённых материалов пока нет' : 'Материалы не найдены'}</h2><p className="mt-2 text-sm leading-6 text-rosewood/65">{view === 'saved' && !query ? 'Сохраняйте полезные статьи закладкой, чтобы быстро вернуться к ним.' : 'Попробуйте изменить запрос или выбрать другую категорию.'}</p>{view === 'saved' && !query && <button className="mt-4 pill-button" onClick={() => setView('all')}>Посмотреть все материалы</button>}</section>}

      <p className="text-xs leading-5 text-rosewood/55">Рекомендации объяснимы и используют только данные, сохранённые на вашем устройстве. Материалы не заменяют консультацию специалиста.</p>
    </div>
  );
}

function KnowledgeCard({ article, saved, reason, onToggleSaved, onOpen }: { article: KnowledgeArticle; saved: boolean; reason?: string; onToggleSaved: () => void; onOpen: () => void }) {
  const categoryMeta = article.category === 'Цикл'
    ? { Icon: Droplet, tone: 'bg-rose-50 text-rose-500' }
    : article.category === 'Симптомы'
      ? { Icon: ScanHeart, tone: 'bg-orange-50 text-orange-500' }
      : article.category === 'Самочувствие'
        ? { Icon: Smile, tone: 'bg-violet-50 text-violet-600' }
        : { Icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600' };
  const CategoryIcon = categoryMeta.Icon;
  return <article className="bento-card flex flex-col p-5 transition duration-200 hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${categoryMeta.tone}`}><CategoryIcon className="h-5 w-5" /></span><span className="text-xs font-semibold uppercase tracking-wide text-petal">{article.category}</span></div><button aria-label={saved ? 'Убрать из сохраненных' : 'Сохранить материал'} className="flex h-11 w-11 items-center justify-center rounded-2xl text-petal transition hover:bg-blush" onClick={onToggleSaved}>{saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}</button></div><div className="mt-3"><ArticleEvidenceBadge compact /></div><h2 className="mt-3 text-xl font-semibold leading-7">{article.title}</h2><p className="mt-2 text-sm leading-6 text-rosewood/70">{article.summary}</p>{reason && <p className="mt-3 rounded-2xl bg-blush px-3 py-2 text-xs leading-5 text-rosewood/65"><strong>Почему сейчас:</strong> {reason}</p>}<div className="mt-auto flex items-center justify-between pt-4"><span className="text-xs text-rosewood/50">{article.readingMinutes} {pluralMinutes(article.readingMinutes)}</span><button className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-petal transition hover:bg-blush" onClick={onOpen}>Читать <ChevronRight className="h-4 w-4" /></button></div></article>;
}

function pluralMinutes(minutes: number) {
  const mod10 = minutes % 10;
  const mod100 = minutes % 100;
  if (mod10 === 1 && mod100 !== 11) return 'минута';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'минуты';
  return 'минут';
}

function ArticleEvidenceBadge({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} ${dark ? 'bg-amber-300/15 text-amber-100' : 'bg-amber-50 text-amber-900'}`}><BookHeart className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />Открытые источники · без медрецензии</span>;
}

function readAnalyticsPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const stored = window.sessionStorage.getItem(`luna-analytics-${key}`);
  return stored && allowed.includes(stored as T) ? stored as T : fallback;
}

function AnalyticsView({ state, onChange, onOpenDiary, onOpenReport }: { state: AppState; onChange: (state: AppState) => void; onOpenDiary: () => void; onOpenReport: () => void }) {
  const [periodFilter, setPeriodFilter] = useState<AnalyticsPeriodFilter>(() => readAnalyticsPreference('period', ['3', '6', '12m', 'all'], '3'));
  const [section, setSection] = useState<'overview' | 'cycle' | 'wellbeing' | 'history'>(() => readAnalyticsPreference('section', ['overview', 'cycle', 'wellbeing', 'history'], 'overview'));
  const [wellbeingView, setWellbeingView] = useState<'summary' | 'symptoms' | 'sleep' | 'lifestyle'>(() => readAnalyticsPreference('wellbeing', ['summary', 'symptoms', 'sleep', 'lifestyle'], 'summary'));
  const [historyFilter, setHistoryFilter] = useState<'all' | 'cycle' | 'symptoms' | 'wellbeing' | 'sleep'>(() => readAnalyticsPreference('history', ['all', 'cycle', 'symptoms', 'wellbeing', 'sleep'], 'all'));
  const stats = getCycleStats(state);
  const today = todayIso();
  const hasCycleHistory = stats.cycleLengths.length >= 2;
  const selectedRanges = filterPeriodRangesForAnalytics(stats.ranges, periodFilter, today);
  const cutoff = periodFilter === '12m' ? addDays(today, -364) : hasCycleHistory ? selectedRanges[0]?.start : addDays(today, -29);
  const entries = Object.values(state.entries)
    .filter((entry) => entry.date <= today && (!cutoff || entry.date >= cutoff))
    .sort((left, right) => left.date.localeCompare(right.date));
  const selectedCycleLengths = selectedRanges.slice(1).map((range, index) => daysBetween(selectedRanges[index].start, range.start));
  const selectedCycles = selectedCycleLengths.map((length, index) => ({ length, start: selectedRanges[index].start, end: addDays(selectedRanges[index + 1].start, -1) }));
  const lastRange = selectedRanges[selectedRanges.length - 1];
  const latestPeriodIsActive = Boolean(lastRange && daysBetween(lastRange.end, today) <= 1);
  const completedPeriods = latestPeriodIsActive ? selectedRanges.slice(0, -1) : selectedRanges;
  const meaningfulEntries = entries.filter(hasTrackedData);
  const hasReportData = state.periodDays.length > 0 || Object.values(state.entries).some((entry) => entry.date <= today && hasTrackedData(entry));
  const trackingWindowDays = 7;
  const trackingWindowStart = addDays(today, -(trackingWindowDays - 1));
  const recentEntries = entries.filter((entry) => entry.date >= trackingWindowStart);
  const recentMeaningfulDays = new Set(recentEntries.filter(hasTrackedData).map((entry) => entry.date)).size;
  const coverage = Math.round((recentMeaningfulDays / trackingWindowDays) * 100);
  const symptomEntryCount = entries.filter((entry) => entry.symptoms.length || entry.pain !== undefined || entry.flow !== undefined).length;
  const wellbeingEntryCount = new Set(entries.filter((entry) => entry.dayRating || entry.mood || entry.energy).map((entry) => entry.date)).size;
  const sleepEntryCount = new Set(entries.filter((entry) => entry.sleepHours || entry.sleepQuality).map((entry) => entry.date)).size;
  const categoryProgress = [
    { label: 'Циклы', current: selectedCycleLengths.length, target: 2, unit: 'циклов' },
    { label: 'Симптомы', current: symptomEntryCount, target: 3, unit: 'записей' },
    { label: 'Самочувствие', current: wellbeingEntryCount, target: 7, unit: 'дней' },
    { label: 'Сон', current: sleepEntryCount, target: 5, unit: 'записей' },
  ];

  const values = <K extends keyof DayEntry>(key: K) => entries.map((entry) => entry[key]).filter((value): value is NonNullable<DayEntry[K]> => value !== undefined && value !== null);
  const positiveNumbers = (key: keyof DayEntry) => values(key).map(Number).filter((value) => Number.isFinite(value) && value > 0);
  const averageCycleLength = selectedCycleLengths.length ? Math.round(average(selectedCycleLengths)) : null;
  const averagePeriodLength = completedPeriods.length ? average(completedPeriods.map((range) => range.length)).toFixed(1) : null;
  const cycleMin = selectedCycleLengths.length ? Math.min(...selectedCycleLengths) : null;
  const cycleMax = selectedCycleLengths.length ? Math.max(...selectedCycleLengths) : null;
  const symptomCounts = countTags(entries.flatMap((entry) => entry.symptoms ?? []));
  const symptomSeveritySummary = getSymptomSeveritySummary(entries);
  const symptomCycleCounts = countTags(selectedRanges.flatMap((range, index) => {
    const nextStart = selectedRanges[index + 1]?.start;
    const inCycle = entries.filter((entry) => entry.date >= range.start && (!nextStart || entry.date < nextStart));
    return Array.from(new Set(inCycle.flatMap((entry) => entry.symptoms ?? [])));
  }));
  const detailedMoodCounts = countTags(entries.flatMap((entry) => entry.moods ?? []));
  const dischargeCounts = countTags(entries.flatMap((entry) => entry.discharge ?? []));
  const digestionCounts = countTags(entries.flatMap((entry) => entry.digestion ?? []));
  const contextCounts = countTags(entries.flatMap((entry) => entry.contextTags ?? []));
  const moodCounts = countTags(entries.flatMap((entry) => entry.mood ? [moodLabels[entry.mood]] : []));
  const sleepQualityCounts = countTags(entries.flatMap((entry) => entry.sleepQuality ? [entry.sleepQuality === 'poor' ? 'Плохое' : entry.sleepQuality === 'good' ? 'Хорошее' : 'Нормальное'] : []));
  const appetiteCounts = countTags(entries.flatMap((entry) => entry.appetite ? [entry.appetite === 'low' ? 'Пониженный' : entry.appetite === 'high' ? 'Повышенный' : 'Обычный'] : []));
  const activityCounts = countTags(entries.flatMap((entry) => entry.activity ? [entry.activity === 'low' ? 'Низкая' : entry.activity === 'high' ? 'Высокая' : 'Средняя'] : []));
  const topSymptom = symptomCycleCounts.find(([, count]) => count >= 2);
  const hasObservation = Boolean(topSymptom || (selectedCycleLengths.length >= 3 && cycleMin !== null && cycleMax !== null));
  const reliability = !hasObservation
    ? 'Недостаточно данных'
    : selectedCycleLengths.length >= 6 && meaningfulEntries.length >= 20
      ? 'Устойчивое наблюдение'
      : topSymptom
        ? 'Повторяется в циклах'
        : 'Предварительное наблюдение';
  const mainObservation = topSymptom
    ? `${topSymptom[0]} отмечалось в ${topSymptom[1]} из ${selectedRanges.length} отслеживаемых циклов.`
    : selectedCycleLengths.length >= 3 && cycleMin !== null && cycleMax !== null
      ? `Длина последних циклов находилась в вашем диапазоне ${cycleMin}–${cycleMax} дней.`
      : 'Пока мало сопоставимых записей для персонального наблюдения.';
  const observationWhy = topSymptom
    ? 'Повторение в разных циклах полезнее одного отдельного эпизода при подготовке истории самочувствия.'
    : hasObservation
      ? 'Личный диапазон помогает ориентироваться на вашу историю, а не на одно усреднённое число.'
      : 'Для вывода нужны сопоставимые записи минимум в двух циклах.';
  const observationAction = topSymptom
    ? 'Продолжайте отмечать выраженность и влияние на обычные дела. При необходимости добавьте факт в отчёт врачу.'
    : hasObservation
      ? 'Продолжайте отмечать начало месячных — диапазон станет точнее по мере накопления циклов.'
      : 'Продолжайте короткие отметки, приложение не будет делать вывод раньше времени.';
  const observationSources = topSymptom
    ? entries.filter((entry) => entry.symptoms.includes(topSymptom[0])).slice(-12)
    : [];
  const observationKey = topSymptom ? `symptom:${topSymptom[0]}` : selectedCycleLengths.length >= 3 ? 'cycle:range' : 'insufficient-data';
  const observationFeedback = state.insightFeedback?.[observationKey];
  const setObservationFeedback = (value: 'helpful' | 'not-helpful') => onChange({ ...state, insightFeedback: { ...(state.insightFeedback ?? {}), [observationKey]: value } });
  const sleepEntries = entries.filter((entry) => (entry.sleepHours ?? 0) > 0).slice(-12);
  const temperatureEntries = entries.filter((entry) => entry.basalTemperature !== undefined).slice(-16);
  const weightEntries = entries.filter((entry) => entry.weightKg !== undefined).slice(-16);
  const entriesWithSymptoms = entries.filter((entry) => entry.symptoms?.length).length;
  const notesCount = entries.filter((entry) => entry.note.trim()).length;
  const sexCount = entries.filter((entry) => entry.hadSex).length;
  const overviewDates = Array.from({ length: 14 }, (_, index) => addDays(today, index - 13));
  const currentCycleDay = getCycleDay(state, today);
  const emptyCycleGuidance = getCycleAnalyticsEmptyGuidance(state.periodDays.length > 0, selectedCycleLengths.length);
  const dayRatingEntries = entries.filter((entry) => entry.dayRating).slice(-14);
  const historyEntries = meaningfulEntries.filter((entry) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'cycle') return state.periodDays.includes(entry.date) || entry.flow !== undefined || entry.pain !== undefined;
    if (historyFilter === 'symptoms') return Boolean(entry.symptoms.length || entry.discharge?.length || entry.digestion?.length);
    if (historyFilter === 'wellbeing') return Boolean(entry.dayRating || entry.mood || entry.energy || entry.moods?.length);
    return Boolean(entry.sleepHours || entry.sleepQuality);
  });

  useEffect(() => { window.sessionStorage.setItem('luna-analytics-period', periodFilter); }, [periodFilter]);
  useEffect(() => { window.sessionStorage.setItem('luna-analytics-section', section); }, [section]);
  useEffect(() => { window.sessionStorage.setItem('luna-analytics-wellbeing', wellbeingView); }, [wellbeingView]);
  useEffect(() => { window.sessionStorage.setItem('luna-analytics-history', historyFilter); }, [historyFilter]);

  return (
    <div className="space-y-4">
      <section className="analytics-hero-v2 rounded-[30px] p-5 sm:p-6">
        <div className="flex flex-col gap-4 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
          <div className="relative z-[1]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1.5 text-xs font-semibold text-petal shadow-sm"><Sparkles className="h-3.5 w-3.5" />Личная картина</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-[2rem]">Аналитика</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-rosewood/65">Здесь видно, что меняется и повторяется в ваших отметках. Без диагнозов и преждевременных выводов.</p>
          </div>
          {hasCycleHistory ? <select aria-label="Период аналитики" className="relative z-[1] w-full rounded-2xl border border-white/90 bg-white/80 px-3 py-2.5 text-sm font-semibold text-rosewood shadow-sm outline-none backdrop-blur min-[380px]:w-auto" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as AnalyticsPeriodFilter)}><option value="3">3 цикла</option><option value="6">6 циклов</option><option value="12m">12 месяцев</option><option value="all">Всё время</option></select> : <span className="relative z-[1] inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/80 bg-white/65 px-4 text-sm font-semibold text-rosewood/60 shadow-sm backdrop-blur">Последние 30 дней</span>}
        </div>
      </section>
      <div className="analytics-section-nav sticky top-3 z-10">
        <div className="grid grid-cols-4 gap-1">
          {([
            ['overview', 'Главное', Sparkles],
            ['cycle', 'Цикл', Droplet],
            ['wellbeing', 'Самочувствие', Smile],
            ['history', 'Записи', ListChecks],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              className={`analytics-section-button ${section === id ? 'is-active' : ''}`}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => setSection(id)}
            >
              <span className="analytics-section-icon"><Icon className="h-4 w-4" /></span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {section === 'overview' && (
        <div key="overview" className="analytics-panel space-y-4">
          <section className={`analytics-focus-card ${hasObservation ? 'is-ready' : 'is-collecting'}`}>
            <div className="relative z-[1] flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-sm"><Sparkles className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white/65">{hasObservation ? 'Ваше главное наблюдение' : 'Следующий ориентир'}</p>
                  {hasObservation && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70">{reliability}</span>}
                </div>
                <h2 className="mt-1 max-w-2xl text-xl font-semibold leading-7 text-white sm:text-2xl">{hasObservation ? mainObservation : emptyCycleGuidance.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{hasObservation ? observationAction : emptyCycleGuidance.description}</p>
              </div>
            </div>
            {!hasObservation && <div className="relative z-[1] mt-5 grid grid-cols-3 gap-2" aria-label="Путь к первому сравнению">{[
              { label: 'Начало цикла', done: state.periodDays.length > 0 },
              { label: 'Следующий цикл', done: selectedCycleLengths.length >= 1 },
              { label: 'Сравнение', done: selectedCycleLengths.length >= 2 },
            ].map((step, index) => <div key={step.label} className={`rounded-2xl border px-2 py-2.5 ${step.done ? 'border-white/20 bg-white/15' : 'border-white/10 bg-white/[0.06]'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? 'bg-white text-petal' : 'bg-white/10 text-white/55'}`}>{step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><p className="mt-2 text-[10px] font-semibold leading-4 text-white/65 sm:text-xs">{step.label}</p></div>)}</div>}
            {!hasObservation && <button className="relative z-[1] mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#5945b2] shadow-lg shadow-[#39266d]/15 transition hover:-translate-y-0.5" onClick={onOpenDiary}>Добавить запись <ChevronRight className="h-4 w-4" /></button>}
            {observationSources.length > 0 && <details className="relative z-[1] mt-4 rounded-2xl bg-white/10 p-3 text-white"><summary className="cursor-pointer text-sm font-semibold">Показать даты · {observationSources.length}</summary><div className="mt-3 flex flex-wrap gap-2">{observationSources.map((entry) => <span key={entry.date} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">{formatRuDate(entry.date)}</span>)}</div></details>}
          </section>

          <div className="bento-grid items-start">
            <div className="md:col-span-5"><AnalyticsCyclePreview currentDay={currentCycleDay} lastStart={lastRange?.start} cycleLengths={selectedCycleLengths} periodLength={averagePeriodLength} onOpen={() => setSection('cycle')} /></div>
            <div className="md:col-span-7"><TrackingRhythmChart dates={overviewDates} entries={state.entries} periodDays={state.periodDays} onOpen={() => setSection('wellbeing')} /></div>
          </div>
        </div>
      )}

      {section === 'cycle' && (
        <div key="cycle" className="analytics-panel space-y-4">
          <section className="bento-card p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Циклы</h2><span className="text-xs font-semibold text-rosewood/50">{selectedCycleLengths.length} завершено</span></div>
            <CycleDynamicsChart cycles={selectedCycles} periodLength={averagePeriodLength} cycleStarted={state.periodDays.length > 0} />
          </section>
          <CyclePatternChart state={state} ranges={selectedRanges} />
          <section className="bento-card p-5">
            <h2 className="text-xl font-semibold">История циклов</h2>
            {selectedRanges.length ? <div className="mt-4 space-y-3">{[...selectedRanges].reverse().map((range, index) => { const active = index === 0 && latestPeriodIsActive; return <div key={range.start} className="flex items-center justify-between gap-4 rounded-2xl bg-blush px-4 py-3"><div><p className="font-medium">{formatRuDate(range.start)}</p><p className="mt-1 text-xs text-rosewood/55">Месячные: {range.length} {pluralDays(range.length)}</p></div><span className="text-xs font-semibold text-rosewood/60">{active ? 'идут сейчас' : 'завершены'}</span></div>; })}</div> : <p className="mt-4 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/65">Пока нет отмеченных месячных.</p>}
          </section>
        </div>
      )}

      {section === 'wellbeing' && (
        <div key="wellbeing" className="analytics-panel space-y-4">
          <section className="bento-card p-4 sm:p-5">
            <div><p className="text-sm font-semibold text-rosewood/50">Выберите, что посмотреть</p><h2 className="mt-1 text-xl font-semibold">Самочувствие</h2></div>
            <div className="analytics-mode-nav mt-4 grid grid-cols-4 gap-1.5">
              {([['summary', 'Состояние', Smile], ['symptoms', 'Симптомы', ScanHeart], ['sleep', 'Сон', MoonStar], ['lifestyle', 'Привычки', Gauge]] as const).map(([id, label, Icon]) => <button key={id} className={`analytics-mode-button ${wellbeingView === id ? 'is-active' : ''}`} aria-pressed={wellbeingView === id} onClick={() => setWellbeingView(id)}><span className="analytics-mode-icon"><Icon className="h-4 w-4" /></span><span>{label}</span></button>)}
            </div>
          </section>

          {wellbeingView === 'summary' && <div key="summary" className="analytics-panel space-y-4">
            <section className="bento-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-rosewood/50">Общее состояние</p><h2 className="mt-1 text-xl font-semibold">Как менялось самочувствие</h2></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-petal">{positiveNumbers('dayRating').length} {pluralMarks(positiveNumbers('dayRating').length)}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Оценка дня" value={positiveNumbers('dayRating').length >= 7 ? `${average(positiveNumbers('dayRating')).toFixed(1)} из 5` : `${positiveNumbers('dayRating').length} из 7 дней`} /><Metric label="Энергия" value={positiveNumbers('energy').length >= 7 ? `${average(positiveNumbers('energy')).toFixed(1)} из 5` : `${positiveNumbers('energy').length} из 7 дней`} /><Metric label="Боль" value={values('pain').length ? average(values('pain').map(Number)) === 0 ? 'Не отмечалась' : `${average(values('pain').map(Number)).toFixed(1)} из 3` : 'Нет данных'} /><Metric label="Обильность" value={values('flow').length ? average(values('flow').map(Number)) === 0 ? 'Не отмечалась' : `${average(values('flow').map(Number)).toFixed(1)} из 3` : 'Нет данных'} /></div></section>
            <ChartSection title="Оценка дня" points={dayRatingEntries.length >= 2 ? dayRatingEntries.map((entry) => ({ date: entry.date, value: entry.dayRating ?? 0, label: `${entry.dayRating} из 5` })) : []} color="bg-violet-400" empty="Добавьте оценку дня минимум за два дня." />
            <TagSummary title="Подробные настроения" items={detailedMoodCounts.slice(0, 10)} empty="Подробные настроения пока не отмечены." />
            <TagSummary title="Быстрая оценка настроения" items={moodCounts.slice(0, 5)} empty="Быстрая оценка пока не отмечена." />
          </div>}

          {wellbeingView === 'symptoms' && <div key="symptoms" className="analytics-panel space-y-4">
            <TagSummary title="Симптомы" items={symptomCounts.slice(0, 8)} empty="Симптомы пока не отмечены." />
            <SymptomSeverityCard items={symptomSeveritySummary.slice(0, 6)} canCompareByCycle={selectedRanges.length >= 2} onOpenCycle={() => setSection('cycle')} />
            <TagSummary title="Выделения" items={dischargeCounts.slice(0, 8)} empty="Выделения пока не отмечены." />
            <TagSummary title="Пищеварение" items={digestionCounts.slice(0, 6)} empty="Состояние пищеварения пока не отмечено." />
          </div>}

          {wellbeingView === 'sleep' && <div key="sleep" className="analytics-panel space-y-4">
            <section className="bento-card p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><MoonStar className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold">Сон и восстановление</h2><p className="text-sm text-rosewood/50">{positiveNumbers('sleepHours').length} сохранённых ночей</p></div></div><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Средняя длительность" value={positiveNumbers('sleepHours').length >= 5 ? `${average(positiveNumbers('sleepHours')).toFixed(1)} ч` : `${positiveNumbers('sleepHours').length} из 5 записей`} /><Metric label="Записей" value={`${positiveNumbers('sleepHours').length}`} /></div><div className="mt-4"><TagRows items={sleepQualityCounts} empty="Качество сна пока не отмечено." /></div></section>
            <ChartSection title="Длительность сна" points={sleepEntries.length >= 5 ? sleepEntries.map((entry) => ({ date: entry.date, value: entry.sleepHours ?? 0, label: `${entry.sleepHours} ч` })) : []} color="bg-indigo-300" empty={`Добавьте сон ещё за ${Math.max(0, 5 - sleepEntries.length)} ${pluralDays(Math.max(0, 5 - sleepEntries.length))}, чтобы увидеть динамику.`} />
          </div>}

          {wellbeingView === 'lifestyle' && <div key="lifestyle" className="analytics-panel space-y-4">
            <DailyTrends state={state} />
            <section className="bento-card p-5"><h2 className="text-xl font-semibold">Сводка привычек</h2><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Вода в дни отметок" value={positiveNumbers('waterMl').length ? `${Math.round(average(positiveNumbers('waterMl')))} мл` : 'Нет данных'} /><Metric label="Средние шаги" value={positiveNumbers('steps').length ? Math.round(average(positiveNumbers('steps'))).toLocaleString('ru-RU') : 'Нет данных'} /><Metric label="Дней с активностью" value={`${values('activity').length}`} /></div><div className="mt-5 space-y-4"><MiniTagGroup label="Активность" items={activityCounts} /><MiniTagGroup label="Аппетит" items={appetiteCounts} /></div></section>
            <TagSummary title="Другие факторы" items={contextCounts.slice(0, 8)} empty="Стресс, поездки и другие факторы пока не отмечены." />
            <ChartSection title="Базальная температура" points={temperatureEntries.length >= 2 ? temperatureEntries.map((entry) => ({ date: entry.date, value: entry.basalTemperature ?? 0, label: `${entry.basalTemperature} °C` })) : []} color="bg-petal" empty="Добавьте минимум два измерения базальной температуры." />
            <ChartSection title="Вес" points={weightEntries.length >= 2 ? weightEntries.map((entry) => ({ date: entry.date, value: entry.weightKg ?? 0, label: `${entry.weightKg} кг` })) : []} color="bg-indigo-300" empty="Добавьте минимум два измерения веса." />
            <details className="bento-card p-5"><summary className="cursor-pointer list-none text-lg font-semibold">Личные данные</summary><p className="mt-2 text-sm leading-6 text-rosewood/60">Показываются только здесь и не включаются в будущий отчёт без отдельного выбора.</p><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Интимная жизнь" value={`${sexCount} отметок`} /><Metric label="Личные заметки" value={`${notesCount}`} /></div></details>
          </div>}
        </div>
      )}

      {section === 'history' && (
        <section key="history" className="analytics-panel bento-card p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-rosewood/50">Хронология</p><h2 className="mt-1 text-xl font-semibold">История записей</h2></div><span className="text-xs font-semibold text-rosewood/50">{historyEntries.length} {pluralDays(historyEntries.length)}</span></div>
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">{([['all', 'Все'], ['cycle', 'Цикл'], ['symptoms', 'Симптомы'], ['wellbeing', 'Самочувствие'], ['sleep', 'Сон']] as const).map(([id, label]) => <button key={id} className={`chip shrink-0 ${historyFilter === id ? 'active' : ''}`} aria-pressed={historyFilter === id} onClick={() => setHistoryFilter(id)}>{label}</button>)}</div>
          {historyEntries.length ? <div className="mt-3 space-y-3">{[...historyEntries].reverse().slice(0, 30).map((entry) => <AnalyticsHistoryEntry key={entry.date} entry={entry} />)}</div> : <p className="mt-4 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/65">{meaningfulEntries.length ? 'Для этого фильтра записей пока нет.' : 'Пока нет заполненных дней. Добавьте первую запись в дневнике.'}</p>}
        </section>
      )}

      <section className="analytics-report-card"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-petal shadow-sm"><FileDown className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-rosewood/40">Для консультации</p><h2 className="mt-1 font-semibold">Отчёт из ваших отметок</h2><p className="mt-1 text-sm leading-5 text-rosewood/55">{hasReportData ? 'Только сохранённые факты — без автоматических диагнозов.' : 'Сначала добавьте хотя бы одну отметку — пустой отчёт не поможет.'}</p></div></div><button className="analytics-report-action" onClick={hasReportData ? onOpenReport : onOpenDiary}><span>{hasReportData ? 'Создать отчёт' : 'Добавить запись'}</span><ChevronRight className="h-4 w-4" /></button></section>
    </div>
  );
}

function AnalyticsCyclePreview({ currentDay, lastStart, cycleLengths, periodLength, onOpen }: { currentDay: number | null; lastStart?: string; cycleLengths: number[]; periodLength: string | null; onOpen: () => void }) {
  const recent = cycleLengths.slice(-5);
  const min = recent.length ? Math.min(...recent) : 0;
  const max = recent.length ? Math.max(...recent) : 0;
  const span = Math.max(1, max - min);
  const points = recent.map((value, index) => `${10 + (index / Math.max(1, recent.length - 1)) * 80},${70 - ((value - min) / span) * 42}`).join(' ');

  return <button type="button" className="analytics-cycle-card w-full text-left" onClick={onOpen}>
    <div className="relative z-[1] flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-rose-500 shadow-sm"><Droplet className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-rosewood/40">Текущий цикл</p><p className="mt-0.5 text-sm font-semibold text-rosewood/70">{lastStart ? `Начался ${formatRuDate(lastStart)}` : 'Ожидает первой отметки'}</p></div></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/65 text-rosewood/45"><ChevronRight className="h-4 w-4" /></span></div>
    <div className="relative z-[1] mt-6 flex items-center gap-4">
      <span className="analytics-cycle-orb"><strong>{currentDay ?? '—'}</strong><small>{currentDay ? 'день цикла' : 'нет данных'}</small></span>
      <div className="min-w-0"><h2 className="text-xl font-semibold leading-7">{currentDay ? 'Цикл продолжается' : 'Отметьте месячные'}</h2><p className="mt-1 text-sm leading-5 text-rosewood/55">{currentDay ? 'Следующая отметка начала позволит сравнить длину цикла.' : 'После первой отметки здесь появится день цикла.'}</p></div>
    </div>
    <div className="relative z-[1] mt-5 rounded-[22px] border border-white/80 bg-white/60 p-3.5 backdrop-blur">
      {recent.length >= 2 ? <><div className="flex items-center justify-between"><p className="text-xs font-semibold text-rosewood/50">Последние циклы</p><span className="text-xs font-semibold text-petal">{min}–{max} дней</span></div><svg viewBox="0 0 100 72" className="mt-1 h-24 w-full" role="img" aria-label={`Последние циклы: ${recent.join(', ')} дней`}><line x1="8" x2="92" y1="25" y2="25" stroke="#E9E3EF" /><line x1="8" x2="92" y1="49" y2="49" stroke="#E9E3EF" /><polyline points={points} fill="none" stroke="#8A72DE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{recent.map((value, index) => { const x = 10 + (index / Math.max(1, recent.length - 1)) * 80; const y = 70 - ((value - min) / span) * 42; return <g key={`${value}-${index}`}><circle cx={x} cy={y} r="3.5" fill="#fff" stroke="#7561D5" strokeWidth="2" /><text x={x} y={y - 7} textAnchor="middle" fontSize="5" fill="#5E5668">{value}</text></g>; })}</svg></> : <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-petal"><Sparkles className="h-4 w-4" /></span><div><p className="text-sm font-semibold">Собираем историю</p><p className="mt-0.5 text-xs leading-5 text-rosewood/50">График появится после двух завершённых циклов.</p></div></div>}
    </div>
    <div className="relative z-[1] mt-4 flex items-center justify-between text-sm"><span className="text-rosewood/55">Длительность месячных</span><strong className="font-semibold text-rosewood">{periodLength ? `${periodLength} дня` : 'пока нет среднего'}</strong></div>
  </button>;
}

function TrackingRhythmChart({ dates, entries, periodDays, onOpen }: { dates: string[]; entries: Record<string, DayEntry>; periodDays: string[]; onOpen?: () => void }) {
  const daySignals = dates.map((date) => {
    const entry = entries[date];
    const signals = [
      periodDays.includes(date) ? { id: 'cycle', label: 'Месячные', color: 'bg-rose-100 text-rose-500', Icon: Droplet } : null,
      entry && (entry.dayRating || entry.mood || entry.energy || entry.moods?.length) ? { id: 'wellbeing', label: 'Самочувствие', color: 'bg-violet-100 text-violet-600', Icon: Smile } : null,
      entry && (entry.symptoms.length || entry.pain !== undefined) ? { id: 'symptoms', label: 'Симптомы', color: 'bg-orange-100 text-orange-500', Icon: ScanHeart } : null,
      entry && (entry.sleepHours || entry.sleepQuality) ? { id: 'sleep', label: 'Сон', color: 'bg-indigo-100 text-indigo-500', Icon: MoonStar } : null,
    ].filter((signal): signal is { id: string; label: string; color: string; Icon: typeof Droplet } => Boolean(signal));
    return { date, signals };
  });
  const daysWithSignals = daySignals.filter(({ signals }) => signals.length > 0).length;
  const latestSignalDay = [...daySignals].reverse().find(({ signals }) => signals.length > 0);
  const rhythmRows = [
    { label: '8–14 дней назад', days: daySignals.slice(0, 7) },
    { label: 'Последние 7 дней', days: daySignals.slice(7) },
  ].filter(({ days }) => days.length > 0);
  const legend = [
    { label: 'Месячные', color: 'bg-rose-100 text-rose-500', Icon: Droplet },
    { label: 'Самочувствие', color: 'bg-violet-100 text-violet-600', Icon: Smile },
    { label: 'Симптомы', color: 'bg-orange-100 text-orange-500', Icon: ScanHeart },
    { label: 'Сон', color: 'bg-indigo-100 text-indigo-500', Icon: MoonStar },
  ];

  return (
    <section className="analytics-rhythm-card overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-petal"><ListChecks className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-rosewood/40">Последние 14 дней</p><h2 className="mt-1 text-xl font-semibold">Лента вашего ритма</h2></div></div>
        <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-petal">{daysWithSignals} из {dates.length}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-rosewood/60">Каждая карточка — один день. Значки показывают сохранённые данные.</p>

      <div className="mt-5 space-y-4" role="img" aria-label={`Лента отметок за ${dates.length} дней. Данные есть за ${daysWithSignals} ${pluralDays(daysWithSignals)}.`}>
        {rhythmRows.map((row) => (
          <div key={row.label}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-rosewood/40">{row.label}</p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {row.days.map(({ date, signals }) => {
                const parsed = parseIsoDate(date);
                const isToday = date === todayIso();
                const description = signals.length ? signals.map(({ label }) => label).join(', ') : 'нет отметок';
                return (
                  <div
                    key={date}
                    className={`relative flex min-h-[76px] min-w-0 flex-col items-center rounded-2xl border px-1 py-2 ${isToday ? 'border-violet-300 bg-violet-50 shadow-sm' : signals.length ? 'border-rosewood/5 bg-white shadow-sm' : 'border-transparent bg-blush/55'}`}
                    title={`${formatRuDate(date)}: ${description}`}
                    aria-label={`${formatRuDate(date)}: ${description}`}
                  >
                    <span className="text-[9px] font-semibold uppercase text-rosewood/40">{new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(parsed).slice(0, 2)}</span>
                    <span className={`mt-0.5 text-xs font-semibold ${isToday ? 'text-petal' : 'text-rosewood/65'}`}>{parsed.getDate()}</span>
                    <span className="mt-auto flex max-w-[42px] flex-wrap justify-center gap-0.5" aria-hidden="true">
                      {signals.length ? signals.map(({ id, color, Icon }) => <i key={id} className={`flex h-[17px] w-[17px] items-center justify-center rounded-md ${color}`}><Icon className="h-2.5 w-2.5" /></i>) : <i className="mb-1 h-1 w-3 rounded-full bg-rosewood/10" />}
                    </span>
                    {isToday && <i className="absolute -bottom-1 h-2 w-2 rounded-full border-2 border-white bg-petal" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Обозначения">
        {legend.map(({ label, color, Icon }) => (
          <span key={label} className="inline-flex items-center gap-2 text-xs text-rosewood/60">
            <i className={`flex h-6 w-6 items-center justify-center rounded-lg ${color}`} aria-hidden="true"><Icon className="h-3.5 w-3.5" /></i>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-violet-50/70 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-petal" />
        <p className="text-sm leading-6 text-rosewood/65">{latestSignalDay ? `Последняя заполненная дата — ${formatRuDate(latestSignalDay.date)}. Пустая карточка означает, что в этот день вы ничего не сохраняли.` : 'Добавьте первую отметку — она сразу появится на этой ленте.'}</p>
      </div>
      {onOpen && <button className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-petal" onClick={onOpen}>Открыть самочувствие <ChevronRight className="h-4 w-4" /></button>}
    </section>
  );
}

function hasTrackedData(entry: DayEntry) {
  return Boolean(
    entry.dayRating || entry.waterMl > 0 || entry.mood || entry.moods?.length || (entry.sleepHours ?? 0) > 0 || entry.sleepQuality || entry.appetite ||
    (entry.steps ?? 0) > 0 || (entry.calories ?? 0) > 0 || entry.activity || entry.pain !== undefined || entry.flow !== undefined || entry.energy ||
    entry.hadSex || entry.symptomsChecked || entry.symptoms?.length || entry.discharge?.length || entry.digestion?.length || entry.contextTags?.length || entry.basalTemperature || entry.weightKg || entry.note.trim()
  );
}

function average(numbers: number[]) {
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0;
}

function countTags(items: string[]): Array<[string, number]> {
  const counts = items.reduce<Record<string, number>>((result, item) => ({ ...result, [item]: (result[item] ?? 0) + 1 }), {});
  return Object.entries(counts).sort((left, right) => right[1] - left[1]);
}

function TagSummary({ title, items, empty }: { title: string; items: Array<[string, number]>; empty: string }) {
  return <section className="bento-card p-5"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4"><TagRows items={items} empty={empty} /></div></section>;
}

function SymptomSeverityCard({ items, canCompareByCycle, onOpenCycle }: { items: Array<{ symptom: string; count: number; averageSeverity: number }>; canCompareByCycle: boolean; onOpenCycle: () => void }) {
  return <section className="bento-card p-5"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><ScanHeart className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-rosewood/50">Только сохранённые оценки</p><h2 className="mt-1 text-xl font-semibold">Выраженность симптомов</h2></div></div>{items.length ? <><div className="mt-5 space-y-4">{items.map((item) => <div key={item.symptom}><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold">{item.symptom}</p><p className="mt-0.5 text-xs text-rosewood/45">{item.count} {pluralMarks(item.count)}</p></div><strong className="shrink-0 text-sm text-petal">{item.averageSeverity.toFixed(1)} из 3</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-50" role="img" aria-label={`${item.symptom}: средняя отмеченная выраженность ${item.averageSeverity.toFixed(1)} из 3`}><span className="block h-full rounded-full bg-gradient-to-r from-rose-300 to-rose-500" style={{ width: `${(item.averageSeverity / 3) * 100}%` }} /></div></div>)}</div><p className="mt-5 rounded-2xl bg-blush p-3 text-xs leading-5 text-rosewood/55">Среднее рассчитано только по дням, где вы выбрали выраженность. Пропуски не считаются нулём.</p>{canCompareByCycle ? <button className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-petal" onClick={onOpenCycle}>Посмотреть по дням цикла <ChevronRight className="h-4 w-4" /></button> : <p className="mt-3 text-xs leading-5 text-rosewood/50">Карта по дням цикла появится после отметок минимум в двух циклах.</p>}</> : <div className="mt-4 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/60">Пока нет оценок выраженности. В дневнике выберите симптом и отметьте, насколько он выражен.</div>}</section>;
}

function TagRows({ items, empty }: { items: Array<[string, number]>; empty: string }) {
  return items.length ? <div className="flex flex-wrap gap-2">{items.map(([label, count]) => <span key={label} className="inline-flex items-center gap-2 rounded-full bg-blush px-3 py-2 text-sm font-medium"><span>{label}</span><strong className="text-petal">{count}</strong></span>)}</div> : <p className="rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/65">{empty}</p>;
}

function MiniTagGroup({ label, items }: { label: string; items: Array<[string, number]> }) {
  return <div><p className="mb-2 text-sm font-semibold text-rosewood/60">{label}</p><TagRows items={items} empty="Пока нет отметок." /></div>;
}

function AnalyticsHistoryEntry({ entry }: { entry: DayEntry }) {
  const facts = [
    entry.dayRating ? `День ${entry.dayRating}/5` : '',
    entry.energy ? `Энергия ${entry.energy}/5` : '',
    entry.pain !== undefined ? `Боль ${entry.pain}/3` : '',
    entry.flow !== undefined ? `Обильность ${entry.flow}/3` : '',
    entry.sleepHours ? `Сон ${entry.sleepHours} ч` : '',
    entry.waterMl ? `Вода ${entry.waterMl} мл` : '',
    entry.steps ? `${entry.steps.toLocaleString('ru-RU')} шагов` : '',
    entry.basalTemperature ? `${entry.basalTemperature} °C` : '',
    entry.weightKg ? `${entry.weightKg} кг` : '',
    entry.hadSex ? 'Личная отметка: интимная жизнь' : '',
  ].filter(Boolean);
  const tags = [entry.mood ? moodLabels[entry.mood] : '', ...(entry.moods ?? []), ...entry.symptoms, ...(entry.discharge ?? []), ...(entry.digestion ?? []), ...(entry.contextTags ?? [])].filter(Boolean);
  const marksCount = facts.length + tags.length;
  return <article className="rounded-2xl bg-blush p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{formatRuDate(entry.date)}</p><span className="text-xs text-rosewood/50">{marksCount} {pluralMarks(marksCount)}</span></div>{facts.length > 0 && <p className="mt-2 text-sm leading-6 text-rosewood/70">{facts.join(' · ')}</p>}{tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-rosewood/70">{tag}</span>)}</div>}{entry.note.trim() && <details className="mt-3 rounded-xl bg-white/70 p-3"><summary className="cursor-pointer text-sm font-semibold text-rosewood/65">Личная заметка</summary><p className="mt-2 text-sm leading-6 text-rosewood/70">{entry.note}</p></details>}</article>;
}

function pluralMarks(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'отметка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'отметки';
  return 'отметок';
}

function ReportView({ state, onChange, onBack }: { state: AppState; onChange: (state: AppState) => void; onBack: () => void }) {
  const defaultIncluded: Record<ReportOption, boolean> = {
    cycles: true,
    pain: true,
    symptoms: true,
    wellbeing: true,
    sleep: true,
    lifestyle: true,
    measurements: true,
    questions: true,
    notes: false,
    sex: false,
  };
  const draft = state.doctorReportDraft ?? { period: '3' as const, questions: '', included: defaultIncluded, updatedAt: todayIso() };
  const period = draft.period;
  const questions = draft.questions;
  const included = { ...defaultIncluded, ...draft.included };
  const updateDraft = (updates: Partial<typeof draft>) => onChange({ ...state, doctorReportDraft: { ...draft, ...updates, updatedAt: todayIso() } });
  const stats = getCycleStats(state);
  const cycleLimit = period === 'all' ? null : Number(period);
  const selectedRanges = cycleLimit ? stats.ranges.slice(-(cycleLimit + 1)) : stats.ranges;
  const cutoff = selectedRanges[0]?.start;
  const entries = Object.values(state.entries)
    .filter((entry) => entry.date <= todayIso() && (!cutoff || entry.date >= cutoff) && hasTrackedData(entry))
    .sort((left, right) => left.date.localeCompare(right.date));
  const cycleLengths = selectedRanges.slice(1).map((range, index) => daysBetween(selectedRanges[index].start, range.start));
  const symptomCounts = countTags(entries.flatMap((entry) => entry.symptoms ?? []));
  const severeSymptomCounts = countTags(entries.flatMap((entry) => Object.entries(entry.symptomSeverity ?? {}).filter(([, severity]) => severity === 3).map(([symptom]) => symptom)));
  const impactedDays = entries.filter((entry) => entry.symptomsAffectDailyLife).length;
  const dischargeCounts = countTags(entries.flatMap((entry) => entry.discharge ?? []));
  const digestionCounts = countTags(entries.flatMap((entry) => entry.digestion ?? []));
  const moodCounts = countTags(entries.flatMap((entry) => [...(entry.moods ?? []), ...(entry.mood ? [moodLabels[entry.mood]] : [])]));
  const painValues = entries.filter((entry) => entry.pain !== undefined).map((entry) => entry.pain as number);
  const flowValues = entries.filter((entry) => entry.flow !== undefined).map((entry) => entry.flow as number);
  const energyValues = entries.filter((entry) => entry.energy !== undefined).map((entry) => entry.energy as number);
  const dayRatings = entries.filter((entry) => entry.dayRating !== undefined).map((entry) => entry.dayRating as number);
  const sleepValues = entries.filter((entry) => (entry.sleepHours ?? 0) > 0).map((entry) => entry.sleepHours as number);
  const waterValues = entries.filter((entry) => entry.waterMl > 0).map((entry) => entry.waterMl);
  const stepValues = entries.filter((entry) => (entry.steps ?? 0) > 0).map((entry) => entry.steps as number);
  const weightEntries = entries.filter((entry) => entry.weightKg !== undefined);
  const temperatureEntries = entries.filter((entry) => entry.basalTemperature !== undefined);
  const notes = entries.filter((entry) => entry.note.trim());
  const sexEntries = entries.filter((entry) => entry.hadSex);
  const contextCounts = countTags(entries.flatMap((entry) => entry.contextTags ?? []));
  const activeSectionCount = Object.values(included).filter(Boolean).length;
  const periodLabel = entries.length ? `${formatRuDate(entries[0].date)} – ${formatRuDate(entries[entries.length - 1].date)}` : 'нет записей';
  const hasReportContent = entries.length > 0 || selectedRanges.length > 0 || questions.trim().length > 0;

  const toggle = (option: ReportOption) => updateDraft({ included: { ...included, [option]: !included[option] } });
  const downloadTextCopy = () => {
    if (!hasReportContent) return;
    const preview = document.getElementById('doctor-report-preview');
    if (!preview) return;
    const blob = new Blob([preview.innerText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luna-doctor-report-${todayIso()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <section className="surface-hero print-hide rounded-[28px] p-5">
        <button className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-petal" onClick={onBack}><ChevronLeft className="h-5 w-5" />Назад к аналитике</button>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold text-rosewood/60">Факты для консультации</p><h1 className="mt-1 text-3xl font-semibold">Отчёт для врача</h1><p className="mt-2 text-sm leading-6 text-rosewood/65">Выберите только те данные, которыми готовы поделиться.</p></div>
          <ShieldCheck className="h-8 w-8 shrink-0 text-petal" />
        </div>
      </section>

      <section className="print-hide bento-card p-5">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Период отчёта</h2><p className="mt-1 text-sm text-rosewood/55">{entries.length} {pluralDays(entries.length)} с записями · черновик сохранён</p></div><select className="rounded-2xl bg-blush px-3 py-2 text-sm font-semibold outline-none" value={period} onChange={(event) => updateDraft({ period: event.target.value as typeof period })}><option value="3">3 цикла</option><option value="6">6 циклов</option><option value="all">Всё время</option></select></div>
      </section>

      <section className="print-hide bento-card p-5">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Что включить</h2><p className="mt-1 text-sm text-rosewood/55">Выбрано {activeSectionCount} из 10 разделов</p></div><span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-petal">Можно изменить</span></div>
        <div className="mt-4 space-y-2">
          <ReportToggle label="Циклы и месячные" description="Даты, продолжительность и диапазон" checked={included.cycles} onChange={() => toggle('cycles')} />
          <ReportToggle label="Боль и обильность" description="Только отмеченные значения" checked={included.pain} onChange={() => toggle('pain')} />
          <ReportToggle label="Симптомы" description="Симптомы, выделения и пищеварение" checked={included.symptoms} onChange={() => toggle('symptoms')} />
          <ReportToggle label="Настроение и энергия" description="Средние оценки и частые состояния" checked={included.wellbeing} onChange={() => toggle('wellbeing')} />
          <ReportToggle label="Сон" description="Длительность и количество записей" checked={included.sleep} onChange={() => toggle('sleep')} />
          <ReportToggle label="Образ жизни" description="Вода, шаги, питание и внешние факторы" checked={included.lifestyle} onChange={() => toggle('lifestyle')} />
          <ReportToggle label="Вес и базальная температура" description="Измерения за выбранный период" checked={included.measurements} onChange={() => toggle('measurements')} />
          <ReportToggle label="Вопросы врачу" description="Текст, который вы добавите ниже" checked={included.questions} onChange={() => toggle('questions')} />
        </div>
        <div className="mt-5 rounded-2xl border border-petal/15 bg-blush p-4"><p className="text-sm font-semibold">Чувствительные данные</p><p className="mt-1 text-xs leading-5 text-rosewood/55">Выключены по умолчанию и попадут в отчёт только после вашего выбора.</p><div className="mt-3 space-y-2"><ReportToggle label="Личные заметки" description={`${notes.length} заметок`} checked={included.notes} onChange={() => toggle('notes')} sensitive /><ReportToggle label="Интимная жизнь" description={`${sexEntries.length} отметок`} checked={included.sex} onChange={() => toggle('sex')} sensitive /></div></div>
      </section>

      <section className="print-hide bento-card p-5">
        <label className="label" htmlFor="doctor-questions">Что хотите обсудить с врачом?</label>
        <textarea id="doctor-questions" className="input min-h-28 resize-none bg-blush" value={questions} onChange={(event) => updateDraft({ questions: event.target.value })} placeholder="Например: почему боль стала появляться чаще?" />
      </section>

      <article id="doctor-report-preview" className="rounded-[28px] bg-white p-5 shadow-soft sm:p-8">
        <header className="border-b border-rosewood/10 pb-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-petal"><MiraMark className="h-6 w-6" />Mira</p>
          <h1 className="mt-2 text-2xl font-semibold">Отчёт о цикле и самочувствии</h1>
          <p className="mt-2 text-sm text-rosewood/60">Период наблюдения: {periodLabel}</p>
          {state.profile.name && <p className="mt-1 text-sm text-rosewood/60">Пользователь: {state.profile.name}</p>}
          <p className="mt-4 rounded-2xl bg-blush p-3 text-xs leading-5 text-rosewood/60">Отчёт составлен по самостоятельным отметкам пользователя и не содержит медицинских выводов.</p>
        </header>

        {included.cycles && <ReportSection title="Циклы и месячные"><ReportFacts facts={[`Завершённых циклов: ${cycleLengths.length}`, `Средняя длина: ${cycleLengths.length ? `${Math.round(average(cycleLengths))} дней` : 'нет данных'}`, `Диапазон: ${cycleLengths.length ? `${Math.min(...cycleLengths)}–${Math.max(...cycleLengths)} дней` : 'нет данных'}`]} />{selectedRanges.length ? <div className="mt-3 space-y-2">{[...selectedRanges].reverse().map((range) => <p key={range.start} className="rounded-xl bg-blush px-3 py-2 text-sm">Начало {formatRuDate(range.start)} · месячные {range.length} {pluralDays(range.length)}</p>)}</div> : <ReportEmpty>Месячные за выбранный период не отмечены.</ReportEmpty>}</ReportSection>}

        {included.pain && <ReportSection title="Боль и обильность"><ReportFacts facts={[`Боль отмечена: ${painValues.filter((value) => value > 0).length} дней`, `Средняя боль по отметкам: ${painValues.length ? `${average(painValues).toFixed(1)} из 3` : 'нет данных'}`, `Обильность отмечена: ${flowValues.length} дней`, `Средняя обильность: ${flowValues.length ? `${average(flowValues).toFixed(1)} из 3` : 'нет данных'}`]} /></ReportSection>}

        {included.symptoms && <ReportSection title="Симптомы"><ReportFacts facts={[`Симптомы мешали обычным делам: ${impactedDays} дней`]} /><ReportTagList label="Симптомы" items={symptomCounts} /><ReportTagList label="Сильная выраженность" items={severeSymptomCounts} /><ReportTagList label="Выделения" items={dischargeCounts} /><ReportTagList label="Пищеварение" items={digestionCounts} /></ReportSection>}

        {included.wellbeing && <ReportSection title="Настроение и энергия"><ReportFacts facts={[`Оценка дня: ${dayRatings.length ? `${average(dayRatings).toFixed(1)} из 5, ${dayRatings.length} отметок` : 'нет данных'}`, `Энергия: ${energyValues.length ? `${average(energyValues).toFixed(1)} из 5, ${energyValues.length} отметок` : 'нет данных'}`]} /><ReportTagList label="Отмеченные состояния" items={moodCounts} /></ReportSection>}

        {included.sleep && <ReportSection title="Сон"><ReportFacts facts={[`Записей сна: ${sleepValues.length}`, `Средняя продолжительность: ${sleepValues.length ? `${average(sleepValues).toFixed(1)} ч` : 'нет данных'}`]} /></ReportSection>}

        {included.lifestyle && <ReportSection title="Образ жизни и контекст"><ReportFacts facts={[`Вода в дни отметок: ${waterValues.length ? `${Math.round(average(waterValues))} мл в среднем` : 'нет данных'}`, `Шаги: ${stepValues.length ? `${Math.round(average(stepValues)).toLocaleString('ru-RU')} в среднем` : 'нет данных'}`]} /><ReportTagList label="Дополнительные факторы" items={contextCounts} /></ReportSection>}

        {included.measurements && <ReportSection title="Измерения"><ReportFacts facts={[`Вес: ${weightEntries.length ? `${weightEntries[weightEntries.length - 1].weightKg} кг, последнее измерение ${formatRuDate(weightEntries[weightEntries.length - 1].date)}` : 'нет данных'}`, `Базальная температура: ${temperatureEntries.length ? `${temperatureEntries[temperatureEntries.length - 1].basalTemperature} °C, последнее измерение ${formatRuDate(temperatureEntries[temperatureEntries.length - 1].date)}` : 'нет данных'}`]} /></ReportSection>}

        {included.questions && <ReportSection title="Вопросы врачу">{questions.trim() ? <p className="whitespace-pre-wrap text-sm leading-6">{questions}</p> : <ReportEmpty>Вопросы пока не добавлены.</ReportEmpty>}</ReportSection>}

        {included.notes && <ReportSection title="Личные заметки"><div className="space-y-3">{notes.length ? notes.map((entry) => <div key={entry.date}><p className="text-xs font-semibold text-rosewood/50">{formatRuDate(entry.date)}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{entry.note}</p></div>) : <ReportEmpty>Личных заметок нет.</ReportEmpty>}</div></ReportSection>}

        {included.sex && <ReportSection title="Интимная жизнь">{sexEntries.length ? <p className="text-sm leading-6">Отмечено {sexEntries.length} раз: {sexEntries.map((entry) => formatRuDate(entry.date)).join(', ')}.</p> : <ReportEmpty>Отметок нет.</ReportEmpty>}</ReportSection>}

        <footer className="mt-6 border-t border-rosewood/10 pt-4 text-xs leading-5 text-rosewood/50">Сформировано {formatRuDate(todayIso())}. Прогнозы приложения и этот отчёт не заменяют консультацию врача.</footer>
      </article>

      <section className="print-hide sticky bottom-4 z-20 rounded-[24px] bg-white/95 p-3 shadow-xl backdrop-blur"><div className="grid gap-2 sm:grid-cols-2"><button disabled={!hasReportContent} className="pill-button primary w-full disabled:cursor-not-allowed disabled:opacity-45" onClick={() => hasReportContent && window.print()}><FileDown className="h-5 w-5" />Открыть печать / сохранить PDF</button><button disabled={!hasReportContent} className="pill-button w-full disabled:cursor-not-allowed disabled:opacity-45" onClick={downloadTextCopy}>Скачать текстовую копию</button></div><p className="mt-2 text-center text-[11px] leading-4 text-rosewood/50">{hasReportContent ? 'Перед сохранением откроется системное окно. Личные заметки и интимная жизнь включаются только вручную.' : 'Добавьте хотя бы одну запись или вопрос врачу, чтобы подготовить отчёт.'}</p></section>
    </div>
  );
}

function ReportToggle({ label, description, checked, onChange, sensitive = false }: { label: string; description: string; checked: boolean; onChange: () => void; sensitive?: boolean }) {
  return <button className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left" role="switch" aria-checked={checked} onClick={onChange}><span className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${checked ? 'justify-end bg-petal' : 'justify-start bg-rosewood/15'}`}><span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}{sensitive ? ' · личное' : ''}</strong><small className="mt-0.5 block text-xs font-normal text-rosewood/50">{description}</small></span></button>;
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="report-section border-b border-rosewood/10 py-5 last:border-0"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-3">{children}</div></section>;
}

function ReportFacts({ facts }: { facts: string[] }) {
  return <ul className="space-y-2">{facts.map((fact) => <li key={fact} className="text-sm leading-6">• {fact}</li>)}</ul>;
}

function ReportTagList({ label, items }: { label: string; items: Array<[string, number]> }) {
  return <div className="mb-4 last:mb-0"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rosewood/50">{label}</p>{items.length ? <div className="flex flex-wrap gap-2">{items.map(([item, count]) => <span key={item} className="rounded-full bg-blush px-3 py-1.5 text-xs font-medium">{item} · {count}</span>)}</div> : <p className="text-sm text-rosewood/55">Нет отметок.</p>}</div>;
}

function ReportEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-blush p-3 text-sm text-rosewood/55">{children}</p>;
}

function CycleDynamicsChart({ cycles, periodLength, cycleStarted }: { cycles: Array<{ length: number; start: string; end: string }>; periodLength: string | null; cycleStarted: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const recent = cycles.slice(-6);
  const lengths = recent.map((cycle) => cycle.length);
  const hasPoint = recent.length >= 1;
  const ready = recent.length >= 2;
  const chartMin = hasPoint ? Math.min(...lengths) : 21;
  const chartMax = hasPoint ? Math.max(...lengths) : 35;
  const padding = Math.max(3, Math.ceil((chartMax - chartMin) * 0.35));
  const scaleMin = chartMin - padding;
  const scaleMax = chartMax + padding;
  const scaleSpan = Math.max(1, scaleMax - scaleMin);
  const xFor = (index: number) => recent.length === 1 ? 50 : 10 + (index / Math.max(recent.length - 1, 1)) * 80;
  const yFor = (value: number) => 82 - ((value - scaleMin) / scaleSpan) * 62;
  const points = recent.map((cycle, index) => ({ x: xFor(index), y: yFor(cycle.length), value: cycle.length }));
  const path = points.length > 1 ? points.reduce((result, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlOffset = (point.x - previous.x) * 0.42;
    return `${result} C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
  }, '') : '';
  const hasPersonalRange = recent.length >= 3;
  const personalMin = hasPersonalRange ? Math.min(...lengths) : null;
  const personalMax = hasPersonalRange ? Math.max(...lengths) : null;
  const rangeTop = personalMax === null ? 0 : yFor(personalMax);
  const rangeBottom = personalMin === null ? 0 : yFor(personalMin);
  const latestOutsidePrevious = recent.length >= 4 && (() => {
    const previous = lengths.slice(0, -1);
    const latest = lengths[lengths.length - 1];
    return latest < Math.min(...previous) || latest > Math.max(...previous);
  })();
  const averageLength = lengths.length ? Math.round(average(lengths)) : null;
  const selectedCycle = selectedIndex === null ? null : recent[selectedIndex];

  return (
    <div className="mt-5 overflow-hidden rounded-[26px] border border-violet-100 bg-gradient-to-br from-white via-[#faf8ff] to-[#f3efff] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Динамика цикла</p><p className="mt-1 text-xs leading-5 text-rosewood/50">Длина от начала одних месячных до начала следующих</p></div><span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-petal shadow-sm">{recent.length} {pluralCycles(recent.length)}</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/80 p-3"><span className="block text-[10px] font-semibold uppercase tracking-wide text-rosewood/40">Среднее</span><strong className="mt-1 block text-sm">{averageLength ? `${averageLength} дней` : '—'}</strong></div>
        <div className="rounded-2xl bg-white/80 p-3"><span className="block text-[10px] font-semibold uppercase tracking-wide text-rosewood/40">Диапазон</span><strong className="mt-1 block text-sm">{recent.length >= 2 ? `${chartMin}–${chartMax}` : '—'}</strong></div>
        <div className="rounded-2xl bg-white/80 p-3"><span className="block text-[10px] font-semibold uppercase tracking-wide text-rosewood/40">Месячные</span><strong className="mt-1 block text-sm">{periodLength ? `${periodLength} дня` : '—'}</strong></div>
      </div>
      <div className="relative mt-5 h-56 overflow-hidden rounded-[22px] bg-white/70 px-2 py-3">
        <div className="pointer-events-none absolute inset-x-4 top-1/4 border-t border-rosewood/8" />
        <div className="pointer-events-none absolute inset-x-4 top-1/2 border-t border-rosewood/8" />
        <div className="pointer-events-none absolute inset-x-4 top-3/4 border-t border-rosewood/8" />
        {hasPoint ? <svg viewBox="0 0 100 100" className="relative h-full w-full overflow-visible" role="img" aria-label={`Динамика последних циклов: ${lengths.join(', ')} дней`}>
          {hasPersonalRange && <g><rect x="6" y={rangeTop} width="88" height={Math.max(5, rangeBottom - rangeTop)} rx="3" fill="#7561D5" opacity="0.09" /><text x="8" y={Math.max(8, rangeTop - 3)} fontSize="4.2" fill="#7561D5">ваш диапазон</text></g>}
          {ready && <path className="cycle-line" d={path} fill="none" stroke="#AEB4C2" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          {points.map((point, index) => {
            const alert = latestOutsidePrevious && index === points.length - 1;
            const selected = selectedIndex === index;
            return <g key={`${point.value}-${index}`} role="button" tabIndex={0} aria-label={`Цикл ${index + 1}: ${point.value} дней, с ${formatRuDate(recent[index].start)} по ${formatRuDate(recent[index].end)}`} onClick={() => setSelectedIndex(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedIndex(index); } }} className="cycle-point cursor-pointer outline-none" style={{ animationDelay: `${120 + index * 70}ms` }}><circle cx={point.x} cy={point.y} r={selected ? 7 : alert ? 5.5 : 4.5} fill={selected ? '#EDE7FF' : alert ? '#FFF4D6' : '#fff'} stroke={selected ? '#7561D5' : alert ? '#F4A100' : '#667085'} strokeWidth={selected ? 3 : alert ? 2.5 : 2} vectorEffect="non-scaling-stroke" /><circle cx={point.x} cy={point.y} r="1.8" fill={alert ? '#F4A100' : '#667085'} /><text x={point.x} y={point.y - 9} textAnchor="middle" fontSize="5" fontWeight="600" fill="#4B4558">{point.value}</text><text x={point.x} y="97" textAnchor="middle" fontSize="4" fill="#90889B">{index + 1}</text></g>;
          })}
        </svg> : <div className="flex h-full flex-col items-center justify-center text-center"><svg viewBox="0 0 100 42" className="h-24 w-full max-w-md" aria-hidden="true"><path d="M8 30 C22 30, 24 13, 38 18 S58 32, 68 19 S82 12, 92 22" fill="none" stroke="#DDD8E7" strokeWidth="2.5" strokeDasharray="4 4" />{[8, 38, 68, 92].map((x, index) => <circle key={x} cx={x} cy={[30, 18, 19, 22][index]} r="3" fill="#fff" stroke="#DDD8E7" strokeWidth="2" />)}</svg><p className="mt-2 max-w-sm text-sm font-semibold">Линия появится после двух завершённых циклов</p><p className="mt-1 max-w-sm text-xs leading-5 text-rosewood/50">{cycleStarted ? 'Отметьте начало следующих месячных — так завершится первый цикл.' : 'Сначала отметьте первый день месячных — так начнётся история цикла.'}</p></div>}
      </div>
      {selectedCycle ? <div className="analytics-panel mt-4 flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm" role="status" aria-live="polite"><div><p className="text-xs font-semibold uppercase tracking-wide text-petal">Цикл {selectedIndex! + 1}</p><p className="mt-1 font-semibold">{formatRuDate(selectedCycle.start)} — {formatRuDate(selectedCycle.end)}</p><p className="mt-1 text-xs text-rosewood/50">Выбранная точка графика</p></div><strong className="shrink-0 text-xl">{selectedCycle.length} дней</strong></div> : hasPoint && !ready ? <div className="mt-4 rounded-2xl bg-white/75 p-3 text-sm leading-6 text-rosewood/65">Первый завершённый цикл: {lengths[0]} дней. После следующего завершённого цикла точки соединятся линией.</div> : ready && <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white/75 p-3"><span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${latestOutsidePrevious ? 'bg-amber-400' : 'bg-emerald-400'}`} /><p className="text-sm leading-6 text-rosewood/65">{latestOutsidePrevious ? 'Последний цикл вышел за диапазон предыдущих записей. Это изменение вашей истории, а не медицинская оценка.' : hasPersonalRange ? `Ваш сохранённый диапазон: ${personalMin}–${personalMax} дней.` : 'Нажмите на точку, чтобы посмотреть даты. После третьего цикла появится личный диапазон.'}</p></div>}
    </div>
  );
}

function CycleDataExplorer({ state }: { state: AppState }) {
  const [view, setView] = useState<'cycles' | 'wellbeing' | 'symptoms'>('cycles');
  const stats = getCycleStats(state);
  const cycleLengths = stats.cycleLengths.slice(-6);
  const days = Array.from({ length: 14 }, (_, index) => addDays(todayIso(), index - 13));
  const wellbeing = days.map((date) => {
    const entry = state.entries[date];
    const values = [entry?.dayRating, entry?.energy].map(Number).filter((value) => Number.isFinite(value) && value > 0);
    return { date, value: values.length ? average(values) : 0 };
  });
  const wellbeingSamples = wellbeing.filter((point) => point.value > 0);
  const symptomCounts = countTags(Object.values(state.entries).flatMap((entry) => entry.symptoms)).slice(0, 5);
  const maxSymptomCount = Math.max(...symptomCounts.map(([, count]) => count), 1);
  const cycleMin = cycleLengths.length ? Math.min(...cycleLengths) : 0;
  const cycleMax = cycleLengths.length ? Math.max(...cycleLengths) : 0;
  const cycleSpan = Math.max(1, cycleMax - cycleMin);
  const cyclePoints = cycleLengths.map((length, index) => `${cycleLengths.length === 1 ? 50 : 8 + (index / (cycleLengths.length - 1)) * 84},${82 - ((length - cycleMin) / cycleSpan) * 56}`).join(' ');
  const wellbeingPoints = wellbeing.map((point, index) => `${8 + (index / 13) * 84},${point.value ? 86 - (point.value / 5) * 64 : 90}`).join(' ');
  const activeLabel = view === 'cycles' ? 'Ритм циклов' : view === 'wellbeing' ? 'Самочувствие по дням' : 'Частые симптомы';

  return <section className="bento-card overflow-hidden p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Визуализация данных</p><h2 className="mt-2 text-2xl font-semibold">Картина вашего ритма</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rosewood/60">Переключайте представления, чтобы увидеть динамику, а не только отдельные числа.</p></div><div className="flex rounded-2xl bg-blush p-1">{([['cycles', 'Циклы'], ['wellbeing', 'Состояние'], ['symptoms', 'Симптомы']] as const).map(([id, label]) => <button key={id} className={`min-h-10 rounded-xl px-3 text-xs font-semibold transition ${view === id ? 'bg-white text-petal shadow-sm' : 'text-rosewood/50'}`} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div></div>
    <div className="mt-6 rounded-[26px] bg-gradient-to-br from-[#f4f0ff] via-white to-[#fff1f5] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-rosewood/45">{activeLabel}</p><p className="mt-1 text-sm font-semibold">{view === 'cycles' ? cycleLengths.length >= 2 ? `${cycleMin}–${cycleMax} дней · ${cycleLengths.length} завершённых циклов` : 'Нужно минимум 2 завершённых цикла' : view === 'wellbeing' ? `${wellbeingSamples.length} отметок за 14 дней` : `${symptomCounts.length} симптомов в истории`}</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-petal shadow-sm">Только ваши данные</span></div>
      {view === 'cycles' && (cycleLengths.length >= 2 ? <div className="mt-5"><svg viewBox="0 0 100 100" role="img" aria-label={`Длина последних циклов: ${cycleLengths.join(', ')} дней`} className="h-44 w-full overflow-visible"><rect x="4" y="18" width="92" height="70" rx="8" fill="#ffffff" opacity="0.72" /><line x1="8" x2="92" y1="32" y2="32" stroke="#ddd6eb" strokeWidth="0.7" /><line x1="8" x2="92" y1="58" y2="58" stroke="#ddd6eb" strokeWidth="0.7" /><line x1="8" x2="92" y1="84" y2="84" stroke="#ddd6eb" strokeWidth="0.7" /><polyline points={cyclePoints} fill="none" stroke="#7561D5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{cycleLengths.map((length, index) => { const x = cycleLengths.length === 1 ? 50 : 8 + (index / (cycleLengths.length - 1)) * 84; const y = 82 - ((length - cycleMin) / cycleSpan) * 56; return <g key={`${length}-${index}`}><circle cx={x} cy={y} r="3.3" fill="#fff" stroke="#7561D5" strokeWidth="2" vectorEffect="non-scaling-stroke" /><text x={x} y={y - 8} textAnchor="middle" fontSize="5" fill="#625B73">{length}</text><text x={x} y="96" textAnchor="middle" fontSize="4" fill="#8b8298">{index + 1}</text></g>; })}</svg><p className="mt-2 text-sm leading-6 text-rosewood/65">Колебание между показанными циклами — {cycleMax - cycleMin} {pluralDays(cycleMax - cycleMin)}. Это личная динамика, а не оценка нормы.</p></div> : <VisualizationEmpty text={state.periodDays.length === 0 ? 'Отметьте первый день месячных, чтобы начать историю цикла.' : 'Отметьте начало следующих месячных, чтобы завершить ещё один цикл и увидеть линию динамики.'} />)}
      {view === 'wellbeing' && (wellbeingSamples.length >= 3 ? <div className="mt-5"><svg viewBox="0 0 100 100" role="img" aria-label={`Самочувствие за 14 дней, ${wellbeingSamples.length} отметок`} className="h-44 w-full"><rect x="4" y="18" width="92" height="72" rx="8" fill="#ffffff" opacity="0.72" /><line x1="8" x2="92" y1="34" y2="34" stroke="#ddd6eb" strokeWidth="0.7" /><line x1="8" x2="92" y1="58" y2="58" stroke="#ddd6eb" strokeWidth="0.7" /><line x1="8" x2="92" y1="82" y2="82" stroke="#ddd6eb" strokeWidth="0.7" /><polyline points={wellbeingPoints} fill="none" stroke="#D96C87" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{wellbeing.map((point, index) => point.value > 0 ? <circle key={point.date} cx={8 + (index / 13) * 84} cy={86 - (point.value / 5) * 64} r="2.7" fill="#fff" stroke="#D96C87" strokeWidth="1.8" vectorEffect="non-scaling-stroke"><title>{formatRuDate(point.date)}: {point.value.toFixed(1)} из 5</title></circle> : null)}</svg><div className="mt-2 flex justify-between text-[10px] font-medium text-rosewood/45"><span>{formatRuDate(days[0])}</span><span>сегодня</span></div><p className="mt-3 text-sm leading-6 text-rosewood/65">Линия объединяет оценку дня и энергию только в дни, когда вы их отметили. Пропуски не считаются плохим самочувствием.</p></div> : <VisualizationEmpty text={`Добавьте ещё ${Math.max(0, 3 - wellbeingSamples.length)} ${pluralDays(Math.max(0, 3 - wellbeingSamples.length))} с оценкой дня или энергии.`} />)}
      {view === 'symptoms' && (symptomCounts.length ? <div className="mt-6 space-y-4">{symptomCounts.map(([label, count]) => <div key={label}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{label}</span><span className="text-rosewood/55">{count} {pluralMarks(count)}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-rose-300 to-petal" style={{ width: `${Math.max(8, (count / maxSymptomCount) * 100)}%` }} /></div></div>)}<p className="rounded-2xl bg-white/75 p-3 text-sm leading-6 text-rosewood/65">Частота показывает число дней с отметкой. Она не означает тяжесть симптома или диагноз.</p></div> : <VisualizationEmpty text="Добавьте симптомы в дневнике — здесь появится сравнительная карта частоты." />)}
    </div>
  </section>;
}

function VisualizationEmpty({ text }: { text: string }) {
  return <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-dashed border-violet-200 bg-white/65 p-6 text-center"><ChartSpline className="h-8 w-8 text-petal/50" /><p className="mt-3 max-w-md text-sm leading-6 text-rosewood/60">{text}</p></div>;
}

function DailyTrends({ state }: { state: AppState }) {
  const [range, setRange] = useState<7 | 30>(7);
  const days = Array.from({ length: range }, (_, index) => addDays(todayIso(), index - range + 1));
  const metrics = [
    { id: 'water' as const, title: 'Вода', unit: 'мл', minSamples: 3, icon: Droplets, color: 'bg-cyan-400', tint: 'from-cyan-50 to-white', value: (entry?: DayEntry) => entry?.waterMl ?? 0 },
    { id: 'steps' as const, title: 'Шаги', unit: '', minSamples: 3, icon: Footprints, color: 'bg-emerald-400', tint: 'from-emerald-50 to-white', value: (entry?: DayEntry) => entry?.steps ?? 0 },
    { id: 'nutrition' as const, title: 'Питание', unit: '', minSamples: 3, icon: Utensils, color: 'bg-lime-500', tint: 'from-lime-50 to-white', value: (entry?: DayEntry) => entry?.appetite === 'high' ? 3 : entry?.appetite === 'normal' ? 2 : entry?.appetite === 'low' ? 1 : 0 },
  ].filter((metric) => state.profile.dailyMetrics.includes(metric.id));

  return <section className="bento-card p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Ежедневная динамика</p><h2 className="mt-2 text-xl font-semibold">Ваш ритм</h2><p className="mt-1 text-sm leading-6 text-rosewood/55">Сравнение появляется после трёх записей одного показателя.</p></div><div className="flex rounded-xl bg-blush p-1">{([7, 30] as const).map((value) => <button key={value} className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${range === value ? 'bg-white text-petal shadow-sm' : 'text-rosewood/50'}`} onClick={() => setRange(value)}>{value} дн.</button>)}</div></div>{metrics.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{metrics.map((metric) => { const values = days.map((day) => metric.value(state.entries[day])); const positive = values.filter((value) => value > 0); const ready = positive.length >= metric.minSamples; const avg = ready ? Math.round(average(positive)) : 0; const current = values[values.length - 1]; const max = Math.max(...values, 1); const appetiteLabel = (value: number) => value === 1 ? 'меньше' : value === 2 ? 'обычно' : value === 3 ? 'больше' : '—'; const displayValue = (value: number) => metric.id === 'nutrition' ? appetiteLabel(value) : value ? `${value.toLocaleString('ru-RU')} ${metric.unit}`.trim() : '—'; const relation = !ready ? `${positive.length} из ${metric.minSamples} записей для сравнения.` : !current ? 'Сегодня значение не отмечено.' : current > avg ? 'Сегодня выше вашего среднего.' : current < avg ? 'Сегодня ниже вашего среднего.' : 'Сегодня на уровне вашего среднего.'; return <article key={metric.id} className={`rounded-[24px] bg-gradient-to-br ${metric.tint} p-4`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><metric.icon className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{metric.title}</p><p className="text-xs text-rosewood/45">{ready ? `среднее ${displayValue(avg)}` : 'среднее появится позже'}</p></div></div><p className="text-right text-lg font-semibold">{displayValue(current)}</p></div><div className="mt-5 flex h-24 items-end gap-1" aria-label={`${metric.title}: график за ${range} дней`}>{values.map((value, index) => <span key={days[index]} className="flex min-w-0 flex-1 items-end self-stretch"><i className={`w-full rounded-t-full ${metric.color} ${value === 0 ? 'opacity-10' : index === values.length - 1 ? 'opacity-100' : 'opacity-35'}`} style={{ height: `${value === 0 ? 5 : Math.max(12, (value / max) * 100)}%` }} title={`${formatRuDate(days[index])}: ${displayValue(value)}`} /></span>)}</div><div className="mt-2 flex justify-between text-[10px] font-medium text-rosewood/40"><span>{formatRuDate(days[0])}</span><span>сегодня</span></div><p className="mt-3 text-xs font-medium text-rosewood/60">{relation}</p></article>; })}</div> : <div className="mt-5 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/60">Добавьте воду, питание или шаги в настройках — здесь появятся графики.</div>}</section>;
}

function CyclePatternChart({ state, ranges }: { state: AppState; ranges: Array<{ start: string; end: string; length: number }> }) {
  const [mode, setMode] = useState<'symptoms' | 'wellbeing'>('symptoms');
  const recentRanges = ranges.slice(-3);
  const dayCount = Math.min(35, Math.max(21, state.profile.cycleLength));
  const points = Array.from({ length: dayCount }, (_, index) => {
    const cycleDay = index + 1;
    const entries = recentRanges.map((range) => state.entries[addDays(range.start, index)]).filter((entry): entry is DayEntry => Boolean(entry));
    if (mode === 'symptoms') {
      const values = entries.map((entry) => entry.symptoms.length ? Math.max(1, ...Object.values(entry.symptomSeverity ?? {})) : 0).filter((value) => value > 0);
      return { cycleDay, value: values.length ? average(values) / 3 : 0, samples: values.length };
    }
    const values = entries.flatMap((entry) => [entry.dayRating, entry.energy]).map(Number).filter(Number.isFinite);
    return { cycleDay, value: values.length ? average(values) / 5 : 0, samples: values.length };
  });
  const hasData = recentRanges.length >= 2 && points.some((point) => point.samples > 0);
  const peak = points.reduce((best, point) => point.value > best.value ? point : best, points[0]);

  return <section className="bento-card p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">По дням цикла</p><h2 className="mt-2 text-xl font-semibold">Повторяемость</h2><p className="mt-1 text-sm leading-6 text-rosewood/55">Сравнение последних {recentRanges.length || 0} {pluralCycles(recentRanges.length || 0)} по одинаковым дням.</p></div><div className="flex rounded-xl bg-blush p-1">{([['symptoms', 'Симптомы'], ['wellbeing', 'Самочувствие']] as const).map(([id, label]) => <button key={id} className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${mode === id ? 'bg-white text-petal shadow-sm' : 'text-rosewood/50'}`} onClick={() => setMode(id)}>{label}</button>)}</div></div>{hasData ? <><div className="mt-5 overflow-x-auto pb-2"><div className="min-w-[42rem]"><div className="grid h-7 overflow-hidden rounded-full text-[9px] font-semibold text-rosewood/55" style={{ gridTemplateColumns: `${state.profile.periodLength}fr ${Math.max(1, 14 - state.profile.periodLength)}fr ${Math.max(1, dayCount - 14)}fr` }}><span className="flex items-center justify-center bg-rose-100">Месячные</span><span className="flex items-center justify-center bg-violet-100">Первая половина</span><span className="flex items-center justify-center bg-indigo-100">Вторая половина</span></div><div className="mt-4 space-y-2">{recentRanges.map((range, rangeIndex) => <div key={range.start} className="grid grid-cols-[5.5rem_1fr] items-center gap-3"><span className="text-xs font-semibold text-rosewood/55">{formatRuDate(range.start)}</span><div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>{Array.from({ length: dayCount }, (_, index) => { const entry = state.entries[addDays(range.start, index)]; const raw = mode === 'symptoms' ? entry?.symptoms.length ? Math.max(1, ...Object.values(entry.symptomSeverity ?? {})) / 3 : 0 : entry ? average([entry.dayRating, entry.energy].map(Number).filter(Number.isFinite)) / 5 : 0; return <span key={`${rangeIndex}-${index}`} className={`h-5 rounded-full ${mode === 'symptoms' ? 'bg-rose-400' : 'bg-violet-500'} ${raw ? 'opacity-100' : 'opacity-10'}`} style={{ transform: `scaleY(${raw ? Math.max(0.35, raw) : 0.2})` }} title={`${index + 1}-й день: ${raw ? 'есть отметка' : 'нет данных'}`} />; })}</div></div>)}</div></div></div><div className="mt-5 overflow-x-auto pb-2"><div className="grid min-w-[42rem] gap-1" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>{points.map((point) => <div key={point.cycleDay} className="flex flex-col items-center gap-2"><div className="flex h-24 w-full items-end rounded-full bg-blush/70 p-0.5"><span className={`w-full rounded-full ${mode === 'symptoms' ? 'bg-gradient-to-t from-rose-400 to-pink-300' : 'bg-gradient-to-t from-violet-500 to-indigo-300'} ${point.samples ? 'opacity-100' : 'opacity-10'}`} style={{ height: `${point.samples ? Math.max(10, point.value * 100) : 5}%` }} title={`День ${point.cycleDay}: ${point.samples} отметок`} /></div><span className="text-[9px] font-medium text-rosewood/40">{[1, 7, 14, 21, 28, 35].includes(point.cycleDay) ? point.cycleDay : ''}</span></div>)}</div></div><div className="mt-3 rounded-2xl bg-blush p-3 text-sm leading-6 text-rosewood/65">{mode === 'symptoms' ? `Больше всего сопоставимых симптомов отмечено около ${peak.cycleDay}-го дня цикла.` : `Наиболее выраженные отметки самочувствия находятся около ${peak.cycleDay}-го дня цикла.`} Фазы показаны ориентировочно по календарным дням; это наблюдение, а не медицинский вывод.</div></> : <div className="mt-5 rounded-2xl bg-blush p-4 text-sm leading-6 text-rosewood/60">Для сравнения нужны отметки минимум в двух циклах. Продолжайте добавлять симптомы или оценку самочувствия — пропуски не считаются отсутствием симптомов.</div>}</section>;
}

function ChartSection({ title, points, color, empty }: { title: string; points: Array<{ date: string; value: number; label: string }>; color: string; empty: string }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = points.length ? Math.min(...points.map((point) => point.value)) : 0;
  const span = max - min;
  const yPosition = (value: number) => span === 0 ? 50 : 88 - ((value - min) / span) * 70;
  const linePoints = points.map((point, index) => `${(index / Math.max(points.length - 1, 1)) * 100},${yPosition(point.value)}`).join(' ');
  return <section className="bento-card p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2>{points.length > 1 && <span className="rounded-full bg-lilac px-3 py-1 text-xs font-medium text-petal">последние записи</span>}</div>{points.length ? <div className="mt-5"><div className="relative h-36 overflow-hidden rounded-2xl bg-gradient-to-b from-lilac/50 to-white px-2"><div className="pointer-events-none absolute inset-x-3 top-1/4 border-t border-rosewood/10" /><div className="pointer-events-none absolute inset-x-3 top-1/2 border-t border-rosewood/10" /><div className="pointer-events-none absolute inset-x-3 top-3/4 border-t border-rosewood/10" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative h-full w-full overflow-visible"><polygon points={`0,100 ${linePoints} 100,100`} className={color.replace('bg-', 'fill-')} opacity="0.09" /><polyline points={linePoints} fill="none" stroke="currentColor" strokeWidth="2.4" vectorEffect="non-scaling-stroke" className={color.replace('bg-', 'text-')} />{points.map((point, index) => <circle key={point.date} cx={(index / Math.max(points.length - 1, 1)) * 100} cy={yPosition(point.value)} r="2.2" className={`${color.replace('bg-', 'fill-')} stroke-white`} strokeWidth="1.2" vectorEffect="non-scaling-stroke"><title>{point.label}</title></circle>)}</svg></div><div className="mt-3 flex justify-between text-[10px] text-rosewood/55">{points.map((point) => <span key={point.date}>{parseIsoDate(point.date).getDate()}</span>)}</div></div> : <div className="mt-4 rounded-2xl bg-gradient-to-br from-lilac/50 to-white p-4 text-sm leading-6 text-rosewood/65">{empty}</div>}</section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/90 bg-gradient-to-br from-white to-[#f3efff] p-3 shadow-sm">
      <p className="text-xs text-rosewood/60">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  return <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#7561D5 ${value * 3.6}deg, #EDE7FF 0deg)` }} aria-label={`Заполнено ${value}% периода`}><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[11px] font-bold text-petal shadow-sm">{value}%</div></div>;
}

function ProfileView({
  state,
  onChange,
  onBack,
  onOpenSavedArticles,
  onRestartOnboarding,
  onReset,
}: {
  state: AppState;
  onChange: (state: AppState) => void;
  onBack: () => void;
  onOpenSavedArticles: () => void;
  onRestartOnboarding: () => void;
  onReset: () => void;
}) {
  type ProfileSection = 'overview' | 'cycle' | 'tracking' | 'today' | 'reminders' | 'data' | 'about';
  type ExportCategory = 'cycle' | 'wellbeing' | 'lifestyle' | 'notes' | 'intimate';
  const [profileSection, setProfileSection] = useState<ProfileSection>('overview');
  const [reorderingModules, setReorderingModules] = useState(false);
  const [settingsReset, setSettingsReset] = useState<'cycle' | 'tracking' | 'today' | 'reminders' | null>(null);
  const [importMessage, setImportMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ fileName: string; nextState: AppState; entries: number; periodDays: number; firstDate?: string; lastDate?: string; createdAt?: string; included?: Record<ExportCategory, boolean> } | null>(null);
  const [exportOptions, setExportOptions] = useState<Record<ExportCategory, boolean>>({
    cycle: true,
    wellbeing: true,
    lifestyle: true,
    notes: false,
    intimate: false,
  });
  const exportData = () => {
    const blob = new Blob([JSON.stringify(createBackupPayload(state, exportOptions), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mira-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onChange({ ...state, lastBackupAt: todayIso() });
    setExportMessage('Резервная копия скачана');
    window.setTimeout(() => setExportMessage(''), 2400);
  };
  const updateProfile = (key: keyof AppState['profile'], value: AppState['profile'][keyof AppState['profile']]) => {
    onChange({ ...state, profile: { ...state.profile, [key]: value } });
  };
  const toggleTrackingModule = (module: TrackingModule) => {
    const exists = state.profile.trackingModules.includes(module);
    const next = exists ? state.profile.trackingModules.filter((item) => item !== module) : [...state.profile.trackingModules, module];
    if (!next.length) return;
    onChange({ ...state, profile: { ...state.profile, trackingModules: next } });
  };
  const toggleDailyMetric = (metric: DailyMetric) => {
    const selected = state.profile.dailyMetrics.includes(metric);
    const dailyMetrics = selected
      ? state.profile.dailyMetrics.filter((item) => item !== metric)
      : [...state.profile.dailyMetrics, metric];
    onChange({ ...state, profile: { ...state.profile, dailyMetrics } });
  };
  const moveTrackingModule = (module: TrackingModule, direction: -1 | 1) => {
    const visibleModules: TrackingModule[] = state.profile.trackingModules.filter((item) => item !== 'body');
    const visibleIndex = visibleModules.indexOf(module);
    const targetModule = visibleModules[visibleIndex + direction];
    if (!targetModule) return;
    const next = [...state.profile.trackingModules];
    const sourceIndex = next.indexOf(module);
    const targetIndex = next.indexOf(targetModule);
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    onChange({ ...state, profile: { ...state.profile, trackingModules: next } });
  };
  const trackingMeta: Record<TrackingModule, { label: string; description: string }> = {
    cycle: { label: 'Цикл и симптомы', description: 'Месячные, боль, обильность и симптомы' },
    wellbeing: { label: 'Самочувствие', description: 'Настроение, общая оценка и энергия' },
    sleep: { label: 'Сон', description: 'Длительность и качество сна' },
    body: { label: 'Режим и тело', description: 'Вода, шаги, питание, вес и температура' },
    personal: { label: 'Личное', description: 'Интимная жизнь и заметки' },
  };
  const updateProfileNumber = (key: 'cycleLength' | 'periodLength' | 'waterGoalMl', rawValue: string, min: number, max: number) => {
    if (rawValue === '') return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    updateProfile(key, Math.min(max, Math.max(min, value)));
  };
  const requestReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    if (window.confirm('Удалить все записи и настройки Mira без возможности восстановления?')) onReset();
  };

  const resetProfileSection = (section: 'cycle' | 'tracking' | 'today' | 'reminders') => {
    const profile = section === 'cycle'
      ? { ...state.profile, cycleLength: defaultProfile.cycleLength, periodLength: defaultProfile.periodLength }
      : section === 'tracking'
        ? { ...state.profile, trackingModules: defaultProfile.trackingModules, dailyMetrics: defaultProfile.dailyMetrics, waterGoalMl: defaultProfile.waterGoalMl }
        : section === 'today'
          ? { ...state.profile, showHormonoscope: defaultProfile.showHormonoscope, showCycloscope: defaultProfile.showCycloscope }
          : { ...state.profile, reminderEnabled: defaultProfile.reminderEnabled, reminderTime: defaultProfile.reminderTime };
    onChange({ ...state, profile });
    setSettingsReset(null);
    if (section === 'tracking') setReorderingModules(false);
  };

  const importData = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text()) as Record<string, unknown>;
      const nextState = parseImportedState(raw, state);
      const dates = [...new Set([...Object.keys(nextState.entries), ...nextState.periodDays])].sort();
      const meta = raw.exportMeta && typeof raw.exportMeta === 'object' ? raw.exportMeta as { createdAt?: unknown; included?: unknown } : undefined;
      const included = meta?.included && typeof meta.included === 'object'
        ? (Object.fromEntries((['cycle', 'wellbeing', 'lifestyle', 'notes', 'intimate'] as ExportCategory[]).map((key) => [key, (meta.included as Record<string, unknown>)[key] === true])) as Record<ExportCategory, boolean>)
        : undefined;
      setPendingImport({
        fileName: file.name,
        nextState,
        entries: Object.keys(nextState.entries).length,
        periodDays: nextState.periodDays.length,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
        createdAt: typeof meta?.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(meta.createdAt) ? meta.createdAt : undefined,
        included,
      });
      setImportMessage('');
    } catch {
      setPendingImport(null);
      setImportMessage('Не удалось импортировать этот файл');
      window.setTimeout(() => setImportMessage(''), 2400);
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    onChange(pendingImport.nextState);
    setPendingImport(null);
    setImportMessage('Данные импортированы');
    window.setTimeout(() => setImportMessage(''), 2400);
  };

  const backupDates = [...new Set([...Object.keys(state.entries), ...state.periodDays])].sort();
  const selectedExportCategories = (Object.keys(exportOptions) as ExportCategory[]).filter((key) => exportOptions[key]);

  const sectionMeta: Record<ProfileSection, { eyebrow: string; title: string; description: string }> = {
    overview: { eyebrow: 'Настройки Mira', title: 'Профиль', description: 'Цикл, дневник и управление данными — без длинного списка.' },
    cycle: { eyebrow: 'Профиль', title: 'Цикл и прогноз', description: 'Базовые параметры, которые используются до накопления личной истории.' },
    tracking: { eyebrow: 'Профиль', title: 'Дневник', description: 'Выберите разделы и показатели, которые хотите заполнять.' },
    today: { eyebrow: 'Профиль', title: 'Главная страница', description: 'Управляйте дополнительными карточками на экране «Сегодня».' },
    reminders: { eyebrow: 'Профиль', title: 'Напоминания', description: 'Нейтральная подсказка внутри приложения — без передачи данных.' },
    data: { eyebrow: 'Профиль', title: 'Данные и приватность', description: 'Резервная копия, перенос и полное удаление локальной истории.' },
    about: { eyebrow: 'Профиль', title: 'О Mira', description: 'Назначение продукта, ограничения и доступ к проверяемым источникам.' },
  };
  const activeMeta = sectionMeta[profileSection];

  return (
    <div className="space-y-5">
      <section className="surface-hero rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-4"><div><button className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-petal" onClick={profileSection === 'overview' ? onBack : () => { setProfileSection('overview'); setResetArmed(false); setPendingImport(null); setSettingsReset(null); setReorderingModules(false); }}><ChevronLeft className="h-5 w-5" />{profileSection === 'overview' ? 'Назад' : 'К профилю'}</button><p className="text-sm font-semibold text-rosewood/60">{activeMeta.eyebrow}</p><h1 className="mt-1 text-3xl font-semibold">{activeMeta.title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-rosewood/65">{activeMeta.description}</p></div><span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-petal">Локально</span></div>
      </section>

      {profileSection === 'overview' && <>
        <section className="bento-card overflow-hidden p-5">
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">Данные остаются на этом устройстве</h2><p className="mt-1 text-sm leading-6 text-rosewood/60">Mira не отправляет записи на сервер. Создайте резервную копию перед очисткой браузера или сменой устройства.</p><button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-sm font-semibold text-emerald-700" onClick={() => setProfileSection('data')}><LockKeyhole className="h-4 w-4" />Управлять данными</button></div></div>
        </section>
        <section className="bento-card divide-y divide-rosewood/10 p-2">
          <ProfileMenuItem icon={<Droplet className="h-5 w-5" />} tone="bg-violet-50 text-violet-600" label="Цикл и прогноз" summary={`${state.profile.cycleLength} дней · месячные ${state.profile.periodLength} дней`} onClick={() => setProfileSection('cycle')} />
          <ProfileMenuItem icon={<NotebookPen className="h-5 w-5" />} tone="bg-rose-50 text-rose-500" label="Дневник" summary={`${state.profile.trackingModules.length} ${pluralProfileItem(state.profile.trackingModules.length, 'раздел', 'раздела', 'разделов')} · ${state.profile.dailyMetrics.length} ${pluralProfileItem(state.profile.dailyMetrics.length, 'показатель', 'показателя', 'показателей')}`} onClick={() => setProfileSection('tracking')} />
          <ProfileMenuItem icon={<PanelsTopLeft className="h-5 w-5" />} tone="bg-amber-50 text-amber-600" label="Главная страница" summary={`${Number(state.profile.showHormonoscope) + Number(state.profile.showCycloscope)} из 2 дополнительных карточек`} onClick={() => setProfileSection('today')} />
          <ProfileMenuItem icon={<BellRing className="h-5 w-5" />} tone="bg-indigo-50 text-indigo-500" label="Напоминания" summary={state.profile.reminderEnabled ? `Включено после ${state.profile.reminderTime}` : 'Выключены'} onClick={() => setProfileSection('reminders')} />
          <ProfileMenuItem icon={<Database className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-600" label="Данные и приватность" summary={state.lastBackupAt ? `Копия от ${formatRuDate(state.lastBackupAt)}` : 'Резервной копии ещё нет'} onClick={() => setProfileSection('data')} />
          <ProfileMenuItem icon={<Info className="h-5 w-5" />} tone="bg-cyan-50 text-cyan-600" label="О Mira" summary="Назначение, ограничения и версия 0.1.0" onClick={() => setProfileSection('about')} />
        </section>
      </>}

      {profileSection === 'cycle' && <><section className="bento-card p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blush">
          <Settings2 className="h-5 w-5 text-petal" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Личное и настройки прогноза</h2>
          <p className="text-sm text-rosewood/70">После накопления истории приложение будет опираться на реальные циклы.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя">
          <input
            className="input"
            value={state.profile.name}
            onChange={(event) => updateProfile('name', event.target.value)}
            placeholder="Например, Анна"
          />
        </Field>
        <Field label="Средняя длина цикла">
          <input
            type="number"
            min={18}
            max={60}
            className="input"
            value={state.profile.cycleLength}
            onChange={(event) => updateProfileNumber('cycleLength', event.target.value, 18, 60)}
          />
        </Field>
        <Field label="Длительность месячных">
          <input
            type="number"
            min={1}
            max={14}
            className="input"
            value={state.profile.periodLength}
            onChange={(event) => updateProfileNumber('periodLength', event.target.value, 1, 14)}
          />
        </Field>
      </div>
      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><Check className="h-4 w-4" />Настройки сохраняются автоматически</p>
      </section><ProfileSectionReset section="cycle" armed={settingsReset === 'cycle'} onArm={() => setSettingsReset('cycle')} onCancel={() => setSettingsReset(null)} onConfirm={() => resetProfileSection('cycle')} /></>}

      {profileSection === 'today' && <><section className="bento-card p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Главная страница</p><h2 className="mt-2 text-xl font-semibold">Карточки на «Сегодня»</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">Оставьте только те подсказки, которые хотите видеть каждый день.</p></div><span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-petal">{Number(state.profile.showHormonoscope) + Number(state.profile.showCycloscope)} из 2</span></div>
        <div className="mt-5 space-y-2">
          <ProfileToggle
            checked={state.profile.showHormonoscope}
            label="Гормоноскоп"
            description="Календарный ориентир по фазе цикла и гормонам"
            icon={<Sparkles className="h-5 w-5" />}
            tone="bg-rose-50 text-rose-500"
            onChange={() => updateProfile('showHormonoscope', !state.profile.showHormonoscope)}
          />
          <ProfileToggle
            checked={state.profile.showCycloscope}
            label="Cycloscope"
            description="Лёгкий ежедневный гороскоп для настроения"
            icon={<MoonStar className="h-5 w-5" />}
            tone="bg-violet-50 text-violet-600"
            onChange={() => updateProfile('showCycloscope', !state.profile.showCycloscope)}
          />
        </div>
      </section><ProfileSectionReset section="главной страницы" armed={settingsReset === 'today'} onArm={() => setSettingsReset('today')} onCancel={() => setSettingsReset(null)} onConfirm={() => resetProfileSection('today')} /></>}

      {profileSection === 'tracking' && <>
      <section className="bento-card p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Что отслеживать</h2><p className="mt-2 text-sm leading-6 text-rosewood/65">Выбранные разделы появятся в дневнике. Сон, энергия, вода и шаги также могут отображаться на «Сегодня».</p></div><button className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${reorderingModules ? 'bg-petal text-white' : 'bg-blush text-petal'}`} onClick={() => setReorderingModules((current) => !current)}>{reorderingModules ? 'Готово' : 'Порядок'}</button></div>
        <div className="mt-4 space-y-2">
          {state.profile.trackingModules.filter((module) => module !== 'body').map((module, index) => {
            const meta = trackingMeta[module];
            const visibleCount = state.profile.trackingModules.filter((item) => item !== 'body').length;
            return <div key={module} className="rounded-2xl bg-blush p-2"><button className="flex w-full min-w-0 items-center gap-3 p-1 text-left" role="switch" aria-checked="true" onClick={() => toggleTrackingModule(module)}><span className="flex h-6 w-10 shrink-0 items-center justify-end rounded-full bg-petal p-0.5"><span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span><span className="min-w-0"><strong className="block text-sm">{meta.label}</strong><small className="mt-0.5 block truncate text-xs font-normal text-rosewood/50">{meta.description}</small></span></button>{reorderingModules && <div className="mt-2 grid grid-cols-2 gap-2 border-t border-rosewood/10 pt-2"><button className="min-h-9 rounded-xl bg-white text-xs font-semibold text-rosewood/60 disabled:opacity-30" disabled={index === 0} onClick={() => moveTrackingModule(module, -1)}>Выше</button><button className="min-h-9 rounded-xl bg-white text-xs font-semibold text-rosewood/60 disabled:opacity-30" disabled={index === visibleCount - 1} onClick={() => moveTrackingModule(module, 1)}>Ниже</button></div>}</div>;
          })}
          {(['cycle', 'wellbeing', 'sleep', 'personal'] as TrackingModule[]).filter((module) => !state.profile.trackingModules.includes(module)).map((module) => <button key={module} className="flex w-full items-center gap-3 rounded-2xl bg-blush p-3 text-left opacity-70" role="switch" aria-checked="false" onClick={() => toggleTrackingModule(module)}><span className="flex h-6 w-10 shrink-0 items-center justify-start rounded-full bg-rosewood/15 p-0.5"><span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span><span><strong className="block text-sm">{trackingMeta[module].label}</strong><small className="mt-0.5 block text-xs font-normal text-rosewood/50">{trackingMeta[module].description}</small></span></button>)}
        </div>
      </section>
      <section className="bento-card p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Персонализация</p><h2 className="mt-2 text-xl font-semibold">Ежедневные показатели</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">Выберите только то, что хотите видеть в Дневнике. Показатели можно включать и выключать в любой момент.</p></div><span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-petal">{state.profile.dailyMetrics.length} из 3</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {([
            ['water', 'Вода', 'мл', Droplets, 'from-cyan-100 to-white'],
            ['nutrition', 'Питание', 'аппетит', Utensils, 'from-emerald-100 to-white'],
            ['steps', 'Шаги', 'за день', Footprints, 'from-emerald-100 to-white'],
          ] as const).map(([id, label, hint, Icon, gradient]) => {
            const active = state.profile.dailyMetrics.includes(id);
            return <button key={id} type="button" role="switch" aria-checked={active} onClick={() => toggleDailyMetric(id)} className={`relative min-h-32 overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 ${active ? `border-white bg-gradient-to-br ${gradient} shadow-soft` : 'border-rosewood/10 bg-white/55 text-rosewood/55'}`}><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-white text-petal shadow-sm' : 'bg-blush text-rosewood/35'}`}><Icon className="h-5 w-5" /></span><strong className="mt-4 block text-sm">{label}</strong><small className="mt-1 block text-xs">{hint}</small><span className={`absolute right-3 top-3 flex h-6 w-10 items-center rounded-full p-0.5 ${active ? 'justify-end bg-petal' : 'justify-start bg-rosewood/15'}`}><span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span></button>;
          })}
        </div>
        {state.profile.dailyMetrics.includes('water') && <div className="mt-4 rounded-2xl bg-blush p-4"><Field label="Цель воды, мл"><input type="number" min={500} max={10000} step={100} className="input bg-white" value={state.profile.waterGoalMl} onChange={(event) => updateProfileNumber('waterGoalMl', event.target.value, 500, 10000)} /></Field></div>}
      </section><ProfileSectionReset section="дневника" armed={settingsReset === 'tracking'} onArm={() => setSettingsReset('tracking')} onCancel={() => setSettingsReset(null)} onConfirm={() => resetProfileSection('tracking')} /></>}

      {profileSection === 'reminders' && <><section className="bento-card p-5">
        <h2 className="text-xl font-semibold">Напоминание о дневнике</h2>
        <p className="mt-2 text-sm leading-6 text-rosewood/65">Показывается только внутри приложения после выбранного времени. Текст нейтральный и не раскрывает медицинские данные.</p>
        <button className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-blush p-3 text-left" role="switch" aria-checked={state.profile.reminderEnabled} onClick={() => updateProfile('reminderEnabled', !state.profile.reminderEnabled)}><span className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${state.profile.reminderEnabled ? 'justify-end bg-petal' : 'justify-start bg-rosewood/15'}`}><span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span><span><strong className="block text-sm">{state.profile.reminderEnabled ? 'Напоминание включено' : 'Напоминание выключено'}</strong><small className="mt-0.5 block text-xs font-normal text-rosewood/50">Без push-уведомлений и передачи данных</small></span></button>
        {state.profile.reminderEnabled && <Field label="Показывать после"><input type="time" className="input mt-3" value={state.profile.reminderTime} onChange={(event) => updateProfile('reminderTime', event.target.value)} /></Field>}
      </section><ProfileSectionReset section="напоминаний" armed={settingsReset === 'reminders'} onArm={() => setSettingsReset('reminders')} onCancel={() => setSettingsReset(null)} onConfirm={() => resetProfileSection('reminders')} /></>}

      {profileSection === 'data' && <>
        <section className="bento-card p-5">
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold">Только на этом устройстве</h2><p className="mt-1 text-sm leading-6 text-rosewood/60">Записи хранятся в браузере и не отправляются на сервер. При очистке браузера они могут исчезнуть.</p><p className="mt-2 text-xs font-semibold text-rosewood/50">{state.lastBackupAt ? `Последняя копия: ${formatRuDate(state.lastBackupAt)}` : 'Резервная копия ещё не создавалась'}</p></div></div>
        </section>
        <section className="bento-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Резервная копия</p><h2 className="mt-2 text-xl font-semibold">Что включить</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">Настройки профиля включаются всегда. Заметки и интимные данные выключены по умолчанию.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-blush p-3 text-center"><div><strong className="block text-lg tabular-nums">{Object.keys(state.entries).length}</strong><span className="text-[10px] text-rosewood/50">дней</span></div><div className="border-x border-rosewood/10"><strong className="block text-lg tabular-nums">{selectedExportCategories.length}</strong><span className="text-[10px] text-rosewood/50">категории</span></div><div><strong className="block truncate text-xs">{backupDates.length ? `${formatRuDate(backupDates[0])} — ${formatRuDate(backupDates[backupDates.length - 1])}` : 'Нет данных'}</strong><span className="text-[10px] text-rosewood/50">период</span></div></div>
          <div className="mt-5 space-y-2">
            {([
              ['cycle', 'Цикл и месячные', 'Даты и обильность', Droplet, 'bg-rose-50 text-rose-500'],
              ['wellbeing', 'Самочувствие', 'Оценка дня, настроение и симптомы', Smile, 'bg-violet-50 text-violet-600'],
              ['lifestyle', 'Сон и показатели', 'Сон, вода, шаги и измерения', MoonStar, 'bg-indigo-50 text-indigo-500'],
              ['notes', 'Личные заметки', 'Текст заметок и контекст дня', NotebookText, 'bg-amber-50 text-amber-600'],
              ['intimate', 'Интимная жизнь', 'Интимные отметки и выделения', LockKeyhole, 'bg-rose-50 text-rose-500'],
            ] as const).map(([id, label, description, Icon, tone]) => <ProfileToggle key={id} checked={exportOptions[id]} label={label} description={description} icon={<Icon className="h-5 w-5" />} tone={tone} onChange={() => setExportOptions((current) => ({ ...current, [id]: !current[id] }))} />)}
          </div>
          <button className="pill-button primary mt-5 w-full" onClick={exportData}><FileDown className="h-4 w-4" />Скачать выбранную копию</button>
          <p className="mt-3 text-xs leading-5 text-rosewood/50">Копия без выбранной категории не восстановит данные этой категории при импорте.</p>
          {exportMessage && <p className="mt-2 text-center text-sm font-medium text-emerald-700" role="status">{exportMessage}</p>}
        </section>
        <section className="bento-card p-5">
          <h2 className="text-xl font-semibold">Перенести данные</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">Сначала выберите JSON-файл. Перед заменой текущих данных вы увидите его состав.</p>
          <label className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blush px-4 py-3 font-semibold text-rosewood"><FileUp className="h-4 w-4" />Выбрать файл<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); event.currentTarget.value = ''; }} /></label>
          {pendingImport && <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4" role="status"><p className="text-xs font-semibold uppercase tracking-wide text-petal">Готово к импорту</p><h3 className="mt-1 truncate font-semibold">{pendingImport.fileName}</h3><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/75 p-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-rosewood/40">Состав</span><strong className="mt-1 block text-sm">{pendingImport.entries} дней · {pendingImport.periodDays} дней месячных</strong></div><div className="rounded-xl bg-white/75 p-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-rosewood/40">Период</span><strong className="mt-1 block text-sm">{pendingImport.firstDate && pendingImport.lastDate ? `${formatRuDate(pendingImport.firstDate)} — ${formatRuDate(pendingImport.lastDate)}` : 'Нет дат'}</strong></div></div>{pendingImport.createdAt && <p className="mt-3 text-xs text-rosewood/55">Копия создана {formatRuDate(pendingImport.createdAt)}.</p>}{pendingImport.included ? <div className="mt-3 flex flex-wrap gap-1.5">{(Object.keys(pendingImport.included) as ExportCategory[]).map((key) => <span key={key} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${pendingImport.included?.[key] ? 'bg-emerald-50 text-emerald-700' : 'bg-white/70 text-rosewood/40 line-through'}`}>{backupCategoryLabel(key)}</span>)}</div> : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Старая копия: состав категорий не указан. Проверьте файл перед заменой истории.</p>}<p className="mt-3 text-sm leading-6 text-rosewood/60">Текущая история будет полностью заменена.</p><div className="mt-4 flex gap-2"><button className="pill-button flex-1" onClick={() => setPendingImport(null)}>Отмена</button><button className="pill-button primary flex-1" onClick={confirmImport}>Заменить данные</button></div></div>}
          {importMessage && <p className="mt-2 text-center text-sm font-medium text-rosewood/70" role="status">{importMessage}</p>}
        </section>
        <section className="rounded-[28px] border border-rose-200 bg-rose-50/65 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-500">Опасная зона</p><h2 className="mt-2 text-xl font-semibold">Удаление данных</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">Будут удалены записи, настройки и сохранённые материалы только из этого браузера.</p>
          {!resetArmed ? <button className="mt-4 min-h-11 w-full rounded-2xl border border-rose-300 bg-white px-4 py-3 font-semibold text-rose-600" onClick={requestReset}>Удалить все локальные данные</button> : <div className="mt-4 rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-rose-700">Это действие нельзя отменить без резервной копии.</p><div className="mt-3 flex gap-2"><button className="pill-button flex-1" onClick={() => setResetArmed(false)}>Отмена</button><button className="min-h-11 flex-1 rounded-2xl bg-rose-600 px-3 text-sm font-semibold text-white" onClick={requestReset}>Удалить навсегда</button></div></div>}
          <button className="mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-rosewood/60" onClick={onRestartOnboarding}>Показать онбординг снова</button>
        </section>
      </>}

      {profileSection === 'about' && <>
        <section className="bento-card p-5"><div className="flex items-start gap-3"><MiraMark className="h-12 w-12 shadow-soft" /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Mira</p><h2 className="mt-1 text-xl font-semibold">Спокойное наблюдение за циклом</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">Приложение помогает записывать факты, видеть личную динамику и готовиться к разговору со специалистом.</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-3"><AboutFact icon={<LockKeyhole className="h-4 w-4" />} title="Локально" text="Данные остаются в браузере" /><AboutFact icon={<ChartSpline className="h-4 w-4" />} title="Наблюдения" text="Пропуски не считаются нормой или нулём" /><AboutFact icon={<ShieldCheck className="h-4 w-4" />} title="Без диагнозов" text="Прогнозы и связи показаны осторожно" /></div></section>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50/75 p-5"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold text-amber-950">Важное ограничение</h2><p className="mt-2 text-sm leading-6 text-amber-900/75">Mira не является медицинским устройством, не ставит диагноз и не заменяет консультацию врача. Прогнозы цикла ориентировочные и не подходят для выбора метода контрацепции.</p></div></div></section>
        <section className="bento-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-petal">Библиотека</p><h2 className="mt-2 text-xl font-semibold">Сохранённые материалы</h2><p className="mt-2 text-sm leading-6 text-rosewood/60">В статьях указаны открытые медицинские источники. Материалы пока не прошли врачебную рецензию.</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-petal">{state.savedArticles.length}</span></div><button className="pill-button primary mt-5 w-full" onClick={onOpenSavedArticles}><LibraryBig className="h-4 w-4" />Открыть сохранённые</button></section>
        <p className="text-center text-xs text-rosewood/40">Mira · версия 0.1.0 · локальная бета</p>
      </>}
    </div>
  );
}

function ProfileSectionReset({ section, armed, onArm, onCancel, onConfirm }: { section: string; armed: boolean; onArm: () => void; onCancel: () => void; onConfirm: () => void }) {
  return <section className="rounded-[22px] border border-white/80 bg-white/55 p-4">{armed ? <div><p className="text-sm font-semibold">Вернуть стандартные настройки {section}?</p><p className="mt-1 text-xs leading-5 text-rosewood/55">Записи и история не удалятся.</p><div className="mt-3 flex gap-2"><button className="pill-button flex-1" onClick={onCancel}>Отмена</button><button className="pill-button primary flex-1" onClick={onConfirm}>Сбросить</button></div></div> : <button className="min-h-11 w-full rounded-xl px-3 text-sm font-semibold text-rosewood/55 transition hover:bg-blush" onClick={onArm}>Восстановить стандартные настройки</button>}</section>;
}

function AboutFact({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl bg-blush p-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-petal">{icon}</span><strong className="mt-3 block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-rosewood/50">{text}</span></div>;
}

function backupCategoryLabel(category: 'cycle' | 'wellbeing' | 'lifestyle' | 'notes' | 'intimate') {
  return { cycle: 'Цикл', wellbeing: 'Самочувствие', lifestyle: 'Сон и показатели', notes: 'Заметки', intimate: 'Интимное' }[category];
}

function ProfileMenuItem({ icon, tone, label, summary, onClick }: { icon: ReactNode; tone: string; label: string; summary: string; onClick: () => void }) {
  return <button className="flex min-h-[4.75rem] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-blush/70" onClick={onClick}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>{icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="mt-1 block truncate text-xs font-normal text-rosewood/50">{summary}</small></span><ChevronRight className="h-5 w-5 shrink-0 text-rosewood/30" /></button>;
}

function pluralProfileItem(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function ProfileToggle({ checked, label, description, icon, tone, onChange }: { checked: boolean; label: string; description: string; icon: ReactNode; tone: string; onChange: () => void }) {
  return <button type="button" className={`flex w-full items-center gap-3 rounded-[22px] border p-3 text-left transition ${checked ? 'border-white bg-blush shadow-sm' : 'border-rosewood/10 bg-white/45 opacity-70'}`} role="switch" aria-checked={checked} onClick={onChange}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${checked ? tone : 'bg-rosewood/5 text-rosewood/35'}`}>{icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="mt-1 block text-xs font-normal leading-5 text-rosewood/50">{description}</small></span><span className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${checked ? 'justify-end bg-petal' : 'justify-start bg-rosewood/15'}`}><span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span></button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function MiraMark({ className = 'h-7 w-7', label }: { className?: string; label?: string }) {
  return <span className={`mira-brand-mark ${className}`} role={label ? 'img' : undefined} aria-label={label} />;
}

function DayRatingFace({ rating }: { rating: number }) {
  const mouth = rating === 1
    ? 'M10 21c1.8-4.3 10.2-4.3 12 0'
    : rating === 2
      ? 'M11 20c1.6-2.8 8.4-2.8 10 0'
      : rating === 3
        ? 'M11 19h10'
        : rating === 4
          ? 'M11 17.5c1.7 3.2 8.3 3.2 10 0'
          : 'M10 16.5c2 5.1 10 5.1 12 0';

  return (
    <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="1.25" fill="currentColor" />
      <circle cx="20" cy="13" r="1.25" fill="currentColor" />
      <path d={mouth} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 rounded-[28px] border border-white/80 bg-[#f7f4fc]/85 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_18px_55px_rgba(61,49,104,0.18)] backdrop-blur-2xl sm:inset-x-auto sm:left-1/2 sm:w-[min(31rem,calc(100%-2rem))] sm:-translate-x-1/2">
      <div className="mx-auto grid gap-1.5" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-button ${active ? 'active' : ''}`}
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`nav-icon ${active ? '' : tab.tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.7} /></span>
              <span className="max-w-full whitespace-nowrap leading-none">{tab.label}</span>
              {active && <span className="nav-active-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default App;
