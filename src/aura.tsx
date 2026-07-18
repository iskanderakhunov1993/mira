import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BatteryLow,
  BatteryWarning,
  Bed,
  BedDouble,
  Bell,
  BicepsFlexed,
  Bird,
  Bone,
  Brain,
  BrainCircuit,
  Bug,
  BookOpenText,
  Bookmark,
  CalendarRange,
  Cat,
  ChartSpline,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  CircleAlert,
  CircleDashed,
  FileDown,
  Droplet,
  DropletOff,
  Dog,
  FileHeart,
  Fish,
  Flame,
  FlameKindling,
  Focus,
  Footprints,
  Frown,
  CircleGauge,
  CloudMoon,
  Dumbbell,
  GlassWater,
  Hand,
  Heart,
  HeartCrack,
  HeartPulse,
  House,
  Info,
  Infinity as InfinityIcon,
  ListChecks,
  LockKeyhole,
  Lightbulb,
  Minus,
  Meh,
  Moon,
  MessageSquareText,
  NotebookTabs,
  Orbit,
  Plus,
  Play,
  Rabbit,
  Rat,
  RefreshCw,
  Search,
  Sandwich,
  Save,
  ScanFace,
  Send,
  ShoppingBag,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Snail,
  Sparkle,
  Squirrel,
  Stethoscope,
  PersonStanding,
  Pill,
  Sun,
  ThermometerSun,
  Turtle,
  Upload,
  UserRound,
  Utensils,
  UtensilsCrossed,
  Thermometer,
  TestTubeDiagonal,
  Timer,
  Waves,
  Weight,
  Wind,
  Trash2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import './aura.css';
import { StartupGate } from './StartupSplash';
import { clearAuraDatabaseState, loadAuraDatabaseState, persistAuraDatabaseState } from './auraDb';
import { deliverFeedback, type FeedbackCategory, type FeedbackPayload } from './feedback';
import { knowledgeArticles as medicalKnowledgeArticles, type KnowledgeArticle } from './knowledge';
import { evaluatePeriodCheckin } from './periodCheckin';
import { registerMiraServiceWorker } from './pwa';
import {
  AURA_TODAY,
  addDays,
  createAuraExportState,
  createEmptyAuraState,
  daysBetween,
  deriveAttentionEvidence,
  emptyAuraEntry,
  getAuraCycleMetrics,
  getAuraCycleRangeTrend,
  getAuraDayCoverage,
  getAuraObservationDates,
  getAuraPeriodEpisodes,
  getAuraSafetyFacts,
  parseImportedAuraState,
  setAuraCycleExcluded,
  setAuraPeriodEnd,
  setAuraPeriodStart,
  shouldShowAttention,
  type AuraDayEntry,
  type AuraAnimalAvatar,
  type AuraBleedingType,
  type AuraBleedingMedication,
  type AuraContraception,
  type AuraHomeCardId,
  type AuraHormonoscopeFeedback,
  type AuraIud,
  type AuraIntimacyAfter,
  type AuraModuleId,
  type AuraOnboarding,
  type AuraPainOnset,
  type AuraPeriodCheckin,
  type AuraPregnancyTestResult,
  type AuraReliefEffect,
  type AuraSymptom,
  type AuraState,
} from './auraState';
import { generateWorkout, type AuraWorkoutLog, type WorkoutFeedback, type WorkoutVenue } from './workoutEngine';

function MiraMark({ className = '', label }: { className?: string; label?: string }) {
  return <span className={`mira-brand-mark ${className}`} role={label ? 'img' : undefined} aria-label={label} />;
}

type Screen = 'onboarding' | 'today' | 'calendar' | 'diary' | 'analytics' | 'knowledge' | 'article' | 'cycle-report' | 'report' | 'profile';
type AnalyticsSection = 'overview' | 'cycle' | 'wellbeing' | 'history';
type WellbeingMode = 'summary' | 'symptoms' | 'sleep' | 'habits';
type KnowledgeCategory = 'all' | 'cycle' | 'symptoms' | 'sleep' | 'wellbeing' | 'habits';
type KnowledgeTab = 'for-you' | 'all' | 'saved';
type PrototypeScenario = 'history' | 'first' | 'empty';
type Overlay = 'attention' | 'daily-plan' | 'support-options' | 'cycloscope' | 'workout' | 'personal-data' | 'medical-context' | 'home-settings' | 'diary-settings' | 'data-controls' | 'delete-confirm' | 'feedback' | 'support' | 'quick-symptoms' | 'quick-support' | 'symptom-saved' | 'period-checkin' | 'temperature-history' | 'weight-history' | 'sleep-history' | 'water-history' | 'steps-history' | 'nutrition-history' | 'notes-history' | null;
type PersistStatus = 'saved' | 'saving' | 'error';

const navItems: Array<{ id: Screen; label: string; icon: LucideIcon }> = [
  { id: 'today', label: 'Сегодня', icon: House },
  { id: 'diary', label: 'Дневник', icon: NotebookTabs },
  { id: 'analytics', label: 'Аналитика', icon: ChartSpline },
  { id: 'knowledge', label: 'Знания', icon: BookOpenText },
];

type KnowledgeArticleCard = {
  id: string;
  categoryId: Exclude<KnowledgeCategory, 'all'>;
  category: string;
  icon: LucideIcon;
  tone: string;
  time: string;
  title: string;
};

const knowledgeCategoryMeta: Record<KnowledgeArticle['category'], Pick<KnowledgeArticleCard, 'categoryId' | 'icon' | 'tone'>> = {
  'Цикл': { categoryId: 'cycle', icon: CalendarRange, tone: 'violet' },
  'Симптомы': { categoryId: 'symptoms', icon: Heart, tone: 'coral' },
  'Самочувствие': { categoryId: 'wellbeing', icon: Smile, tone: 'rose' },
  'Забота о себе': { categoryId: 'habits', icon: Activity, tone: 'sage' },
};

const knowledgeArticleCards: KnowledgeArticleCard[] = medicalKnowledgeArticles.map((article) => ({
  id: article.id,
  category: article.category,
  time: `${article.readingMinutes} ${pluralRu(article.readingMinutes, 'минута', 'минуты', 'минут')}`,
  title: article.title,
  ...(article.id === 'sleep-wellbeing' ? { categoryId: 'sleep' as const, icon: Moon, tone: 'indigo' } : knowledgeCategoryMeta[article.category]),
}));

const animalAvatars: Array<{ id: AuraAnimalAvatar; label: string; icon: LucideIcon }> = [
  { id: 'cat', label: 'Кошка', icon: Cat },
  { id: 'dog', label: 'Собака', icon: Dog },
  { id: 'rabbit', label: 'Кролик', icon: Rabbit },
  { id: 'bird', label: 'Птица', icon: Bird },
  { id: 'fish', label: 'Рыбка', icon: Fish },
  { id: 'turtle', label: 'Черепаха', icon: Turtle },
  { id: 'squirrel', label: 'Белка', icon: Squirrel },
  { id: 'snail', label: 'Улитка', icon: Snail },
  { id: 'mouse', label: 'Мышка', icon: Rat },
  { id: 'ladybug', label: 'Божья коровка', icon: Bug },
];

function AnimalAvatarIcon({ avatar, label }: { avatar: AuraAnimalAvatar; label?: string }) {
  const option = animalAvatars.find((item) => item.id === avatar) ?? animalAvatars[0];
  const Icon = option.icon;
  return <Icon role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

const ruMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const ruMonthTitles = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const ruWeekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function localDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatRuDate(value: string, withYear = false) {
  const date = localDate(value);
  return `${date.getDate()} ${ruMonths[date.getMonth()]}${withYear ? ` ${date.getFullYear()}` : ''}`;
}

function formatRuRange(start?: string, end?: string) {
  if (!start || !end) return 'Ориентир появится позже';
  const from = localDate(start);
  const to = localDate(end);
  return from.getMonth() === to.getMonth()
    ? `${from.getDate()}–${to.getDate()} ${ruMonths[to.getMonth()]}`
    : `${formatRuDate(start)} – ${formatRuDate(end)}`;
}

function pluralRu(value: number, one: string, few: string, many: string) {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function symptomDiaryText(symptom: AuraSymptom) {
  return `${symptom.label} · ${symptom.severity}/3${symptom.affectsLife ? ' · мешал обычным делам' : ''}`;
}

function symptomSeverityText(severity: AuraSymptom['severity']) {
  return severity === 1 ? 'лёгкая' : severity === 2 ? 'средняя' : 'сильная';
}

function periodDurations(data: AuraState) {
  const metrics = getAuraCycleMetrics(data);
  const includedStarts = new Set(metrics.completedStarts);
  return getAuraPeriodEpisodes(data)
    .filter((episode) => includedStarts.has(episode.start) && episode.status === 'confirmed' && episode.duration !== null)
    .map((episode) => episode.duration!);
}

function generateWorkoutForDate(data: AuraState, date: string, generatedAt = new Date().toISOString(), venue: WorkoutVenue = 'home') {
  const day = data.entries[date] ?? emptyAuraEntry(date);
  const metrics = getAuraCycleMetrics(data, date);
  const completedDates = Object.entries(data.entries)
    .filter(([entryDate, entry]) => entryDate < date && entryDate >= addDays(date, -6) && entry.workout?.status === 'completed')
    .map(([entryDate]) => entryDate);
  let consecutiveWorkoutDays = 0;
  for (let offset = 1; offset <= 2; offset += 1) {
    if (data.entries[addDays(date, -offset)]?.workout?.status !== 'completed') break;
    consecutiveWorkoutDays += 1;
  }
  return generateWorkout({
    date,
    venue,
    recentCompletedCount: completedDates.length,
    consecutiveWorkoutDays,
    cycleDay: metrics.cycleDay ?? undefined,
    period: day.period,
    rating: day.rating,
    energy: day.energy,
    sleepHours: day.sleepHours,
    sleepQuality: day.sleepQuality,
    symptoms: day.symptoms.map(({ id, severity, affectsLife }) => ({ id, severity, affectsLife })),
  }, generatedAt);
}

function App({ initialData }: { initialData: AuraState }) {
  const [data, setData] = useState<AuraState>(() => initialData.onboarding.completed
    ? { ...initialData, selectedDate: AURA_TODAY }
    : initialData);
  const [screen, setScreen] = useState<Screen>(() => data.onboarding.completed ? 'today' : 'onboarding');
  const [selectedArticleId, setSelectedArticleId] = useState('cramps-care');
  const [analyticsSection, setAnalyticsSection] = useState<AnalyticsSection>('overview');
  const [wellbeingMode, setWellbeingMode] = useState<WellbeingMode>('summary');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('idea');
  const [persistStatus, setPersistStatus] = useState<PersistStatus>('saved');
  const [toast, setToast] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);
  const attentionInitialized = useRef(false);
  const cycleMetrics = useMemo(() => getAuraCycleMetrics(data), [data]);
  const scenario: PrototypeScenario = cycleMetrics.completedCycles >= 2 ? 'history' : cycleMetrics.starts.length ? 'first' : 'empty';

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (attentionInitialized.current) return;
    attentionInitialized.current = true;
    if (shouldShowAttention(data)) setOverlay('attention');
  }, [data]);

  useEffect(() => {
    setPersistStatus('saving');
    let active = true;
    const timer = window.setTimeout(() => {
      void persistAuraDatabaseState(data).then((saved) => {
        if (!active) return;
        setPersistStatus(saved ? 'saved' : 'error');
        if (!saved) setToast('Не удалось сохранить локально. Проверьте доступ к хранилищу.');
      });
    }, 260);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const open = (next: Screen) => {
    if (next === 'onboarding') setOnboardingStep(0);
    if (next === 'today' && data.selectedDate !== AURA_TODAY) {
      setData((current) => ({ ...current, selectedDate: AURA_TODAY }));
    }
    if (next === 'diary' && data.selectedDate > AURA_TODAY) {
      setData((current) => ({ ...current, selectedDate: AURA_TODAY }));
      setToast('Для записи открыт сегодняшний день');
    }
    setScreen(next);
    document.querySelector('.aura-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeData = (updater: (current: AuraState) => AuraState) => {
    setPersistStatus('saving');
    setData((current) => updater(current));
  };

  const patchEntry = (date: string, patch: Partial<AuraDayEntry>) => {
    if (date > AURA_TODAY) {
      setToast('Будущую дату можно посмотреть, но запись появится только в этот день.');
      return;
    }
    changeData((current) => ({
      ...current,
      selectedDate: date,
      entries: {
        ...current.entries,
        [date]: {
          ...(current.entries[date] ?? emptyAuraEntry()),
          ...patch,
          completionQuality: current.entries[date]?.completionQuality === 'full' || patch.periodCheckin ? 'full' : 'focused',
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const openWorkout = (regenerate = false, venue?: WorkoutVenue) => {
    const date = data.selectedDate;
    if (data.entries[date]?.workout && !regenerate) {
      setOverlay('workout');
      return;
    }
    changeData((current) => {
      const selectedDate = current.selectedDate;
      const day = current.entries[selectedDate] ?? emptyAuraEntry(selectedDate);
      const workout = generateWorkoutForDate(current, selectedDate, new Date().toISOString(), venue ?? day.workout?.venue ?? 'home');
      return {
        ...current,
        modules: { ...current.modules, activity: true },
        entries: {
          ...current.entries,
          [selectedDate]: { ...day, workout, updatedAt: new Date().toISOString() },
        },
      };
    });
    setOverlay('workout');
  };

  const patchWorkout = (patch: Partial<AuraWorkoutLog>) => {
    changeData((current) => {
      const date = current.selectedDate;
      const day = current.entries[date] ?? emptyAuraEntry(date);
      if (!day.workout) return current;
      const workout = { ...day.workout, ...patch };
      const completed = workout.status === 'completed';
      return {
        ...current,
        entries: {
          ...current.entries,
          [date]: {
            ...day,
            workout,
            activity: completed ? `${workout.title} · ${workout.durationMin} мин` : day.activity,
            recommendedActivityDone: completed ? true : day.recommendedActivityDone,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const dismissAttention = () => {
    const evidence = deriveAttentionEvidence(data);
    changeData((current) => ({
      ...current,
      attention: {
        ...current.attention,
        evidenceKey: evidence.key,
        dismissedUntil: addDays(AURA_TODAY, 7),
        lastShownAt: AURA_TODAY,
        showCount: current.attention.showCount + 1,
      },
    }));
    setOverlay(null);
    setToast('Рекомендация скрыта на 7 дней');
  };

  const exportData = () => {
    try {
      const payload = createAuraExportState(data, data.privacy.sensitiveExport);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mira-aura-backup.json';
      link.click();
      URL.revokeObjectURL(url);
      setToast('Копия подготовлена');
    } catch {
      setToast('Не удалось подготовить копию');
    }
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseImportedAuraState(JSON.parse(await file.text()));
      setData(imported);
      setScreen(imported.onboarding.completed ? 'today' : 'onboarding');
      setOverlay(null);
      setToast('Копия восстановлена');
    } catch {
      setToast('Файл не распознан. Данные не изменены.');
    } finally {
      event.target.value = '';
    }
  };

  const deleteAllData = async () => {
    const deleted = await clearAuraDatabaseState();
    if (!deleted) {
      setOverlay('data-controls');
      setToast('Не удалось полностью удалить данные. Попробуйте ещё раз.');
      return;
    }
    setData(createEmptyAuraState());
    setOnboardingStep(0);
    setScreen('onboarding');
    setOverlay(null);
    setToast('Локальные данные удалены');
  };

  const openArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    open('article');
  };

  const submitFeedback = async (payload: FeedbackPayload) => {
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    try {
      const delivery = await deliverFeedback(payload, { endpoint: viteEnv?.VITE_FEEDBACK_ENDPOINT });
      setOverlay(null);
      setToast(delivery === 'api' ? 'Сообщение отправлено команде Mira' : delivery === 'share' ? 'Сообщение передано в выбранное приложение' : 'Сообщение скопировано, отправьте его удобным способом');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    }
  };

  return (
    <div className="aura-lab">
      <main className="lab-canvas">
        <div className="phone-shell">
          <div className="phone-status"><span>9:41</span><span className="phone-island" /><span>● ● ▰</span></div>
          <div className="aura-scroll">
            {screen === 'onboarding' && <Onboarding
              step={onboardingStep}
              setStep={setOnboardingStep}
              initial={data.onboarding}
              onFinish={(onboarding) => {
                changeData((current) => {
                  const focus = new Set(onboarding.focus);
                  const periodStarts = onboarding.lastPeriod
                    ? Array.from(new Set([...current.periodStarts, onboarding.lastPeriod])).sort()
                    : current.periodStarts;
                  return {
                    ...current,
                    onboarding: { ...onboarding, completed: true, reminders: false },
                    notifications: false,
                    periodStarts,
                    modules: {
                      ...current.modules,
                      cycle: focus.has('cycle'),
                      mood: focus.has('mood'),
                      sleep: focus.has('sleep'),
                      daily: focus.has('daily'),
                      activity: focus.has('activity'),
                      note: focus.has('note'),
                      intimate: false,
                    },
                  };
                });
                setToast('Главная настроена под вас');
                open('today');
              }}
            />}
            {screen === 'today' && <Today data={data} scenario={scenario} onOpen={open} onOpenArticle={openArticle} onSelectDate={(date) => changeData((current) => ({ ...current, selectedDate: date }))} onShowAttention={() => setOverlay('attention')} onOpenDailyPlan={() => setOverlay('daily-plan')} onOpenSupportOptions={() => setOverlay('support-options')} onOpenWorkout={() => openWorkout()} onOpenHomeSettings={() => setOverlay('home-settings')} onOpenPeriodStart={() => setOverlay('period-checkin')} onOpenQuickSymptoms={() => setOverlay('quick-symptoms')} onOpenUnwell={() => setOverlay('quick-support')} onHormonoscopeFeedback={(date, feedback) => changeData((current) => ({ ...current, hormonoscopeFeedback: { ...current.hormonoscopeFeedback, [date]: feedback } }))} onCycloscopeFeedback={(date, feedback) => changeData((current) => ({ ...current, cycloscopeFeedback: { ...current.cycloscopeFeedback, [date]: feedback } }))} />}
            {screen === 'calendar' && <Calendar data={data} scenario={scenario} onSelectDate={(date) => changeData((current) => ({ ...current, selectedDate: date }))} onSetPeriodStart={(date, marked) => changeData((current) => setAuraPeriodStart(current, date, marked))} onNotify={setToast} onBack={() => open('today')} onOpenDiary={() => open('diary')} />}
            {screen === 'diary' && <Diary data={data} persistStatus={persistStatus} onPatchEntry={patchEntry} onOpenCalendar={() => open('calendar')} onOpenSettings={() => setOverlay('diary-settings')} onOpenSleepHistory={() => setOverlay('sleep-history')} onOpenWaterHistory={() => setOverlay('water-history')} onOpenStepsHistory={() => setOverlay('steps-history')} onOpenNutritionHistory={() => setOverlay('nutrition-history')} onOpenNotesHistory={() => setOverlay('notes-history')} onOpenTemperatureHistory={() => setOverlay('temperature-history')} onOpenWeightHistory={() => setOverlay('weight-history')} onDone={() => open('today')} onNotify={setToast} />}
            {screen === 'analytics' && <Analytics data={data} onChangeData={changeData} scenario={scenario} section={analyticsSection} setSection={setAnalyticsSection} mode={wellbeingMode} setMode={setWellbeingMode} onOpenDiary={() => open('diary')} onOpenCycleReport={() => open('cycle-report')} onOpenReport={() => open('report')} />}
            {screen === 'knowledge' && <Knowledge data={data} onChangeData={changeData} onOpenArticle={openArticle} />}
            {screen === 'article' && <Article article={medicalKnowledgeArticles.find((article) => article.id === selectedArticleId) ?? medicalKnowledgeArticles[0]} onBack={() => open('knowledge')} />}
            {screen === 'cycle-report' && <CycleReport data={data} onBack={() => open('analytics')} onOpenDoctorReport={() => open('report')} />}
            {screen === 'report' && <Report data={data} onBack={() => open('analytics')} onNotify={setToast} />}
            {screen === 'profile' && <Profile data={data} onOpenPersonalData={() => setOverlay('personal-data')} onOpenHealthContext={() => setOverlay('medical-context')} onBack={() => open('today')} onOpenHomeSettings={() => setOverlay('home-settings')} onOpenDiarySettings={() => setOverlay('diary-settings')} onOpenData={() => setOverlay('data-controls')} onOpenSaved={() => open('knowledge')} onOpenFeedback={(category) => { setFeedbackCategory(category); setOverlay('feedback'); }} onOpenSupport={() => setOverlay('support')} />}
          </div>
          {overlay === 'attention' && <AttentionModal
            evidence={deriveAttentionEvidence(data)}
            onClose={dismissAttention}
            onOpenReport={() => {
              setOverlay(null);
              open('report');
            }}
          />}
          {overlay === 'daily-plan' && <DailyPlanModal date={data.selectedDate} day={data.entries[data.selectedDate] ?? emptyAuraEntry(data.selectedDate)} onPatch={(patch) => patchEntry(data.selectedDate, patch)} onClose={() => setOverlay(null)} />}
          {overlay === 'support-options' && <SupportOptionsModal date={data.selectedDate} day={data.entries[data.selectedDate] ?? emptyAuraEntry(data.selectedDate)} onAddSymptoms={() => { setOverlay(null); setOverlay('quick-symptoms'); }} onClose={() => setOverlay(null)} />}
          {overlay === 'cycloscope' && <CycloscopeModal data={data} date={data.selectedDate} onClose={() => setOverlay(null)} onOpenDiary={() => { setOverlay(null); open('diary'); }} />}
          {overlay === 'workout' && data.entries[data.selectedDate]?.workout && <WorkoutModal workout={data.entries[data.selectedDate].workout!} onPatch={patchWorkout} onRegenerate={(venue) => openWorkout(true, venue)} onClose={() => setOverlay(null)} />}
          {overlay === 'personal-data' && <PersonalDataSheet data={data} onSave={(profile, avatar) => changeData((current) => ({ ...current, profile, avatar }))} onClose={() => setOverlay(null)} />}
          {overlay === 'medical-context' && <HealthContextSheet data={data} onSave={(healthContext) => changeData((current) => ({ ...current, profile: { ...current.profile, healthContext } }))} onClose={() => setOverlay(null)} />}
          {overlay === 'temperature-history' && <TemperatureHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'weight-history' && <WeightHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'sleep-history' && <SleepHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'water-history' && <WaterHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'steps-history' && <StepsHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'nutrition-history' && <NutritionHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'notes-history' && <NotesHistoryModal data={data} onClose={() => setOverlay(null)} />}
          {overlay === 'home-settings' && <SettingsSheet title="Главная страница" description="Выберите карточки, которые помогают вам сегодня." onClose={() => setOverlay(null)}>{(Object.entries(data.homeCards) as Array<[AuraHomeCardId, boolean]>).map(([id, checked]) => <ToggleRow key={id} title={{hormonoscope:'Hormonoscope',cycloscope:'Циклоскоп',dailyPlan:'Что может пригодиться',rhythm:'Ваш ритм',recommendation:'Mira заметила',knowledge:'Полезная статья'}[id]} note={{hormonoscope:'Личный ритм по похожим дням',cycloscope:'Лёгкий атмосферный прогноз для настроения',dailyPlan:'Аптечка, тренировка и возможные варианты поддержки',rhythm:'Сон, вода и шаги',recommendation:'Осторожные наблюдения по нескольким циклам',knowledge:'Одна статья по контексту'}[id]} checked={checked} onClick={() => changeData((current) => ({ ...current, homeCards: { ...current.homeCards, [id]: !checked } }))} />)}</SettingsSheet>}
          {overlay === 'diary-settings' && <SettingsSheet title="Разделы дневника" description="Показывайте только то, что действительно отмечаете." onClose={() => setOverlay(null)}>{(Object.entries(data.modules) as Array<[AuraModuleId, boolean]>).filter(([id]) => id !== 'cycle' && id !== 'mood').map(([id, checked]) => <ToggleRow key={id} title={{cycle:'Цикл и симптомы',mood:'Энергия',sleep:'Сон',daily:'Вода и шаги',activity:'Активность',intimate:'Интимная жизнь',nutrition:'Питание',body:'Показатели тела',note:'Заметка и контекст'}[id]} note={id === 'intimate' ? 'Чувствительный раздел внутри формы «Симптомы» · выключен по умолчанию' : 'Можно изменить в любой момент'} checked={checked} sensitive={id === 'intimate'} onClick={() => changeData((current) => ({ ...current, modules: { ...current.modules, [id]: !checked } }))} />)}</SettingsSheet>}
          {overlay === 'data-controls' && <DataControlsSheet data={data} onChangeData={changeData} onExport={exportData} onImport={importData} onDelete={() => setOverlay('delete-confirm')} onClose={() => setOverlay(null)} />}
          {overlay === 'delete-confirm' && <ConfirmDelete onCancel={() => setOverlay('data-controls')} onConfirm={deleteAllData} />}
          {overlay === 'feedback' && <FeedbackSheet initialCategory={feedbackCategory} onClose={() => setOverlay(null)} onSubmit={submitFeedback} />}
          {overlay === 'support' && <SupportSheet onClose={() => setOverlay(null)} onNotify={setToast} />}
          {overlay === 'period-checkin' && <PeriodCheckinFlow
            date={data.selectedDate}
            day={data.entries[data.selectedDate] ?? emptyAuraEntry(data.selectedDate)}
            periodStarts={data.periodStarts}
            periodEnds={data.periodEnds}
            cycleDelayed={getAuraCycleMetrics(data, data.selectedDate).daysLate > 0}
            onClose={() => setOverlay(null)}
            onEnd={() => {
              changeData((current) => setAuraPeriodEnd(current, current.selectedDate, true));
              setOverlay(null);
              setToast('Окончание месячных сохранено');
            }}
            onSave={(checkin, symptoms) => {
              changeData((current) => {
                const date = current.selectedDate;
                const day = current.entries[date] ?? emptyAuraEntry(date);
                const isPeriod = checkin.bleedingType === 'period-start' || checkin.bleedingType === 'period-ongoing';
                const next = checkin.bleedingType === 'period-start'
                  ? setAuraPeriodStart(current, date, true)
                  : current.periodStarts.includes(date)
                    ? setAuraPeriodStart(current, date, false)
                    : current;
                const periodSymptomIds = new Set([...periodAdditionalSymptoms.map((item) => item.id), 'pain']);
                const existingSymptoms = new Map(day.symptoms.filter((symptom) => !periodSymptomIds.has(symptom.id)).map((symptom) => [symptom.id, symptom]));
                symptoms.forEach((symptom) => existingSymptoms.set(symptom.id, symptom));
                return {
                  ...next,
                  modules: { ...next.modules, cycle: true },
                  entries: {
                    ...next.entries,
                    [date]: {
                      ...day,
                      period: isPeriod ? checkin.flow === 'light' ? 'light' : checkin.flow === 'medium' ? 'medium' : 'heavy' : undefined,
                      periodCheckin: checkin,
                      completionQuality: 'full',
                      symptoms: [...existingSymptoms.values()],
                      symptomsChecked: symptoms.length ? true : day.symptomsChecked,
                      updatedAt: new Date().toISOString(),
                    },
                  },
                };
              });
              setOverlay(null);
              setToast('Отметка месячных сохранена');
            }}
          />}
          {(overlay === 'quick-symptoms' || overlay === 'quick-support') && <QuickSymptomsSheet mode={overlay === 'quick-support' ? 'support' : 'symptoms'} date={data.selectedDate} day={data.entries[data.selectedDate] ?? emptyAuraEntry(data.selectedDate)} showIntimate={data.modules.intimate} onClose={() => setOverlay(null)} onSave={(patch) => { changeData((current) => ({ ...current, modules: { ...current.modules, cycle: true }, entries: { ...current.entries, [current.selectedDate]: { ...(current.entries[current.selectedDate] ?? emptyAuraEntry(current.selectedDate)), ...patch, completionQuality: current.entries[current.selectedDate]?.completionQuality === 'full' ? 'full' : 'focused', updatedAt: new Date().toISOString() } } })); setOverlay('symptom-saved'); }} />}
          {overlay === 'symptom-saved' && <SymptomSavedSheet day={data.entries[data.selectedDate] ?? emptyAuraEntry()} onClose={() => setOverlay(null)} onOpenDiary={() => { setOverlay(null); open('diary'); }} onOpenAnalytics={() => { setAnalyticsSection('wellbeing'); setWellbeingMode('symptoms'); setOverlay(null); open('analytics'); }} />}
          {!online && <div className="offline-banner" role="status"><CloudMoon />Нет сети · записи продолжат сохраняться на устройстве</div>}
          {toast && <div className="aura-toast" role="status"><Check />{toast}</div>}
          {!['onboarding', 'article', 'cycle-report', 'report', 'profile', 'calendar'].includes(screen) && <BottomNav screen={screen} onOpen={open} />}
        </div>
      </main>
    </div>
  );
}

const onboardingGoals = [
  { id: 'today', title: 'Что происходит сегодня', note: 'День цикла и короткий ориентир', icon: House },
  { id: 'forecast', title: 'Когда ждать месячные', note: 'Диапазон вместо одной точной даты', icon: CalendarRange },
  { id: 'patterns', title: 'Повторяются ли симптомы', note: 'Боль, сон и самочувствие по циклам', icon: ChartSpline },
  { id: 'doctor', title: 'Подготовиться к консультации', note: 'Собрать факты в понятный отчёт', icon: FileHeart },
] as const;

const onboardingPatterns = [
  { id: 'stable', title: 'Обычно похож', note: 'Разница в несколько дней', icon: CircleGauge },
  { id: 'changes', title: 'Иногда меняется', note: 'Может заметно сдвигаться', icon: ChartSpline },
  { id: 'irregular', title: 'Сильно меняется', note: 'Трудно ожидать дату', icon: Activity },
  { id: 'unknown', title: 'Пока не знаю', note: 'Начнём без предположений', icon: Info },
] as const;

const onboardingFocus = [
  { id: 'cycle', title: 'Цикл и симптомы', icon: Heart },
  { id: 'mood', title: 'Настроение', icon: Smile },
  { id: 'sleep', title: 'Сон', icon: Moon },
  { id: 'daily', title: 'Вода и шаги', icon: GlassWater },
  { id: 'activity', title: 'Активность', icon: Footprints },
  { id: 'note', title: 'Заметки', icon: MessageSquareText },
] as const;

function Onboarding({ step, setStep, initial, onFinish }: { step: number; setStep: (step: number) => void; initial: AuraOnboarding; onFinish: (data: AuraOnboarding) => void }) {
  const [draft, setDraft] = useState<AuraOnboarding>(() => ({ ...initial, focus: [...initial.focus] }));
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const lastStep = 6;
  const canContinue = step === 1 ? Boolean(draft.goal) : step === 3 ? Boolean(draft.cyclePattern) : step === 5 ? draft.focus.length > 0 : true;
  const selectedGoal = onboardingGoals.find((item) => item.id === draft.goal)?.title;
  const selectedPattern = onboardingPatterns.find((item) => item.id === draft.cyclePattern)?.title;
  const toggleFocus = (id: AuraModuleId) => setDraft((current) => ({
    ...current,
    focus: current.focus.includes(id) ? current.focus.filter((item) => item !== id) : [...current.focus, id],
  }));
  const next = () => {
    if (!canContinue) return;
    if (step < lastStep) setStep(step + 1);
    else onFinish(draft);
  };

  return <div className={`screen onboarding-screen onboarding-step-${step}`}>
    <header className="onboarding-topbar">
      {step > 0 ? <button className="onboarding-back" onClick={() => setStep(step - 1)} aria-label="Назад"><ChevronLeft /></button> : <span className="onboarding-back-placeholder" />}
      <div className="simple-brand"><MiraMark className="onboarding-brand-mark" /><strong>Mira</strong></div>
      <span className="onboarding-count">{step === 0 ? 'Знакомство' : `${step} из ${lastStep}`}</span>
    </header>
    {step > 0 && <div className="onboarding-progress" aria-label={`Шаг ${step} из ${lastStep}`}><i style={{ width: `${(step / lastStep) * 100}%` }} /></div>}

    <main className="onboarding-page" key={step}>
      {step === 0 && <>
        <div className="onboarding-hero-art" aria-hidden="true">
          <div className="onboarding-orbit orbit-one" />
          <div className="onboarding-orbit orbit-two" />
          <div className="onboarding-day"><span>18</span><small>день цикла</small></div>
          <span className="onboarding-fact fact-cycle"><Droplet /> Цикл</span>
          <span className="onboarding-fact fact-state"><Smile /> Состояние</span>
          <span className="onboarding-fact fact-sleep"><Moon /> Сон</span>
        </div>
        <div className="onboarding-heading intro-heading">
          <span className="eyebrow">30 секунд для себя</span>
          <h1>Наблюдайте за циклом, а не пытайтесь всё запомнить</h1>
          <p>Короткие отметки помогут увидеть вашу личную картину — постепенно и без диагнозов.</p>
        </div>
        <button className={`onboarding-privacy-card ${showPrivacyDetails ? 'open' : ''}`} onClick={() => setShowPrivacyDetails((value) => !value)} aria-expanded={showPrivacyDetails}>
          <span><LockKeyhole /></span><p><strong>Ваши записи остаются на этом устройстве</strong><small>Как Mira хранит данные</small></p><ChevronDown />
        </button>
        {showPrivacyDetails && <div className="onboarding-privacy-details">
          <span><ShieldCheck /><p><strong>Локальное хранение</strong><small>Записи сохраняются в базе этого браузера и не отправляются на сервер.</small></p></span>
          <span><FileDown /><p><strong>Экспорт под вашим контролем</strong><small>Копию можно скачать самостоятельно; личные заметки выключены по умолчанию.</small></p></span>
          <span><Trash2 /><p><strong>Удаление в любой момент</strong><small>Управление данными всегда доступно в профиле.</small></p></span>
        </div>}
      </>}

      {step === 1 && <>
        <OnboardingHeading eyebrow="Начнём с главного" title="Что хотите понять в первую очередь?" text="Это настроит главную. Выбор можно изменить в любой момент." />
        <div className="onboarding-choice-list goal-list">
          {onboardingGoals.map(({ id, title, note, icon: Icon }) => <button key={id} className={draft.goal === id ? 'selected' : ''} onClick={() => setDraft((current) => ({ ...current, goal: id }))}>
            <span className="choice-icon"><Icon /></span><span><strong>{title}</strong><small>{note}</small></span><i>{draft.goal === id && <Check />}</i>
          </button>)}
        </div>
      </>}

      {step === 2 && <>
        <OnboardingHeading eyebrow="Первый ориентир" title="Когда начались последние месячные?" text="Укажите первый день. Если не уверены — этот вопрос можно пропустить." />
        <div className="onboarding-date-card">
          <span className="choice-icon"><CalendarRange /></span>
          <div><strong>Первый день месячных</strong><small>Прокрутите день, месяц и год</small></div>
          <DateWheelPicker value={draft.lastPeriod} onChange={(lastPeriod) => setDraft((current) => ({ ...current, lastPeriod }))} />
        </div>
        <div className="onboarding-explain"><CircleGauge /><p><strong>Что появится сразу</strong><span>День цикла. Надёжный диапазон прогноза появится после нескольких завершённых циклов.</span></p></div>
      </>}

      {step === 3 && <>
        <OnboardingHeading eyebrow="Без строгих рамок" title="Насколько предсказуем ваш цикл?" text="Здесь нет правильного ответа — нужен только стартовый ориентир." />
        <div className="onboarding-choice-grid pattern-grid">
          {onboardingPatterns.map(({ id, title, note, icon: Icon }) => <button key={id} className={draft.cyclePattern === id ? 'selected' : ''} onClick={() => setDraft((current) => ({ ...current, cyclePattern: id }))}>
            <span className="choice-icon"><Icon /></span><strong>{title}</strong><small>{note}</small>{draft.cyclePattern === id && <i><Check /></i>}
          </button>)}
        </div>
        {draft.cyclePattern && !['irregular', 'unknown'].includes(draft.cyclePattern) && <div className="onboarding-stepper">
          <span><small>Примерная длина</small><strong>{draft.cycleLength ?? 28} дней</strong></span>
          <div><button onClick={() => setDraft((current) => ({ ...current, cycleLength: Math.max(21, (current.cycleLength ?? 28) - 1) }))}>−</button><button onClick={() => setDraft((current) => ({ ...current, cycleLength: Math.min(45, (current.cycleLength ?? 28) + 1) }))}>+</button></div>
          <p>Это стартовая оценка, а не медицинская норма.</p>
        </div>}
      </>}

      {step === 4 && <>
        <OnboardingHeading eyebrow="Ещё один ориентир" title="Сколько обычно идут месячные?" text="Используем это только для первой настройки. Дальше важнее ваши реальные даты." />
        <div className="period-length-preview">
          <div className="period-length-preview-head">
            <span className="period-length-preview-icon"><CalendarRange /></span>
            <span>
              <small>{draft.periodLength ? 'Вы выбрали' : draft.periodLengthUnknown ? 'Ваш цикл' : 'Если пока не знаете'}</small>
              <strong>{draft.periodLength ? `${draft.periodLength} ${draft.periodLength === 3 || draft.periodLength === 4 ? 'дня' : 'дней'}` : draft.periodLengthUnknown ? 'Длительность бывает разной' : 'Можно выбрать «Не знаю»'}</strong>
            </span>
          </div>
          {draft.periodLength ? <>
            <div className="period-length-calendar" aria-label={`Пример: месячные идут ${draft.periodLength} дней`}>
              {Array.from({ length: 7 }, (_, index) => <span key={index} className={index < draft.periodLength! ? 'active' : ''}><i>{index + 1}</i><b>{index < draft.periodLength! ? <Droplet /> : null}</b></span>)}
            </div>
            <div className="period-length-calendar-caption"><span>Первый день</span><span>Последний день — {draft.periodLength}</span></div>
          </> : <p>{draft.periodLengthUnknown ? 'Отмечайте реальные даты — Mira рассчитает вашу длительность по истории.' : 'Это нормально: Mira начнёт считать длительность после первых отметок.'}</p>}
        </div>
        <div className="period-length-options">
          {[3, 4, 5, 6, 7].map((days) => <button key={days} className={draft.periodLength === days && !draft.periodLengthUnknown ? 'selected' : ''} onClick={() => setDraft((current) => ({ ...current, periodLength: days, periodLengthUnknown: false }))}><strong>{days}</strong><small>дн.</small></button>)}
        </div>
        <div className="onboarding-secondary-options">
          <button className={!draft.periodLength && draft.periodLengthUnknown ? 'selected' : ''} onClick={() => setDraft((current) => ({ ...current, periodLength: undefined, periodLengthUnknown: true }))}>По-разному</button>
          <button className={!draft.periodLength && !draft.periodLengthUnknown ? 'selected' : ''} onClick={() => setDraft((current) => ({ ...current, periodLength: undefined, periodLengthUnknown: false }))}>Не знаю</button>
        </div>
      </>}

      {step === 5 && <>
        <OnboardingHeading eyebrow="Только нужное" title="Что хотите отмечать?" text="Выберите хотя бы один раздел. Остальное останется доступно в настройках." />
        <div className="onboarding-focus-grid">
          {onboardingFocus.map(({ id, title, icon: Icon }) => <button key={id} className={draft.focus.includes(id) ? 'selected' : ''} onClick={() => toggleFocus(id)}>
            <span className="choice-icon"><Icon /></span><strong>{title}</strong><i>{draft.focus.includes(id) && <Check />}</i>
          </button>)}
        </div>
        <div className="sensitive-note"><LockKeyhole /><p><strong>Чувствительные разделы выключены</strong><span>Их можно включить отдельно позже.</span></p></div>
      </>}

      {step === 6 && <>
        <div className="onboarding-ready-mark"><ShieldCheck /></div>
        <OnboardingHeading eyebrow="Всё готово" title="Сначала факты — потом закономерности" text="Пустой день не считается отсутствием симптомов. Mira покажет вывод только тогда, когда данных достаточно." />
        <div className="onboarding-summary">
          <span><Sparkle /><small>Главная</small><strong>{selectedGoal ?? 'Личный обзор'}</strong></span>
          <span><CircleGauge /><small>Цикл</small><strong>{selectedPattern ?? 'Без предположений'}</strong></span>
          <span><ListChecks /><small>Дневник</small><strong>{draft.focus.length} {draft.focus.length === 1 ? 'раздел' : 'раздела'}</strong></span>
        </div>
        <div className="onboarding-reminder is-unavailable">
          <span className="choice-icon"><Bell /></span><span><strong>Напоминания появятся позже</strong><small>В веб-версии они пока недоступны, поэтому Mira не будет обещать уведомление.</small></span>
        </div>
        <div className="onboarding-privacy-row"><LockKeyhole />Записи хранятся локально · их можно экспортировать или удалить</div>
        <p className="onboarding-disclaimer">Mira помогает наблюдать за самочувствием, но не ставит диагноз и не заменяет врача.</p>
      </>}
    </main>

    <footer className="onboarding-actions">
      <button className="primary-button" disabled={!canContinue} onClick={next}>{step === 0 ? 'Настроить под себя' : step === lastStep ? 'Открыть мою главную' : 'Продолжить'} <ChevronRight /></button>
      {step === 2 && <button className="text-button" onClick={() => { setDraft((current) => ({ ...current, lastPeriod: undefined })); setStep(3); }}>Не помню — пропустить</button>}
      {step === 4 && <button className="text-button" onClick={() => setStep(5)}>Пропустить вопрос</button>}
    </footer>
  </div>;
}

function OnboardingHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="onboarding-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>;
}

const dateWheelMonths = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const dateWheelMonthsGenitive = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function DateWheelColumn({ label, items, selected, onSelect }: { label: string; items: Array<{ value: number; label: string; disabled?: boolean }>; selected: number; onSelect: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const itemHeight = 40;
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === selected));
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = selectedIndex * itemHeight;
  }, [selectedIndex, items.length]);
  return <div className="date-wheel-column">
    <span>{label}</span>
    <div
      ref={ref}
      className="date-wheel-scroll"
      role="listbox"
      aria-label={label}
      onScroll={(event) => {
        const index = Math.min(items.length - 1, Math.max(0, Math.round(event.currentTarget.scrollTop / itemHeight)));
        if (items[index]?.disabled) {
          event.currentTarget.scrollTop = selectedIndex * itemHeight;
          return;
        }
        if (items[index] && items[index].value !== selected) onSelect(items[index].value);
      }}
    >
      {items.map((item) => <button key={item.value} role="option" aria-selected={item.value === selected} disabled={item.disabled} className={item.value === selected ? 'selected' : ''} onClick={() => onSelect(item.value)}>{item.label}</button>)}
    </div>
  </div>;
}

function DateWheelPicker({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const [todayYear, todayMonth, todayDay] = AURA_TODAY.split('-').map(Number);
  const source = (value && value <= AURA_TODAY ? value : AURA_TODAY).split('-').map(Number);
  const year = Math.min(todayYear, Math.max(2000, source[0]));
  const monthLimit = year === todayYear ? todayMonth : 12;
  const month = Math.min(monthLimit, Math.max(1, source[1]));
  const monthDays = new Date(year, month, 0).getDate();
  const dayLimit = year === todayYear && month === todayMonth ? todayDay : monthDays;
  const day = Math.min(dayLimit, Math.max(1, source[2]));
  const toDate = (nextYear: number, nextMonth: number, nextDay: number) => `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
  const setDate = (nextYear: number, nextMonth: number, nextDay: number) => {
    const nextMonthLimit = nextYear === todayYear ? todayMonth : 12;
    const safeMonth = Math.min(nextMonthLimit, nextMonth);
    const nextMonthDays = new Date(nextYear, safeMonth, 0).getDate();
    const nextDayLimit = nextYear === todayYear && safeMonth === todayMonth ? todayDay : nextMonthDays;
    onChange(toDate(nextYear, safeMonth, Math.min(nextDayLimit, nextDay)));
  };
  useEffect(() => {
    if (!value) onChange(toDate(year, month, day));
  }, [value, year, month, day, onChange]);
  const days = Array.from({ length: monthDays }, (_, index) => ({ value: index + 1, label: String(index + 1).padStart(2, '0'), disabled: index + 1 > dayLimit }));
  const months = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: dateWheelMonths[index], disabled: index + 1 > monthLimit }));
  const years = Array.from({ length: todayYear - 1997 }, (_, index) => ({ value: 2000 + index, label: String(2000 + index), disabled: 2000 + index > todayYear }));
  return <div className="date-wheel-picker">
    <div className="date-wheel-selection" aria-hidden="true" />
    <DateWheelColumn label="День" items={days} selected={day} onSelect={(nextDay) => setDate(year, month, nextDay)} />
    <DateWheelColumn label="Месяц" items={months} selected={month} onSelect={(nextMonth) => setDate(year, nextMonth, day)} />
    <DateWheelColumn label="Год" items={years} selected={year} onSelect={(nextYear) => setDate(nextYear, month, day)} />
    <span className="date-confirm"><Check /> {day} {dateWheelMonthsGenitive[month - 1]} {year} · только на устройстве</span>
  </div>;
}

function AppHeader({ title = formatRuDate(AURA_TODAY), avatar = 'cat', editorial = false, onProfile, onCalendar }: { title?: string; avatar?: AuraAnimalAvatar; editorial?: boolean; onProfile?: () => void; onCalendar?: () => void }) {
  return <header className="app-header">
    <button className={`avatar-button ${editorial ? 'editorial-brand-button' : ''}`} onClick={onProfile} aria-label="Профиль">{editorial ? <span>Mira</span> : <AnimalAvatarIcon avatar={avatar} />}</button>
    <div>{!editorial && <h1>{title}</h1>}</div>
    <button className="round-button header-calendar-button" onClick={onCalendar} aria-label="Календарь"><CalendarRange /></button>
  </header>;
}

function DateStrip({ data, onSelectDate }: { data: AuraState; onSelectDate: (date: string) => void }) {
  return <div className="date-strip">{Array.from({ length: 7 }, (_, index) => addDays(data.selectedDate, index - 3)).map((value) => {
    const date = localDate(value);
    const active = value === data.selectedDate;
    const isToday = value === AURA_TODAY;
    const entry = data.entries[value];
    const markers = [
      data.periodStarts.includes(value) || (entry?.period && entry.period !== 'none') || entry?.periodCheckin ? '🩸' : '',
      entry?.rating ? ['😞','🙁','😐','🙂','😊'][entry.rating - 1] : entry?.moods.length ? '🙂' : '',
      entry?.symptoms.length ? '🤕' : '',
      entry?.sleepHours ? '🌙' : '',
      entry?.intimate ? '♥' : '',
      entry?.energy ? '⚡' : '',
      entry?.workout || entry?.activity ? '🏃' : '',
    ].filter(Boolean);
    return <button key={value} className={active ? 'active' : ''} disabled={value > AURA_TODAY} onClick={() => onSelectDate(value)} aria-current={active ? 'date' : undefined} aria-label={`${formatRuDate(value)}${isToday ? ', сегодня' : ''}${markers.length ? `, отметок: ${markers.length}` : ''}`}>
      <small>{isToday ? 'Сегодня' : ruWeekdays[date.getDay()].slice(0, 1)}</small>
      <strong>{date.getDate()}</strong>
      <span className="date-strip-markers" aria-hidden="true">
        {markers.slice(0, 3).map((marker, index) => <i key={`${marker}-${index}`}>{marker}</i>)}
        {markers.length > 3 && <b>+</b>}
      </span>
    </button>;
  })}</div>;
}

function Today({ data, scenario, onOpen, onOpenArticle, onSelectDate, onShowAttention, onOpenDailyPlan, onOpenSupportOptions, onOpenWorkout, onOpenHomeSettings, onOpenPeriodStart, onOpenQuickSymptoms, onOpenUnwell, onHormonoscopeFeedback, onCycloscopeFeedback }: { data: AuraState; scenario: PrototypeScenario; onOpen: (screen: Screen) => void; onOpenArticle: (articleId: string) => void; onSelectDate: (date: string) => void; onShowAttention: () => void; onOpenDailyPlan: () => void; onOpenSupportOptions: () => void; onOpenWorkout: () => void; onOpenHomeSettings: () => void; onOpenPeriodStart: () => void; onOpenQuickSymptoms: () => void; onOpenUnwell: () => void; onHormonoscopeFeedback: (date: string, feedback: AuraHormonoscopeFeedback) => void; onCycloscopeFeedback: (date: string, feedback: AuraHormonoscopeFeedback) => void }) {
  const selectedDate = data.selectedDate <= AURA_TODAY ? data.selectedDate : AURA_TODAY;
  const selectedIsToday = selectedDate === AURA_TODAY;
  const day = data.entries[selectedDate] ?? emptyAuraEntry();
  const periodLogged = data.periodStarts.includes(selectedDate) || Boolean(day.period && day.period !== 'none');
  const attention = deriveAttentionEvidence(data);
  const metrics = getAuraCycleMetrics(data, selectedDate);
  const range = formatRuRange(metrics.forecast?.start, metrics.forecast?.end);
  const daysUntilPeriod = metrics.forecast ? Math.max(0, daysBetween(selectedDate, metrics.forecast.start)) : null;
  const contextArticle = medicalKnowledgeArticles.find((article) => article.id === (periodLogged ? 'cramps-care' : 'forecast-confidence')) ?? medicalKnowledgeArticles[0];
  const confidenceLabel = metrics.forecast?.confidence === 'personal'
    ? `Личный диапазон по ${metrics.forecast.cyclesUsed} ${pluralRu(metrics.forecast.cyclesUsed, 'циклу', 'циклам', 'циклам')}`
    : metrics.forecast?.confidence === 'growing'
      ? `Диапазон уточняется по ${metrics.forecast.cyclesUsed} ${pluralRu(metrics.forecast.cyclesUsed, 'циклу', 'циклам', 'циклам')}`
      : 'Предварительный календарный ориентир';
  const forecast = scenario === 'empty'
    ? { title: 'Когда начались месячные?', text: 'После первой даты появится день цикла. Прогноз потребует больше истории.' }
    : metrics.daysLate > 0
      ? { title: `Задержка ${metrics.daysLate} ${pluralRu(metrics.daysLate, 'день', 'дня', 'дней')}`, text: `Ожидаемое окно ${range} прошло. Это календарный расчёт, а не диагноз.` }
      : scenario === 'first'
        ? metrics.forecast ? { title: `Начало возможно ${range}`, text: 'Пока это широкий календарный диапазон. Следующая фактическая дата поможет сделать его личнее.' } : { title: 'Первый цикл продолжается', text: 'Отметьте следующую дату начала — после этого появится первый личный прогноз.' }
        : { title: daysUntilPeriod === 0 ? 'Окно возможного начала — сегодня' : `До начала окна около ${daysUntilPeriod} ${pluralRu(daysUntilPeriod ?? 0, 'дня', 'дней', 'дней')}`, text: `Начало возможно ${range}. Это диапазон, а не точная дата.` };
  return <div className="screen today-screen">
    <AppHeader avatar={data.avatar} editorial onProfile={() => onOpen('profile')} onCalendar={() => onOpen('calendar')} />
    <div className="today-editorial-heading"><span>{formatRuDate(selectedDate)}</span><h1>Ваш ритм сегодня</h1><p>Спокойный взгляд на цикл и самочувствие</p></div>
    <DateStrip data={data} onSelectDate={onSelectDate} />
    <div className="today-status-pills">
      <span><i />{metrics.cycleDay ? `${metrics.cycleDay} ${pluralRu(metrics.cycleDay, 'день', 'дня', 'дней')} цикла` : 'Цикл не настроен'}</span>
      <span><Sparkle />{metrics.forecast ? 'Диапазон готов' : 'Прогноз формируется'}</span>
    </div>
    <section className="cycle-status-card">
      <div className="cycle-card-orbit" aria-hidden="true"><i /><i /><i /><b /></div>
      <div className="cycle-status-main"><div className="cycle-day-value"><strong>{metrics.cycleDay ?? '—'}</strong><span>{metrics.cycleDay ? 'день цикла' : 'пока неизвестен'}</span></div><div className="cycle-status-copy"><small>{selectedIsToday ? 'Сегодня' : formatRuDate(selectedDate)}</small><h2>{forecast.title}</h2><p>{forecast.text}</p></div></div>
      {scenario !== 'empty' ? <div className="cycle-timeline">
        <div className="cycle-timeline-head"><span>Основание прогноза</span><strong>{confidenceLabel}</strong></div>
        {data.homeCards.knowledge && <button className="cycle-context-article" onClick={() => onOpenArticle(contextArticle.id)} aria-label={`Открыть статью: ${contextArticle.title}`}><span><BookOpenText /></span><div><small>По теме · {contextArticle.readingMinutes} {pluralRu(contextArticle.readingMinutes, 'минута', 'минуты', 'минут')}</small><strong>{contextArticle.title}</strong></div><ChevronRight /></button>}
      </div> : <button className="cycle-empty-action" onClick={onOpenPeriodStart}><Plus /> Добавить первый день месячных</button>}
      <div className="cycle-inline-actions"><button className={periodLogged ? 'active period-action' : 'period-action'} aria-pressed={periodLogged} onClick={onOpenPeriodStart}><span className="cycle-action-icon"><Droplet /></span><strong>{periodLogged ? 'Кровотечение отмечено' : 'Отметить кровотечение'}</strong></button><button className={day.symptoms.length || day.moods.length || day.energy ? 'active symptom-action' : 'symptom-action'} aria-pressed={Boolean(day.symptoms.length || day.moods.length || day.energy)} onClick={onOpenQuickSymptoms}><span className="cycle-action-icon"><Plus /></span><strong>{day.symptoms.length || day.moods.length || day.energy ? 'Состояние отмечено' : 'Симптомы'}</strong></button><button className="support-action" onClick={onOpenUnwell}><span className="cycle-action-icon"><HeartPulse /></span><strong>Мне плохо</strong></button></div>
    </section>
    {(data.homeCards.rhythm || data.homeCards.dailyPlan) && <section className="surface combined-home-surface">
      {data.homeCards.rhythm && <><div className="section-heading"><div><span className="eyebrow">{selectedIsToday ? 'Сегодня' : formatRuDate(selectedDate)}</span><h2>Ваш ритм</h2></div><button className="mini-link" onClick={onOpenHomeSettings}>Настроить</button></div><div className="metric-row rhythm-metric-row"><MetricCard icon={Moon} illustration="/mira-icons/rhythm-sleep.png?v=2" tone="indigo" label="Сон" value={day.sleepHours ? `${day.sleepHours} ч` : 'Добавить'} note={day.sleepQuality ?? 'Как прошла ночь?'} progress={day.sleepHours ? Math.min(100, day.sleepHours / 8 * 100) : 0} /><MetricCard icon={GlassWater} illustration="/mira-icons/rhythm-water.png?v=2" tone="cyan" label="Вода" value={day.water ? `${day.water.toLocaleString('ru-RU')} мл` : 'Добавить'} note={day.water ? 'За выбранный день' : 'Сколько выпили?'} progress={day.water ? Math.min(100, day.water / 2000 * 100) : 0} /><MetricCard icon={Footprints} illustration="/mira-icons/rhythm-steps.png?v=2" tone="sage" label="Шаги" value={day.steps ? day.steps.toLocaleString('ru-RU') : 'Добавить'} note={day.steps ? 'За выбранный день' : 'Отметить активность'} progress={day.steps ? Math.min(100, day.steps / 8000 * 100) : 0} /></div></>}
      {data.homeCards.dailyPlan && <div className={`today-plan-preview ${data.homeCards.rhythm ? '' : 'is-first'}`}><div className="today-plan-title"><div><h2>Что может пригодиться</h2></div></div><div className="today-plan-grid"><button className="kit care-kit-card" onClick={onOpenDailyPlan} aria-label="Открыть аптечку"><img className="plan-3d-icon" src="/mira-icons/first-aid-kit.png" alt="" /><strong>Аптечка</strong></button><button className="movement" onClick={onOpenWorkout} aria-label="Открыть тренировку"><img className="plan-3d-icon" src="/mira-icons/workout.png" alt="" /><strong>Тренировка</strong></button><button className="vitamins support-options-card" onClick={onOpenSupportOptions} aria-label="Открыть возможные варианты поддержки"><img className="plan-3d-icon" src="/mira-icons/vitamins.png" alt="" /><strong>Что может помочь</strong><small>{day.symptoms.length ? `${day.symptoms.length} ${pluralRu(day.symptoms.length, 'отметка', 'отметки', 'отметок')}` : 'По симптомам'}</small></button></div></div>}
    </section>}
    {data.homeCards.hormonoscope && <ScopesModule data={data} date={selectedDate} onFeedback={onHormonoscopeFeedback} />}
    {data.homeCards.cycloscope && <CycloscopeMiniCard data={data} date={selectedDate} onFeedback={onCycloscopeFeedback} />}
    {data.homeCards.recommendation && attention.eligible && <section className="attention-summary"><div className="attention-summary-head"><span className="attention-icon"><ChartSpline /></span><div><span className="eyebrow">Mira заметила</span><h2>Боль повторяется</h2></div><button onClick={onShowAttention}>Динамика <ChevronRight /></button></div><p>Отмечена в {attention.cycles} {pluralRu(attention.cycles, 'цикле', 'циклах', 'циклах')} · в {attention.impactDays} {pluralRu(attention.impactDays, 'случае', 'случаях', 'случаях')} мешала обычным делам.</p><div className="attention-summary-evidence"><span>{attention.painDays >= 5 && attention.cycles >= 3 ? 'Повторяемость заметна' : 'Первые признаки'}</span><small>Основано на {attention.painDays} {pluralRu(attention.painDays, 'отметке', 'отметках', 'отметках')}</small></div></section>}
  </div>;
}

const workoutStatusCopy: Record<AuraWorkoutLog['status'], string> = {
  planned: 'План сохранён',
  in_progress: 'Тренировка идёт',
  completed: 'Выполнено',
  skipped: 'Пропущено сегодня',
};

const workoutLevelCopy: Record<AuraWorkoutLog['level'], string> = {
  rest: 'Восстановление',
  recovery: 'Мягкий режим',
  light: 'Лёгкая нагрузка',
  moderate: 'Умеренная нагрузка',
};

const dailyCareItems = [
  { id: 'period-products', title: 'Прокладки', image: '/mira-icons/pads.png' },
  { id: 'spare-underwear', title: 'Запасное бельё', image: '/mira-icons/spare-underwear.png' },
  { id: 'heat-patch', title: 'Термопластырь', image: '/mira-icons/heat-patch.png' },
];

function CareKitIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M23 17v-4.5A4.5 4.5 0 0 1 27.5 8h9a4.5 4.5 0 0 1 4.5 4.5V17" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <rect x="8" y="17" width="48" height="39" rx="12" fill="currentColor" opacity=".16"/>
    <rect x="8" y="17" width="48" height="39" rx="12" stroke="currentColor" strokeWidth="4"/>
    <path d="M32 27v19M22.5 36.5h19" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}

function CareItemIcon({ id }: { id: string }) {
  if (id === 'period-products') return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M17 7c-5 4-7 10-7 17s2 13 7 17c2 2 12 2 14 0 5-4 7-10 7-17S36 11 31 7c-2-2-12-2-14 0Z" fill="currentColor" opacity=".16"/><path d="M17 7c-5 4-7 10-7 17s2 13 7 17M31 7c5 4 7 10 7 17s-2 13-7 17M19 14c3 3 7 3 10 0M19 34c3-3 7-3 10 0" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg>;
  if (id === 'spare-underwear') return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M7 12h34l-4 25c-5-1-9-5-13-10-4 5-8 9-13 10L7 12Z" fill="currentColor" opacity=".16"/><path d="M7 12h34M8.5 20c6 0 10-3 12-8m19 8c-6 0-10-3-12-8M11 37c5-1 9-5 13-10 4 5 8 9 13 10L41 12H7l4 25Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="7" y="10" width="34" height="28" rx="9" fill="currentColor" opacity=".16"/><rect x="7" y="10" width="34" height="28" rx="9" stroke="currentColor" strokeWidth="2.8"/><path d="M18 31c-3-3 3-5 0-8s3-5 0-8m10 16c-3-3 3-5 0-8s3-5 0-8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg>;
}

type QuickSymptomOption = { id: string; label: string; icon: LucideIcon };
type SymptomTone = 'rose' | 'coral' | 'lavender' | 'amber' | 'plum';
type QuickSymptomCategory = { id: string; label: string; tone: SymptomTone; options: QuickSymptomOption[] };

const quickSymptomCategories: QuickSymptomCategory[] = [
  { id: 'common', label: 'Частые', tone: 'rose', options: [
    { id: 'pain', label: 'Боль внизу живота', icon: HeartPulse },
    { id: 'fatigue', label: 'Усталость', icon: BatteryLow },
    { id: 'headache', label: 'Головная боль', icon: Brain },
    { id: 'back', label: 'Боль в спине', icon: PersonStanding },
    { id: 'breast', label: 'Чувствительность груди', icon: Heart },
    { id: 'bloating', label: 'Вздутие', icon: CircleDashed },
    { id: 'mood-swings', label: 'Перепады настроения', icon: RefreshCw },
  ] },
  { id: 'body', label: 'Тело', tone: 'coral', options: [
    { id: 'migraine', label: 'Мигрень', icon: Zap },
    { id: 'joint-pain', label: 'Боль в суставах', icon: Bone },
    { id: 'muscle-pain', label: 'Мышечная боль', icon: BicepsFlexed },
    { id: 'dizziness', label: 'Головокружение', icon: Orbit },
    { id: 'hot-flash', label: 'Приливы жара', icon: ThermometerSun },
    { id: 'night-sweats', label: 'Ночная потливость', icon: CloudMoon },
  ] },
  { id: 'energy', label: 'Сон и энергия', tone: 'lavender', options: [
    { id: 'insomnia', label: 'Бессонница', icon: BedDouble },
    { id: 'sleepiness', label: 'Сонливость', icon: Bed },
    { id: 'low-energy', label: 'Мало энергии', icon: BatteryWarning },
    { id: 'forgetfulness', label: 'Забывчивость', icon: BrainCircuit },
    { id: 'poor-focus', label: 'Трудно сосредоточиться', icon: Focus },
    { id: 'restlessness', label: 'Беспокойство', icon: Waves },
  ] },
  { id: 'digestion', label: 'Пищеварение', tone: 'amber', options: [
    { id: 'nausea', label: 'Тошнота', icon: Frown },
    { id: 'constipation', label: 'Запор', icon: LockKeyhole },
    { id: 'diarrhea', label: 'Диарея', icon: ChevronsDown },
    { id: 'appetite', label: 'Повышенный аппетит', icon: Sandwich },
    { id: 'low-appetite', label: 'Снижение аппетита', icon: UtensilsCrossed },
    { id: 'heartburn', label: 'Изжога', icon: FlameKindling },
  ] },
  { id: 'skin-intimate', label: 'Кожа и интимное', tone: 'plum', options: [
    { id: 'acne', label: 'Высыпания', icon: ScanFace },
    { id: 'dry-skin', label: 'Сухая кожа', icon: Sun },
    { id: 'vaginal-itching', label: 'Зуд во влагалище', icon: Hand },
    { id: 'vaginal-dryness', label: 'Сухость во влагалище', icon: DropletOff },
    { id: 'vaginal-burning', label: 'Жжение', icon: Flame },
    { id: 'painful-sex', label: 'Боль при сексе', icon: HeartCrack },
    { id: 'unusual-odor', label: 'Необычный запах', icon: Wind },
  ] },
];

const quickSymptomOptions = quickSymptomCategories.flatMap((category) => category.options);

function SymptomGlyph({ icon: Icon, tone }: { icon: LucideIcon; tone: SymptomTone }) {
  return <span className={`symptom-glyph tone-${tone}`} aria-hidden="true"><Icon /></span>;
}

type PeriodCheckinResult = AuraPeriodCheckin['result'];

const bleedingTypeCopy: Record<AuraBleedingType, string> = {
  'period-start': 'Начало месячных',
  'period-ongoing': 'Месячные продолжаются',
  spotting: 'Мажущие выделения',
  'between-periods': 'Между месячными',
  'after-sex': 'После близости',
};

const bleedingFrequencyCopy: Record<AuraPeriodCheckin['changeFrequency'], string> = {
  '4h-plus': 'раз в 4 часа или реже',
  '2-3h': 'каждые 2–3 часа',
  '1-2h': 'каждые 1–2 часа',
  hourly: 'каждый час или чаще',
};

const periodResultContent: Record<PeriodCheckinResult, { eyebrow: string; title: string; text: string; action: string; icon: LucideIcon }> = {
  usual: {
    eyebrow: 'Обычное состояние',
    title: 'Похоже на вашу обычную картину',
    text: 'Сохраните отметку и продолжайте наблюдать за самочувствием.',
    action: 'Сохранить отметку',
    icon: ShieldCheck,
  },
  observe: {
    eyebrow: 'Стоит понаблюдать',
    title: 'Состояние немного изменилось',
    text: 'Обратите внимание, усиливаются ли кровотечение, боль или слабость.',
    action: 'Сохранить и наблюдать',
    icon: Waves,
  },
  doctor: {
    eyebrow: 'Рекомендуем консультацию',
    title: 'Эти симптомы стоит обсудить с врачом',
    text: 'Mira сохранит ответы, чтобы их было проще вспомнить на консультации.',
    action: 'Сохранить для истории',
    icon: Stethoscope,
  },
  urgent: {
    eyebrow: 'Нужна срочная оценка',
    title: 'Такое сочетание симптомов может требовать срочной помощи',
    text: 'Если состояние ухудшается, не ждите и обратитесь за неотложной медицинской помощью.',
    action: 'Сохранить результат',
    icon: CircleAlert,
  },
};

const periodAdditionalSymptoms: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'dizziness', label: 'Головокружение', icon: Orbit },
  { id: 'weakness', label: 'Слабость', icon: BatteryLow },
  { id: 'fever', label: 'Температура', icon: Thermometer },
  { id: 'nausea', label: 'Тошнота', icon: Frown },
  { id: 'breathlessness', label: 'Одышка', icon: Wind },
  { id: 'fainting', label: 'Обморок', icon: PersonStanding },
  { id: 'chest-pain', label: 'Боль в груди', icon: HeartPulse },
  { id: 'racing-heart', label: 'Сильное сердцебиение', icon: Activity },
  { id: 'painful-urination', label: 'Боль при мочеиспускании', icon: DropletOff },
  { id: 'other', label: 'Другое', icon: Plus },
];

function PeriodCheckinFlow({ date, day, periodStarts, periodEnds, cycleDelayed, onClose, onEnd, onSave }: {
  date: string;
  day: AuraDayEntry;
  periodStarts: string[];
  periodEnds: string[];
  cycleDelayed: boolean;
  onClose: () => void;
  onEnd: () => void;
  onSave: (checkin: AuraPeriodCheckin, symptoms: AuraSymptom[]) => void;
}) {
  const saved = day.periodCheckin;
  const latestStart = periodStarts.filter((item) => item <= date).slice(-1)[0];
  const latestEnd = periodEnds.filter((item) => item <= date).slice(-1)[0];
  const activePeriod = Boolean(latestStart && (!latestEnd || latestEnd < latestStart) && daysBetween(latestStart!, date) <= 14);
  const [step, setStep] = useState(0);
  const [bleedingType, setBleedingType] = useState<AuraBleedingType | undefined>(saved?.bleedingType ?? (activePeriod ? 'period-ongoing' : 'period-start'));
  const [overall, setOverall] = useState<AuraPeriodCheckin['overall'] | undefined>(saved?.overall);
  const [flow, setFlow] = useState<AuraPeriodCheckin['flow'] | undefined>(saved?.flow);
  const [changeFrequency, setChangeFrequency] = useState<AuraPeriodCheckin['changeFrequency'] | undefined>(saved?.changeFrequency);
  const [hourlyBleedingHours, setHourlyBleedingHours] = useState(saved?.hourlyBleedingHours ?? 0);
  const [largeClots, setLargeClots] = useState(saved?.largeClots ?? false);
  const [leaksThroughProtection, setLeaksThroughProtection] = useState(saved?.leaksThroughProtection ?? false);
  const [doubleProtection, setDoubleProtection] = useState(saved?.doubleProtection ?? false);
  const [nightChanges, setNightChanges] = useState(saved?.nightChanges ?? false);
  const [durationDays, setDurationDays] = useState(saved?.durationDays ?? 1);
  const [painImpact, setPainImpact] = useState<AuraPeriodCheckin['painImpact'] | undefined>(saved?.painImpact);
  const [painScore, setPainScore] = useState(saved?.painScore ?? 0);
  const [painLocations, setPainLocations] = useState<string[]>(saved?.painLocations ?? []);
  const [painOnset, setPainOnset] = useState<AuraPainOnset | undefined>(saved?.painOnset);
  const [reliefEffect, setReliefEffect] = useState<AuraReliefEffect | undefined>(saved?.reliefEffect);
  const [symptoms, setSymptoms] = useState<string[]>(saved?.symptoms ?? []);
  const [pregnancyPossible, setPregnancyPossible] = useState(saved?.pregnancyPossible ?? false);
  const [pregnancyTest, setPregnancyTest] = useState<AuraPregnancyTestResult | undefined>(saved?.pregnancyTest);
  const [differentFromUsual, setDifferentFromUsual] = useState(saved?.differentFromUsual ?? false);
  const toggle = (value: string, values: string[], setValues: (next: string[]) => void) => setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const complete = Boolean(bleedingType && overall && flow && changeFrequency && painImpact);
  const unusualBleeding = bleedingType === 'between-periods' || bleedingType === 'after-sex' || bleedingType === 'spotting';
  const pregnancyTestRelevant = pregnancyPossible && (cycleDelayed || unusualBleeding || (painImpact !== undefined && painImpact !== 'none') || painScore > 0);
  const result = complete ? evaluatePeriodCheckin({
    bleedingType: bleedingType!,
    overall: overall!,
    flow: flow!,
    changeFrequency: changeFrequency!,
    hourlyBleedingHours,
    largeClots,
    leaksThroughProtection,
    doubleProtection,
    nightChanges,
    durationDays,
    painImpact: painImpact!,
    painScore,
    painOnset,
    reliefEffect,
    symptoms,
    pregnancyPossible,
    pregnancyTest: pregnancyTestRelevant ? pregnancyTest : undefined,
    differentFromUsual,
  }) : 'usual';
  const resultContent = periodResultContent[result];
  const ResultIcon = resultContent.icon;
  const canContinue = step === 0 ? Boolean(bleedingType && overall) : step === 1 ? Boolean(flow && changeFrequency) : step === 2 ? Boolean(painImpact) : true;
  const save = () => {
    if (!bleedingType || !overall || !flow || !changeFrequency || !painImpact) return;
    const completedAt = new Date().toISOString();
    const checkin: AuraPeriodCheckin = {
      bleedingType,
      overall,
      flow,
      changeFrequency,
      hourlyBleedingHours,
      largeClots,
      leaksThroughProtection,
      doubleProtection,
      nightChanges,
      durationDays,
      painImpact,
      painScore,
      painLocations,
      painOnset,
      reliefEffect,
      symptoms,
      pregnancyPossible,
      pregnancyTest: pregnancyTestRelevant ? pregnancyTest : undefined,
      differentFromUsual,
      result,
      completedAt,
    };
    const symptomLabels = new Map(periodAdditionalSymptoms.map((item) => [item.id, item.label]));
    const storedSymptoms: AuraSymptom[] = symptoms
      .filter((id) => id !== 'other')
      .map((id) => ({ id, label: symptomLabels.get(id) ?? id, severity: result === 'urgent' || result === 'doctor' ? 3 : result === 'observe' ? 2 : 1, affectsLife: painImpact === 'disrupts' || painImpact === 'unable' }));
    if (painImpact !== 'none' || painScore > 0) storedSymptoms.push({
      id: 'pain',
      label: painLocations.length ? `Боль: ${painLocations.join(', ')}` : 'Боль во время месячных',
      severity: painScore >= 7 ? 3 : painScore >= 4 ? 2 : 1,
      affectsLife: painImpact === 'disrupts' || painImpact === 'unable',
    });
    onSave(checkin, storedSymptoms);
  };
  const stepTitles = ['Самочувствие', 'Кровотечение', 'Боль', 'Дополнительно', 'Результат'];
  return <div className="attention-overlay period-checkin-overlay" onClick={onClose}>
    <section className="attention-modal period-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="period-checkin-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <header className="period-checkin-header">
        <span className="period-checkin-header-icon"><Droplet /></span>
        <div><span className="eyebrow">Кровотечение · {formatRuDate(date)}</span><h2 id="period-checkin-title">{stepTitles[step]}</h2></div>
        <em>{step + 1} из 5</em>
      </header>
      <div className="period-checkin-progress" aria-label={`Шаг ${step + 1} из 5`}>{stepTitles.map((title, index) => <i key={title} className={index <= step ? 'active' : ''}/>)}</div>

      {step === 0 && <div className="period-checkin-step intro">
        <div className="period-step-copy"><h3>Что вы отмечаете?</h3><p>Это помогает не путать новый цикл с продолжающимся или необычным кровотечением.</p></div>
        <div className="period-event-grid">
          {!activePeriod && <button className={bleedingType === 'period-start' ? 'active' : ''} onClick={() => setBleedingType('period-start')}><Droplet /><span><strong>Начались месячные</strong><small>Первый день нового цикла</small></span>{bleedingType === 'period-start' && <Check />}</button>}
          {activePeriod && <button className={bleedingType === 'period-ongoing' ? 'active' : ''} onClick={() => setBleedingType('period-ongoing')}><Waves /><span><strong>Месячные продолжаются</strong><small>Не создаёт новое начало цикла</small></span>{bleedingType === 'period-ongoing' && <Check />}</button>}
          <button className={bleedingType === 'spotting' ? 'active' : ''} onClick={() => setBleedingType('spotting')}><CircleDashed /><span><strong>Мажущие выделения</strong><small>Небольшие кровянистые выделения</small></span>{bleedingType === 'spotting' && <Check />}</button>
          <button className={bleedingType === 'between-periods' ? 'active' : ''} onClick={() => setBleedingType('between-periods')}><CalendarRange /><span><strong>Между месячными</strong><small>Отдельно от ожидаемого периода</small></span>{bleedingType === 'between-periods' && <Check />}</button>
          <button className={bleedingType === 'after-sex' ? 'active' : ''} onClick={() => setBleedingType('after-sex')}><Heart /><span><strong>После близости</strong><small>Кровянистые выделения после секса</small></span>{bleedingType === 'after-sex' && <Check />}</button>
        </div>
        {activePeriod && <button className="period-end-action" onClick={onEnd}><Check /><span><strong>Месячные закончились</strong><small>Сохранить окончание периода на выбранную дату</small></span></button>}
        <div className="period-step-copy period-overall-copy"><h3>Как проходит этот день?</h3><p>Выберите общее ощущение.</p></div>
        <div className="period-overall-grid">
          {([
            ['easy', 'Легко', 'День почти не меняется', Smile],
            ['usual', 'Как обычно', 'Похоже на привычный день', Meh],
            ['harder', 'Тяжелее обычного', 'Нужно больше заботы о себе', Frown],
            ['very-hard', 'Очень тяжело', 'Обычные дела даются сложно', CircleAlert],
          ] as const).map(([id, title, note, Icon]) => <button key={id} className={overall === id ? 'active' : ''} aria-pressed={overall === id} onClick={() => setOverall(id)}>
            <span><Icon /></span><strong>{title}</strong><small>{note}</small>{overall === id && <Check />}
          </button>)}
        </div>
      </div>}

      {step === 1 && <div className="period-checkin-step">
        <div className="period-step-copy"><h3>Насколько обильное кровотечение?</h3><p>Выберите состояние, которое лучше описывает сегодняшний день.</p></div>
        <div className="period-flow-scale">
          {([
            ['light', 'Слабое', 1],
            ['medium', 'Среднее', 2],
            ['heavy', 'Обильное', 3],
            ['very-heavy', 'Очень обильное', 4],
          ] as const).map(([id, label, drops]) => <button key={id} className={flow === id ? 'active' : ''} aria-pressed={flow === id} onClick={() => setFlow(id)}>
            <span>{Array.from({ length: drops }).map((_, index) => <Droplet key={index}/>)}</span><strong>{label}</strong>
          </button>)}
        </div>
        <section className="period-subquestion"><h4>Как часто приходится менять средство?</h4><div className="period-chip-grid">{([
          ['4h-plus', 'Раз в 4 часа или реже'],
          ['2-3h', 'Каждые 2–3 часа'],
          ['1-2h', 'Каждые 1–2 часа'],
          ['hourly', 'Каждый час или чаще'],
        ] as const).map(([id, label]) => <button key={id} className={changeFrequency === id ? 'active' : ''} onClick={() => setChangeFrequency(id)}>{label}</button>)}</div></section>
        {changeFrequency === 'hourly' && <section className="period-subquestion hourly-duration"><h4>Сколько часов подряд?</h4><div className="period-hour-grid">{[1,2,3,4].map((value) => <button key={value} className={hourlyBleedingHours === value ? 'active' : ''} onClick={() => setHourlyBleedingHours(value)}>{value === 4 ? '4+' : value} {pluralRu(value, 'час', 'часа', 'часов')}</button>)}</div></section>}
        {(flow === 'heavy' || flow === 'very-heavy') && <section className="period-subquestion bleeding-signs"><h4>Что ещё происходило?</h4><div>{([
          ['largeClots', 'Крупные сгустки', largeClots, setLargeClots],
          ['leaks', 'Протекание на одежду или постель', leaksThroughProtection, setLeaksThroughProtection],
          ['double', 'Нужна двойная защита', doubleProtection, setDoubleProtection],
          ['night', 'Приходилось менять ночью', nightChanges, setNightChanges],
        ] as const).map(([id, label, checked, setter]) => <button key={id} className={checked ? 'active' : ''} onClick={() => setter(!checked)}><span>{checked && <Check />}</span>{label}</button>)}</div></section>}
        <section className="period-subquestion compact"><h4>Какой сегодня день кровотечения?</h4><div className="period-day-picker">{[1,2,3,4,5,6,7,8].map((value) => <button key={value} className={durationDays === value ? 'active' : ''} onClick={() => setDurationDays(value)}>{value === 8 ? '8+' : value}</button>)}</div></section>
      </div>}

      {step === 2 && <div className="period-checkin-step">
        <div className="period-step-copy"><h3>Как боль влияет на ваш день?</h3><p>Влияние на привычные дела полезнее одной цифры.</p></div>
        <div className="period-impact-list">{([
          ['none', 'Не мешает'],
          ['slow-down', 'Приходится замедлиться'],
          ['disrupts', 'Мешает обычным делам'],
          ['unable', 'Не могу заниматься обычными делами'],
        ] as const).map(([id, label]) => <button key={id} className={painImpact === id ? 'active' : ''} onClick={() => { setPainImpact(id); if (id === 'none') { setPainScore(0); setPainOnset(undefined); setReliefEffect(undefined); } }}><span>{painImpact === id && <Check />}</span><strong>{label}</strong></button>)}</div>
        {painImpact && painImpact !== 'none' && <><section className="period-subquestion pain-score"><div><h4>Сила боли сейчас</h4><strong>{painScore}<small>/10</small></strong></div><input type="range" min="0" max="10" value={painScore} onChange={(event) => setPainScore(Number(event.target.value))}/><div className="period-range-labels"><span>Нет боли</span><span>Очень сильная</span></div></section>
        <section className="period-subquestion"><h4>Где болит?</h4><div className="period-body-picker"><div className="period-body-figure"><PersonStanding /></div><div>{['Низ живота','Справа','Слева','Поясница','Другое'].map((location) => <button key={location} className={painLocations.includes(location) ? 'active' : ''} onClick={() => toggle(location, painLocations, setPainLocations)}>{location}{painLocations.includes(location) && <Check />}</button>)}</div></div></section>
        <section className="period-subquestion"><h4>Эта боль знакома вам?</h4><div className="period-chip-grid three">{([
          ['usual','Похожая на обычную'],
          ['new','Новая'],
          ['sudden','Началась внезапно'],
        ] as const).map(([id,label]) => <button key={id} className={painOnset === id ? 'active' : ''} onClick={() => setPainOnset(id)}>{label}</button>)}</div></section>
        <section className="period-subquestion"><h4>Помогло ли то, что вы уже использовали?</h4><p>Только ваш факт — Mira ничего не назначает.</p><div className="period-chip-grid four">{([
          ['not-used','Не использовала'],
          ['helped','Помогло'],
          ['partly','Частично'],
          ['did-not-help','Не помогло'],
        ] as const).map(([id,label]) => <button key={id} className={reliefEffect === id ? 'active' : ''} onClick={() => setReliefEffect(id)}>{label}</button>)}</div></section></>}
      </div>}

      {step === 3 && <div className="period-checkin-step">
        <div className="period-step-copy"><h3>Есть ли дополнительные симптомы?</h3><p>Можно выбрать несколько. Если ничего нет — просто продолжайте.</p></div>
        <div className="period-extra-grid">{periodAdditionalSymptoms.map(({ id, label, icon: Icon }) => <button key={id} className={symptoms.includes(id) ? 'active' : ''} aria-pressed={symptoms.includes(id)} onClick={() => toggle(id, symptoms, setSymptoms)}><span><Icon /></span><strong>{label}</strong>{symptoms.includes(id) && <Check />}</button>)}</div>
        <div className="period-context-list">
          <button className={pregnancyPossible ? 'active' : ''} onClick={() => { setPregnancyPossible(!pregnancyPossible); if (pregnancyPossible) setPregnancyTest(undefined); }}><span>{pregnancyPossible && <Check />}</span><div><strong>Беременность возможна</strong><small>Это важно для безопасной оценки боли и кровотечения</small></div></button>
          <button className={differentFromUsual ? 'active' : ''} onClick={() => setDifferentFromUsual(!differentFromUsual)}><span>{differentFromUsual && <Check />}</span><div><strong>Этот день не как обычно</strong><small>Состояние заметно отличается от вашей привычной картины</small></div></button>
        </div>
        {pregnancyTestRelevant && <section className="period-pregnancy-test"><span><TestTubeDiagonal /></span><div><small>Показываем из-за боли, задержки или необычного кровотечения</small><h4>Есть результат теста на беременность?</h4><p>Отмечайте только уже сделанный тест.</p><div>{([
          ['negative','Отрицательный'],
          ['positive','Положительный'],
        ] as const).map(([id,label]) => <button key={id} className={pregnancyTest === id ? 'active' : ''} onClick={() => setPregnancyTest(pregnancyTest === id ? undefined : id)}>{pregnancyTest === id && <Check />}{label}</button>)}</div></div></section>}
      </div>}

      {step === 4 && <div className={`period-checkin-step result tone-${result}`}>
        <div className="period-result-card"><span><ResultIcon /></span><div><small>{resultContent.eyebrow}</small><h3>{resultContent.title}</h3><p>{resultContent.text}</p></div></div>
        <div className="period-result-summary">
          <span><small>Тип</small><strong>{bleedingTypeCopy[bleedingType!]}</strong></span>
          <span><small>Кровотечение</small><strong>{{light:'Слабое',medium:'Среднее',heavy:'Обильное','very-heavy':'Очень обильное'}[flow!]}</strong></span>
          <span><small>Боль</small><strong>{painScore}/10</strong></span>
        </div>
        {result === 'urgent' && <aside className="period-urgent-note"><CircleAlert /><p><strong>Не ждите ухудшения</strong>Особенно если средство промокает каждый час несколько часов подряд и есть одышка, головокружение, обморок, боль в груди или сильное сердцебиение.</p></aside>}
        <p className="period-result-disclaimer">Mira не ставит диагноз. Результат основан только на ответах этой отметки.</p>
      </div>}

      <footer className="period-checkin-actions">
        {step > 0 && <button className="period-back-button" onClick={() => setStep(step - 1)}><ChevronLeft /> Назад</button>}
        {step < 4
          ? <button className="primary-button" disabled={!canContinue} onClick={() => setStep(step + 1)}>Продолжить <ChevronRight /></button>
          : <button className={`primary-button result-${result}`} onClick={save}><Check /> {resultContent.action}</button>}
      </footer>
    </section>
  </div>;
}

function QuickSymptomsSheet({ mode = 'symptoms', date, day, showIntimate, onClose, onSave }: { mode?: 'symptoms' | 'support'; date: string; day: AuraDayEntry; showIntimate: boolean; onClose: () => void; onSave: (patch: Partial<AuraDayEntry>) => void }) {
  const [symptoms, setSymptoms] = useState<AuraSymptom[]>(day.symptoms);
  const [symptomsNone, setSymptomsNone] = useState(day.symptomsChecked === true && day.symptoms.length === 0);
  const [moods, setMoods] = useState<string[]>(day.moods);
  const [energy, setEnergy] = useState<number | undefined>(day.energy);
  const [intimacyPatch, setIntimacyPatch] = useState<Partial<AuraDayEntry>>({ intimate: day.intimate, intimacyComfort: day.intimacyComfort, intimacyAfter: day.intimacyAfter, intimacyDesire: day.intimacyDesire, intimacyNote: day.intimacyNote });
  const intimacyDay = { ...day, ...intimacyPatch };
  const frequentOptions = quickSymptomCategories[0].options.slice(0, 6);
  const frequentIds = new Set(frequentOptions.map((option) => option.id));
  const [showDetails, setShowDetails] = useState(() => mode === 'support' || day.moods.length > 0 || Boolean(day.energy) || day.intimate === true || day.symptoms.some((symptom) => !frequentIds.has(symptom.id)));
  const impactMarked = symptoms.some((symptom) => symptom.affectsLife);
  const toggleSymptom = (option: QuickSymptomOption) => {
    setSymptomsNone(false);
    setSymptoms((current) => current.some((item) => item.id === option.id)
      ? current.filter((item) => item.id !== option.id)
      : [...current, { id: option.id, label: option.label, severity: 1, affectsLife: current.some((item) => item.affectsLife) }]);
  };
  const setSeverity = (id: string, severity: AuraSymptom['severity']) => setSymptoms((current) => current.map((item) => item.id === id ? { ...item, severity } : item));
  const toggleImpact = () => setSymptoms((current) => current.map((item) => ({ ...item, affectsLife: !current.some((symptom) => symptom.affectsLife) })));
  const painAffectsLife = symptoms.some((symptom) => symptom.id === 'pain' && symptom.affectsLife);
  const detailCategories = quickSymptomCategories.map((category) => ({ ...category, options: category.options.filter((option) => !frequentIds.has(option.id)) })).filter((category) => category.options.length);
  return <div className="attention-overlay quick-checkin-overlay" onClick={onClose}>
    <section className="attention-modal quick-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="quick-checkin-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <header className={`quick-checkin-header ${mode === 'support' ? 'support' : ''}`}><span>{mode === 'support' ? <HeartPulse /> : <Heart />}</span><div><span className="eyebrow">{mode === 'support' ? 'Самочувствие' : 'Симптомы'} · {formatRuDate(date)}</span><h2 id="quick-checkin-title">{mode === 'support' ? 'Что беспокоит сильнее всего?' : 'Что чувствовали в этот день?'}</h2></div><em>Сохранится после кнопки</em></header>
      {mode === 'support' && <aside className="quick-support-note"><ShieldCheck /><span><strong>Начните с фактов</strong>Выберите симптом и выраженность. Если боль мешает обычным делам, Mira покажет безопасный следующий шаг.</span></aside>}

      <section className="quick-checkin-section symptoms frequent"><div className="quick-checkin-section-title"><div><span><Stethoscope /></span><h3>Частые симптомы</h3></div><small>{symptoms.length ? `${symptoms.length} выбрано` : 'Выберите подходящее'}</small></div><div className="quick-symptom-grid quick-frequent-grid">{frequentOptions.map(({ id,label,icon: Icon }) => { const active = symptoms.some((item) => item.id === id); return <button key={id} className={active ? 'active' : ''} aria-pressed={active} onClick={() => toggleSymptom({ id,label,icon:Icon })}><SymptomGlyph icon={Icon} tone="rose" /><strong>{label}</strong>{active && <Check />}</button>; })}</div></section>

      <button className={`quick-no-symptoms ${symptomsNone ? 'active' : ''}`} aria-pressed={symptomsNone} onClick={() => { const next = !symptomsNone; setSymptomsNone(next); if (next) setSymptoms([]); }}><span>{symptomsNone && <Check />}</span><strong>Симптомов не было</strong></button>

      <button className={`quick-more-details ${showDetails ? 'open' : ''}`} onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails}><Plus /><span><strong>{showDetails ? 'Скрыть дополнительные поля' : 'Ещё симптомы и состояние'}</strong><small>Настроение, энергия и остальные симптомы</small></span><ChevronDown /></button>

      {showDetails && <div className="quick-details-panel">
        <section className="quick-checkin-section mood"><div className="quick-checkin-section-title"><div><span><Smile /></span><h3>Настроение</h3></div><small>{moods.length ? `${moods.length} выбрано` : 'Не отмечено'}</small></div><div className="quick-mood-grid">{['Спокойствие','Радость','Раздражение','Грусть','Тревога'].map((value) => <button key={value} className={moods.includes(value) ? 'active' : ''} aria-pressed={moods.includes(value)} onClick={() => setMoods((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}><strong>{value}</strong>{moods.includes(value) && <Check />}</button>)}</div></section>

        <section className="quick-checkin-section energy"><div className="quick-checkin-section-title"><div><span><BatteryLow /></span><h3>Энергия</h3></div><small>{energy ? `${energy} из 5` : 'Не отмечено'}</small></div><div className="quick-energy-scale">{[1,2,3,4,5].map((value) => <button key={value} className={energy === value ? 'active' : ''} aria-pressed={energy === value} onClick={() => setEnergy(energy === value ? undefined : value)}><strong>{value}</strong><small>{value === 1 ? 'Мало' : value === 5 ? 'Много' : ''}</small></button>)}</div></section>

        <section className="quick-checkin-section symptoms extra"><div className="quick-checkin-section-title"><div><span><Plus /></span><h3>Другие симптомы</h3></div></div><div className="quick-symptom-groups">{detailCategories.map((category) => <section className={`quick-symptom-group tone-${category.tone}`} key={category.id} aria-labelledby={`quick-${category.id}`}><div className="quick-symptom-group-title"><strong id={`quick-${category.id}`}>{category.label}</strong></div><div className="quick-symptom-grid">{category.options.map(({ id,label,icon: Icon }) => { const active = symptoms.some((item) => item.id === id); return <button key={id} className={active ? 'active' : ''} aria-pressed={active} onClick={() => toggleSymptom({ id,label,icon:Icon })}><SymptomGlyph icon={Icon} tone={category.tone} /><strong>{label}</strong>{active && <Check />}</button>; })}</div></section>)}</div></section>
        {showIntimate && <section className="quick-checkin-section quick-intimacy-section"><div className="quick-checkin-section-title"><div><span><LockKeyhole /></span><h3>Интимная жизнь</h3></div><small>Добровольно</small></div><IntimacyEditor day={intimacyDay} onChange={(patch) => setIntimacyPatch((current) => ({ ...current, ...patch }))} /></section>}
      </div>}

      {symptoms.length > 0 && <section className="quick-severity"><div className="quick-checkin-section-title"><div><span><CircleGauge /></span><h3>Насколько выражено?</h3></div><small>Для каждого симптома</small></div>{symptoms.map((symptom) => <div className="quick-severity-row" key={symptom.id}><strong>{symptom.label}</strong><div>{([1,2,3] as const).map((value) => <button key={value} className={symptom.severity === value ? 'active' : ''} aria-pressed={symptom.severity === value} onClick={() => setSeverity(symptom.id, value)}>{value}<small>{symptomSeverityText(value)}</small></button>)}</div></div>)}</section>}

      {symptoms.length > 0 && <section className="quick-impact-section"><div><span><ShieldCheck /></span><p><strong>Мешало обычным делам?</strong><small>Необязательно. Помогает Mira заметить важное для отчёта врачу.</small></p></div><button className={`quick-impact-toggle ${impactMarked ? 'active' : ''}`} aria-pressed={impactMarked} onClick={toggleImpact}><span>{impactMarked && <Check />}</span>{impactMarked ? 'Да, мешало' : 'Нет'}</button></section>}

      {painAffectsLife && <aside className="quick-safety-alert"><CircleAlert /><span><strong>Боль не нужно терпеть</strong>Если она новая, резкая, усиливается или мешает обычной жизни, обсудите это с врачом. При внезапной сильной боли нужна срочная помощь.</span></aside>}

      <button className="primary-button quick-checkin-save" disabled={symptoms.length === 0 && !symptomsNone && moods.length === 0 && !energy && intimacyDay.intimate !== true} onClick={() => onSave({ symptoms, moods, energy, symptomsChecked: symptoms.length > 0 || symptomsNone, ...intimacyPatch })}><Check /> Сохранить состояние</button>
    </section>
  </div>;
}

function SymptomSavedSheet({ day, onClose, onOpenDiary, onOpenAnalytics }: { day: AuraDayEntry; onClose: () => void; onOpenDiary: () => void; onOpenAnalytics: () => void }) {
  return <div className="attention-overlay symptom-saved-overlay" onClick={onClose}>
    <section className="attention-modal symptom-saved-modal" role="dialog" aria-modal="true" aria-labelledby="symptom-saved-title" onClick={(event) => event.stopPropagation()}>
      <button className="attention-close" onClick={onClose} aria-label="Закрыть подтверждение"><X /></button>
      <span className="symptom-saved-icon"><Check /></span>
      <span className="eyebrow">Запись сохранена</span>
      <h2 id="symptom-saved-title">Mira учтёт это в вашей истории</h2>
      {day.symptoms.length ? <div className="symptom-saved-list">{day.symptoms.map((symptom) => <span key={symptom.id}><strong>{symptom.label}</strong><small>Выраженность {symptom.severity}/3 · {symptomSeverityText(symptom.severity)}{symptom.affectsLife ? ' · мешало обычным делам' : ''}</small></span>)}</div> : <p className="symptom-saved-clear">{day.moods.length ? `Настроение сохранено: ${day.moods.join(', ').toLowerCase()}.` : `Энергия сохранена: ${day.energy} из 5.`}</p>}
      <p className="symptom-saved-note">Запись уже находится в Дневнике. Аналитика будет сравнивать её только с другими сохранёнными днями.</p>
      <div className="symptom-saved-actions"><button onClick={onOpenDiary}><NotebookTabs /> Открыть дневник</button><button onClick={onOpenAnalytics}><ChartSpline /> Смотреть динамику</button></div>
      <button className="text-button" onClick={onClose}>Остаться на главной</button>
    </section>
  </div>;
}

function DailyPlanModal({ date, day, onPatch, onClose }: { date: string; day: AuraDayEntry; onPatch: (patch: Partial<AuraDayEntry>) => void; onClose: () => void }) {
  const careItems = day.careItems ?? [];
  const toggleCareItem = (id: string) => onPatch({ careItems: careItems.includes(id) ? careItems.filter((item) => item !== id) : [...careItems, id] });
  return <div className="attention-overlay daily-plan-overlay" onClick={onClose}>
    <section className="attention-modal daily-plan-modal" role="dialog" aria-modal="true" aria-label={`Аптечка · ${formatRuDate(date)}`} onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть план на сегодня"><X /></button>
      <header className="care-kit-modal-header">
        <img src="/mira-icons/first-aid-kit.png" alt="Аптечка" />
      </header>
      <div className="care-kit-modal-items">{dailyCareItems.map((item) => {
          const checked = careItems.includes(item.id);
          return <button key={item.id} className={checked ? 'checked' : ''} onClick={() => toggleCareItem(item.id)} aria-pressed={checked}><img src={item.image} alt="" /><strong>{item.title}</strong>{checked && <span><Check /></span>}</button>;
        })}</div>
      <button className="primary-button care-kit-done" onClick={onClose}>Готово</button>
    </section>
  </div>;
}

type SupportOption = {
  title: string;
  note: string;
  icon: LucideIcon;
  tone: 'rose' | 'amber' | 'sage';
};

function getSupportOptions(day: AuraDayEntry): SupportOption[] {
  const text = day.symptoms.map((symptom) => `${symptom.id} ${symptom.label}`.toLowerCase()).join(' ');
  const options: SupportOption[] = [];
  const add = (option: SupportOption) => {
    if (!options.some((item) => item.title === option.title)) options.push(option);
  };
  if (/боль|спазм|cramp|pain|живот|таз/.test(text)) {
    add({ title: 'Мягкое тепло', note: 'Тёплая грелка или душ могут уменьшить ощущение спазмов.', icon: ThermometerSun, tone: 'rose' });
    add({ title: 'Если боль не проходит', note: 'Обсудите безопасные варианты помощи с врачом или фармацевтом, особенно если боль новая или сильная.', icon: Stethoscope, tone: 'amber' });
  }
  if (/голов|мигрен|head/.test(text)) {
    add({ title: 'Вода и тихий отдых', note: 'Снизьте яркость света, отдохните и проверьте, достаточно ли вы пили.', icon: GlassWater, tone: 'sage' });
    add({ title: 'Если состояние необычное', note: 'При новой, резкой или усиливающейся головной боли лучше обратиться за медицинской оценкой.', icon: Stethoscope, tone: 'amber' });
  }
  if (/устал|слаб|fatigue|энерг/.test(text)) {
    add({ title: 'Восстановление', note: 'Еда, вода и короткий отдых — первый безопасный шаг при усталости.', icon: Moon, tone: 'sage' });
    add({ title: 'Проверить причину', note: 'Если слабость повторяется или усиливается, сохраните отметки и обсудите их со специалистом.', icon: Stethoscope, tone: 'amber' });
  }
  if (/настро|раздраж|тревог|mood|груд/.test(text)) {
    add({ title: 'Мягкий режим', note: 'Сон, регулярная еда и спокойная активность могут поддержать самочувствие.', icon: Heart, tone: 'rose' });
    add({ title: 'Наблюдать повторяемость', note: 'Отмечайте состояние несколько циклов; устойчивую картину можно обсудить со специалистом.', icon: ChartSpline, tone: 'amber' });
  }
  return options.length ? options.slice(0, 4) : [
    { title: 'Сначала отметьте симптомы', note: 'Mira подберёт подходящие варианты поддержки по вашим отметкам за день.', icon: ListChecks, tone: 'rose' },
  ];
}

function SupportOptionsModal({ date, day, onAddSymptoms, onClose }: { date: string; day: AuraDayEntry; onAddSymptoms: () => void; onClose: () => void }) {
  const options = getSupportOptions(day);
  const hasSymptoms = day.symptoms.length > 0;
  return <div className="attention-overlay support-options-overlay" onClick={onClose}>
    <section className="attention-modal support-options-modal" role="dialog" aria-modal="true" aria-labelledby="support-options-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть варианты поддержки"><X /></button>
      <header className="support-options-header">
        <img src="/mira-icons/vitamins.png" alt="" />
        <div><span className="eyebrow">Поддержка · {formatRuDate(date)}</span><h2 id="support-options-title">{hasSymptoms ? 'Что может помочь' : 'Добавьте самочувствие'}</h2><p>{hasSymptoms ? `Основано на отметках: ${day.symptoms.slice(0, 2).map((item) => item.label.toLowerCase()).join(' и ')}${day.symptoms.length > 2 ? ` и ещё ${day.symptoms.length - 2}` : ''}.` : 'После отметки симптомов здесь появятся подходящие варианты.'}</p></div>
      </header>
      <div className="support-options-list">{options.map(({ title, note, icon: Icon, tone }) => <article className={`support-option tone-${tone}`} key={title}><span><Icon /></span><div><strong>{title}</strong><p>{note}</p></div><ChevronRight /></article>)}</div>
      {hasSymptoms ? <aside className="support-options-safety"><ShieldCheck /><p><strong>Это не назначение</strong><span>Перед лекарствами и добавками проверьте инструкцию, противопоказания и совместимость. При сильных или необычных симптомах обратитесь к врачу.</span></p></aside> : <button className="primary-button support-options-action" onClick={onAddSymptoms}><Plus /> Отметить симптомы</button>}
      {hasSymptoms && <button className="primary-button support-options-action" onClick={onClose}>Понятно</button>}
    </section>
  </div>;
}

function getHormonoscopeSimilarDays(data: AuraState, date: string) {
  const starts = data.periodStarts.filter((start) => start <= date).sort();
  const currentStart = starts[starts.length - 1];
  if (!currentStart) return [];
  const cycleDay = daysBetween(currentStart, date) + 1;
  return starts.slice(0, -1).slice(-5).flatMap((start, index, previousStarts) => {
    const nextStart = previousStarts[index + 1] ?? currentStart;
    const candidates = Object.entries(data.entries)
      .filter(([entryDate, entry]) => entryDate >= start && entryDate < nextStart && Math.abs(daysBetween(start, entryDate) + 1 - cycleDay) <= 2 && (entry.energy || entry.rating || entry.moods.length || entry.symptoms.length))
      .sort(([firstDate], [secondDate]) => Math.abs(daysBetween(start, firstDate) + 1 - cycleDay) - Math.abs(daysBetween(start, secondDate) + 1 - cycleDay));
    return candidates.length ? [candidates[0][1]] : [];
  });
}

function FrequencyDots({ filled, total }: { filled: number; total: number }) {
  return <span className="hormonoscope-frequency" aria-label={`Так было в ${filled} из ${total} похожих дней`}>{Array.from({ length: total }, (_, index) => <i key={index} className={index < filled ? 'filled' : ''} />)}</span>;
}

function ScopesModule({ data, date, onFeedback }: { data: AuraState; date: string; onFeedback: (date: string, feedback: AuraHormonoscopeFeedback) => void }) {
  const [showMethod, setShowMethod] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const similarDays = getHormonoscopeSimilarDays(data, date);
  const total = similarDays.length;
  const energyValues = similarDays.flatMap((entry) => entry.energy ? [entry.energy] : []);
  const positiveEnergy = energyValues.filter((value) => value >= 4).length;
  const ratingValues = similarDays.flatMap((entry) => entry.rating ? [entry.rating] : []);
  const positiveMood = ratingValues.filter((value) => value >= 4).length;
  const symptomFrequency = new Map<string, number>();
  similarDays.forEach((entry) => new Set(entry.symptoms.map((symptom) => symptom.label)).forEach((label) => symptomFrequency.set(label, (symptomFrequency.get(label) ?? 0) + 1)));
  const strongestBodyPattern = Math.max(0, ...symptomFrequency.values());
  const bodyPattern = Array.from(symptomFrequency.entries()).sort((first, second) => second[1] - first[1])[0];
  const calculatedObservations = total >= 3 ? [
    energyValues.length >= 3 ? { id: 'energy', icon: Zap, title: 'Энергия', text: positiveEnergy >= Math.ceil(energyValues.length * .6) ? 'Чаще выше средней' : 'Обычно без явного подъёма', filled: positiveEnergy } : null,
    ratingValues.length >= 3 ? { id: 'mood', icon: Smile, title: 'Настроение', text: positiveMood >= Math.ceil(ratingValues.length * .6) ? 'Обычно ровное или хорошее' : 'Выраженного паттерна пока нет', filled: positiveMood } : null,
    { id: 'body', icon: HeartPulse, title: 'Тело', text: bodyPattern && strongestBodyPattern >= Math.ceil(total * .6) ? `Часто: ${bodyPattern[0].toLowerCase()}` : 'Выраженного паттерна пока нет', filled: strongestBodyPattern },
  ].filter((item): item is { id: string; icon: LucideIcon; title: string; text: string; filled: number } => Boolean(item)) : [];
  const ready = total >= 3 && calculatedObservations.length > 0;
  const feedback = data.hormonoscopeFeedback[date];
  const suggestions = ['Задачи с общением', 'Привычная активность', 'Встречи и контакты'];
  const moreSuggestions = ['Спокойное планирование', 'Короткая прогулка', 'Проверить самочувствие'];

  return <section className="scopes-module hormonoscope-mini">
    <header className="hormonoscope-mini-head"><div><Sparkle /><strong>Hormonoscope</strong><em>{ready ? 'Личное наблюдение' : 'Собираем данные'}</em></div><button onClick={() => setShowMethod((value) => !value)} aria-expanded={showMethod}>По {total} похожим {pluralRu(total, 'дню', 'дням', 'дням')} <Info /></button></header>
    {showMethod && <p className="hormonoscope-method">Mira сравнивает только ваши заполненные дни рядом с тем же днём предыдущих циклов. Пропуски не считаются отсутствием симптома.</p>}
    {ready ? <>
      <h2>Что повторялось в похожие дни</h2>
      <div className={`hormonoscope-observations count-${calculatedObservations.length}`}>{calculatedObservations.map(({ id, icon: Icon, title, text, filled }) => <article key={id} className={id}><Icon /><strong>{title}</strong><p>{text}</p><FrequencyDots filled={Math.min(total, filled)} total={total} /></article>)}</div>
      <div className="hormonoscope-suggestions"><h3>Сегодня может подойти</h3><div>{suggestions.map((suggestion) => <span key={suggestion}>{suggestion}</span>)}<button onClick={() => setShowMore((value) => !value)} aria-label="Показать ещё варианты" aria-expanded={showMore}>•••</button>{showMore && moreSuggestions.map((suggestion) => <span key={suggestion} className="more">{suggestion}</span>)}</div></div>
      <footer className="hormonoscope-feedback"><span>{feedback ? 'Спасибо, ответ сохранён' : 'Насколько полезно наблюдение?'}</span><div>{([['matched', '🙂'], ['neutral', '😐'], ['missed', '🙁']] as const).map(([value, emoji]) => <button key={value} className={feedback === value ? 'active' : ''} aria-label={value === 'matched' ? 'Полезно' : value === 'neutral' ? 'Нейтрально' : 'Не полезно'} aria-pressed={feedback === value} onClick={() => onFeedback(date, value)}>{emoji}</button>)}</div></footer>
    </> : <div className="hormonoscope-empty"><CalendarRange /><h3>Пока недостаточно похожих дней</h3><p>Есть {total} из 3 необходимых дней с отметками. Это не означает, что закономерности нет.</p></div>}
  </section>;
}

function CycloscopeMiniCard({ data, date, onFeedback }: { data: AuraState; date: string; onFeedback: (date: string, feedback: AuraHormonoscopeFeedback) => void }) {
  const [showInfo, setShowInfo] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [signIndex, setSignIndex] = useState(0);
  const feedback = data.cycloscopeFeedback[date];
  const signs = ['Обратите внимание на случайную встречу.', 'Заметьте идею, которая появится между делом.', 'Сохраните фразу, которая сегодня отзовётся.'];
  const chips: Array<{ label: string; icon: LucideIcon }> = [
    { label: 'Общение', icon: MessageSquareText },
    { label: 'Новые знакомства', icon: UserRound },
    { label: 'Движение', icon: PersonStanding },
  ];
  const extraChips = ['Творческий импульс', 'Небольшая прогулка', 'Спонтанный план'];
  const toggleChip = (chip: string) => setSelectedChips((current) => current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]);

  return <section className="cycloscope-mini-card">
    <header className="cycloscope-mini-head"><div><Sparkle /><strong>Циклоскоп</strong><em>Новое</em></div><button onClick={() => setShowInfo((value) => !value)} aria-expanded={showInfo}>Для настроения <Info /></button></header>
    {showInfo && <p className="cycloscope-mini-info">Лёгкий игровой прогноз для настроения. Не медицинская рекомендация и не анализ здоровья.</p>}
    <div className="cycloscope-mini-main">
      <div className="cycloscope-mini-copy"><small>Ваш образ дня</small><h2>✧ Магнит ✧</h2><p>Сегодня можно позволить себе быть немного заметнее. Хорошие идеи могут появиться через общение, новые знакомства или случайные совпадения. Если захочется — дайте себе чуть больше открытости к людям и возможностям дня.</p></div>
    </div>
    <div className="cycloscope-mini-chips"><h3>Сегодня может подойти</h3><div>{chips.map(({ label, icon: Icon }) => <button key={label} className={selectedChips.includes(label) ? 'active' : ''} aria-pressed={selectedChips.includes(label)} onClick={() => toggleChip(label)}><Icon />{label}</button>)}<button className="more-button" onClick={() => setShowMore((value) => !value)} aria-label="Показать ещё варианты" aria-expanded={showMore}>•••</button>{showMore && extraChips.map((chip) => <button key={chip} className={`extra ${selectedChips.includes(chip) ? 'active' : ''}`} aria-pressed={selectedChips.includes(chip)} onClick={() => toggleChip(chip)}>{chip}</button>)}</div></div>
    <div className="cycloscope-mini-sign"><span><Sparkle /></span><div><strong>Маленький знак</strong><p>{signs[signIndex]}</p></div><button onClick={() => setSignIndex((current) => (current + 1) % signs.length)} aria-label="Показать другой знак"><ChevronRight /></button></div>
    <footer className="cycloscope-mini-feedback"><span>{feedback ? 'Спасибо за реакцию' : 'Как вам сегодняшний Циклоскоп?'}</span><div>{([['matched', '🙂'], ['neutral', '😐'], ['missed', '🙁']] as const).map(([value, emoji]) => <button key={value} className={`${value} ${feedback === value ? 'active' : ''}`} aria-label={value === 'matched' ? 'Понравился' : value === 'neutral' ? 'Нейтрально' : 'Не понравился'} aria-pressed={feedback === value} onClick={() => onFeedback(date, value)}>{emoji}</button>)}</div></footer>
  </section>;
}

type CycloscopeInsight = {
  status: 'empty' | 'early' | 'repeated' | 'pattern';
  cycleDay: number | null;
  symptom?: string;
  count: number;
  cycles: number;
  dates: string[];
  title: string;
  text: string;
};

function getCycloscopeInsight(data: AuraState, date: string): CycloscopeInsight {
  const metrics = getAuraCycleMetrics(data, date);
  if (!metrics.cycleDay || !metrics.starts.length) return { status: 'empty', cycleDay: null, count: 0, cycles: 0, dates: [], title: 'Нужна история цикла', text: 'Добавьте начало месячных и отмечайте самочувствие.' };
  const currentStart = [...metrics.starts].reverse().find((start) => start <= date) ?? null;
  const stats = new Map<string, { label: string; count: number; cycles: Set<string>; dates: string[] }>();
  Object.entries(data.entries).forEach(([entryDate, entry]) => {
    const start = [...metrics.starts].reverse().find((item) => item <= entryDate);
    if (!start || start === currentStart) return;
    const cycleDay = daysBetween(start, entryDate) + 1;
    if (Math.abs(cycleDay - metrics.cycleDay!) > 2) return;
    entry.symptoms.forEach((symptom) => {
      const current = stats.get(symptom.id) ?? { label: symptom.label, count: 0, cycles: new Set<string>(), dates: [] };
      current.count += 1;
      current.cycles.add(start);
      current.dates.push(entryDate);
      stats.set(symptom.id, current);
    });
  });
  const top = [...stats.values()].sort((left, right) => right.cycles.size - left.cycles.size || right.count - left.count)[0];
  if (!top) return { status: 'early', cycleDay: metrics.cycleDay, count: 0, cycles: metrics.completedCycles, dates: [], title: 'Пока мало похожих отметок', text: `Отмечайте состояние около ${metrics.cycleDay}-го дня ещё в нескольких циклах.` };
  const status = top.cycles.size >= 3 ? 'pattern' : top.cycles.size >= 2 ? 'repeated' : 'early';
  const title = status === 'pattern' ? 'Похоже на личную закономерность' : status === 'repeated' ? 'Похоже, это повторяется' : 'Предварительное наблюдение';
  const text = status === 'early'
    ? `${top.label} отмечалась в похожий период одного прошлого цикла.`
    : `${top.label} отмечалась около ${metrics.cycleDay}-го дня в ${top.cycles.size} ${pluralRu(top.cycles.size, 'цикле', 'циклах', 'циклах')}.`;
  return { status, cycleDay: metrics.cycleDay, symptom: top.label, count: top.count, cycles: top.cycles.size, dates: top.dates.sort().reverse(), title, text };
}

function CycloscopeCard({ data, date, onOpen }: { data: AuraState; date: string; onOpen: () => void }) {
  const insight = getCycloscopeInsight(data, date);
  return <button className={`cycloscope-card ${insight.status}`} onClick={onOpen}>
    <span className="cycloscope-icon"><InfinityIcon /></span>
    <span className="cycloscope-copy"><small>Циклоскоп · личная история</small><strong>{insight.title}</strong><p>{insight.text}</p></span>
    <span className="cycloscope-evidence">{insight.status === 'empty' ? 'Начать' : insight.status === 'early' ? 'Мало данных' : `${insight.cycles} ${pluralRu(insight.cycles, 'цикл', 'цикла', 'циклов')}`}<ChevronRight /></span>
  </button>;
}

function CycloscopeModal({ data, date, onClose, onOpenDiary }: { data: AuraState; date: string; onClose: () => void; onOpenDiary: () => void }) {
  const insight = getCycloscopeInsight(data, date);
  return <div className="attention-overlay cycloscope-overlay" onClick={onClose}>
    <section className="attention-modal cycloscope-modal" role="dialog" aria-modal="true" aria-labelledby="cycloscope-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" /><button className="attention-close" onClick={onClose} aria-label="Закрыть Циклоскоп"><X /></button>
      <header className="cycloscope-modal-head"><span><InfinityIcon /></span><div><small>Циклоскоп · личная история</small><h2 id="cycloscope-title">{insight.title}</h2></div></header>
      <section className="cycloscope-insight">
        <span className={`cycloscope-confidence ${insight.status}`}>{insight.status === 'pattern' ? 'Личная закономерность' : insight.status === 'repeated' ? 'Повторилось' : insight.status === 'early' ? 'Предварительно' : 'Нет данных'}</span>
        <h3>{insight.text}</h3>
        {insight.symptom && <div className="cycloscope-path"><span><small>Похожие дни</small><strong>{insight.cycleDay ? `${Math.max(1, insight.cycleDay - 2)}–${insight.cycleDay + 2}` : '—'}</strong></span><ChevronRight /><span><small>Отметка</small><strong>{insight.symptom}</strong></span><ChevronRight /><span><small>Основание</small><strong>{insight.count} {pluralRu(insight.count, 'запись', 'записи', 'записей')}</strong></span></div>}
      </section>
      {insight.dates.length > 0 && <section className="cycloscope-history"><small>Когда это отмечалось</small>{insight.dates.slice(0, 3).map((item) => <span key={item}><i /><strong>{formatRuDate(item, true)}</strong><em>похожий день цикла</em></span>)}</section>}
      <aside className="cycloscope-note"><ShieldCheck /><span>Циклоскоп показывает совпадения в ваших записях. Он не доказывает причину и не гарантирует повторение.</span></aside>
      <button className="primary-button" onClick={insight.status === 'empty' || insight.status === 'early' ? onOpenDiary : onClose}>{insight.status === 'empty' || insight.status === 'early' ? 'Добавить отметку' : 'Понятно'}</button>
    </section>
  </div>;
}

function WorkoutModal({ workout, onPatch, onRegenerate, onClose }: { workout: AuraWorkoutLog; onPatch: (patch: Partial<AuraWorkoutLog>) => void; onRegenerate: (venue?: WorkoutVenue) => void; onClose: () => void }) {
  const isRest = workout.level === 'rest';
  const canRegenerate = workout.status !== 'in_progress';
  const completedExerciseIds = workout.completedExerciseIds ?? [];
  const workoutVenue = workout.venue ?? 'home';
  const snapshotItems = [
    workout.snapshot.cycleDay ? `${workout.snapshot.cycleDay}-й день цикла` : 'День цикла неизвестен',
    workout.snapshot.energy ? `Энергия ${workout.snapshot.energy}/5` : 'Энергия не отмечена',
    workout.snapshot.sleepHours ? `Сон ${workout.snapshot.sleepHours} ч` : workout.snapshot.sleepQuality ? `Сон: ${workout.snapshot.sleepQuality.toLowerCase()}` : 'Сон не отмечен',
  ];
  const begin = () => onPatch({ status: 'in_progress', startedAt: new Date().toISOString(), completedAt: undefined, feedback: undefined });
  const complete = () => onPatch({ status: 'completed', completedAt: new Date().toISOString() });
  const skip = () => onPatch({ status: 'skipped', completedAt: new Date().toISOString() });
  const toggleExercise = (id: string) => onPatch({ completedExerciseIds: completedExerciseIds.includes(id) ? completedExerciseIds.filter((item) => item !== id) : [...completedExerciseIds, id] });
  const venueOptions: Array<{ id: WorkoutVenue; label: string; icon: LucideIcon }> = [
    { id: 'home', label: 'Дома', icon: House },
    { id: 'outdoor', label: 'На улице', icon: Sun },
    { id: 'gym', label: 'В зале', icon: Dumbbell },
  ];
  return <div className="attention-overlay workout-overlay" onClick={onClose}>
    <section className={`attention-modal workout-modal level-${workout.level}`} role="dialog" aria-modal="true" aria-labelledby="workout-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть тренировку"><X /></button>
      <header className="workout-header">
        <span className="workout-header-icon">{isRest ? <Moon /> : <Dumbbell />}</span>
        <div><span className="eyebrow">Тренировка на сегодня</span><h2 id="workout-title">{workout.title}</h2><p>{workoutLevelCopy[workout.level]} · {workout.intensityLabel}</p></div>
        <span className={`workout-status ${workout.status}`}>{workoutStatusCopy[workout.status]}</span>
      </header>

      <div className="workout-summary">
        <span><Timer /><strong>{workout.durationMin}</strong><small>минут</small></span>
        <span><CircleGauge /><strong>{workout.exercises.length}</strong><small>{isRest ? 'шага' : 'упражнений'}</small></span>
        <span><Activity /><strong>{workout.intensityLabel}</strong><small>интенсивность</small></span>
      </div>

      {!isRest && <section className="workout-venue">
        <div><strong>Где тренируемся?</strong><small>{workout.recentCompletedCount ?? 0} из {workout.weeklyTarget ?? 3} тренировок за 7 дней</small></div>
        <div>{venueOptions.map(({ id, label, icon: Icon }) => <button key={id} className={workoutVenue === id ? 'active' : ''} disabled={!canRegenerate} onClick={() => onRegenerate(id)}><Icon />{label}</button>)}</div>
      </section>}

      <section className="workout-why">
        <div className="workout-section-title"><div><Sparkle /><h3>Почему такой вариант</h3></div>{canRegenerate && <button onClick={() => onRegenerate(workoutVenue)}><RefreshCw /> Обновить</button>}</div>
        <div className="workout-context">{snapshotItems.map((item) => <span key={item}>{item}</span>)}</div>
        <ul>{workout.reasons.map((reason) => <li key={reason}><Check />{reason}</li>)}</ul>
      </section>

      <section className="workout-exercises">
        <div className="workout-section-title"><div><ListChecks /><h3>{isRest ? 'План восстановления' : 'Готовая последовательность'}</h3></div><small>{completedExerciseIds.length} / {workout.exercises.length}</small></div>
        <ol>{workout.exercises.map((exercise, index) => {
          const checked = completedExerciseIds.includes(exercise.id);
          return <li key={exercise.id} className={checked ? 'checked' : ''}><button onClick={() => toggleExercise(exercise.id)} aria-pressed={checked}><span>{checked ? <Check /> : index + 1}</span><div><strong>{exercise.title}</strong><small>{exercise.amount}</small><p>{exercise.note}</p></div></button></li>;
        })}</ol>
      </section>

      <aside className="workout-safety"><ShieldCheck /><p><strong>Ориентируйтесь на самочувствие</strong><span>Остановитесь при боли, головокружении, боли в груди или необычной одышке. Это не медицинское назначение. Упражнения Кегеля не добавляются автоматически: тазовое дно должно уметь не только напрягаться, но и расслабляться.</span></p></aside>

      {workout.status === 'completed' && <section className="workout-feedback"><span>Как ощущалась нагрузка?</span><div>{([
        ['easy', 'Слишком легко'],
        ['right', 'В самый раз'],
        ['hard', 'Слишком тяжело'],
      ] as Array<[WorkoutFeedback, string]>).map(([value, label]) => <button key={value} className={workout.feedback === value ? 'active' : ''} onClick={() => onPatch({ feedback: value })}>{workout.feedback === value && <Check />}{label}</button>)}</div></section>}

      <div className="workout-actions">
        {workout.status === 'planned' && (isRest
          ? <button className="primary-button" onClick={complete}><Check /> Сохранить день восстановления</button>
          : <button className="primary-button" onClick={begin}><Play /> Начать тренировку</button>)}
        {workout.status === 'in_progress' && <button className="primary-button" onClick={complete}><Check /> Завершить и сохранить</button>}
        {workout.status === 'completed' && <button className="primary-button" onClick={onClose}><Check /> Готово</button>}
        {workout.status === 'skipped' && <button className="primary-button" onClick={() => onRegenerate(workoutVenue)}><RefreshCw /> Подобрать заново</button>}
        {workout.status === 'planned' && !isRest && <button className="text-button" onClick={skip}>Сегодня пропустить</button>}
      </div>
    </section>
  </div>;
}

function AttentionModal({ evidence, onClose, onOpenReport }: { evidence: ReturnType<typeof deriveAttentionEvidence>; onClose: () => void; onOpenReport: () => void }) {
  const cycleMap = new Map<string, { start: string; count: number; impact: number; max: number }>();
  evidence.entries.forEach((entry) => {
    const current = cycleMap.get(entry.cycleStart) ?? { start: entry.cycleStart, count: 0, impact: 0, max: 0 };
    current.count += 1;
    current.impact += Number(entry.affectsLife);
    current.max = Math.max(current.max, entry.value);
    cycleMap.set(entry.cycleStart, current);
  });
  const cycles = [...cycleMap.values()].sort((left, right) => left.start.localeCompare(right.start)).slice(-4);
  const reliability = evidence.painDays >= 5 && evidence.cycles >= 3 ? 'Повторяемость заметна' : 'Первые признаки';
  return <div className="attention-overlay" onClick={onClose}>
    <section className="attention-modal pattern-modal" role="dialog" aria-modal="true" aria-labelledby="attention-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть динамику"><X /></button>
      <header className="attention-modal-header">
        <span className="attention-modal-icon"><ChartSpline /></span>
        <div><span className="eyebrow">Mira заметила повторение</span><h2 id="attention-title">Боль повторяется в нескольких циклах</h2></div>
      </header>
      <p className="attention-lead">За {evidence.cycles} {pluralRu(evidence.cycles, 'цикл', 'цикла', 'циклов')} боль отмечена {evidence.painDays} {pluralRu(evidence.painDays, 'раз', 'раза', 'раз')}. В {evidence.impactDays} {pluralRu(evidence.impactDays, 'случае', 'случаях', 'случаях')} она мешала обычным делам.</p>

      <div className="attention-pattern-state"><span><Sparkle /></span><div><small>Надёжность наблюдения</small><strong>{reliability}</strong><p>{evidence.painDays >= 5 ? 'Данных достаточно, чтобы показать повторение, но не чтобы объяснять причину.' : 'Продолжайте отмечать боль — картина будет точнее.'}</p></div></div>

      <section className="attention-analysis">
        <div className="section-heading"><div><span className="eyebrow">Динамика</span><h3>Боль по циклам</h3></div><span className="soft-status">{evidence.cycles} {pluralRu(evidence.cycles, 'цикл', 'цикла', 'циклов')}</span></div>
        <div className="attention-bars" role="img" aria-label={`Боль отмечена в ${evidence.cycles} циклах`}>
          {cycles.map((cycle) => <span key={cycle.start}><b>{cycle.count} {pluralRu(cycle.count, 'день', 'дня', 'дней')}</b><i style={{ height: `${28 + cycle.max * 18}%` }}><em>{cycle.impact ? `${cycle.impact} меш.` : 'не меш.'}</em></i><small>{new Date(`${cycle.start}T12:00:00`).toLocaleDateString('ru-RU',{ month: 'short' })}</small></span>)}
        </div>
        <p>Основано на {evidence.painDays} сохранённых отметках. Пустые дни не считаются отсутствием боли.</p>
      </section>

      <div className="attention-report-note"><FileHeart /><p><strong>Для разговора с врачом</strong>В отчёт попадут даты, выраженность боли и влияние на обычные дела.</p></div>
      <div className="attention-actions">
        <button className="primary-button" onClick={onOpenReport}><FileHeart /> Показать в отчёте врачу</button>
      </div>
    </section>
  </div>;
}

function MetricCard({ icon: Icon, illustration, tone, label, value, note, progress = 0 }: { icon: LucideIcon; illustration?: string; tone: string; label: string; value: string; note: string; progress?: number }) {
  return <article className={`metric-card rhythm-card ${tone} ${progress ? 'has-value' : 'is-empty'}`}>
    <div className="rhythm-card-head">{illustration ? <img src={illustration} alt="" aria-hidden="true" /> : <span className={`metric-icon ${tone}`}><Icon /></span>}<small>{label}</small></div>
    <strong>{value}</strong><span className="rhythm-note">{note}</span>
    <i className="rhythm-progress"><b style={{ width: `${progress}%` }} /></i>
  </article>;
}

function Calendar({ data, scenario, onSelectDate, onSetPeriodStart, onNotify, onBack, onOpenDiary }: { data: AuraState; scenario: PrototypeScenario; onSelectDate: (date: string) => void; onSetPeriodStart: (date: string, marked: boolean) => void; onNotify: (message: string) => void; onBack: () => void; onOpenDiary: () => void }) {
  const selected = localDate(data.selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthDays = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: Math.ceil((leading + monthDays) / 7) * 7 }, (_, index) => {
    const day = index - leading + 1;
    return day >= 1 && day <= monthDays ? day : null;
  });
  const selectedEntry = data.entries[data.selectedDate];
  const metrics = getAuraCycleMetrics(data);
  const forecastRange = formatRuRange(metrics.forecast?.start, metrics.forecast?.end);
  const confidence = metrics.forecast?.confidence;
  const forecastMonth = metrics.forecast ? localDate(metrics.forecast.start) : null;
  const forecastOutsideVisibleMonth = Boolean(forecastMonth && (forecastMonth.getFullYear() !== year || forecastMonth.getMonth() !== month));
  const monthIso = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const isForecast = (date: string) => Boolean(metrics.forecast && date >= metrics.forecast.start && date <= metrics.forecast.end);
  const isPeriod = (date: string) => data.periodStarts.includes(date) || Boolean(data.entries[date]?.period && data.entries[date]?.period !== 'none');
  const selectedIsPeriodStart = data.periodStarts.includes(data.selectedDate);
  const selectedIsFuture = data.selectedDate > AURA_TODAY;
  const selectedLabel = `${formatRuDate(data.selectedDate)}${data.selectedDate === AURA_TODAY ? ' · сегодня' : ''}`;
  return <div className="screen calendar-screen">
    <TopBack title="Календарь" onBack={onBack} action={<button className="round-button" aria-label="О календаре"><Info /></button>} />
    <section className="calendar-summary aura-hero">
      <span className="glass-label"><Sparkle /> {metrics.daysLate ? 'Окно возможного начала прошло' : confidence === 'personal' ? 'Личный диапазон начала' : confidence === 'growing' ? 'Диапазон уточняется' : confidence === 'preliminary' ? 'Календарный ориентир' : 'Данных пока мало'}</span><h2>{metrics.daysLate ? `После диапазона прошло ${metrics.daysLate} дн.` : forecastRange}</h2><p>{metrics.daysLate ? `Расчётное окно возможного начала было ${forecastRange}. Это календарный ориентир, а не диагноз.` : metrics.forecastCyclesUsed >= 3 ? `Диапазон возможного начала рассчитан по ${metrics.forecastCyclesUsed} завершённым циклам.` : metrics.forecast ? `Пока используем стартовую настройку ${metrics.expectedLength} дней. Личный диапазон появится после трёх завершённых циклов.` : 'Добавьте длину цикла в настройках или следующую фактическую дату начала.'}</p>
      <div className="confidence-line"><span style={{ width: confidence === 'personal' ? '78%' : confidence === 'growing' ? '52%' : confidence === 'preliminary' ? '28%' : '0%' }} /></div><small>Уверенность растёт с новыми завершёнными циклами</small>
    </section>
    <section className="surface month-card">
      <div className="month-title"><button onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} aria-label="Предыдущий месяц"><ChevronLeft /></button><h2>{ruMonthTitles[month]} {year}</h2><button onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} aria-label="Следующий месяц"><ChevronRight /></button></div>
      {forecastOutsideVisibleMonth && forecastMonth && <button className="calendar-forecast-jump" onClick={() => setVisibleMonth(new Date(forecastMonth.getFullYear(), forecastMonth.getMonth(), 1))}><span><i className="forecast" /><strong>Прогноз: {forecastRange}</strong></span><em>Показать <ChevronRight /></em></button>}
      <div className="weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="month-grid">{days.map((day, index) => {
        if (!day) return <i key={index} />;
        const date = monthIso(day);
        return <button key={date} onClick={() => onSelectDate(date)} className={`${isPeriod(date) ? 'period' : ''} ${isForecast(date) ? 'forecast' : ''} ${date === AURA_TODAY ? 'today' : ''} ${data.entries[date] ? 'has-entry' : ''} ${date === data.selectedDate ? 'selected' : ''}`}><span>{day}</span></button>;
      })}</div>
      <div className="calendar-legend"><span><i className="period" /> Месячные</span><span><i className="forecast" /> Прогноз</span><span><i className="entry" /> Есть запись</span></div>
    </section>
    <section className="surface selected-day-card">
      <div><span className="eyebrow">Выбрано</span><h2>{selectedLabel}</h2><p>{selectedIsPeriodStart ? 'Отмечено как первый день нового цикла.' : selectedEntry ? `${selectedEntry.symptoms.length ? 'Симптомы, ' : ''}${selectedEntry.sleepHours ? 'сон, ' : ''}${selectedEntry.water ? 'вода' : 'запись'} сохранены.` : selectedIsFuture ? 'Будущую дату можно посмотреть, но нельзя заполнять заранее.' : 'Выберите действие для этой даты.'}</p></div>
      <div className="selected-day-actions">
        <button className={`calendar-period-action ${selectedIsPeriodStart ? 'active' : ''}`} disabled={selectedIsFuture} onClick={() => {
          onSetPeriodStart(data.selectedDate, !selectedIsPeriodStart);
          onNotify(selectedIsPeriodStart ? `Начало цикла ${formatRuDate(data.selectedDate)} удалено` : `${formatRuDate(data.selectedDate)} отмечено как начало нового цикла`);
        }}>{selectedIsPeriodStart ? <Check /> : <Droplet />}<span><strong>{selectedIsPeriodStart ? 'Начало отмечено' : 'Отметить начало месячных'}</strong><small>{selectedIsPeriodStart ? 'Нажмите, чтобы убрать' : 'Прогноз пересчитается сразу'}</small></span></button>
        <button className="calendar-entry-action" disabled={selectedIsFuture} onClick={onOpenDiary}>{selectedEntry ? 'Редактировать день' : 'Добавить запись'} <ChevronRight /></button>
      </div>
    </section>
  </div>;
}

function Diary({ data, persistStatus, onPatchEntry, onOpenCalendar, onOpenSettings, onOpenSleepHistory, onOpenWaterHistory, onOpenStepsHistory, onOpenNutritionHistory, onOpenNotesHistory, onOpenTemperatureHistory, onOpenWeightHistory, onDone, onNotify }: { data: AuraState; persistStatus: PersistStatus; onPatchEntry: (date: string, patch: Partial<AuraDayEntry>) => void; onOpenCalendar: () => void; onOpenSettings: () => void; onOpenSleepHistory: () => void; onOpenWaterHistory: () => void; onOpenStepsHistory: () => void; onOpenNutritionHistory: () => void; onOpenNotesHistory: () => void; onOpenTemperatureHistory: () => void; onOpenWeightHistory: () => void; onDone: () => void; onNotify: (message: string) => void }) {
  const [openModule, setOpenModule] = useState('sleep');
  const day = data.entries[data.selectedDate] ?? emptyAuraEntry();
  const hasStateSummary = day.symptoms.length > 0 || day.moods.length > 0 || Boolean(day.energy);
  const savedSleepDays = Object.values(data.entries).filter((entry) => typeof entry.sleepHours === 'number' && entry.sleepHours > 0).length;
  const savedWaterDays = Object.values(data.entries).filter((entry) => typeof entry.water === 'number' && entry.water > 0).length;
  const savedStepsDays = Object.values(data.entries).filter((entry) => typeof entry.steps === 'number' && entry.steps > 0).length;
  const savedNutritionDays = Object.values(data.entries).filter((entry) => typeof entry.calories === 'number' && entry.calories > 0).length;
  const savedNoteDays = Object.values(data.entries).filter((entry) => Boolean(entry.note?.trim())).length;
  const toggleValue = (items: string[], value: string) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
  const update = (patch: Partial<AuraDayEntry>) => onPatchEntry(data.selectedDate, patch);
  const statusCopy = persistStatus === 'saving' ? 'Сохраняем изменения…' : persistStatus === 'error' ? 'Не удалось сохранить' : 'Все изменения сохранены';
  return <div className="screen diary-screen">
    <AppHeader avatar={data.avatar} title={formatRuDate(data.selectedDate)} onCalendar={onOpenCalendar} />
    <div className={`save-status ${persistStatus}`} >{persistStatus === 'error' ? <CircleAlert /> : persistStatus === 'saving' ? <Save /> : <Check />} {statusCopy}</div>
    {hasStateSummary && <section className="diary-state-summary">
      <div className="diary-state-summary-head"><span><HeartPulse /></span><div><small>{day.completionQuality === 'full' ? 'Полная структурированная отметка' : 'Точечная отметка'}</small><h2>Состояние дня</h2></div></div>
      {day.symptoms.length > 0 && <div className="diary-state-symptoms">{day.symptoms.map((symptom) => <span key={symptom.id}><strong>{symptom.label}</strong><small>{symptomDiaryText(symptom).replace(`${symptom.label} · `, '')}</small></span>)}</div>}
      {(day.moods.length > 0 || day.energy) && <div className="diary-state-meta">{day.moods.length > 0 && <span><Smile />{day.moods.join(', ')}</span>}{day.energy && <span><BatteryLow />Энергия {day.energy}/5</span>}</div>}
      <p>Это краткая сводка уже сохранённой отметки, без повторного ввода.</p>
    </section>}
    <div className="diary-title"><div><span className="eyebrow">Заполните только нужное</span><h2>Разделы дня</h2></div><button onClick={onOpenSettings}><SlidersHorizontal /> Настроить</button></div>
    {data.modules.sleep && <DiaryModule title="Сон" icon={Moon} tone="indigo" summary={day.sleepHours ? `${day.sleepHours} ч · ${day.sleepQuality?.toLowerCase() ?? 'качество не отмечено'}` : 'Не отмечено'} open={openModule === 'sleep'} onToggle={() => setOpenModule(openModule === 'sleep' ? '' : 'sleep')}>
      <SleepDurationEditor value={day.sleepHours ?? 0} onChange={(sleepHours) => update({ sleepHours })} />
      <p className="module-prompt">Как вы чувствуете себя после сна?</p>
      <div className="sleep-quality-options">{([
        ['Плохое','Не отдохнула','Есть усталость',Frown],
        ['Обычное','Нормально','Хватило сил',Meh],
        ['Хорошее','Хорошо','Есть отдых',Smile],
      ] as const).map(([value,title,note,Icon]) => <button key={value} className={day.sleepQuality === value ? 'active' : ''} onClick={() => update({ sleepQuality: value })}><Icon /><span><strong>{title}</strong><small>{note}</small></span>{day.sleepQuality === value && <Check />}</button>)}</div>
      <button className="measurement-history-link sleep" onClick={onOpenSleepHistory}><span><ChartSpline /><strong>История по дням</strong><small>{savedSleepDays} {pluralRu(savedSleepDays, 'сохранённый день', 'сохранённых дня', 'сохранённых дней')}</small></span><ChevronRight /></button>
    </DiaryModule>}
    {data.modules.daily && <DiaryModule title="Вода" icon={Droplet} tone="cyan" summary={day.water ? `${day.water.toLocaleString('ru-RU')} мл` : 'Пока не отмечено'} open={openModule === 'water'} onToggle={() => setOpenModule(openModule === 'water' ? '' : 'water')}>
      <WaterEditor value={day.water ?? 0} onChange={(water) => update({ water })} />
      <button className="measurement-history-link water" onClick={onOpenWaterHistory}><span><ChartSpline /><strong>История по дням</strong><small>{savedWaterDays} {pluralRu(savedWaterDays, 'сохранённый день', 'сохранённых дня', 'сохранённых дней')}</small></span><ChevronRight /></button>
    </DiaryModule>}
    {data.modules.daily && <DiaryModule title="Шаги" icon={Footprints} tone="sage" summary={day.steps ? `${day.steps.toLocaleString('ru-RU')} из 7 000` : 'Пока не отмечено'} open={openModule === 'steps'} onToggle={() => setOpenModule(openModule === 'steps' ? '' : 'steps')}>
      <StepsEditor value={day.steps ?? 0} onChange={(steps) => update({ steps })} />
      <button className="measurement-history-link steps" onClick={onOpenStepsHistory}><span><ChartSpline /><strong>История по дням</strong><small>{savedStepsDays} {pluralRu(savedStepsDays, 'сохранённый день', 'сохранённых дня', 'сохранённых дней')}</small></span><ChevronRight /></button>
    </DiaryModule>}
    {data.modules.activity && <DiaryModule title="Активность" icon={Dumbbell} tone="sage" summary={day.workout ? `${workoutStatusCopy[day.workout.status]} · ${day.workout.durationMin} мин` : day.activity ?? 'Не отмечено'} open={openModule === 'activity'} onToggle={() => setOpenModule(openModule === 'activity' ? '' : 'activity')}>
      {day.workout && <WorkoutDiaryCard workout={day.workout} />}
      <p className="module-prompt">Другая активность за день</p><div className="choice-chips">{['Прогулка','Тренировка','Растяжка','День отдыха'].map((value) => <button key={value} className={day.activity === value ? 'active' : ''} onClick={() => update({ activity: value })}>{value}</button>)}</div>
    </DiaryModule>}
    {data.modules.nutrition && <DiaryModule title="Питание" icon={Utensils} tone="coral" summary={day.calories ? `${day.calories.toLocaleString('ru-RU')} ккал` : day.nutrition.length ? day.nutrition.join(', ') : 'Не отмечено'} open={openModule === 'nutrition'} onToggle={() => setOpenModule(openModule === 'nutrition' ? '' : 'nutrition')}>
      <NutritionEditor value={day.calories} onChange={(calories) => update({ calories })} />
      <button className="measurement-history-link nutrition" onClick={onOpenNutritionHistory}><span><ChartSpline /><strong>История по дням</strong><small>{savedNutritionDays} {pluralRu(savedNutritionDays, 'сохранённый день', 'сохранённых дня', 'сохранённых дней')}</small></span><ChevronRight /></button>
      <p className="module-prompt">Если хочется, добавьте контекст</p><div className="choice-chips">{['Обычный аппетит','Повышенный аппетит','Тяга к сладкому','Вздутие'].map((value) => <button key={value} className={day.nutrition.includes(value) ? 'active' : ''} onClick={() => update({ nutrition: toggleValue(day.nutrition, value) })}>{value}</button>)}</div>
    </DiaryModule>}
    {data.modules.body && <DiaryModule title="Температура" icon={Thermometer} tone="violet" summary={day.temperature ? `${day.temperature.toFixed(1).replace('.', ',')} °C` : 'Не отмечено'} open={openModule === 'temperature'} onToggle={() => setOpenModule(openModule === 'temperature' ? '' : 'temperature')}>
      <MeasurementEditor type="temperature" value={day.temperature} data={data} onChange={(temperature) => update({ temperature })} onOpenHistory={onOpenTemperatureHistory} />
    </DiaryModule>}
    {data.modules.body && <DiaryModule title="Вес" icon={Weight} tone="coral" summary={day.weight ? `${day.weight.toFixed(1).replace('.', ',')} кг` : 'Пока не отмечено'} open={openModule === 'weight'} onToggle={() => setOpenModule(openModule === 'weight' ? '' : 'weight')}>
      <MeasurementEditor type="weight" value={day.weight} data={data} onChange={(weight) => update({ weight })} onOpenHistory={onOpenWeightHistory} />
    </DiaryModule>}
    {data.modules.note && <DiaryModule title="Заметка" icon={MessageSquareText} tone="indigo" summary={day.note ? 'Есть заметка' : 'Можно написать что угодно'} open={openModule === 'note'} onToggle={() => setOpenModule(openModule === 'note' ? '' : 'note')}>
      <textarea className="note-field free-note" value={day.note ?? ''} placeholder="Пишите свободно: как прошёл день, что чувствовали, что хочется запомнить…" onChange={(event) => update({ note: event.target.value })}/>
      <button className="measurement-history-link notes" onClick={onOpenNotesHistory}><span><NotebookTabs /><strong>История заметок</strong><small>{savedNoteDays} {pluralRu(savedNoteDays, 'сохранённый день', 'сохранённых дня', 'сохранённых дней')}</small></span><ChevronRight /></button>
      <p className="module-prompt">Быстрый контекст, если подходит</p><div className="choice-chips">{['Стресс','Поездка','Болезнь','Лекарства'].map((value) => <button key={value} className={day.contexts.includes(value) ? 'active' : ''} onClick={() => update({ contexts: toggleValue(day.contexts, value) })}>{value}</button>)}</div>
    </DiaryModule>}
    <button className="primary-button sticky-save" onClick={() => { onNotify('Все изменения сохранены автоматически'); onDone(); }}><Check /> Готово — вернуться на Сегодня</button>
  </div>;
}

function SleepDurationEditor({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const max = 16;
  const safeValue = Math.min(max, Math.max(0, value));
  const percent = Math.round((safeValue / max) * 100);
  const displayValue = Number.isInteger(safeValue) ? String(safeValue) : String(safeValue).replace('.', ',');
  return <div className="sleep-duration-editor">
    <div className="sleep-duration-head"><span><small>Длительность сна</small><strong>{displayValue} <b>ч</b></strong></span><span className="sleep-step-note"><Moon /> шаг 30 минут</span></div>
    <div className="sleep-sky" aria-hidden="true">
      <span className="sleep-scene-moon"><Moon /></span><i className="sleep-star star-a"/><i className="sleep-star star-b"/><i className="sleep-star star-c"/><span className="sleep-scene-dawn"><Sparkle /></span>
      <div className="sleep-horizon"><i/><i/><i/><i/><i/></div>
    </div>
    <div className="sleep-range-wrap">
      <input className="sleep-duration-range" type="range" min="0" max={max} step="0.5" value={safeValue} onChange={(event) => onChange(Number(event.target.value))} aria-label="Длительность сна" aria-valuetext={`${displayValue} часа`} style={{ background: `linear-gradient(90deg,#f7df81 0%,#f7df81 ${percent}%,rgba(255,255,255,.3) ${percent}%,rgba(255,255,255,.3) 100%)` }}/>
      <div className="sleep-range-labels"><span>0</span><span>4</span><span>8</span><span>12</span><span>16 ч</span></div>
    </div>
  </div>;
}

function WaterEditor({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const safeValue = Math.min(10000, Math.max(0, value));
  const fill = Math.min(100, Math.round((safeValue / 2000) * 100));
  const changeBy = (delta: number) => onChange(Math.min(10000, Math.max(0, safeValue + delta)));
  return <div className="hydration-editor">
    <div className="sport-bottle" role="img" aria-label={`Выпито ${safeValue} миллилитров`}>
      <span className="sport-bottle-cap"><i/></span>
      <span className="sport-bottle-body"><i className="sport-bottle-fill" style={{ height: `${fill}%` }}/><b><Droplet /></b></span>
    </div>
    <div className="water-manual-input">
      <button onClick={() => changeBy(-250)} aria-label="Уменьшить воду на 250 миллилитров">−</button>
      <label><input type="number" inputMode="numeric" min="0" max="10000" step="50" value={safeValue || ''} placeholder="0" aria-label="Количество воды в миллилитрах" onChange={(event) => onChange(event.target.value ? Math.min(10000, Math.max(0, Math.round(Number(event.target.value)))) : 0)} /><small>мл</small></label>
      <button onClick={() => changeBy(250)} aria-label="Увеличить воду на 250 миллилитров">+</button>
    </div>
  </div>;
}

function StepsEditor({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const goal = 7000;
  const max = Math.max(14000, Math.ceil(value / goal) * goal);
  const percent = Math.min(100, Math.round((value / max) * 100));
  const goalPercent = Math.round((goal / max) * 100);
  const remaining = Math.max(0, goal - value);
  return <div className="steps-editor">
    <div className="steps-visual-summary"><img src="/mira-icons/rhythm-steps.png?v=2" alt=""/><div className="steps-value"><span><small>Пройдено сегодня</small><strong>{value.toLocaleString('ru-RU')} <b>шагов</b></strong></span><em className={value >= goal ? 'done' : ''}>{value >= goal ? <Check /> : <Footprints />}{value >= goal ? 'Цель 7 000 выполнена' : `Ещё ${remaining.toLocaleString('ru-RU')}`}</em></div></div>
    <div className="steps-slider-wrap">
      <input className="steps-range" type="range" min="0" max={max} step="500" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label="Количество шагов" aria-valuetext={`${value.toLocaleString('ru-RU')} шагов из ориентира 7 000`} style={{ background: `linear-gradient(90deg, #9ac8ad 0%, #5f9b7d ${percent}%, #e8f1eb ${percent}%, #e8f1eb 100%)` }} />
      <span className="steps-goal-tick" style={{ left: `${goalPercent}%` }} aria-hidden="true" />
    </div>
    <div className="steps-scale"><span>0</span><strong><Check />7 000 · цель</strong><span>{max.toLocaleString('ru-RU')}</span></div>
    <div className="metric-step-buttons"><button onClick={() => onChange(Math.max(0, value - 500))}>− 500</button><button onClick={() => onChange(Math.min(30000, value + 500))}>+ 500</button></div>
    <p className="metric-context">7 000 шагов — выбранный ориентир интерфейса, а не обязательная медицинская норма.</p>
  </div>;
}

function NutritionEditor({ value, onChange }: { value?: number; onChange: (value?: number) => void }) {
  const safeValue = typeof value === 'number' ? Math.min(10000, Math.max(0, value)) : undefined;
  const changeBy = (delta: number) => onChange(Math.min(10000, Math.max(0, (safeValue ?? 0) + delta)) || undefined);
  return <div className="nutrition-editor">
    <div className="nutrition-illustration" aria-hidden="true"><span className="meal-cup"><i/></span><span className="meal-burger"><i/><b/><em/></span><span className="meal-fries"><i/><i/><i/></span></div>
    <div className="nutrition-manual-input">
      <button onClick={() => changeBy(-100)} aria-label="Уменьшить калорийность на 100">−</button>
      <label><input type="number" inputMode="numeric" min="0" max="10000" step="50" value={safeValue ?? ''} placeholder="0" aria-label="Калории за день" onChange={(event) => onChange(event.target.value ? Math.min(10000, Math.max(0, Math.round(Number(event.target.value)))) : undefined)} /><small>ккал</small></label>
      <button onClick={() => changeBy(100)} aria-label="Увеличить калорийность на 100">+</button>
    </div>
  </div>;
}

function MeasurementEditor({ type, value, data, onChange, onOpenHistory }: { type: 'temperature' | 'weight'; value?: number; data: AuraState; onChange: (value?: number) => void; onOpenHistory?: () => void }) {
  const temperature = type === 'temperature';
  const points = Object.entries(data.entries).flatMap(([date, entry]) => {
    const amount = entry[type];
    return typeof amount === 'number' ? [{ date, value: amount }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  return <div className="measurement-editor">
    {temperature ? <TemperatureControl value={value} onChange={onChange} /> : <WeightControl value={value} onChange={onChange} />}
    <button className={`measurement-history-link ${temperature ? 'temperature' : 'weight'}`} onClick={onOpenHistory}><span><ChartSpline /><strong>История по дням</strong><small>{points.length ? `${points.length} ${pluralRu(points.length, 'измерение', 'измерения', 'измерений')}` : 'Пока нет измерений'}</small></span><ChevronRight /></button>
  </div>;
}

function TemperatureControl({ value, onChange }: { value?: number; onChange: (value?: number) => void }) {
  const min = 34;
  const max = 42;
  const safeValue = typeof value === 'number' ? Math.min(max, Math.max(min, value)) : 36.6;
  const changeBy = (delta: number) => onChange(Math.min(max, Math.max(min, Math.round((safeValue + delta) * 10) / 10)));
  const percent = (safeValue - min) / (max - min);
  const displayValue = typeof value === 'number' ? value.toFixed(1) : '';
  return <div className="temperature-control">
    <div className="temperature-object" aria-hidden="true">
      <span className="temperature-object-slot"><i style={{ height: `${24 + (percent * 56)}%` }} /></span>
      <span className="temperature-object-bulb" />
      <span className="temperature-object-ticks"><i/><i/><i/></span>
    </div>
    <div className="temperature-manual-input">
      <button onClick={() => changeBy(-0.1)} aria-label="Уменьшить температуру на 0,1">−</button>
      <label><input type="number" inputMode="decimal" min={min} max={max} step="0.1" value={displayValue} placeholder="36,6" aria-label="Температура в градусах Цельсия" onChange={(event) => { const next = Number(event.target.value.replace(',', '.')); onChange(event.target.value && Number.isFinite(next) ? Math.min(max, Math.max(min, Math.round(next * 10) / 10)) : undefined); }} /><small>°C</small></label>
      <button onClick={() => changeBy(0.1)} aria-label="Увеличить температуру на 0,1">+</button>
    </div>
  </div>;
}

function TemperatureHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const points = Object.entries(data.entries).flatMap(([date, entry]) => typeof entry.temperature === 'number' ? [{ date, value: entry.temperature }] : []).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  return <div className="attention-overlay temperature-history-overlay" onClick={onClose}>
    <section className="attention-modal temperature-history-modal" role="dialog" aria-modal="true" aria-labelledby="temperature-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю температуры"><X /></button>
      <header><span><ChartSpline /></span><div><small>Температура</small><h2 id="temperature-history-title">История по дням</h2></div></header>
      {points.length > 1 ? <MiniMeasurementChart points={points} unit="°" /> : <div className="temperature-history-empty"><Thermometer /><strong>Нужно ещё одно измерение</strong><span>После двух отметок здесь появится график.</span></div>}
      {points.length > 0 && <div className="temperature-history-list">{[...points].reverse().map((point) => <div key={point.date}><span>{formatRuDate(point.date)}</span><strong>{point.value.toFixed(1).replace('.', ',')} °C</strong></div>)}</div>}
    </section>
  </div>;
}

function SleepHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const entries = Object.entries(data.entries).flatMap(([date, entry]) => typeof entry.sleepHours === 'number' && entry.sleepHours > 0 ? [{ date, value: entry.sleepHours, quality: entry.sleepQuality }] : []).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const points = entries.map(({ date, value }) => ({ date, value }));
  const qualityCopy: Record<string, string> = { 'Плохое': 'Не отдохнула', 'Обычное': 'Нормально', 'Хорошее': 'Хорошо' };
  return <div className="attention-overlay measurement-history-overlay" onClick={onClose}>
    <section className="attention-modal measurement-history-modal sleep-history-modal" role="dialog" aria-modal="true" aria-labelledby="sleep-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю сна"><X /></button>
      <header><span><Moon /></span><div><small>Сон</small><h2 id="sleep-history-title">История по дням</h2></div></header>
      {points.length > 1 ? <MiniMeasurementChart points={points} unit=" ч" /> : <div className="measurement-history-empty"><Moon /><strong>Нужно ещё одно измерение</strong><span>После двух отметок здесь появится график сна.</span></div>}
      {entries.length > 0 && <div className="measurement-history-list sleep-history-list">{[...entries].reverse().map((entry) => <div key={entry.date}><span>{formatRuDate(entry.date)}</span><p><strong>{entry.value.toLocaleString('ru-RU')} ч</strong><small>{entry.quality ? qualityCopy[entry.quality] ?? entry.quality : 'Состояние не отмечено'}</small></p></div>)}</div>}
    </section>
  </div>;
}

function WaterHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const points = Object.entries(data.entries).flatMap(([date, entry]) => typeof entry.water === 'number' && entry.water > 0 ? [{ date, value: entry.water }] : []).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  return <div className="attention-overlay measurement-history-overlay" onClick={onClose}>
    <section className="attention-modal measurement-history-modal water-history-modal" role="dialog" aria-modal="true" aria-labelledby="water-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю воды"><X /></button>
      <header><span><Droplet /></span><div><small>Вода</small><h2 id="water-history-title">История по дням</h2></div></header>
      {points.length > 1 ? <MiniMeasurementChart points={points} unit=" мл" /> : <div className="measurement-history-empty"><Droplet /><strong>Нужен ещё один день</strong><span>После двух отметок здесь появится график воды.</span></div>}
      {points.length > 0 && <div className="measurement-history-list">{[...points].reverse().map((point) => <div key={point.date}><span>{formatRuDate(point.date)}</span><strong>{point.value.toLocaleString('ru-RU')} мл</strong></div>)}</div>}
    </section>
  </div>;
}

function StepsHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const points = Object.entries(data.entries).flatMap(([date, entry]) => typeof entry.steps === 'number' && entry.steps > 0 ? [{ date, value: entry.steps }] : []).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  return <div className="attention-overlay measurement-history-overlay" onClick={onClose}>
    <section className="attention-modal measurement-history-modal steps-history-modal" role="dialog" aria-modal="true" aria-labelledby="steps-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю шагов"><X /></button>
      <header><span><Footprints /></span><div><small>Шаги</small><h2 id="steps-history-title">История по дням</h2></div></header>
      {points.length > 1 ? <MiniMeasurementChart points={points} unit="" /> : <div className="measurement-history-empty"><Footprints /><strong>Нужен ещё один день</strong><span>После двух отметок здесь появится график шагов.</span></div>}
      {points.length > 0 && <div className="measurement-history-list">{[...points].reverse().map((point) => <div key={point.date}><span>{formatRuDate(point.date)}</span><strong>{point.value.toLocaleString('ru-RU')} шагов</strong></div>)}</div>}
    </section>
  </div>;
}

function NutritionHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const points = Object.entries(data.entries).flatMap(([date, entry]) => typeof entry.calories === 'number' && entry.calories > 0 ? [{ date, value: entry.calories }] : []).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  return <div className="attention-overlay measurement-history-overlay" onClick={onClose}>
    <section className="attention-modal measurement-history-modal nutrition-history-modal" role="dialog" aria-modal="true" aria-labelledby="nutrition-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю питания"><X /></button>
      <header><span><Utensils /></span><div><small>Питание</small><h2 id="nutrition-history-title">История калорий</h2></div></header>
      {points.length > 1 ? <MiniMeasurementChart points={points} unit="" /> : <div className="measurement-history-empty"><Utensils /><strong>Нужен ещё один день</strong><span>После двух отметок здесь появится график калорий.</span></div>}
      {points.length > 0 && <div className="measurement-history-list">{[...points].reverse().map((point) => <div key={point.date}><span>{formatRuDate(point.date)}</span><strong>{point.value.toLocaleString('ru-RU')} ккал</strong></div>)}</div>}
    </section>
  </div>;
}

function NotesHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const notes = Object.entries(data.entries).flatMap(([date, entry]) => entry.note?.trim() ? [{ date, text: entry.note.trim(), contexts: entry.contexts }] : []).sort((a, b) => b.date.localeCompare(a.date));
  return <div className="attention-overlay measurement-history-overlay" onClick={onClose}>
    <section className="attention-modal measurement-history-modal notes-history-modal" role="dialog" aria-modal="true" aria-labelledby="notes-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю заметок"><X /></button>
      <header><span><NotebookTabs /></span><div><small>Заметки</small><h2 id="notes-history-title">История по дням</h2></div></header>
      {notes.length ? <div className="notes-history-list">{notes.map((note) => <article key={note.date}><time>{formatRuDate(note.date)}</time><p>{note.text}</p>{note.contexts.length > 0 && <div>{note.contexts.map((context) => <span key={context}>{context}</span>)}</div>}</article>)}</div> : <div className="measurement-history-empty"><NotebookTabs /><strong>Заметок пока нет</strong><span>Сохранённые тексты появятся здесь по датам.</span></div>}
    </section>
  </div>;
}

function WeightHistoryModal({ data, onClose }: { data: AuraState; onClose: () => void }) {
  const points = Object.entries(data.entries).flatMap(([date, entry]) => typeof entry.weight === 'number' ? [{ date, value: entry.weight }] : []).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  return <div className="attention-overlay measurement-history-overlay" onClick={onClose}>
    <section className="attention-modal measurement-history-modal weight-history-modal" role="dialog" aria-modal="true" aria-labelledby="weight-history-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть историю веса"><X /></button>
      <header><span><Weight /></span><div><small>Вес</small><h2 id="weight-history-title">История по дням</h2></div></header>
      {points.length > 1 ? <MiniMeasurementChart points={points} unit=" кг" /> : <div className="measurement-history-empty"><Weight /><strong>Нужно ещё одно измерение</strong><span>После двух отметок здесь появится график.</span></div>}
      {points.length > 0 && <div className="measurement-history-list">{[...points].reverse().map((point) => <div key={point.date}><span>{formatRuDate(point.date)}</span><strong>{point.value.toFixed(1).replace('.', ',')} кг</strong></div>)}</div>}
    </section>
  </div>;
}

function WeightControl({ value, onChange }: { value?: number; onChange: (value?: number) => void }) {
  const min = 20;
  const max = 300;
  const safeValue = typeof value === 'number' ? Math.min(max, Math.max(min, value)) : 58.5;
  const displayValue = typeof value === 'number' ? value.toFixed(1) : '';
  const changeBy = (delta: number) => onChange(Math.min(max, Math.max(min, Math.round((safeValue + delta) * 10) / 10)));
  return <div className="weight-control">
    <div className="weight-object" aria-hidden="true">
      <span className="weight-object-face"><i/><b/><em/></span>
      <span className="weight-object-deck" />
    </div>
    <div className="weight-manual-input">
      <button onClick={() => changeBy(-0.1)} aria-label="Уменьшить вес на 0,1">−</button>
      <label><input type="number" inputMode="decimal" min={min} max={max} step="0.1" value={displayValue} placeholder="58,5" aria-label="Вес в килограммах" onChange={(event) => { const next = Number(event.target.value.replace(',', '.')); onChange(event.target.value && Number.isFinite(next) ? Math.min(max, Math.max(min, Math.round(next * 10) / 10)) : undefined); }} /><small>кг</small></label>
      <button onClick={() => changeBy(0.1)} aria-label="Увеличить вес на 0,1">+</button>
    </div>
  </div>;
}

function MiniMeasurementChart({ points, unit }: { points: Array<{ date: string; value: number }>; unit: string }) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (index: number) => 18 + (index * (284 / Math.max(1, points.length - 1)));
  const y = (value: number) => 79 - (((value - min) / span) * 48);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' ');
  return <div className="mini-measurement-chart"><svg viewBox="0 0 320 112" role="img" aria-label="История измерений"><defs><linearGradient id="measurement-gradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fba0e3" stopOpacity=".35"/><stop offset="1" stopColor="#fba0e3" stopOpacity="0"/></linearGradient></defs><path className="measure-area" d={`${path} L ${x(points.length - 1)} 88 L ${x(0)} 88 Z`} fill="url(#measurement-gradient)" /><path className="measure-line" d={path}/>{points.map((point, index) => <g key={point.date}><circle cx={x(index)} cy={y(point.value)} r="4"/><text x={x(index)} y={y(point.value) - 9}>{String(point.value).replace('.', ',')}{unit}</text><text className="measure-date" x={x(index)} y="103">{Number(point.date.slice(8))}</text></g>)}</svg></div>;
}

function WorkoutDiaryCard({ workout }: { workout: AuraWorkoutLog }) {
  return <div className={`workout-diary-card ${workout.status}`}>
    <span>{workout.status === 'completed' ? <Check /> : workout.level === 'rest' ? <Moon /> : <Dumbbell />}</span>
    <div><small>{workoutStatusCopy[workout.status]}</small><strong>{workout.title}</strong><p>{workout.durationMin} минут · {workout.intensityLabel.toLowerCase()}{workout.feedback ? ` · ${workout.feedback === 'easy' ? 'было легко' : workout.feedback === 'right' ? 'нагрузка подошла' : 'было тяжело'}` : ''}</p></div>
  </div>;
}

function DiaryModule({ title, icon: Icon, tone, summary, open, onToggle, children }: { title: string; icon: LucideIcon; tone: string; summary: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className={`diary-module ${open ? 'open' : ''}`}><button className="module-head" onClick={onToggle}><span className={`metric-icon ${tone}`}><Icon /></span><span><strong>{title}</strong><small>{summary}</small></span><ChevronDown /></button>{open && <div className="module-body">{children}</div>}</section>;
}

function IntimacyEditor({ day, onChange }: { day: AuraDayEntry; onChange: (patch: Partial<AuraDayEntry>) => void }) {
  const after = day.intimacyAfter ?? [];
  const setAfter = (value: AuraIntimacyAfter) => {
    if (value === 'none') {
      onChange({ intimacyAfter: after.includes('none') ? [] : ['none'] });
      return;
    }
    const withoutNone = after.filter((item) => item !== 'none');
    onChange({ intimacyAfter: withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value] });
  };
  const clear = () => onChange({ intimate: undefined, intimacyComfort: undefined, intimacyAfter: [], intimacyDesire: undefined, intimacyNote: undefined });

  return <div className="intimacy-editor">
    <p className="privacy-inline"><ShieldCheck /> Хранится на этом устройстве. В экспорт попадёт только с вашего разрешения.</p>
    {day.intimate !== true ? <div className="intimacy-start"><span className="intimacy-start-icon"><Heart /></span><div><strong>Добавляйте только когда близость была</strong><p>Пустой день не означает «не было» и не попадёт в аналитику.</p></div><button onClick={() => onChange({ intimate: true })}><Plus /> Отметить близость</button></div> : <>
      <div className="intimacy-question"><strong>Как прошло?</strong><span>Один вариант</span></div>
      <div className="intimacy-comfort-grid">{([
        ['comfortable','Комфортно','Без неприятных ощущений',Smile],
        ['discomfort','Дискомфорт','Было неприятно',Meh],
        ['pain','Боль','Было больно',Frown],
      ] as const).map(([value,title,note,Icon]) => <button key={value} className={day.intimacyComfort === value ? 'active' : ''} onClick={() => onChange({ intimacyComfort: value })}><Icon /><strong>{title}</strong><small>{note}</small>{day.intimacyComfort === value && <Check />}</button>)}</div>

      <div className="intimacy-question"><strong>Что было после?</strong><span>Можно выбрать несколько</span></div>
      <div className="intimacy-after-chips">{([
        ['none','Без особенностей',Check],
        ['pain','Боль',CircleAlert],
        ['bleeding','Кровянистые выделения',Droplet],
        ['discharge','Необычные выделения',CircleAlert],
      ] as const).map(([value,label,Icon]) => <button key={value} className={after.includes(value) ? 'active' : ''} onClick={() => setAfter(value)}><Icon /> {label}</button>)}</div>

      <div className="intimacy-question"><strong>Желание</strong><span>Необязательно</span></div>
      <div className="intimacy-desire">{([['lower','Ниже обычного'],['usual','Как обычно'],['higher','Выше обычного']] as const).map(([value,label]) => <button key={value} className={day.intimacyDesire === value ? 'active' : ''} onClick={() => onChange({ intimacyDesire: value })}>{label}</button>)}</div>

      <label className="intimacy-note"><span>Заметка <small>необязательно</small></span><textarea value={day.intimacyNote ?? ''} maxLength={1000} placeholder="Например: дискомфорт прошёл через час" onChange={(event) => onChange({ intimacyNote: event.target.value })}/></label>
      <aside className="intimacy-analytics-note"><ChartSpline /><span><strong>Когда появится аналитика</strong>После 5 отметок минимум в двух циклах — только наблюдения, без диагнозов.</span></aside>
      <button className="intimacy-reset" onClick={clear}><Trash2 /> Удалить отметку о близости</button>
    </>}
  </div>;
}

function Analytics({ data, onChangeData, scenario, section, setSection, mode, setMode, onOpenDiary, onOpenCycleReport, onOpenReport }: { data: AuraState; onChangeData: (updater: (current: AuraState) => AuraState) => void; scenario: PrototypeScenario; section: AnalyticsSection; setSection: (section: AnalyticsSection) => void; mode: WellbeingMode; setMode: (mode: WellbeingMode) => void; onOpenDiary: () => void; onOpenCycleReport: () => void; onOpenReport: () => void }) {
  const entryCount = getAuraObservationDates(data).length;
  const metrics = getAuraCycleMetrics(data);
  const showOverviewGate = section === 'overview' && scenario !== 'history';
  return <div className="screen analytics-screen">
    <header className="analytics-header"><div><span className="eyebrow">Личная картина</span><h1>Аналитика</h1></div><span className="period-select">{metrics.completedCycles ? `${metrics.completedCycles} ${pluralRu(metrics.completedCycles, 'цикл', 'цикла', 'циклов')}` : 'С начала'}</span></header>
    <div className="analytics-tabs">{([['overview', 'Главное'], ['cycle', 'Цикл'], ['wellbeing', 'Самочувствие'], ['history', 'Записи']] as const).map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>)}</div>
    {showOverviewGate ? <AnalyticsDataState data={data} scenario={scenario} entryCount={entryCount} onOpenDiary={onOpenDiary} /> : <>
      {section === 'overview' && <AnalyticsOverview data={data} setSection={setSection} />}
      {section === 'cycle' && <CycleAnalytics data={data} onChangeData={onChangeData} />}
      {section === 'wellbeing' && <WellbeingAnalytics data={data} mode={mode} setMode={setMode} />}
      {section === 'history' && <HistoryAnalytics data={data} />}
    </>}
    {section === 'overview' && (entryCount > 0 || metrics.starts.length > 0) && <div className="analytics-report-links">
      <section className="report-cta cycle-report-cta"><span><ChartSpline /></span><div><small>Для вас</small><strong>Отчёт о цикле</strong><p>Последний цикл, месячные и личная динамика.</p></div><button onClick={onOpenCycleReport} aria-label="Открыть отчёт о цикле"><ChevronRight /></button></section>
      <section className="report-cta doctor-report-cta"><span><FileHeart /></span><div><small>Для консультации</small><strong>Отчёт для врача</strong><p>Только сохранённые факты, без диагнозов.</p></div><button onClick={onOpenReport} aria-label="Открыть отчёт для врача"><ChevronRight /></button></section>
    </div>}
  </div>;
}

function AnalyticsDataState({ data, scenario, entryCount, onOpenDiary }: { data: AuraState; scenario: Exclude<PrototypeScenario, 'history'>; entryCount: number; onOpenDiary: () => void }) {
  const empty = scenario === 'empty';
  const metrics = getAuraCycleMetrics(data);
  const evidence = deriveAttentionEvidence(data);
  return <div className="analytics-content data-state-content">
    <section className="data-state-hero">
      <span className="data-state-icon">{empty ? <ChartSpline /> : <Sparkle />}</span>
      <span className="eyebrow">{empty ? 'Начало личной истории' : 'Первый цикл'}</span>
      <h2>{empty ? 'Аналитика появится из ваших записей' : 'Пока показываем только факты'}</h2>
      <p>{empty ? 'Добавьте начало месячных или самочувствие. Пустые дни не будут считаться отсутствием симптомов.' : 'Одна запись уже сохранена, но её недостаточно для сравнения циклов и личных закономерностей.'}</p>
      <button className="primary-button" onClick={onOpenDiary}><Plus /> {empty ? 'Добавить первую запись' : 'Продолжить наблюдение'}</button>
    </section>
    <section className="surface evidence-roadmap"><div className="section-heading"><div><span className="eyebrow">Что появится дальше</span><h2>По мере накопления данных</h2></div><span className="soft-status">{entryCount} запись</span></div>{[
      ['День текущего цикла','После первой даты начала',metrics.cycleDay !== null],
      ['Длина завершённого цикла','После двух дат начала',metrics.completedCycles >= 1],
      ['Личный диапазон','После трёх завершённых циклов',metrics.completedCycles >= 3],
      ['Повтор симптома','Если он встречается минимум в двух циклах',evidence.cycles >= 2],
    ].map(([title,note,ready]) => <div className={`roadmap-row ${ready ? 'ready' : ''}`} key={String(title)}><span>{ready ? <Check /> : <LockKeyhole />}</span><div><strong>{title}</strong><small>{note}</small></div></div>)}</section>
    <aside className="privacy-inline"><ShieldCheck /> Выводы не строятся по одной записи. Отсутствующие данные не заменяются нулями.</aside>
  </div>;
}

function AnalyticsOverview({ data, setSection }: { data: AuraState; setSection: (section: AnalyticsSection) => void }) {
  const metrics = getAuraCycleMetrics(data);
  const evidence = deriveAttentionEvidence(data);
  const last14Dates = Array.from({ length: 14 }, (_, index) => addDays(AURA_TODAY, index - 13));
  const coverage = last14Dates.map((date) => getAuraDayCoverage(data, date));
  const coverageItems = [
    { id: 'cycle', label: 'Цикл и кровотечение', Icon: Droplet, count: coverage.filter((day) => day.cycle === 'recorded').length },
    { id: 'symptoms', label: 'Симптомы', Icon: HeartPulse, count: coverage.filter((day) => day.symptoms === 'recorded' || day.symptoms === 'explicit-none').length, positive: coverage.filter((day) => day.symptoms === 'recorded').length, none: coverage.filter((day) => day.symptoms === 'explicit-none').length },
    { id: 'wellbeing', label: 'Состояние и энергия', Icon: Smile, count: coverage.filter((day) => day.wellbeing === 'recorded').length },
    { id: 'habits', label: 'Сон и привычки', Icon: Moon, count: coverage.filter((day) => day.habits === 'recorded').length },
  ];
  return <div className="analytics-content">
    {metrics.completedCycles >= 3 && evidence.cycles >= 2 && <section className="aura-hero analytics-aura">
      <span className="glass-label"><Sparkle /> {metrics.completedCycles >= 4 ? 'Повторяется в циклах' : 'Первое наблюдение'}</span>
      <h2>{metrics.completedCycles >= 4 ? 'Боль регулярно повторялась' : `Боль отмечалась в ${evidence.cycles} из ${metrics.completedCycles} циклов`}</h2>
      <p>Вывод основан только на сохранённых отметках. Пустые дни не считаются отсутствием боли.</p>
      <div className="hero-data hero-data-two"><span><strong>{evidence.cycles} из {metrics.completedCycles}</strong><small>циклов с болью</small></span><span><strong>{evidence.impactDays}</strong><small>дней мешала делам</small></span></div>
      <button onClick={() => setSection('wellbeing')}>Открыть симптомы <ChevronRight /></button>
    </section>}
    <section className="surface coverage-quality-card">
      <div className="section-heading"><div><span className="eyebrow">Последние 14 дней</span><h2>Полнота по направлениям</h2></div></div>
      <div className="coverage-quality-grid">{coverageItems.map(({ id, label, Icon, count, positive, none }) => <article className={`coverage-quality-item coverage-${id}`} key={id}><span><Icon /></span><div><strong>{label}</strong><small>{id === 'symptoms' && (positive || none) ? `${positive} с симптомами · ${none} без симптомов` : `${count} из 14 дней`}</small><i aria-label={`${label}: ${count} из 14 дней`}><b style={{ width: `${Math.round((count / 14) * 100)}%` }}/></i></div><em>{count}/14</em></article>)}</div>
      <p className="coverage-quality-note"><Info /> Запись только с водой не повышает полноту симптомов или цикла. Пустой день не считается отсутствием симптома.</p>
    </section>
  </div>;
}

function CycleAnalytics({ data, onChangeData }: { data: AuraState; onChangeData: (updater: (current: AuraState) => AuraState) => void }) {
  const metrics = getAuraCycleMetrics(data);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyScope, setHistoryScope] = useState<'all' | 'recent'>('recent');
  const [cycleRange, setCycleRange] = useState<3 | 6 | 12>(3);
  const selectedRange = cycleRange <= metrics.completedCycles ? cycleRange : metrics.completedCycles >= 3 ? 3 : Math.max(1, metrics.completedCycles);
  const recentCompletedStarts = metrics.completedStarts.slice(-selectedRange).reverse();
  const excludedStarts = metrics.excludedStarts.slice().reverse();
  const range = metrics.personalMin && metrics.personalMax ? `${metrics.personalMin}–${metrics.personalMax} дней` : metrics.completedCycles === 2 ? 'пока не рассчитан' : 'собирается';
  const cycleDataLegend = <div className="cycle-data-key" aria-label="Обозначения истории циклов"><span><i className="period" /> Месячные</span><span><i className="fertile" /> Фертильное окно*</span><span><i className="ovulation" /> Овуляция*</span><p>* Фертильное окно и овуляция рассчитаны по календарю и не являются подтверждёнными событиями.</p></div>;
  const renderCycleRow = (start: string, kind: 'current' | 'completed' | 'excluded', allowExclude = true) => {
    const rawIndex = metrics.starts.indexOf(start);
    const nextStart = rawIndex >= 0 ? metrics.starts[rawIndex + 1] ?? null : null;
    const length = nextStart ? daysBetween(start, nextStart) : null;
    const visibleLength = Math.min(31, length ?? metrics.cycleDay ?? 1);
    const episode = getAuraPeriodEpisodes(data).find((item) => item.start === start);
    const explicitlyMarkedPeriodDays = new Set([1, ...Object.entries(data.entries).flatMap(([date, entry]) => {
      const inEpisode = date >= start && (!nextStart || date < nextStart);
      const marked = Boolean(entry.period && entry.period !== 'none') || entry.periodCheckin?.bleedingType === 'period-start' || entry.periodCheckin?.bleedingType === 'period-ongoing';
      return inEpisode && marked ? [daysBetween(start, date) + 1] : [];
    })]);
    const periodDayIndexes = episode?.status === 'confirmed' && episode.duration
      ? new Set(Array.from({ length: episode.duration }, (_, index) => index + 1))
      : explicitlyMarkedPeriodDays;
    const episodeLabel = episode?.status === 'confirmed' && episode.duration
      ? `Месячные длились ${episode.duration} ${pluralRu(episode.duration, 'день', 'дня', 'дней')} · окончание подтверждено`
      : episode?.status === 'ongoing'
        ? `Месячные продолжаются · отмечено ${periodDayIndexes.size} ${pluralRu(periodDayIndexes.size, 'день', 'дня', 'дней')}`
        : `Отмечено ${periodDayIndexes.size} ${pluralRu(periodDayIndexes.size, 'день', 'дня', 'дней')} месячных · окончание не подтверждено`;
    const rowTitle = kind === 'current'
      ? `Текущий цикл: ${metrics.cycleDay ?? 1} ${pluralRu(metrics.cycleDay ?? 1, 'день', 'дня', 'дней')}`
      : `${length ?? '—'} ${pluralRu(length ?? 0, 'день', 'дня', 'дней')}`;
    const rowDates = kind === 'current'
      ? `Начался ${formatRuDate(start)}`
      : `${formatRuDate(start)}${length ? ` — ${formatRuDate(addDays(start, length - 1))}` : ''}`;
    const periodSummary = episode?.status === 'confirmed' && episode.duration
      ? `Месячные · ${episode.duration} ${pluralRu(episode.duration, 'день', 'дня', 'дней')}`
      : `Длительность не подтверждена · отмечено ${periodDayIndexes.size} ${pluralRu(periodDayIndexes.size, 'день', 'дня', 'дней')}`;
    return <div key={`${kind}-${start}`} className={`visual-cycle-row ${kind}`}>
      <span className="visual-cycle-meta"><span><strong>{rowTitle}</strong><small>{rowDates}</small>{kind === 'current' && <em>{episodeLabel}</em>}{kind === 'excluded' && <em>Исключён из аналитики и отчётов</em>}</span><b>{periodSummary}</b></span>
      <span className="visual-cycle-days" aria-label={`${visibleLength} дней`}>{Array.from({ length: 31 }, (_, dayIndex) => {
        const day = dayIndex + 1;
        const isPeriod = periodDayIndexes.has(day);
        const isCurrent = kind === 'current' && day === metrics.cycleDay;
        return <i key={day} title={isPeriod ? 'Сохранённый факт: месячные' : 'Нет сохранённого факта'} className={`${day > visibleLength ? 'future ' : ''}unknown ${isPeriod ? 'fact-period' : ''} ${isCurrent ? 'current' : ''}`} />;
      })}</span>
      {allowExclude && kind !== 'current' && <button className="cycle-exclusion-action" onClick={() => onChangeData((current) => setAuraCycleExcluded(current, start, kind !== 'excluded'))}>{kind === 'excluded' ? 'Вернуть в расчёты' : 'Исключить из расчётов'}</button>}
    </div>;
  };
  if (historyOpen) {
    const allHistory = [
      ...(metrics.currentStart ? [{ start: metrics.currentStart, kind: 'current' as const }] : []),
      ...metrics.completedStarts.slice().reverse().map((start) => ({ start, kind: 'completed' as const })),
    ];
    const visibleHistory = historyScope === 'recent' ? allHistory.slice(0, 3) : allHistory;
    const byYear = visibleHistory.reduce((groups, item) => {
      const year = item.start.slice(0, 4);
      const current = groups.get(year) ?? [];
      current.push(item);
      groups.set(year, current);
      return groups;
    }, new Map<string, typeof visibleHistory>());
    return <div className="cycle-history-screen">
      <header><button onClick={() => setHistoryOpen(false)} aria-label="Назад к аналитике"><ChevronLeft /></button><h2>История циклов</h2><span /></header>
      <div className="cycle-history-scope" aria-label="Период истории"><button className={historyScope === 'all' ? 'active' : ''} onClick={() => setHistoryScope('all')}>Все</button><button className={historyScope === 'recent' ? 'active' : ''} onClick={() => setHistoryScope('recent')}>Последние 3 цикла</button></div>
      <section className="cycle-history-full-card">{[...byYear.entries()].map(([year, items]) => <div className="cycle-history-year" key={year}><h3>{year}</h3>{items.map((item) => renderCycleRow(item.start, item.kind, false))}</div>)}{cycleDataLegend}</section>
    </div>;
  }
  return <div className="analytics-content">
    <div className="metric-banner"><div><span className="metric-icon rose"><Droplet /></span><small>Текущий цикл</small><strong>{metrics.cycleDay ? `${metrics.cycleDay}-й день` : 'Не начат'}</strong><p>Не входит в статистику</p></div><div><small>Ваш недавний диапазон</small><strong>{range}</strong><p>{metrics.completedCycles} завершённых · {metrics.excludedStarts.length} исключено</p></div></div>
    {metrics.completedCycles >= 3 ? <div className="analytics-range-tabs" aria-label="Период сравнения завершённых циклов">{([3,6,12] as const).map((value) => <button key={value} className={selectedRange === value ? 'active' : ''} onClick={() => setCycleRange(value)} disabled={metrics.completedCycles < value}>{value} циклов</button>)}</div> : <div className="analytics-range-pending"><Info /><span><strong>Сохранено {metrics.completedCycles} {pluralRu(metrics.completedCycles, 'завершённый цикл', 'завершённых цикла', 'завершённых циклов')}</strong><small>Сравнение за 3, 6 или 12 циклов появится после следующего завершённого цикла.</small></span></div>}
    <section className="surface chart-card tall">
      <div className="section-heading"><div><span className="eyebrow">Выбрано до {selectedRange} завершённых циклов</span><h2>Длина цикла</h2></div><button className="info-button" aria-label="О расчёте"><Info /></button></div>
      <CycleTrendChart data={data} limit={selectedRange} />
      <div className="chart-legend"><span><i className="line" /> Длина цикла</span></div>
    </section>
    <section className="surface chart-card period-duration-card">
      <div className="section-heading"><div><span className="eyebrow">Подтверждённые окончания</span><h2>Длительность месячных</h2></div><span className="soft-status">до {selectedRange} циклов</span></div>
      <PeriodDurationTrendChart data={data} limit={selectedRange} />
    </section>
    <section className="surface cycle-history visual-cycle-history cycle-history-list"><div className="section-heading"><div><h2>История циклов</h2></div><button className="cycle-history-open" onClick={() => setHistoryOpen(true)}>Смотреть все <ChevronRight /></button></div>{metrics.currentStart ? renderCycleRow(metrics.currentStart, 'current') : <div className="chart-empty"><Droplet /><strong>Текущий цикл не начат</strong><small>Добавьте дату начала месячных.</small></div>}{recentCompletedStarts.length ? recentCompletedStarts.map((start) => renderCycleRow(start, 'completed')) : <div className="cycle-history-empty-row"><ChartSpline /><span><strong>Завершённых циклов пока нет</strong><small>Они появятся после следующей даты начала.</small></span></div>}{cycleDataLegend}</section>
    {excludedStarts.length > 0 && <section className="surface cycle-history visual-cycle-history excluded-cycle-history"><div className="section-heading"><div><span className="eyebrow">Не участвуют в расчётах</span><h2>Исключённые циклы</h2></div><span className="soft-status">{excludedStarts.length}</span></div>{excludedStarts.map((start) => renderCycleRow(start, 'excluded'))}</section>}
  </div>;
}

function CycleTrendChart({ data, limit = 6, compact = false }: { data: AuraState; limit?: number; compact?: boolean }) {
  const metrics = getAuraCycleMetrics(data);
  const lengths = metrics.cycleLengths.slice(-limit);
  if (!lengths.length) return <div className="chart-empty"><ChartSpline /><strong>Нет завершённых циклов</strong><small>Первый факт появится после следующей даты начала месячных.</small></div>;
  const maxY = Math.max(35, ...lengths) + 1;
  const x = (index: number) => 40 + index * (270 / Math.max(1, lengths.length - 1));
  const y = (value: number) => 166 - (value / maxY) * 120;
  const cyclePoints = lengths.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const lastCycle = lengths[lengths.length - 1];
  const hasPreliminaryStats = lengths.length >= 3;
  const averageCycle = hasPreliminaryStats ? Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length) : null;
  const cycleMin = Math.min(...lengths);
  const cycleMax = Math.max(...lengths);
  const cycleRange = hasPreliminaryStats ? (cycleMin === cycleMax ? `${cycleMin} ${pluralRu(cycleMin, 'день', 'дня', 'дней')}` : `${cycleMin}–${cycleMax} дней`) : null;
  const rangeTrend = getAuraCycleRangeTrend(lengths);
  return <div className={`cycle-trend-chart ${compact ? 'compact' : ''}`}>
    <svg className={`cycle-line-chart ${compact ? 'compact' : ''}`} viewBox="0 0 360 205" role="img" aria-label={`Длина циклов: ${lengths.join(', ')} дней`}>
      {[46,86,126,166].map(lineY => <line key={lineY} x1="30" x2="335" y1={lineY} y2={lineY} stroke="#eee7ef" strokeWidth="1" />)}
      <polyline points={cyclePoints} fill="none" stroke="#66a8a8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {lengths.map((value, index) => <g key={`${value}-${index}`}><circle cx={x(index)} cy={y(value)} r="6" fill="#fff" stroke="#66a8a8" strokeWidth="4"/><text x={x(index)} y={y(value)-13} textAnchor="middle" fill="#3b2842" fontSize="11" fontWeight="700">{value}</text><text x={x(index)} y="199" textAnchor="middle" fill="#94899e" fontSize="9">{index + 1}</text></g>)}
    </svg>
    <p className="cycle-trend-summary personal-cycle-summary">
      <span><i className="latest"/>Последний: <strong>{lastCycle} {pluralRu(lastCycle, 'день', 'дня', 'дней')}</strong></span>
      {averageCycle !== null && <span><i className="average"/>Предварительное среднее: <strong>{averageCycle} {pluralRu(averageCycle, 'день', 'дня', 'дней')}</strong></span>}
      {cycleRange && <span><i className="cycle"/>Предварительный диапазон: <strong>{cycleRange}</strong></span>}
    </p>
    {lengths.length === 1 && <div className="range-explanation"><span className="range-ok"><Check /></span><div><strong>Пока показываем только факт</strong><p>Один завершённый цикл нельзя использовать для личного среднего или диапазона.</p></div></div>}
    {lengths.length === 2 && <div className="range-explanation"><span className="range-ok"><Info /></span><div><strong>Пока недостаточно для личного диапазона</strong><p>Показываем оба значения без среднего. Предварительная картина появится после третьего завершённого цикла.</p></div></div>}
    {lengths.length >= 3 && lengths.length < 6 && <div className="range-explanation"><span className="range-ok"><ChartSpline /></span><div><strong>Предварительная личная картина</strong><p>Среднее и диапазон основаны на {lengths.length} завершённых циклах и ещё могут заметно измениться.</p></div></div>}
    {lengths.length >= 6 && <div className={`range-explanation cycle-range-conclusion ${rangeTrend.status}`}><span className="range-ok"><ChartSpline /></span><div><strong>{rangeTrend.title}</strong><p>{rangeTrend.description}</p></div></div>}
  </div>;
}

function PeriodDurationTrendChart({ data, limit = 6 }: { data: AuraState; limit?: number }) {
  const metrics = getAuraCycleMetrics(data);
  const starts = metrics.completedStarts.slice(-limit);
  if (!starts.length) return <div className="chart-empty"><Droplet /><strong>Нет завершённых циклов</strong><small>Длительность появится после подтверждения окончания месячных.</small></div>;
  const episodes = new Map(getAuraPeriodEpisodes(data).map((episode) => [episode.start, episode]));
  const values = starts.map((start) => episodes.get(start)?.duration ?? null);
  const confirmed = values.flatMap((value) => value === null ? [] : [value]);
  const maxY = Math.max(8, ...confirmed);
  const x = (index: number) => 40 + index * (270 / Math.max(1, starts.length - 1));
  const y = (value: number) => 158 - ((value - 1) / Math.max(1, maxY - 1)) * 105;
  const lines = values.flatMap((value, index) => {
    const next = values[index + 1];
    return value !== null && next !== null ? [<line key={`line-${index}`} x1={x(index)} y1={y(value)} x2={x(index + 1)} y2={y(next)} stroke="#f08aac" strokeWidth="4" strokeLinecap="round" />] : [];
  });
  const range = confirmed.length >= 3
    ? `${Math.min(...confirmed)}–${Math.max(...confirmed)} ${pluralRu(Math.max(...confirmed), 'день', 'дня', 'дней')}`
    : null;
  return <div className="period-duration-trend">
    <svg className="cycle-line-chart compact" viewBox="0 0 360 190" role="img" aria-label={`Длительность месячных по циклам: ${values.map((value) => value ?? 'не подтверждена').join(', ')}`}>
      {[53,88,123,158].map(lineY => <line key={lineY} x1="30" x2="335" y1={lineY} y2={lineY} stroke="#eee7ef" strokeWidth="1" />)}
      {lines}
      {values.map((value, index) => value === null
        ? <g key={`unknown-${starts[index]}`}><circle cx={x(index)} cy="158" r="5" fill="#fff" stroke="#d9d1dc" strokeWidth="2" strokeDasharray="3 2"/><text x={x(index)} y="143" textAnchor="middle" fill="#9b919f" fontSize="8">—</text><text x={x(index)} y="181" textAnchor="middle" fill="#94899e" fontSize="9">{index + 1}</text></g>
        : <g key={`period-${starts[index]}`}><circle cx={x(index)} cy={y(value)} r="6" fill="#fff" stroke="#f08aac" strokeWidth="4"/><text x={x(index)} y={y(value)-13} textAnchor="middle" fill="#c75d86" fontSize="10" fontWeight="700">{value}</text><text x={x(index)} y="181" textAnchor="middle" fill="#94899e" fontSize="9">{index + 1}</text></g>)}
    </svg>
    <p className="cycle-trend-summary"><span><i className="period"/>Подтверждено: <strong>{confirmed.length} из {starts.length}</strong></span>{range && <span><i className="period"/>Предварительный диапазон: <strong>{range}</strong></span>}</p>
    {confirmed.length < starts.length && <div className="range-explanation"><span className="range-ok"><Info /></span><div><strong>Учитываем только подтверждённые окончания</strong><p>Пропуск означает, что длительность месячных в этом цикле неизвестна, а не равна нулю.</p></div></div>}
  </div>;
}

function WellbeingAnalytics({ data, mode, setMode }: { data: AuraState; mode: WellbeingMode; setMode: (mode: WellbeingMode) => void }) {
  return <div className="analytics-content">
    <div className="mode-tabs">{([['summary', 'Состояние', Smile], ['symptoms', 'Симптомы', Heart], ['sleep', 'Сон', Moon], ['habits', 'Привычки', CircleGauge]] as const).map(([id,label,Icon]) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}><Icon /><span>{label}</span></button>)}</div>
    {mode === 'summary' && <WellbeingSummary data={data} />}
    {mode === 'symptoms' && <SymptomsAnalytics data={data} />}
    {mode === 'sleep' && <SleepAnalytics data={data} />}
    {mode === 'habits' && <HabitsAnalytics data={data} />}
  </div>;
}

function WellbeingSummary({ data }: { data: AuraState }) {
  const recent = Object.entries(data.entries).sort(([left], [right]) => left.localeCompare(right)).slice(-30);
  const ratings = recent.flatMap(([, day]) => day.rating ? [day.rating] : []);
  const energy = recent.flatMap(([, day]) => day.energy ? [day.energy] : []);
  const painDays = recent.filter(([, day]) => day.symptoms.some((symptom) => symptom.id === 'pain')).length;
  const average = (values: number[]) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1).replace('.', ',') : '—';
  const moods = new Map<string, number>();
  recent.forEach(([, day]) => day.moods.forEach((mood) => moods.set(mood, (moods.get(mood) ?? 0) + 1)));
  const frequentMoods = [...moods.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4);
  const moodMarkCount = [...moods.values()].reduce((sum, count) => sum + count, 0);
  return <>
    <section className="aura-hero wellbeing-hero"><span className="glass-label"><Smile /> Последние 30 записей</span><h2>{ratings.length ? 'Ваши оценки дня' : 'Пока нет оценки самочувствия'}</h2><p>{ratings.length ? `Средняя оценка ${average(ratings)} из 5 по ${ratings.length} сохранённым дням.` : 'Поставьте оценку дня — пустые даты не будут считаться плохим самочувствием.'}</p><div className="wellbeing-score"><strong>{average(ratings)}</strong><span>из 5</span></div></section>
    <div className="two-metrics"><article><small>Энергия</small><strong>{average(energy)} <span>из 5</span></strong><p>{energy.length} {pluralRu(energy.length, 'запись', 'записи', 'записей')}</p></article><article><small>Дней с болью</small><strong>{painDays}</strong><p>из {recent.length} {pluralRu(recent.length, 'записанного дня', 'записанных дней', 'записанных дней')}</p></article></div>
    <section className="surface chart-card"><div className="section-heading"><div><span className="eyebrow">Динамика</span><h2>Оценка дня</h2></div><span className="soft-status">{ratings.length} {pluralRu(ratings.length, 'оценка', 'оценки', 'оценок')}</span></div><MoodAreaChart values={ratings} /><p className="chart-caption">Показаны только дни, когда вы сохранили оценку.</p></section>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">{moodMarkCount} отметок</span><h2>Частые состояния</h2></div></div>{moodMarkCount >= 10 ? <div className="mood-composition">{frequentMoods.map(([label, count], index) => <span key={label} style={{ flex: count }} className={['calm','joy','tired','anxious'][index]}>{label} · {count}</span>)}</div> : <div className="chart-empty"><Smile /><strong>Нужно ещё {10 - moodMarkCount} {pluralRu(10 - moodMarkCount, 'отметка', 'отметки', 'отметок')}</strong><small>Состав состояний покажем после 10 отметок.</small></div>}</section>
  </>;
}

function MoodAreaChart({ values }: { values: number[] }) {
  if (values.length < 10) return <div className="chart-empty"><ChartSpline /><strong>Нужно ещё {10 - values.length} {pluralRu(10 - values.length, 'оценка', 'оценки', 'оценок')}</strong><small>Динамика появится после 10 сохранённых оценок, без заполнения пропущенных дней.</small></div>;
  const recent = values.slice(-12);
  const points = recent.map((value, index) => `${20 + index * (320 / Math.max(1, recent.length - 1))},${150 - (value - 1) * 28}`).join(' ');
  return <svg className="mood-chart" viewBox="0 0 360 170" role="img" aria-label={`Оценки дня: ${recent.join(', ')}`}>{[35,75,115,155].map(y => <line key={y} x1="18" x2="342" y1={y} y2={y} stroke="#f1ddea"/>)}<polyline points={points} fill="none" stroke="#fba0e3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{recent.map((value, index) => <circle key={index} cx={20 + index * (320 / Math.max(1, recent.length - 1))} cy={150 - (value - 1) * 28} r="5" fill="#fff" stroke="#fba0e3" strokeWidth="3"/>)}</svg>;
}

function SymptomsAnalytics({ data }: { data: AuraState }) {
  const metrics = getAuraCycleMetrics(data);
  const [cycleRange, setCycleRange] = useState<1 | 3 | 6 | 12>(() => metrics.completedCycles >= 3 ? 3 : 1);
  const selectedRange = cycleRange <= metrics.completedCycles ? cycleRange : 1;
  const selectedStarts = metrics.completedStarts.slice(-selectedRange);
  const selectedStartSet = new Set(selectedStarts);
  const cycleStartForEntry = (date: string) => [...metrics.starts].reverse().find((start) => start <= date);
  const selectedEntry = (date: string) => {
    const cycleStart = cycleStartForEntry(date);
    return Boolean(cycleStart && selectedStartSet.has(cycleStart));
  };
  const stats = new Map<string, { label: string; count: number; severityTotal: number; impact: number; cycles: Set<string> }>();
  Object.entries(data.entries).filter(([date]) => selectedEntry(date)).forEach(([date, day]) => day.symptoms.forEach((symptom) => {
    const current = stats.get(symptom.id) ?? { label: symptom.label, count: 0, severityTotal: 0, impact: 0, cycles: new Set<string>() };
    current.count += 1;
    current.severityTotal += symptom.severity;
    current.impact += Number(symptom.affectsLife);
    const cycleStart = cycleStartForEntry(date);
    if (cycleStart) current.cycles.add(cycleStart);
    stats.set(symptom.id, current);
  }));
  const symptoms = [...stats.entries()].sort((left, right) => right[1].count - left[1].count);
  const [topId, top] = symptoms[0] ?? [];
  const selectedCycleDays = selectedStarts.reduce((sum, start) => {
    const index = metrics.starts.indexOf(start);
    const end = metrics.starts[index + 1];
    return sum + (end ? daysBetween(start, end) : 0);
  }, 0);
  const assessedSymptomDays = Object.entries(data.entries).filter(([date, day]) => selectedEntry(date) && day.symptomsChecked === true).length;
  const symptomCoverage = selectedCycleDays ? assessedSymptomDays / selectedCycleDays : 0;
  const patternStatus = !top || top.count < 3
    ? 'Недостаточно отметок'
    : top.cycles.size < 2
      ? 'Пока только один цикл'
      : symptomCoverage < .3
        ? 'Нужно больше заполненных дней'
        : top.cycles.size >= 3
          ? 'Повторяется в циклах'
          : 'Предварительное наблюдение';
  const heat = new Map<number, number>();
  if (topId) Object.entries(data.entries).filter(([date]) => selectedEntry(date)).forEach(([date, day]) => {
    const symptom = day.symptoms.find((item) => item.id === topId);
    const cycleStart = cycleStartForEntry(date);
    if (!symptom || !cycleStart) return;
    const cycleDay = daysBetween(cycleStart, date) + 1;
    if (cycleDay >= 1 && cycleDay <= 31) heat.set(cycleDay, Math.min(3, (heat.get(cycleDay) ?? 0) + 1));
  });
  if (!top) return <section className="surface"><div className="chart-empty"><Heart /><strong>Симптомы ещё не отмечены</strong><small>После сохранения они появятся здесь без заполнения пустых дней.</small></div></section>;
  return <>
    <div className="analytics-range-tabs symptom-range-tabs" aria-label="Период анализа симптомов">{([1,3,6,12] as const).map((value) => <button key={value} className={selectedRange === value ? 'active' : ''} onClick={() => setCycleRange(value)} disabled={metrics.completedCycles < value}>{value === 1 ? 'Последний завершённый' : `${value} завершённых`}</button>)}</div>
    <section className="symptom-hero surface"><div className="section-heading"><div><span className="eyebrow">{patternStatus}</span><h2>{top.label}</h2></div><span className="soft-status coral">{top.count} {pluralRu(top.count, 'отметка', 'отметки', 'отметок')}</span></div><div className="symptom-presence-summary"><span><strong>{top.count}</strong><small>{pluralRu(top.count, 'день', 'дня', 'дней')} с отметкой</small></span><p>{top.count < 3 ? 'Для анализа закономерности нужно минимум три отметки.' : top.cycles.size < 2 ? 'Нужны отметки минимум в двух завершённых циклах.' : symptomCoverage < .3 ? 'Пустые дни не считаются отсутствием симптома. Отмечайте и дни без симптомов.' : top.cycles.size >= 3 ? 'Симптом встречался минимум в трёх завершённых циклах.' : 'Симптом встречался минимум в двух циклах; наблюдение пока предварительное.'}</p></div><div className="impact-row impact-row-three"><span><CircleGauge /><strong>{(top.severityTotal / top.count).toFixed(1).replace('.', ',')} из 3</strong><small>средняя интенсивность</small></span><span><Timer /><strong>{top.impact} из {top.count}</strong><small>мешали обычным делам</small></span><span><ListChecks /><strong>{top.cycles.size} {pluralRu(top.cycles.size, 'цикл', 'цикла', 'циклов')}</strong><small>есть отметки</small></span></div><p className="symptom-coverage-note">Полнота симптомов: {Math.round(symptomCoverage * 100)}% дней выбранных циклов явно отмечены. Сон, вода, шаги, питание и вес используются только как контекст.</p></section>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">По дням цикла</span><h2>Когда отмечался симптом</h2></div><button className="info-button" aria-label="О сопоставлении"><Info /></button></div><div className="cycle-heatmap"><div className="phase-labels"><span>Начало цикла</span><span>Первая половина</span><span>Вторая половина</span></div><div className="heat-days">{Array.from({ length: 31 }, (_, index) => <i key={index} className={heat.get(index + 1) ? `level-${heat.get(index + 1)}` : ''} title={`${index + 1}-й день`} />)}</div><div className="heat-axis"><span>1</span><span>7</span><span>14</span><span>21</span><span>28</span></div></div><p className="chart-caption">Сопоставлено по {top.cycles.size} {pluralRu(top.cycles.size, 'циклу', 'циклам', 'циклам')}. Это наблюдение, а не медицинский вывод.</p></section>
    <section className="surface symptom-pattern-cards"><div className="section-heading"><div><span className="eyebrow">По дням цикла</span><h2>Карты симптомов</h2></div><span className="soft-status">{symptoms.length}</span></div>{symptoms.slice(0,3).map(([id, item]) => {
      const dayCounts = new Map<number, number>();
      Object.entries(data.entries).filter(([date]) => selectedEntry(date)).forEach(([date, day]) => {
        if (!day.symptoms.some((symptom) => symptom.id === id)) return;
        const cycleStart = cycleStartForEntry(date);
        if (!cycleStart) return;
        const cycleDay = daysBetween(cycleStart, date) + 1;
        if (cycleDay <= 31) dayCounts.set(cycleDay, (dayCounts.get(cycleDay) ?? 0) + 1);
      });
      const activeDays = [...dayCounts.keys()];
      const daySummary = activeDays.length ? `${Math.min(...activeDays)}–${Math.max(...activeDays)}-й дни` : 'дни уточняются';
      const itemStatus = item.count < 3 ? 'нужно 3 отметки' : item.cycles.size < 2 ? 'только один цикл' : symptomCoverage < .3 ? 'низкая полнота' : item.cycles.size >= 3 ? 'повторяется' : 'предварительно';
      return <article key={id}><div><span className="symptom-pattern-icon"><HeartPulse /></span><p><strong>{item.label}</strong><small>{item.count} отметок · чаще: {daySummary} · интенсивность {(item.severityTotal / item.count).toFixed(1).replace('.', ',')}/3</small></p><em>{itemStatus}</em></div><span className="symptom-pattern-days">{Array.from({ length: 31 }, (_, index) => <i key={index} className={dayCounts.get(index + 1) ? `level-${Math.min(3, dayCounts.get(index + 1)!)}` : ''}/>)}</span></article>;
    })}</section>
    <section className="surface symptom-list"><div className="section-heading"><h2>Все симптомы</h2><span className="soft-status">{symptoms.reduce((sum, [, item]) => sum + item.count, 0)} отметок</span></div>{symptoms.map(([id, item]) => <div key={id}><span><strong>{item.label}</strong><small>{item.count} {pluralRu(item.count, 'отметка', 'отметки', 'отметок')}{item.impact ? ` · мешало делам: ${item.impact}` : ''}</small></span><i><b style={{ width: `${Math.max(8, (item.count / top.count) * 100)}%` }} /></i></div>)}</section>
  </>;
}

function SleepAnalytics({ data }: { data: AuraState }) {
  const sleep = Object.entries(data.entries).sort(([left], [right]) => left.localeCompare(right)).flatMap(([date, day]) => day.sleepHours === undefined ? [] : [{ date, hours: day.sleepHours, quality: day.sleepQuality }]).slice(-12);
  const averageSleep = sleep.length ? (sleep.reduce((sum, item) => sum + item.hours, 0) / sleep.length).toFixed(1).replace('.', ',') : '—';
  const goodSleep = sleep.filter((item) => item.quality === 'Хорошее').length;
  const minSleep = sleep.length ? Math.min(...sleep.map((item) => item.hours)).toFixed(1).replace('.', ',') : '—';
  const maxSleep = sleep.length ? Math.max(...sleep.map((item) => item.hours)).toFixed(1).replace('.', ',') : '—';
  return <>
    <section className="aura-hero sleep-hero"><span className="glass-label"><Moon /> {sleep.length} ночей</span><h2>{sleep.length ? `В среднем ${averageSleep} часа` : 'Сон ещё не отмечен'}</h2><p>{sleep.length ? `Хорошее качество отмечено в ${goodSleep} случаях.` : 'Добавьте длительность и ощущение после сна.'}</p><div className="sleep-moon" /></section>
    <div className="two-metrics"><article><small>Недавний диапазон</small><strong>{minSleep}–{maxSleep} <span>ч</span></strong><p>по сохранённым ночам</p></article><article><small>Хорошее качество</small><strong>{goodSleep}</strong><p>из {sleep.length} ночей</p></article></div>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">Последние {sleep.length} {pluralRu(sleep.length, 'запись', 'записи', 'записей')}</span><h2>Длительность сна</h2></div></div>{sleep.length ? <div className="sleep-bars">{sleep.map((item,index) => <div key={item.date}><span style={{ height: `${item.hours*12}px` }}><b>{item.hours}</b></span><small>{index+1}</small></div>)}</div> : <div className="chart-empty"><Moon /><strong>График появится после первой отметки</strong><small>Пустые дни не считаются нулём.</small></div>}<div className="personal-band"><i /> Ваш недавний диапазон, не медицинская норма</div></section>
    <section className="observation-soft"><span><Sparkle /></span><div><small>Пока собираем пары данных</small><strong>Сон и самочувствие</strong><p>Добавьте ещё 2 оценки дня, чтобы сравнить их со сном без преждевременных выводов.</p></div></section>
  </>;
}

function HabitsAnalytics({ data }: { data: AuraState }) {
  const [habit, setHabit] = useState('water');
  const habitOptions: Array<{ id: string; label: string; icon: LucideIcon }> = [
    { id: 'water', label: 'Вода', icon: GlassWater },
    { id: 'steps', label: 'Шаги', icon: Footprints },
    { id: 'activity', label: 'Активность', icon: Activity },
    { id: 'body', label: 'Тело', icon: Thermometer },
  ];
  const recent = Object.entries(data.entries).sort(([left], [right]) => left.localeCompare(right)).slice(-7);
  const water = recent.map(([date, day]) => ({ date, value: day.water }));
  const waterValues = water.flatMap((item) => item.value === undefined ? [] : [item.value]);
  const averageWater = waterValues.length ? Math.round(waterValues.reduce((sum, value) => sum + value, 0) / waterValues.length) : null;
  const latestWeight = Object.entries(data.entries).sort(([left], [right]) => right.localeCompare(left)).find(([, day]) => day.weight !== undefined);
  const latestTemperature = Object.entries(data.entries).sort(([left], [right]) => right.localeCompare(left)).find(([, day]) => day.temperature !== undefined);
  return <>
    <div className="habit-switch">{habitOptions.map(({ id, label, icon: Icon }) => <button key={id} className={habit === id ? 'active' : ''} onClick={() => setHabit(id)}><Icon /><span>{label}</span></button>)}</div>
    <section className="surface habit-main"><div className="section-heading"><div><span className="eyebrow">Вода · последние записи</span><h2>В дни с отметками</h2></div><span className="soft-status sage">{waterValues.length} {pluralRu(waterValues.length, 'запись', 'записи', 'записей')}</span></div><div className="habit-value"><strong>{averageWater?.toLocaleString('ru-RU') ?? '—'}</strong><span>мл в среднем</span></div><div className="water-bars">{water.map(({date,value}) => <div key={date}><span className={value === undefined ? 'missing' : ''} style={{ height: value === undefined ? '12px' : `${Math.max(16,value/18)}px` }}><b>{value === undefined ? '—' : `${value/1000}`}</b></span><small>{ruWeekdays[localDate(date).getDay()]}</small></div>)}</div><p className="chart-caption">Пустой день означает, что вода не отмечалась. Он не считается нулём.</p></section>
    <section className="surface body-grid"><div className="section-heading"><h2>Измерения</h2></div><div><MetricCard icon={Weight} tone="coral" label="Вес" value={latestWeight ? `${latestWeight[1].weight}` : '—'} note={latestWeight ? `кг · ${formatRuDate(latestWeight[0])}` : 'не отмечено'}/><MetricCard icon={Thermometer} tone="violet" label="Температура" value={latestTemperature ? `${latestTemperature[1].temperature}°` : '—'} note={latestTemperature ? formatRuDate(latestTemperature[0]) : 'не отмечено'}/></div></section>
  </>;
}

function HistoryAnalytics({ data }: { data: AuraState }) {
  const [filter, setFilter] = useState('Все');
  const observationDates = getAuraObservationDates(data);
  const rows = observationDates.map((date) => [date, data.entries[date] ?? emptyAuraEntry(date)] as const).sort(([left], [right]) => right.localeCompare(left)).filter(([date, day]) => {
    if (filter === 'Все') return true;
    if (filter === 'Цикл') return data.periodStarts.includes(date) || Boolean(day.period && day.period !== 'none') || Boolean(day.periodCheckin);
    if (filter === 'Симптомы') return day.symptoms.length > 0;
    if (filter === 'Состояние') return Boolean(day.rating || day.moods.length);
    return day.sleepHours !== undefined;
  });
  const latest = rows.slice(0, 12);
  const currentMonth = localDate(AURA_TODAY);
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const activeDays = new Set(observationDates.filter((date) => date.slice(0, 7) === AURA_TODAY.slice(0, 7)).map((date) => Number(date.slice(8))));
  const summary = (date: string, day: AuraDayEntry) => data.periodStarts.includes(date) ? 'Начало месячных' : day.periodCheckin ? bleedingTypeCopy[day.periodCheckin.bleedingType] : day.symptoms[0] ? `${day.symptoms[0].label}${day.symptoms.length > 1 ? ` · ещё ${day.symptoms.length - 1}` : ''}` : day.rating ? `Оценка дня · ${day.rating}/5` : day.sleepHours !== undefined ? `Сон · ${day.sleepHours} ч` : day.period && day.period !== 'none' ? 'Месячные отмечены' : 'Сохранённая запись';
  const detail = (date: string, day: AuraDayEntry) => data.periodStarts.includes(date) ? 'Первый день цикла' : day.water !== undefined ? `Вода · ${day.water.toLocaleString('ru-RU')} мл` : day.energy ? `Энергия · ${day.energy}/5` : day.moods[0] ?? 'Без дополнительной отметки';
  return <div className="history-view">
    <section className="surface history-calendar"><div className="section-heading"><div><span className="eyebrow">{ruMonthTitles[currentMonth.getMonth()]}</span><h2>История записей</h2></div><span className="soft-status">{activeDays.size} дней</span></div><div className="history-dots">{Array.from({length:daysInMonth},(_,index)=><i key={index} className={activeDays.has(index + 1) ? `active tone-${index%4}` : ''}><span>{index+1}</span></i>)}</div></section>
    <div className="filter-chips">{['Все','Цикл','Симптомы','Состояние','Сон'].map(item=><button key={item} className={filter===item?'active':''} onClick={()=>setFilter(item)}>{item}</button>)}</div>
    <div className="history-list">{latest.map(([date, day], index)=><button key={date}><span className={`history-date ${['coral','violet','sage','rose'][index%4]}`}><strong>{Number(date.slice(8))}</strong><small>{ruMonths[localDate(date).getMonth()].slice(0,3)}</small></span><span><small>{date === AURA_TODAY ? 'Сегодня' : formatRuDate(date)}</small><strong>{summary(date, day)}</strong><p>{detail(date, day)}</p></span><ChevronRight /></button>)}</div>
    {!latest.length && <div className="chart-empty"><NotebookTabs /><strong>Таких записей пока нет</strong><small>Смените фильтр или добавьте отметку в дневнике.</small></div>}
  </div>;
}

function Knowledge({ data, onChangeData, onOpenArticle }: { data: AuraState; onChangeData: (updater: (current: AuraState) => AuraState) => void; onOpenArticle: (articleId: string) => void }) {
  const [tab, setTab] = useState<KnowledgeTab>('for-you');
  const [query, setQuery] = useState('');
  const hasPain = Object.values(data.entries).some((day) => day.symptoms.some((symptom) => symptom.id === 'pain'));
  const recommendedIds = new Set([hasPain ? 'cramps-care' : 'cycle-basics', 'cycle-length', 'sleep-wellbeing', 'pms-basics', 'doctor-report']);
  const visibleArticles = knowledgeArticleCards.filter((article) => {
    const searchMatch = article.title.toLowerCase().includes(query.trim().toLowerCase()) || article.category.toLowerCase().includes(query.trim().toLowerCase());
    const tabMatch = query.trim() || tab === 'all' || (tab === 'saved' ? data.savedArticles.includes(article.id) : recommendedIds.has(article.id));
    return searchMatch && Boolean(tabMatch);
  });
  const toggleSaved = (id: string) => onChangeData((current) => ({ ...current, savedArticles: current.savedArticles.includes(id) ? current.savedArticles.filter((item) => item !== id) : [...current.savedArticles, id] }));

  return <div className="screen knowledge-screen">
    <header className="knowledge-header"><div><h1>Знания</h1></div><button className="round-button" onClick={() => setTab('saved')} aria-label="Сохранённые статьи"><Bookmark /></button></header>
    <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: боль или сон"/>{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X /></button>}</label>
    <div className="knowledge-tabs">{([['for-you','Для вас'],['all','Все материалы'],['saved',`Сохранённые · ${data.savedArticles.length}`]] as const).map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'for-you' && !query && <section className="featured-article" onClick={() => onOpenArticle('cramps-care')}>
      <div className="featured-art clear-article-cover" aria-label="Тема статьи: боль во время месячных">
        <div className="cover-topic"><span><Droplet /></span><div><small>Тема материала</small><strong>Боль во время месячных</strong></div></div>
        <div className="cover-checks"><span><CircleGauge /> Сила</span><span><Timer /> Длительность</span><span><Activity /> Влияние на день</span></div>
      </div>
      <div className="featured-copy"><span className="glass-label"><Heart /> Симптомы · 4 минуты</span><h2>Спазмы в первые дни месячных</h2><p>Что помогает наблюдать боль и когда стоит обратиться за помощью.</p><div><span>Почему сейчас: отмечена боль</span><button>Читать <ChevronRight /></button></div></div>
    </section>}
    <div className="article-list">{visibleArticles.map(article => <ArticleCard key={article.id} {...article} saved={data.savedArticles.includes(article.id)} onToggleSaved={() => toggleSaved(article.id)} onOpen={() => onOpenArticle(article.id)}/>)}</div>
    {!visibleArticles.length && <section className="empty-search"><Search /><h2>{tab === 'saved' ? 'Здесь будут сохранённые статьи' : 'Ничего не найдено'}</h2><p>{tab === 'saved' ? 'Нажмите на закладку у материала, чтобы вернуться к нему позже.' : 'Попробуйте другое слово.'}</p>{query && <button className="secondary-button" onClick={() => setQuery('')}>Сбросить поиск</button>}</section>}
  </div>;
}

function ArticleCard({ tone, category, time, title, icon: Icon, saved, onToggleSaved, onOpen }: { tone: string; category: string; time: string; title: string; icon: LucideIcon; saved: boolean; onToggleSaved: () => void; onOpen?: () => void }) {
  return <article className="article-card"><button className={`bookmark-card ${saved ? 'saved' : ''}`} aria-label={saved ? `Убрать «${title}» из сохранённых` : `Сохранить «${title}»`} onClick={onToggleSaved}><Bookmark /></button><span className={`article-thumb ${tone}`}><i/><Icon /></span><div onClick={onOpen}><small>{category} · {time}</small><strong>{title}</strong><p>Простой разбор с примерами и источниками.</p></div><button aria-label={`Открыть статью «${title}»`} onClick={onOpen}><ChevronRight /></button></article>;
}

function Article({ article, onBack }: { article: KnowledgeArticle; onBack: () => void }) {
  return <div className="screen article-screen">
    <TopBack title="" onBack={onBack} />
    <article className="reading-article simple-reading-article">
      <header className="simple-reading-header"><h1>{article.title}</h1><p>{article.summary}</p></header>

      {article.sections.map((section) => <section className="reading-section" key={section.title}>
        <h2>{section.title}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>)}

      <section className="reading-section"><h2>Когда обратиться за помощью</h2><p>{article.whenToSeekCare}</p></section>
      <button className="primary-button article-read-button" onClick={onBack}><Check /> Прочитано</button>
      <footer className="simple-article-sources"><h2>{article.sources.length === 1 ? 'Источник' : 'Источники'}</h2>{article.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span><strong>{source.publisher}</strong><small>{source.title}</small></span><ChevronRight /></a>)}</footer>
    </article>
  </div>;
}

function CycleReport({ data, onBack, onOpenDoctorReport }: { data: AuraState; onBack: () => void; onOpenDoctorReport: () => void }) {
  const metrics = getAuraCycleMetrics(data);
  const starts = metrics.completedStarts;
  const latestCompletedStart = starts[starts.length - 1];
  const [selectedStart, setSelectedStart] = useState(() => latestCompletedStart ?? '');
  const [comparisonRange, setComparisonRange] = useState<3 | 6 | 12>(3);
  const [comparisonView, setComparisonView] = useState<'history' | 'patterns'>('history');
  const [detailSymptom, setDetailSymptom] = useState<string | null>(null);
  const selectedRawIndex = selectedStart ? metrics.starts.indexOf(selectedStart) : -1;
  const selectedEnd = selectedRawIndex >= 0 ? metrics.starts[selectedRawIndex + 1] ?? null : null;
  const selectedIsCurrent = false;
  const selectedLength = selectedEnd ? daysBetween(selectedStart, selectedEnd) : null;
  const selectedEntries = Object.entries(data.entries).filter(([date]) => Boolean(selectedStart && date >= selectedStart && (!selectedEnd || date < selectedEnd)));
  const selectedPeriodEpisode = getAuraPeriodEpisodes(data).find((episode) => episode.start === selectedStart);
  const selectedPeriodSummary = selectedPeriodEpisode?.status === 'confirmed' && selectedPeriodEpisode.duration
    ? `Месячные длились ${selectedPeriodEpisode.duration} ${pluralRu(selectedPeriodEpisode.duration, 'день', 'дня', 'дней')}`
    : selectedPeriodEpisode?.status === 'ongoing'
      ? `Месячные продолжаются · отмечено ${selectedPeriodEpisode.observedDays} ${pluralRu(selectedPeriodEpisode.observedDays, 'день', 'дня', 'дней')}`
      : selectedPeriodEpisode
        ? `Отмечено ${selectedPeriodEpisode.observedDays} ${pluralRu(selectedPeriodEpisode.observedDays, 'день', 'дня', 'дней')} месячных · окончание не подтверждено`
        : 'Нет данных об эпизоде';
  const cycleOptions = starts.map((start) => {
    const rawIndex = metrics.starts.indexOf(start);
    const end = metrics.starts[rawIndex + 1] ?? null;
    return { start, end, length: end ? daysBetween(start, end) : null };
  }).reverse();
  const durations = periodDurations(data);
  const recentLengths = metrics.cycleLengths.slice(-6);
  const averageLength = recentLengths.length ? Math.round(recentLengths.reduce((sum, value) => sum + value, 0) / recentLengths.length) : null;
  const minLength = recentLengths.length ? Math.min(...recentLengths) : null;
  const maxLength = recentLengths.length ? Math.max(...recentLengths) : null;
  const selectedSymptomCounts = new Map<string, number>();
  selectedEntries.forEach(([, day]) => day.symptoms.forEach((symptom) => selectedSymptomCounts.set(symptom.label, (selectedSymptomCounts.get(symptom.label) ?? 0) + 1)));
  const selectedTopSymptoms = [...selectedSymptomCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3);
  const allObservedCycles = starts.map((start) => {
    const rawIndex = metrics.starts.indexOf(start);
    const end = metrics.starts[rawIndex + 1] ?? null;
    const entries = Object.entries(data.entries).filter(([date]) => date >= start && (!end || date < end));
    return { start, end, length: end ? daysBetween(start, end) : 1, entries };
  }).filter((cycle) => cycle.entries.length > 0);
  const observedCycles = allObservedCycles.slice(-comparisonRange);
  const comparisonLabels = [...new Set(observedCycles.flatMap((cycle) => cycle.entries.flatMap(([, entry]) => entry.symptoms.map((symptom) => symptom.label))))];
  const symptomComparisons = comparisonLabels.map((label) => {
    const selectedDays = selectedSymptomCounts.get(label) ?? 0;
    const symptomDaysByCycle = observedCycles.map((cycle) => cycle.entries.flatMap(([date, entry]) => entry.symptoms.some((symptom) => symptom.label === label) ? [daysBetween(cycle.start, date) + 1] : []));
    const symptomRecordsByCycle = observedCycles.map((cycle) => cycle.entries.flatMap(([, entry]) => entry.symptoms.filter((symptom) => symptom.label === label)));
    const daysByCycle = symptomDaysByCycle.map((days) => days.length);
    const repeatedCycles = daysByCycle.filter((days) => days > 0).length;
    const averageDays = repeatedCycles ? daysByCycle.reduce((sum, days) => sum + days, 0) / repeatedCycles : 0;
    const activeDays = symptomDaysByCycle.flat();
    const typicalStart = activeDays.length ? Math.min(...activeDays) : null;
    const typicalEnd = activeDays.length ? Math.max(...activeDays) : null;
    const comparison = repeatedCycles < 2 ? 'Пока недостаточно повторений' : selectedDays > averageDays + .5 ? 'В этом цикле дольше обычного' : selectedDays < averageDays - .5 ? 'В этом цикле короче обычного' : 'В этом цикле примерно как обычно';
    const selectedRecords = selectedEntries.flatMap(([, entry]) => entry.symptoms.filter((symptom) => symptom.label === label));
    const historyRecords = observedCycles.filter((cycle) => cycle.start !== selectedStart).flatMap((cycle) => cycle.entries.flatMap(([, entry]) => entry.symptoms.filter((symptom) => symptom.label === label)));
    const selectedSeverity = selectedRecords.length ? selectedRecords.reduce((sum, symptom) => sum + symptom.severity, 0) / selectedRecords.length : null;
    const historySeverity = historyRecords.length ? historyRecords.reduce((sum, symptom) => sum + symptom.severity, 0) / historyRecords.length : null;
    const impactDays = selectedRecords.filter((symptom) => symptom.affectsLife).length;
    const impactCycles = symptomRecordsByCycle.filter((records) => records.some((symptom) => symptom.affectsLife)).length;
    const severityComparison = selectedSeverity === null || historySeverity === null ? 'Выраженность пока не с чем сравнить' : selectedSeverity > historySeverity + .35 ? 'Сильнее личного среднего' : selectedSeverity < historySeverity - .35 ? 'Слабее личного среднего' : 'Выраженность примерно как обычно';
    const status = repeatedCycles >= 3 ? 'Повторяется' : repeatedCycles === 2 ? 'Возможное повторение' : selectedDays > 0 ? 'Новая отметка' : 'Мало данных';
    return { label, selectedDays, symptomDaysByCycle, repeatedCycles, averageDays, typicalStart, typicalEnd, comparison, selectedSeverity, impactDays, impactCycles, severityComparison, status };
  }).sort((left, right) => right.repeatedCycles - left.repeatedCycles || right.selectedDays - left.selectedDays);
  const visibleSymptomComparisons = symptomComparisons.filter((item) => item.repeatedCycles >= 2 || item.selectedDays > 0).slice(0, 3);
  const recurringCount = symptomComparisons.filter((item) => item.repeatedCycles >= 2).length;
  const newCount = symptomComparisons.filter((item) => item.repeatedCycles === 1 && item.selectedDays > 0).length;
  const detailComparison = symptomComparisons.find((item) => item.label === detailSymptom) ?? null;
  const regularity = recentLengths.length < 3
    ? 'Нужно ещё несколько завершённых циклов'
    : maxLength! - minLength! <= 7
      ? 'Последние циклы были похожи по длине'
      : 'Длина последних циклов менялась';
  const chartValues = recentLengths.length ? recentLengths : [data.onboarding.cycleLength ?? 28];
  const chartMin = Math.min(...chartValues) - 2;
  const chartMax = Math.max(...chartValues) + 2;
  const chartPoints = chartValues.map((value, index) => `${25 + index * (290 / Math.max(1, chartValues.length - 1))},${112 - ((value - chartMin) / Math.max(1, chartMax - chartMin)) * 70}`).join(' ');
  const recentDurations = durations.slice(-6);
  const trendDurations = chartValues.map((_, index) => recentDurations[Math.max(0, recentDurations.length - chartValues.length) + index] ?? data.onboarding.periodLength ?? 5);
  const periodPoints = trendDurations.map((value, index) => `${25 + index * (290 / Math.max(1, trendDurations.length - 1))},${125 - Math.min(8, value) * 7}`).join(' ');
  const expectedLength = selectedLength ?? metrics.expectedLength ?? data.onboarding.cycleLength ?? 28;
  const ovulationDay = Math.max(8, expectedLength - 14);
  const ovulationDate = selectedStart ? addDays(selectedStart, ovulationDay - 1) : null;
  const fertileStart = ovulationDate ? addDays(ovulationDate, -5) : null;
  const fertileEnd = ovulationDate ? addDays(ovulationDate, 1) : null;
  const historySummary = recentLengths.length < 3
    ? 'Пока мало данных для вывода о регулярности'
    : maxLength! - minLength! <= 7
      ? 'Последние циклы были похожи по длине'
      : 'Длина циклов менялась — это видно в вашей истории';
  const firstName = data.profile.fullName.trim().split(/\s+/)[0];
  return <div className="screen cycle-report-screen">
    <TopBack title="Отчёт о цикле" onBack={onBack} action={<span className="secure-badge"><ShieldCheck /> Локально</span>} />
    <section className="cycle-report-selector" aria-label="Выберите цикл">
      <div><span className="eyebrow">История циклов</span><strong>{cycleOptions.length} {pluralRu(cycleOptions.length, 'цикл', 'цикла', 'циклов')}</strong></div>
      <div>{cycleOptions.map((cycle, index) => <button key={cycle.start} className={selectedStart === cycle.start ? 'active' : ''} onClick={() => setSelectedStart(cycle.start)}>
        <small>{index === 0 && !cycle.end ? 'Сейчас' : `Цикл ${cycleOptions.length - index}`}</small>
        <strong>{formatRuDate(cycle.start)}</strong>
        <span>{cycle.end ? `${cycle.length} ${pluralRu(cycle.length ?? 0, 'день', 'дня', 'дней')}` : `${metrics.cycleDay ?? 1}-й день`}</span>
      </button>)}</div>
    </section>
    <section className="cycle-report-hero">
      <div><span className="eyebrow">Завершённый цикл</span><h1>{firstName ? `${firstName}, ваш цикл` : 'Ваш цикл'}</h1><p>{selectedLength && selectedEnd ? `${formatRuDate(selectedStart)} — ${formatRuDate(addDays(selectedEnd, -1))} · ${selectedLength} ${pluralRu(selectedLength, 'день', 'дня', 'дней')}` : 'Добавьте дату начала месячных'}</p></div>
      <span className="cycle-report-orbit"><Droplet /><i /><i /><i /></span>
    </section>

    <section className="cycle-report-bento" aria-label="Краткая сводка цикла">
      <article className="cycle-bento-card period">
        <span className="report-3d-icon period" aria-hidden="true" />
        <div><small>Месячные начались</small><h2>{selectedStart ? formatRuDate(selectedStart, true) : 'Дата не отмечена'}</h2><p>{selectedPeriodSummary}</p></div>
      </article>
      <article className="cycle-bento-card day">
        <span className="report-3d-icon day" aria-hidden="true" />
        <div><small>{selectedIsCurrent ? 'Сегодня' : 'Длина цикла'}</small><h2>{selectedLength ?? '—'}</h2><p>{selectedIsCurrent ? 'день цикла' : pluralRu(selectedLength ?? 0, 'день', 'дня', 'дней')}</p></div>
      </article>
      <article className="cycle-bento-card ovulation">
        <span className="report-3d-icon ovulation" aria-hidden="true" />
        <div><small>Предполагаемая овуляция</small><h2>{ovulationDate ? formatRuDate(ovulationDate) : '—'}</h2><p>{fertileStart && fertileEnd ? `Окно: ${formatRuDate(fertileStart)} — ${formatRuDate(fertileEnd)}` : 'Нужна история цикла'}</p></div>
      </article>
      <p className="cycle-bento-note">Овуляция рассчитана по календарю и не подтверждена измерениями.</p>
    </section>

    <section className="cycle-report-chart-card cycle-trends-card">
      <div className="section-heading"><div><span className="eyebrow">Последние циклы</span><h2>Как меняется цикл</h2></div><span className="soft-status">{recentLengths.length} {pluralRu(recentLengths.length, 'цикл', 'цикла', 'циклов')}</span></div>
      {recentLengths.length >= 3 ? <><div className="cycle-trend-legend"><span><i /> {recentLengths.length >= 6 ? 'Средний цикл' : 'Предварительное среднее'} · {averageLength ? `${averageLength} дней` : '—'}</span><span><i /> Месячные · {recentDurations.length >= 3 ? `${(recentDurations.reduce((sum, value) => sum + value, 0) / recentDurations.length).toFixed(1).replace('.', ',')} дня` : 'мало данных'}</span></div>
      <svg viewBox="0 0 340 140" role="img" aria-label={`Длина циклов: ${chartValues.join(', ')}`}>
        <defs><linearGradient id="cycleReportArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fb4d7" stopOpacity=".55"/><stop offset="1" stopColor="#9fb4d7" stopOpacity=".04"/></linearGradient></defs>
        {[35,65,95,125].map((y) => <line key={y} x1="20" x2="320" y1={y} y2={y} stroke="#eee8ef" strokeWidth="1"/>)}
        <path d={`M25 120 L${chartPoints} L315 120 Z`} fill="url(#cycleReportArea)"/>
        <polyline points={chartPoints} fill="none" stroke="#8299c1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points={periodPoints} fill="none" stroke="#ef719a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {chartValues.map((value, index) => { const [cx, cy] = chartPoints.split(' ')[index].split(','); return <g key={`${value}-${index}`}><circle cx={cx} cy={cy} r="5" fill="#fff" stroke={index === chartValues.length - 1 ? '#f05b88' : '#8299c1'} strokeWidth="3"/>{index === chartValues.length - 1 && <text x={cx} y={Number(cy) - 12} textAnchor="middle">{value} дней</text>}</g>; })}
      </svg>
      <p>{minLength && maxLength ? `${recentLengths.length >= 6 ? 'Ваш личный' : 'Предварительный'} диапазон цикла ${minLength}–${maxLength} дней.` : 'Сравнение появится после завершённого цикла.'}</p></> : <div className="cycle-trend-waiting"><span><ChartSpline /></span><div><strong>{recentLengths.length === 2 ? 'Показываем два факта без среднего' : 'Сравнение появится после следующего завершённого цикла'}</strong><p>Сейчас сохранено {recentLengths.length} из 3 циклов, необходимых для первой предварительной картины.</p><i><b style={{ width: `${(recentLengths.length / 3) * 100}%` }}/></i></div></div>}
    </section>

    <section className="cycle-history-insight">
      <span className="history-doctor-icon"><Stethoscope /></span><div><small>По вашей истории</small><h2>{historySummary}</h2><p>{recentLengths.length >= 6 ? 'Полная личная динамика по последним шести завершённым циклам.' : recentLengths.length >= 3 ? `Предварительный вывод по ${recentLengths.length} завершённым циклам.` : `Нужно ещё ${Math.max(0, 3 - recentLengths.length)} ${pluralRu(Math.max(0, 3 - recentLengths.length), 'завершённый цикл', 'завершённых цикла', 'завершённых циклов')} для сравнения.`}</p></div>
    </section>

    <section className="previous-symptoms-card selected-cycle-symptoms">
      <div className="section-heading"><div><h2>Симптомы по дням</h2></div></div>
      {selectedTopSymptoms.length ? <div>{selectedTopSymptoms.map(([label, count]) => {
        const SymptomIcon = label.toLowerCase().includes('устал') ? BatteryLow : label.toLowerCase().includes('спин') ? PersonStanding : HeartPulse;
        return <article key={label}>
          <span className="selected-symptom-icon"><SymptomIcon /></span>
          <p><small>{count} {pluralRu(count, 'день', 'дня', 'дней')}</small><strong>{label}</strong></p>
        </article>;
      })}</div> : <div className="cycle-report-empty"><HeartPulse /><span><strong>В этом цикле симптомов не отмечено</strong><small>Пустые дни не считаются отсутствием симптомов.</small></span></div>}
    </section>

    <section className="cycle-symptom-comparison personal-cycle-comparison">
      <div className="symptom-comparison-header"><div><span className="eyebrow">Аналитика · личная история</span><h2>Сравнение циклов</h2><p>Смотрите свои симптомы по завершённым циклам.</p></div>{allObservedCycles.length >= 3 ? <div className="symptom-range-switch" aria-label="Период сравнения">{([3,6,12] as const).map((value) => <button key={value} className={comparisonRange === value ? 'active' : ''} disabled={allObservedCycles.length < value} onClick={() => setComparisonRange(value)}>{value} циклов</button>)}</div> : <span className="soft-status">Сравнение после 3-го цикла</span>}</div>
      <div className="comparison-view-tabs" role="tablist" aria-label="Вид сравнения"><button role="tab" aria-selected={comparisonView === 'history'} className={comparisonView === 'history' ? 'active' : ''} onClick={() => setComparisonView('history')}>История по циклам</button><button role="tab" aria-selected={comparisonView === 'patterns'} className={comparisonView === 'patterns' ? 'active' : ''} onClick={() => setComparisonView('patterns')}>Закономерности</button></div>

      {observedCycles.length >= 2 ? comparisonView === 'history' ? <>
        <div className="symptom-comparison-overview"><span><ChartSpline /></span><div><small>Что вы увидите</small><strong>Каждый цикл отдельно</strong><p>Когда появился симптом и сколько дней был отмечен.</p></div></div>
        <div className="personal-cycle-history">{[...observedCycles].reverse().map((cycle) => {
          const cycleSymptoms = new Map<string, number[]>();
          cycle.entries.forEach(([date, entry]) => entry.symptoms.forEach((symptom) => cycleSymptoms.set(symptom.label, [...(cycleSymptoms.get(symptom.label) ?? []), daysBetween(cycle.start, date) + 1])));
          const visibleSymptoms = [...cycleSymptoms.entries()].sort((left, right) => right[1].length - left[1].length).slice(0, 4);
          return <article key={cycle.start} className="personal-cycle-history-card">
            <header><strong>{formatRuDate(cycle.start)}{cycle.end ? ` — ${formatRuDate(addDays(cycle.end, -1))}` : ' — сейчас'}</strong><span>{cycle.length} {pluralRu(cycle.length, 'день', 'дня', 'дней')}</span></header>
            <div className="personal-cycle-phase-line" aria-label="Условные фазы цикла"><i/><i/><i/><i/></div>
            {visibleSymptoms.length ? <div className="personal-cycle-symptoms">{visibleSymptoms.map(([label, days]) => <button key={label} onClick={() => setDetailSymptom(label)}><strong>{label}</strong><span>{Array.from({ length: Math.min(31, Math.max(1, cycle.length)) }, (_, index) => <i key={index} className={days.includes(index + 1) ? 'active' : ''}/>)}</span><small>{days.length} {pluralRu(days.length, 'день', 'дня', 'дней')}</small></button>)}</div> : <p className="personal-cycle-no-symptoms">В этом цикле сохранённых симптомов нет.</p>}
          </article>;
        })}</div>
      </> : visibleSymptomComparisons.length ? <>
        <div className="symptom-comparison-overview"><span><Sparkle /></span><div><small>Mira заметила</small><strong>{recurringCount ? `${recurringCount} ${pluralRu(recurringCount, 'возможное повторение', 'возможных повторения', 'возможных повторений')}` : 'Повторений пока нет'}</strong><p>{newCount ? `Ещё ${newCount} ${pluralRu(newCount, 'симптом отмечен', 'симптома отмечены', 'симптомов отмечены')} только один раз.` : 'Показаны основные закономерности.'}</p></div></div>
        <div className="symptom-compare-rows">{visibleSymptomComparisons.map((item) => <button key={item.label} onClick={() => setDetailSymptom(item.label)}>
          <span className={`symptom-compare-icon ${item.repeatedCycles >= 2 ? 'repeated' : 'new'}`}>{item.repeatedCycles >= 2 ? <HeartPulse /> : <ChartSpline />}</span>
          <span className="symptom-compare-copy"><strong>{item.label}</strong><small>{item.repeatedCycles >= 2 ? `${item.repeatedCycles} из ${observedCycles.length} циклов${item.typicalStart ? ` · чаще ${item.typicalStart}${item.typicalEnd && item.typicalEnd !== item.typicalStart ? `–${item.typicalEnd}` : ''}-й день` : ''}` : 'Одна сохранённая отметка'}</small></span>
          <span className="symptom-cycle-presence" aria-label={`${item.label}: ${item.repeatedCycles} из ${observedCycles.length} циклов`}>{item.symptomDaysByCycle.map((days, index) => <i key={index} className={days.length ? 'active' : ''} />)}</span>
          <span className="symptom-status-label">{item.repeatedCycles >= 2 ? 'Похоже, повторяется' : 'Пока мало данных'}</span><ChevronRight />
        </button>)}</div>
      </> : <div className="comparison-empty"><ChartSpline /><span><strong>Пока нет симптомов для сравнения</strong><small>Сохраняйте отметки, и Mira начнёт показывать личную историю.</small></span></div> : <div className="comparison-empty"><ChartSpline /><span><strong>Пока мало истории для сравнения</strong><small>Нужны сохранённые отметки минимум в двух циклах.</small></span></div>}
      <p className="comparison-caption">Пустой день означает отсутствие записи, а не подтверждённое отсутствие симптома.</p>
    </section>

    {detailComparison && <div className="attention-overlay symptom-detail-overlay" onClick={() => setDetailSymptom(null)}><section className="settings-sheet symptom-detail-sheet" role="dialog" aria-modal="true" aria-label={`История симптома: ${detailComparison.label}`} onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={() => setDetailSymptom(null)} aria-label="Закрыть"><X /></button>
      <header><span><HeartPulse /></span><div><small>История симптома</small><h2>{detailComparison.label}</h2></div></header>
      <div className="symptom-detail-summary"><span><small>Циклы</small><strong>{detailComparison.repeatedCycles} из {observedCycles.length}</strong></span><span><small>Обычно</small><strong>{detailComparison.averageDays.toFixed(1).replace('.', ',')} {pluralRu(Math.round(detailComparison.averageDays), 'день', 'дня', 'дней')}</strong></span><span><small>Сейчас</small><strong>{detailComparison.comparison.replace('В этом цикле ', '')}</strong></span></div>
      <div className="symptom-detail-map"><div className="symptom-detail-axis"><span/><b>1</b><b>7</b><b>14</b><b>21</b><b>28</b><b>31</b></div>{detailComparison.symptomDaysByCycle.map((days, cycleIndex) => <div className="symptom-detail-cycle" key={cycleIndex}><small>Ц{cycleIndex + 1}</small><span>{Array.from({ length: 31 }, (_, dayIndex) => <i key={dayIndex} className={days.includes(dayIndex + 1) ? 'active' : ''} />)}</span></div>)}</div>
      <div className="symptom-detail-conclusion"><strong>{detailComparison.status}</strong><p>{detailComparison.typicalStart ? `Чаще отмечается на ${detailComparison.typicalStart}${detailComparison.typicalEnd && detailComparison.typicalEnd !== detailComparison.typicalStart ? `–${detailComparison.typicalEnd}` : ''}-й день цикла.` : 'Пока недостаточно отметок, чтобы определить типичные дни.'} {detailComparison.severityComparison}.</p></div>
      <p className="symptom-detail-note">Карта построена только по сохранённым отметкам и не является медицинским заключением.</p>
    </section></div>}

    <button className="secondary-button cycle-doctor-link" onClick={onOpenDoctorReport}><FileHeart /> Подготовить версию для врача</button>
  </div>;
}

function Report({ data, onBack, onNotify }: { data: AuraState; onBack: () => void; onNotify: (message: string) => void }) {
  const [notes, setNotes] = useState(false);
  const [intimate, setIntimate] = useState(false);
  const [reportRange, setReportRange] = useState<3 | 6 | 12>(3);
  const [sections, setSections] = useState<Record<string, boolean>>({ sleep: false, water: false, activity: false, nutrition: false });
  const metrics = getAuraCycleMetrics(data);
  const observationDates = getAuraObservationDates(data);
  const reportStarts = metrics.completedStarts.slice(-reportRange);
  const reportStart = reportStarts[0] ?? observationDates[0] ?? AURA_TODAY;
  const cycleLengths = metrics.cycleLengths.slice(-3);
  const analysisCycleLengths = metrics.cycleLengths.slice(-6);
  const hasPreliminaryCycleStats = analysisCycleLengths.length >= 3;
  const reportDays = cycleLengths.reduce((sum, value) => sum + value, 0);
  const reportStartSet = new Set(reportStarts);
  const reportCycleStartForDate = (date: string) => [...metrics.starts].reverse().find((start) => start <= date);
  const reportEndStart = reportStarts.length ? metrics.starts[metrics.starts.indexOf(reportStarts[reportStarts.length - 1]) + 1] : null;
  const reportEnd = reportEndStart ? addDays(reportEndStart, -1) : AURA_TODAY;
  const averageCycle = hasPreliminaryCycleStats ? Math.round(analysisCycleLengths.reduce((sum, value) => sum + value, 0) / analysisCycleLengths.length) : null;
  const cycleRange = hasPreliminaryCycleStats ? `${Math.min(...analysisCycleLengths)}–${Math.max(...analysisCycleLengths)}` : null;
  const periodEpisodesByStart = new Map(getAuraPeriodEpisodes(data).map((episode) => [episode.start, episode]));
  const analysisDurations = periodDurations(data).slice(-6);
  const averagePeriod = hasPreliminaryCycleStats && analysisDurations.length >= 3 ? (analysisDurations.reduce((sum, value) => sum + value, 0) / analysisDurations.length).toFixed(1).replace('.', ',') : null;
  const optionalSections = Object.values(sections).filter(Boolean).length + Number(notes) + Number(intimate);
  const includedSections = 3 + optionalSections;
  const noteCount = Object.values(data.entries).filter((day) => day.note).length;
  const intimateCount = Object.values(data.entries).filter((day) => day.intimate !== undefined).length;
  const reportEntries = Object.entries(data.entries).filter(([date]) => {
    const cycleStart = reportCycleStartForDate(date);
    return Boolean(cycleStart && reportStartSet.has(cycleStart));
  }).sort(([left], [right]) => left.localeCompare(right));
  const symptomDayCount = reportEntries.filter(([, day]) => day.symptoms.length > 0).length;
  const wellbeingDayCount = reportEntries.filter(([, day]) => Boolean(day.rating || day.energy)).length;
  const bleedingCheckins = reportEntries.flatMap(([date, day]) => day.periodCheckin && (day.periodCheckin.bleedingType !== 'after-sex' || intimate) ? [{ date, checkin: day.periodCheckin }] : []).slice(-8);
  const ratings = reportEntries.flatMap(([, day]) => day.rating ? [day.rating] : []);
  const energyValues = reportEntries.flatMap(([, day]) => day.energy ? [day.energy] : []);
  const sleepValues = reportEntries.flatMap(([, day]) => day.sleepHours === undefined ? [] : [day.sleepHours]);
  const waterValues = reportEntries.flatMap(([, day]) => day.water === undefined ? [] : [day.water]);
  const stepsValues = reportEntries.flatMap(([, day]) => day.steps === undefined ? [] : [day.steps]);
  const nutritionValues = reportEntries.flatMap(([, day]) => day.calories === undefined ? [] : [day.calories]);
  const average = (values: number[]) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1).replace('.', ',') : '—';
  const symptomStats = new Map<string, { label: string; count: number; impact: number; severityTotal: number; severeDays: number }>();
  reportEntries.forEach(([, day]) => day.symptoms.forEach((symptom) => {
    const current = symptomStats.get(symptom.id) ?? { label: symptom.label, count: 0, impact: 0, severityTotal: 0, severeDays: 0 };
    current.count += 1;
    current.impact += Number(symptom.affectsLife);
    current.severityTotal += symptom.severity;
    current.severeDays += Number(symptom.severity === 3);
    symptomStats.set(symptom.id, current);
  }));
  const topSymptoms = [...symptomStats.values()].sort((left, right) => right.count - left.count).slice(0, 5);
  const doctorCycleRows = cycleLengths.map((length, index) => ({
    start: reportStarts[Math.max(0, reportStarts.length - cycleLengths.length) + index] ?? reportStart,
    length,
    period: periodEpisodesByStart.get(reportStarts[Math.max(0, reportStarts.length - cycleLengths.length) + index] ?? reportStart)?.duration ?? null,
  }));
  const symptomDays = new Map<string, Set<number>>();
  reportEntries.forEach(([date, day]) => day.symptoms.forEach((symptom) => {
    const cycleStart = [...metrics.starts].reverse().find((start) => start <= date) ?? reportStart;
    const cycleDay = Math.min(31, Math.max(1, daysBetween(cycleStart, date) + 1));
    symptomDays.set(symptom.label, new Set([...(symptomDays.get(symptom.label) ?? []), cycleDay]));
  }));
  const reportNotes = reportEntries.flatMap(([date, day]) => day.note?.trim() ? [{ date, note: day.note.trim() }] : []);
  const intimacyYes = reportEntries.filter(([, day]) => day.intimate === true).length;
  const intimacyConcern = reportEntries.filter(([, day]) => day.intimacyComfort === 'pain' || day.intimacyAfter?.some((item) => item !== 'none')).length;
  const safetyFacts = getAuraSafetyFacts(data, intimate).filter((fact) => {
    const cycleStart = reportCycleStartForDate(fact.date);
    return Boolean(cycleStart && reportStartSet.has(cycleStart) && (fact.category !== 'intimate' || intimate));
  }).slice(0, 12);
  return <div className="screen report-screen">
    <TopBack title="Отчёт для врача" onBack={onBack} action={<span className="secure-badge"><ShieldCheck /> Локально</span>} />
    <section className="aura-hero report-hero"><span className="glass-label"><FileHeart /> Факты для консультации</span><h2>Подготовьте понятную историю</h2><p>Выберите только те данные, которыми готовы поделиться.</p></section>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">Период</span><h2>{metrics.completedCycles ? `Последние ${Math.min(reportRange, metrics.completedCycles)} ${pluralRu(Math.min(reportRange, metrics.completedCycles), 'цикл', 'цикла', 'циклов')}` : 'С начала наблюдений'}</h2></div></div>{metrics.completedCycles >= 3 ? <div className="analytics-range-tabs report-range-tabs" aria-label="Период отчёта">{([3,6,12] as const).map((value) => <button key={value} className={reportRange === value ? 'active' : ''} disabled={metrics.completedCycles < value} onClick={() => setReportRange(value)}>{value} циклов</button>)}</div> : <p className="chart-caption">Сейчас доступны факты по {metrics.completedCycles} {pluralRu(metrics.completedCycles, 'завершённому циклу', 'завершённым циклам', 'завершённым циклам')}. Сравнение появится после третьего.</p>}<div className="report-summary"><span><strong>{reportDays}</strong><small>{pluralRu(reportDays, 'день периода', 'дня периода', 'дней периода')}</small></span><span><strong>{metrics.completedCycles}</strong><small>{pluralRu(metrics.completedCycles, 'завершённый цикл', 'завершённых цикла', 'завершённых циклов')}</small></span><span><strong>{symptomDayCount}</strong><small>{pluralRu(symptomDayCount, 'день с симптомами', 'дня с симптомами', 'дней с симптомами')}</small></span></div></section>
    <section className="surface report-options"><div className="section-heading"><div><span className="eyebrow">Дополнительно</span><h2>Добавить в отчёт</h2></div>{optionalSections > 0 && <span className="soft-status">{optionalSections} {pluralRu(optionalSections, 'раздел', 'раздела', 'разделов')}</span>}</div>{([['sleep','Сон','Длительность и качество'],['water','Вода','Среднее количество по дням'],['activity','Шаги','История ежедневной активности'],['nutrition','Питание','Калорийность по сохранённым дням']] as const).map(([id,title,note])=><ToggleRow key={id} title={title} note={note} checked={sections[id]} onClick={() => setSections((current) => ({ ...current, [id]: !current[id] }))}/>)}<div className="sensitive-label"><LockKeyhole /> Чувствительные данные выключены</div><ToggleRow title="Личные заметки" note={`${noteCount} ${pluralRu(noteCount, 'заметка', 'заметки', 'заметок')}`} checked={notes} onClick={()=>setNotes(!notes)} sensitive/><ToggleRow title="Интимная жизнь" note={`${intimateCount} ${pluralRu(intimateCount, 'отметка', 'отметки', 'отметок')}`} checked={intimate} onClick={()=>setIntimate(!intimate)} sensitive/></section>
    <section className="report-preview doctor-report-preview" id="mira-report">
      {!includedSections && <div className="chart-empty"><ListChecks /><strong>Выберите хотя бы один раздел</strong><small>Предпросмотр обновляется сразу после переключения.</small></div>}
      {!!includedSections && <div className="doctor-report-pages">
        <article className="doctor-report-page">
          <header><div className="report-logo"><MiraMark /> MIRA HEALTH REPORT</div><small>Страница 1 из 2</small></header>
          <div className="doctor-report-meta"><strong>Цикл и месячные</strong><span>{formatRuDate(reportStart, true)} — {formatRuDate(reportEnd, true)}</span></div>
          <>
            <div className="doctor-report-summary"><span><small>{hasPreliminaryCycleStats ? 'Средний цикл' : 'Завершённые циклы'}</small><strong>{averageCycle ? `${averageCycle} дней` : `${cycleLengths.length} ${pluralRu(cycleLengths.length, 'цикл', 'цикла', 'циклов')}`}</strong></span><span><small>Месячные</small><strong>{averagePeriod ? `${averagePeriod} дня` : 'Факты по датам'}</strong></span><span><small>Личный диапазон</small><strong>{cycleRange ?? 'Нужно 3 цикла'}</strong></span></div>
            {!hasPreliminaryCycleStats && <p className="doctor-report-data-note">Средние и диапазон не рассчитаны: нужны минимум три завершённых цикла.</p>}
            <section className="doctor-cycle-chart"><h3>Длина последних циклов</h3>{doctorCycleRows.length ? doctorCycleRows.map((row) => <div key={`${row.start}-${row.length}`}><small>{formatRuDate(row.start)}</small><span><i style={{width:`${Math.min(100, row.length / 35 * 100)}%`}}/><b style={{width:`${Math.min(100, (row.period ?? 0) / 35 * 100)}%`}}/></span><strong>{row.length} дн.</strong></div>) : <p>Нужен хотя бы один завершённый цикл.</p>}</section>
            <section className="doctor-period-facts"><h3>Эпизоды месячных</h3>{reportStarts.map((date) => { const episode = periodEpisodesByStart.get(date); const status = episode?.status === 'confirmed' && episode.duration ? `${episode.duration} ${pluralRu(episode.duration, 'день', 'дня', 'дней')} · окончание подтверждено` : episode?.status === 'ongoing' ? `продолжаются · отмечено ${episode.observedDays} ${pluralRu(episode.observedDays, 'день', 'дня', 'дней')}` : `отмечено ${episode?.observedDays ?? 1} ${pluralRu(episode?.observedDays ?? 1, 'день', 'дня', 'дней')} · окончание неизвестно`; return <span key={date}><i/><strong>{formatRuDate(date, true)}</strong><small>{status}</small></span>; })}</section>
          </>
          <footer>Mira показывает сохранённые пользователем данные и не ставит диагноз.</footer>
        </article>

        <article className="doctor-report-page">
          <header><div className="report-logo"><MiraMark /> MIRA HEALTH REPORT</div><small>Страница 2 из 2</small></header>
          <div className="doctor-report-meta"><strong>Симптомы и самочувствие</strong><span>{symptomDayCount} {pluralRu(symptomDayCount, 'день с симптомами', 'дня с симптомами', 'дней с симптомами')} · {wellbeingDayCount} {pluralRu(wellbeingDayCount, 'день с оценкой', 'дня с оценкой', 'дней с оценкой')}</span></div>
          <section className="doctor-event-map"><h3>Симптомы по дням цикла</h3><div className="doctor-event-axis"><span/><b>1</b><b>7</b><b>14</b><b>21</b><b>28</b><b>31</b></div>{topSymptoms.length ? topSymptoms.map((symptom) => <div key={symptom.label}><strong>{symptom.label}</strong><span>{Array.from({length:31},(_, index)=><i key={index} className={symptomDays.get(symptom.label)?.has(index + 1) ? 'active' : ''}/>)}</span><small>{symptom.count} дн.</small></div>) : <p>Симптомы не отмечены.</p>}</section>
          <div className="doctor-report-facts-grid">
            <section><h3>Состояние</h3><strong>{average(ratings)} / 5</strong><small>{ratings.length} {pluralRu(ratings.length, 'оценка', 'оценки', 'оценок')}</small><strong>{average(energyValues)} / 5</strong><small>энергия · {energyValues.length} {pluralRu(energyValues.length, 'отметка', 'отметки', 'отметок')}</small></section>
            {sections.sleep && <section><h3>Сон</h3><strong>{average(sleepValues)} ч</strong><small>{sleepValues.length} ночей</small><strong>{reportEntries.filter(([, day]) => day.sleepQuality === 'Хорошее').length}</strong><small>отметок «хорошо»</small></section>}
            {sections.water && <section><h3>Вода</h3><strong>{waterValues.length ? `${Math.round(waterValues.reduce((sum,value)=>sum+value,0)/waterValues.length).toLocaleString('ru-RU')} мл` : '—'}</strong><small>{waterValues.length} сохранённых дней</small></section>}
            {sections.activity && <section><h3>Шаги</h3><strong>{stepsValues.length ? Math.round(stepsValues.reduce((sum,value)=>sum+value,0)/stepsValues.length).toLocaleString('ru-RU') : '—'}</strong><small>{stepsValues.length} сохранённых дней</small></section>}
            {sections.nutrition && <section><h3>Питание</h3><strong>{nutritionValues.length ? `${Math.round(nutritionValues.reduce((sum,value)=>sum+value,0)/nutritionValues.length).toLocaleString('ru-RU')} ккал` : '—'}</strong><small>{nutritionValues.length} сохранённых дней</small></section>}
          </div>
          {bleedingCheckins.length > 0 && <section className="doctor-compact-list"><h3>Кровотечение</h3>{bleedingCheckins.slice(-4).map(({date,checkin})=><p key={`${date}-${checkin.completedAt}`}><strong>{formatRuDate(date)}</strong><span>{checkin.flow === 'very-heavy' ? 'Очень обильное' : checkin.flow === 'heavy' ? 'Обильное' : checkin.flow === 'medium' ? 'Среднее' : 'Слабое'}{checkin.painScore ? ` · боль ${checkin.painScore}/10` : ''}</span></p>)}</section>}
          {safetyFacts.length > 0 && <section className="doctor-compact-list attention"><h3>Важные эпизоды</h3>{safetyFacts.slice(0,3).map((fact,index)=><p key={`${fact.date}-${index}`}><strong>{formatRuDate(fact.date)}</strong><span>{fact.label}</span></p>)}</section>}
          {(notes || intimate) && <section className="doctor-sensitive-note"><LockKeyhole /><span>{notes ? `${reportNotes.length} личных заметок` : ''}{notes && intimate ? ' · ' : ''}{intimate ? `Интимная жизнь: ${intimacyYes} отметок, изменений: ${intimacyConcern}` : ''}</span></section>}
          <footer>Данные подготовлены для обсуждения со специалистом. Это не медицинское заключение.</footer>
        </article>
      </div>}
    </section>
    <button className="primary-button" onClick={() => { onNotify('Открыто системное окно печати'); window.print(); }}><FileDown /> Открыть печать / сохранить PDF</button>
  </div>;
}

function ToggleRow({ title, note, checked, onClick, sensitive = false }: { title: string; note: string; checked: boolean; onClick?: () => void; sensitive?: boolean }) {
  return <button className={`toggle-row ${sensitive ? 'sensitive' : ''}`} onClick={onClick}><span><strong>{title}{sensitive && <i>личное</i>}</strong><small>{note}</small></span><i className={`toggle ${checked ? 'on' : ''}`}><b /></i></button>;
}

function Profile({ data, onOpenPersonalData, onOpenHealthContext, onBack, onOpenHomeSettings, onOpenDiarySettings, onOpenData, onOpenSaved, onOpenFeedback, onOpenSupport }: { data: AuraState; onOpenPersonalData: () => void; onOpenHealthContext: () => void; onBack: () => void; onOpenHomeSettings: () => void; onOpenDiarySettings: () => void; onOpenData: () => void; onOpenSaved: () => void; onOpenFeedback: (category: FeedbackCategory) => void; onOpenSupport: () => void }) {
  const metrics = getAuraCycleMetrics(data);
  const cycleNote = metrics.expectedLength ? `${metrics.expectedLength} дней · месячные ${data.onboarding.periodLength ?? '—'} дней` : `Мало данных · месячные ${data.onboarding.periodLength ?? '—'} дней`;
  const healthContextCount = Number(Boolean(data.profile.healthContext.contraception)) + Number(Boolean(data.profile.healthContext.iud)) + data.profile.healthContext.bleedingMedications.length;
  return <div className="screen profile-screen">
    <TopBack title="Профиль" onBack={onBack} />
    <button className="profile-person" onClick={onOpenPersonalData}><span className="profile-avatar"><AnimalAvatarIcon avatar={data.avatar} /></span><div><h2>{data.profile.fullName || 'Личные данные'}</h2><p>{data.profile.birthDate ? 'Имя, возраст и аватар' : 'Добавить имя, возраст и аватар'}</p></div><ChevronRight /></button>
    <section className="privacy-aura"><span><ShieldCheck /></span><div><small>Приватность</small><h2>Данные остаются на этом устройстве</h2><p>Локальная база и резервная копия в браузере. Ничего не отправляется на сервер.</p><button onClick={onOpenData}>Управлять данными <ChevronRight /></button></div></section>
    <section className="profile-group"><span className="eyebrow">Настройки</span><ProfileRow icon={Droplet} tone="rose" title="Цикл и прогноз" note={cycleNote}/><ProfileRow icon={Stethoscope} tone="sage" title="Контрацепция и препараты" note={healthContextCount ? `${healthContextCount} ${pluralRu(healthContextCount, 'факт', 'факта', 'фактов')} · добровольно` : 'Не заполнено · добровольно'} onClick={onOpenHealthContext}/><ProfileRow icon={NotebookTabs} tone="violet" title="Дневник" note={`${Object.values(data.modules).filter(Boolean).length} разделов включено`} onClick={onOpenDiarySettings}/><ProfileRow icon={House} tone="coral" title="Главная страница" note={`${Object.values(data.homeCards).filter(Boolean).length} карточек`} onClick={onOpenHomeSettings}/><div className="profile-toggle-row is-unavailable"><span className="metric-icon indigo"><Bell /></span><span><strong>Напоминания</strong><small>Пока недоступны в веб-версии</small></span><i className="soft-status">Позже</i></div></section>
    <section className="profile-group"><span className="eyebrow">Ваши данные</span><ProfileRow icon={FileDown} tone="sage" title="Экспорт и резервная копия" note="Создать или восстановить копию" onClick={onOpenData}/><ProfileRow icon={LockKeyhole} tone="violet" title="Данные и приватность" note="Хранение, перенос и удаление" onClick={onOpenData}/><a className="profile-row profile-link" href="/privacy.html" target="_blank" rel="noreferrer"><span className="metric-icon violet"><ShieldCheck /></span><span><strong>Политика конфиденциальности</strong><small>Какие данные хранит Mira и как ими управлять</small></span><ChevronRight /></a><ProfileRow icon={BookOpenText} tone="coral" title="Сохранённые материалы" note={`${data.savedArticles.length} ${pluralRu(data.savedArticles.length, 'статья', 'статьи', 'статей')}`} onClick={onOpenSaved}/></section>
    <section className="community-card">
      <div className="community-heading"><MiraMark className="community-mark" /><div><span className="eyebrow">Проект создаётся вместе с вами</span><h2>Помогите сделать Mira лучше</h2><p>Сообщайте о сложностях, предлагайте идеи или поддержите бесплатный проект.</p></div></div>
      <div className="community-links">
        <button onClick={() => onOpenFeedback('problem')}><span className="community-link-icon problem"><Bug /></span><span><strong>Сообщить об ошибке</strong><small>Если что-то работает непонятно или неправильно</small></span><ChevronRight /></button>
        <button onClick={() => onOpenFeedback('idea')}><span className="community-link-icon idea"><Lightbulb /></span><span><strong>Предложить новую функцию</strong><small>Расскажите, чего вам не хватает в Mira</small></span><ChevronRight /></button>
        <button className="support" onClick={onOpenSupport}><span className="community-link-icon support"><Heart /></span><span><strong>Поддержать Mira</strong><small>Помочь бесплатному проекту развиваться</small></span><ChevronRight /></button>
      </div>
      <small><ShieldCheck /> Личные записи не прикрепляются. Поддержка добровольна и не открывает платные функции.</small>
    </section>
    <section className="surface about-card"><MiraMark className="about-brand-mark" /><div><strong>Mira</strong><p>Не является медицинским устройством и не заменяет консультацию специалиста.</p></div><Info /></section>
  </div>;
}

function PersonalDataSheet({ data, onSave, onClose }: { data: AuraState; onSave: (profile: AuraState['profile'], avatar: AuraAnimalAvatar) => void; onClose: () => void }) {
  const [fullName, setFullName] = useState(data.profile.fullName);
  const [birthDate, setBirthDate] = useState(data.profile.birthDate ?? '');
  const [avatar, setAvatar] = useState(data.avatar);
  const age = birthDate ? Math.max(0, Math.floor(daysBetween(birthDate, AURA_TODAY) / 365.2425)) : null;
  const save = () => {
    onSave({ fullName: fullName.trim(), birthDate: birthDate || undefined, healthContext: data.profile.healthContext }, avatar);
    onClose();
  };
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet personal-data-sheet" role="dialog" aria-modal="true" aria-label="Личные данные" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className="personal-data-icon"><UserRound /></span><h2>Личные данные</h2>
      <label className="personal-field"><span>Имя и фамилия</span><input value={fullName} maxLength={120} placeholder="Как к вам обращаться" onChange={(event) => setFullName(event.target.value)}/></label>
      <label className="personal-field"><span>Дата рождения</span><input type="date" max={AURA_TODAY} value={birthDate} onChange={(event) => setBirthDate(event.target.value)}/>{age !== null && <small>{age} {pluralRu(age, 'год', 'года', 'лет')}</small>}</label>
      <div className="personal-avatar-picker"><span>Аватар</span><div className="avatar-grid">{animalAvatars.map(({ id, label, icon: Icon }) => <button key={id} className={avatar === id ? 'active' : ''} onClick={() => setAvatar(id)} aria-label={label} aria-pressed={avatar === id}><Icon /><small>{label}</small>{avatar === id && <Check />}</button>)}</div></div>
      <button className="primary-button" onClick={save}><Check /> Сохранить</button>
    </section>
  </div>;
}

const contraceptionLabels: Record<AuraContraception, string> = {
  none: 'Не использую',
  pill: 'Гормональные таблетки',
  'implant-injection': 'Имплант или инъекция',
  'ring-patch': 'Кольцо или пластырь',
  other: 'Другой метод',
};

const iudLabels: Record<AuraIud, string> = {
  none: 'Нет ВМС',
  copper: 'Медная ВМС',
  hormonal: 'Гормональная ВМС',
  unsure: 'Не уверена в типе',
};

const bleedingMedicationLabels: Record<AuraBleedingMedication, string> = {
  anticoagulant: 'Препарат для разжижения крови',
  aspirin: 'Аспирин регулярно',
  'hormonal-treatment': 'Гормональная терапия',
  other: 'Другой влияющий препарат',
};

function HealthContextSheet({ data, onSave, onClose }: { data: AuraState; onSave: (context: AuraState['profile']['healthContext']) => void; onClose: () => void }) {
  const initial = data.profile.healthContext;
  const [contraception, setContraception] = useState<AuraContraception | undefined>(initial.contraception);
  const [iud, setIud] = useState<AuraIud | undefined>(initial.iud);
  const [bleedingMedications, setBleedingMedications] = useState<AuraBleedingMedication[]>(initial.bleedingMedications);
  const toggleMedication = (value: AuraBleedingMedication) => setBleedingMedications((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const save = () => {
    onSave({ contraception, iud, bleedingMedications, updatedAt: new Date().toISOString() });
    onClose();
  };
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet health-context-sheet" role="dialog" aria-modal="true" aria-labelledby="health-context-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className="health-context-icon"><Stethoscope /></span><span className="eyebrow">Добровольный контекст</span><h2 id="health-context-title">Что может влиять на кровотечение</h2><p>Эти сведения помогают подготовить факты для врача. Они не меняют диагноз — Mira его не ставит.</p>
      <section className="health-context-group"><div><strong>Гормональная контрацепция</strong><small>Выберите один вариант или пропустите</small></div><div className="health-context-options">{(Object.entries(contraceptionLabels) as Array<[AuraContraception,string]>).map(([id,label]) => <button key={id} className={contraception === id ? 'active' : ''} onClick={() => setContraception(contraception === id ? undefined : id)}>{contraception === id && <Check />}{label}</button>)}</div></section>
      <section className="health-context-group"><div><strong>Внутриматочная спираль</strong><small>Тип важен для контекста кровотечения</small></div><div className="health-context-options">{(Object.entries(iudLabels) as Array<[AuraIud,string]>).map(([id,label]) => <button key={id} className={iud === id ? 'active' : ''} onClick={() => setIud(iud === id ? undefined : id)}>{iud === id && <Check />}{label}</button>)}</div></section>
      <section className="health-context-group"><div><strong>Препараты, влияющие на кровотечение</strong><small>Можно выбрать несколько; названия препаратов не нужны</small></div><div className="health-context-options">{(Object.entries(bleedingMedicationLabels) as Array<[AuraBleedingMedication,string]>).map(([id,label]) => <button key={id} className={bleedingMedications.includes(id) ? 'active' : ''} onClick={() => toggleMedication(id)}>{bleedingMedications.includes(id) && <Check />}{label}</button>)}</div></section>
      <aside className="health-context-privacy"><LockKeyhole /><span><strong>Чувствительные данные</strong>В отчёт и резервную копию они попадут только после отдельного разрешения.</span></aside>
      <button className="primary-button" onClick={save}><Check /> Сохранить контекст</button>
      <button className="text-button" onClick={() => { onSave({ bleedingMedications: [] }); onClose(); }}>Очистить раздел</button>
    </section>
  </div>;
}

function ProfileRow({ icon: Icon, tone, title, note, onClick }: { icon: LucideIcon; tone: string; title: string; note: string; onClick?: () => void }) {
  return <button className={`profile-row ${onClick ? '' : 'is-static'}`} onClick={onClick} disabled={!onClick}><span className={`metric-icon ${tone}`}><Icon /></span><span><strong>{title}</strong><small>{note}</small></span>{onClick ? <ChevronRight /> : <span />}</button>;
}

function FeedbackSheet({ initialCategory, onClose, onSubmit }: { initialCategory: FeedbackCategory; onClose: () => void; onSubmit: (payload: FeedbackPayload) => Promise<void> }) {
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await onSubmit({ category, message, contact, clientVersion: '0.1.0' });
    } catch {
      setError('Не удалось подготовить сообщение. Скопируйте текст и попробуйте ещё раз.');
    } finally {
      setSending(false);
    }
  };
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet feedback-sheet" role="dialog" aria-modal="true" aria-label="Обратная связь" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className="feedback-icon"><MessageSquareText /></span><span className="eyebrow">Помогите улучшить Mira</span><h2>Что вы хотите изменить?</h2><p>Подготовим безопасное сообщение без данных дневника. Вы сможете отправить его через доступное приложение.</p>
      <div className="feedback-categories" role="group" aria-label="Тема сообщения">{([['problem','Ошибка'],['idea','Новая функция'],['question','Вопрос']] as const).map(([value,label]) => <button key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
      <label className="feedback-field"><span>Сообщение</span><textarea autoFocus value={message} maxLength={1200} placeholder="Например: хочу видеть сравнение боли по циклам…" onChange={(event) => setMessage(event.target.value)}/><small>{message.length} / 1200</small></label>
      <label className="feedback-field compact"><span>Как с вами связаться <i>необязательно</i></span><input type="text" value={contact} placeholder="Email или @username" onChange={(event) => setContact(event.target.value)}/></label>
      <aside className="feedback-privacy"><ShieldCheck /><span><strong>Данные дневника не прикрепляются</strong>В сообщении будут только текст, категория и контакт, если вы его указали.</span></aside>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={!message.trim() || sending} onClick={submit}><Send /> {sending ? 'Подготавливаем…' : 'Отправить или поделиться'}</button>
      <small className="prototype-connection">Если владелец проекта подключит endpoint, сообщение отправится напрямую. Без endpoint откроется системное меню «Поделиться».</small>
    </section>
  </div>;
}

function SupportSheet({ onClose, onNotify }: { onClose: () => void; onNotify: (message: string) => void }) {
  const [amount, setAmount] = useState(199);
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const telegramUrl = viteEnv?.VITE_TELEGRAM_URL?.startsWith('https://') ? viteEnv.VITE_TELEGRAM_URL : undefined;
  const donationUrl = viteEnv?.VITE_DONATION_URL?.startsWith('https://') ? viteEnv.VITE_DONATION_URL : undefined;
  const openConfiguredLink = (url: string | undefined, unavailableMessage: string) => {
    if (!url) {
      onNotify(unavailableMessage);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet support-sheet" role="dialog" aria-modal="true" aria-label="Поддержать Mira" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <div className="support-hero"><span><Heart /></span><small>Mira остаётся бесплатной</small><h2>Спасибо, что помогаете проекту жить</h2><p>Подписка помогает нам расти, а добровольные донаты — оплачивать разработку и медицинскую редактуру.</p></div>
      <div className="support-option"><span className="metric-icon violet"><Bell /></span><div><strong>Подписаться на новости</strong><small>{telegramUrl ? 'Обновления продукта, опросы и приглашения в тестирование.' : 'Канал будет доступен после публикации ссылки владельцем проекта.'}</small></div><button disabled={!telegramUrl} onClick={() => openConfiguredLink(telegramUrl, 'Telegram-канал пока не подключён')}>{telegramUrl ? 'Подписаться' : 'Скоро'}</button></div>
      <div className="donation-block"><span className="eyebrow">Разовая поддержка</span><div className="donation-amounts">{[99,199,499].map((value) => <button key={value} className={amount === value ? 'active' : ''} onClick={() => setAmount(value)}>{value} ₽</button>)}</div><button className="primary-button" disabled={!donationUrl} onClick={() => openConfiguredLink(donationUrl, 'Платёжная ссылка пока не подключена')}><Heart /> {donationUrl ? `Поддержать на ${amount} ₽` : 'Поддержка появится позже'}</button></div>
      <p className="support-promise"><ShieldCheck /> Донат добровольный. Все функции остаются доступными бесплатно.</p>
    </section>
  </div>;
}

function SettingsSheet({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть настройки"><X /></button>
      <span className="eyebrow">Настройка отображения</span><h2>{title}</h2><p>{description}</p>
      <div className="settings-list">{children}</div>
      <button className="primary-button" onClick={onClose}><Check /> Готово</button>
    </section>
  </div>;
}

function DataControlsSheet({ data, onChangeData, onExport, onImport, onDelete, onClose }: { data: AuraState; onChangeData: (updater: (current: AuraState) => AuraState) => void; onExport: () => void; onImport: (event: ChangeEvent<HTMLInputElement>) => void; onDelete: () => void; onClose: () => void }) {
  const observationCount = getAuraObservationDates(data).length;
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet data-controls-sheet" role="dialog" aria-modal="true" aria-label="Данные и приватность" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" /><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className="eyebrow">Локально и под вашим контролем</span><h2>Данные и приватность</h2><p>Записи хранятся в этом браузере. Mira не отправляет их на сервер.</p>
      <div className="data-trust-card"><ShieldCheck /><div><strong>Локальная база защищает историю</strong><small>IndexedDB + резервная копия · {observationCount} {pluralRu(observationCount, 'отметка', 'отметки', 'отметок')}</small></div></div>
      <button className="data-action" onClick={onExport}><FileDown /><span><strong>Сохранить копию</strong><small>Файл JSON для переноса и резервного хранения</small></span><ChevronRight /></button>
      <label className="data-action import-action"><Upload /><span><strong>Восстановить из копии</strong><small>Перед заменой файл будет проверен</small></span><ChevronRight /><input type="file" accept="application/json,.json" onChange={onImport}/></label>
      <ToggleRow title="Включать личные заметки" note="По умолчанию заметки и интимные данные исключены" checked={data.privacy.sensitiveExport} sensitive onClick={() => onChangeData((current) => ({ ...current, privacy: { ...current.privacy, sensitiveExport: !current.privacy.sensitiveExport } }))}/>
      <button className="data-action" onClick={() => onChangeData((current) => ({ ...current, attention: { showCount: 0 } }))}><Bell /><span><strong>Сбросить паузу рекомендаций</strong><small>Новая подходящая рекомендация появится снова</small></span><ChevronRight /></button>
      <button className="delete-action" onClick={onDelete}><Trash2 /> Удалить все локальные данные</button>
    </section>
  </div>;
}

function ConfirmDelete({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="attention-overlay confirm-overlay">
    <section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
      <span className="confirm-icon"><Trash2 /></span><span className="eyebrow">Необратимое действие</span><h2 id="delete-title">Удалить всю историю?</h2><p>Будут удалены записи, настройки и сохранённые материалы из этого браузера. Сначала можно сохранить копию.</p>
      <button className="danger-button" onClick={onConfirm}>Да, удалить данные</button><button className="secondary-button" onClick={onCancel}>Отмена</button>
    </section>
  </div>;
}

function TopBack({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return <header className="top-back"><button className="round-button" onClick={onBack} aria-label={`Назад с экрана «${title}»`}><ChevronLeft /></button><h1>{title}</h1>{action ?? <span />}</header>;
}

function BottomNav({ screen, onOpen }: { screen: Screen; onOpen: (screen: Screen) => void }) {
  return <nav className="bottom-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => onOpen(id)}><span><Icon /></span><small>{label}</small></button>)}</nav>;
}

const root = document.getElementById('aura-root');
const auraGlobal = globalThis as typeof globalThis & { __lunaAuraRoot?: ReturnType<typeof createRoot> };

function AuraDatabaseBootstrap() {
  const [initialData, setInitialData] = useState<AuraState | null>(null);
  useEffect(() => {
    let active = true;
    void loadAuraDatabaseState().then((stored) => {
      if (active) setInitialData(stored);
    });
    return () => { active = false; };
  }, []);
  if (!initialData) return <div className="database-loading" role="status" aria-live="polite">Открываем вашу историю…</div>;
  return <App initialData={initialData} />;
}

if (root) {
  registerMiraServiceWorker();
  auraGlobal.__lunaAuraRoot ??= createRoot(root);
  auraGlobal.__lunaAuraRoot.render(<StartupGate><AuraDatabaseBootstrap /></StartupGate>);
}
