import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Annoyed,
  Bell,
  BookOpenText,
  Bookmark,
  CalendarRange,
  ChartSpline,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileDown,
  Droplet,
  FileHeart,
  Footprints,
  Frown,
  CircleGauge,
  Dumbbell,
  GlassWater,
  Heart,
  House,
  Info,
  Infinity as InfinityIcon,
  ListChecks,
  LockKeyhole,
  Laugh,
  Meh,
  Moon,
  MessageSquareText,
  NotebookTabs,
  Plus,
  Search,
  Save,
  Send,
  ShoppingBag,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Sparkle,
  Stethoscope,
  PersonStanding,
  Pill,
  Upload,
  Utensils,
  Thermometer,
  Timer,
  CircleUserRound,
  Weight,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import './aura.css';
import { StartupGate } from './StartupSplash';
import {
  AURA_TODAY,
  addDays,
  clearAllMiraStorage,
  createEmptyAuraState,
  daysBetween,
  deriveAttentionEvidence,
  emptyAuraEntry,
  getAuraCycleMetrics,
  loadAuraState,
  parseImportedAuraState,
  persistAuraState,
  setAuraPeriodStart,
  shouldShowAttention,
  type AuraDayEntry,
  type AuraHomeCardId,
  type AuraIntimacyAfter,
  type AuraModuleId,
  type AuraOnboarding,
  type AuraSymptom,
  type AuraState,
} from './auraState';

function MiraMark({ className = '', label }: { className?: string; label?: string }) {
  return <span className={`mira-brand-mark ${className}`} role={label ? 'img' : undefined} aria-label={label}><img src="/mira-logo.png" alt="" /></span>;
}

type Screen = 'onboarding' | 'today' | 'calendar' | 'diary' | 'analytics' | 'knowledge' | 'article' | 'report' | 'profile';
type AnalyticsSection = 'overview' | 'cycle' | 'wellbeing' | 'history';
type WellbeingMode = 'summary' | 'symptoms' | 'sleep' | 'habits';
type KnowledgeCategory = 'all' | 'cycle' | 'symptoms' | 'sleep' | 'wellbeing' | 'habits';
type KnowledgeTab = 'for-you' | 'all' | 'saved';
type PrototypeScenario = 'history' | 'first' | 'empty';
type Overlay = 'attention' | 'daily-plan' | 'home-settings' | 'diary-settings' | 'data-controls' | 'delete-confirm' | 'feedback' | 'support' | 'period-start' | 'quick-symptoms' | null;
type PersistStatus = 'saved' | 'saving' | 'error';

const labScreens: Array<{ id: Screen; label: string; icon: LucideIcon }> = [
  { id: 'onboarding', label: 'Онбординг', icon: Sparkle },
  { id: 'today', label: 'Сегодня', icon: House },
  { id: 'calendar', label: 'Календарь', icon: CalendarRange },
  { id: 'diary', label: 'Дневник', icon: NotebookTabs },
  { id: 'analytics', label: 'Аналитика', icon: ChartSpline },
  { id: 'knowledge', label: 'Знания', icon: BookOpenText },
  { id: 'article', label: 'Статья', icon: FileHeart },
  { id: 'report', label: 'Отчёт врачу', icon: FileDown },
  { id: 'profile', label: 'Профиль', icon: CircleUserRound },
];

const navItems: Array<{ id: Screen; label: string; icon: LucideIcon }> = [
  { id: 'today', label: 'Сегодня', icon: House },
  { id: 'diary', label: 'Дневник', icon: NotebookTabs },
  { id: 'analytics', label: 'Аналитика', icon: ChartSpline },
  { id: 'knowledge', label: 'Знания', icon: BookOpenText },
];

const knowledgeCategories: Array<{ id: KnowledgeCategory; label: string; icon: LucideIcon }> = [
  { id: 'all', label: 'Все', icon: BookOpenText },
  { id: 'cycle', label: 'Цикл', icon: CalendarRange },
  { id: 'symptoms', label: 'Симптомы', icon: Heart },
  { id: 'sleep', label: 'Сон', icon: Moon },
  { id: 'wellbeing', label: 'Самочувствие', icon: Smile },
  { id: 'habits', label: 'Привычки', icon: Activity },
];

const knowledgeArticles: Array<{
  id: string;
  categoryId: Exclude<KnowledgeCategory, 'all'>;
  category: string;
  icon: LucideIcon;
  tone: string;
  time: string;
  title: string;
}> = [
  { id: 'cycle-length', categoryId: 'cycle', category: 'Цикл', icon: CalendarRange, tone: 'violet', time: '3 минуты', title: 'Почему длина цикла может меняться' },
  { id: 'sleep-days', categoryId: 'sleep', category: 'Сон', icon: Moon, tone: 'indigo', time: '5 минут', title: 'Сон и самочувствие в разные дни' },
  { id: 'pain-notes', categoryId: 'symptoms', category: 'Симптомы', icon: Heart, tone: 'coral', time: '4 минуты', title: 'Боль вне месячных: что записать' },
  { id: 'mood-changes', categoryId: 'wellbeing', category: 'Самочувствие', icon: Smile, tone: 'rose', time: '4 минуты', title: 'Как замечать изменения настроения' },
  { id: 'daily-rhythm', categoryId: 'habits', category: 'Привычки', icon: Activity, tone: 'sage', time: '3 минуты', title: 'Какие привычки полезно отмечать' },
];

const dayRatings: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Очень тяжело', icon: Annoyed },
  { label: 'Тяжело', icon: Frown },
  { label: 'Обычно', icon: Meh },
  { label: 'Хорошо', icon: Smile },
  { label: 'Отлично', icon: Laugh },
];

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

function App() {
  const [screen, setScreen] = useState<Screen>('today');
  const [analyticsSection, setAnalyticsSection] = useState<AnalyticsSection>('overview');
  const [wellbeingMode, setWellbeingMode] = useState<WellbeingMode>('summary');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [data, setData] = useState<AuraState>(() => loadAuraState());
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [persistStatus, setPersistStatus] = useState<PersistStatus>('saved');
  const [toast, setToast] = useState('');
  const attentionInitialized = useRef(false);
  const cycleMetrics = useMemo(() => getAuraCycleMetrics(data), [data]);
  const scenario: PrototypeScenario = cycleMetrics.completedCycles >= 2 ? 'history' : cycleMetrics.starts.length ? 'first' : 'empty';

  useEffect(() => {
    if (attentionInitialized.current) return;
    attentionInitialized.current = true;
    if (shouldShowAttention(data)) setOverlay('attention');
  }, [data]);

  useEffect(() => {
    setPersistStatus('saving');
    const timer = window.setTimeout(() => {
      const saved = persistAuraState(data);
      setPersistStatus(saved ? 'saved' : 'error');
      if (!saved) setToast('Не удалось сохранить локально. Проверьте доступ к хранилищу.');
    }, 260);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const open = (next: Screen) => {
    if (next === 'onboarding') setOnboardingStep(0);
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
        [date]: { ...(current.entries[date] ?? emptyAuraEntry()), ...patch, updatedAt: new Date().toISOString() },
      },
    }));
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
      const payload = data.privacy.sensitiveExport ? data : {
        ...data,
        entries: Object.fromEntries(Object.entries(data.entries).map(([date, day]) => [date, {
          ...day,
          intimate: undefined,
          intimacyComfort: undefined,
          intimacyAfter: undefined,
          intimacyDesire: undefined,
          intimacyNote: undefined,
          note: undefined,
        }])),
      };
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
      setOverlay(null);
      setToast('Копия восстановлена');
    } catch {
      setToast('Файл не распознан. Данные не изменены.');
    } finally {
      event.target.value = '';
    }
  };

  const deleteAllData = () => {
    clearAllMiraStorage();
    setData(createEmptyAuraState());
    setOverlay(null);
    setToast('Локальные данные удалены');
  };

  return (
    <div className="aura-lab">
      <aside className="lab-rail">
        <div className="lab-brand">
          <MiraMark className="lab-mark" label="Mira" />
          <div><strong>Mira</strong><small>Aura Metrics</small></div>
        </div>
        <div className="lab-note">
          <span>Рабочее приложение</span>
          <strong>Mira · единые данные</strong>
          <p>Все экраны используют одну локальную историю.</p>
        </div>
        <nav className="lab-menu" aria-label="Экраны прототипа">
          {labScreens.map(({ id, label, icon: Icon }) => (
            <button key={id} className={screen === id ? 'active' : ''} onClick={() => open(id)}>
              <Icon /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="lab-spec">
          <span className="swatch violet" /><span className="swatch rose" /><span className="swatch coral" /><span className="swatch sage" />
          <p>Мягкий свет, крупные данные, объяснимые графики и спокойная медицинская лексика.</p>
        </div>
      </aside>

      <main className="lab-canvas">
        <div className="canvas-heading">
          <div><span>Интерактивное приложение</span><h1>{labScreens.find((item) => item.id === screen)?.label}</h1></div>
          <div className="canvas-pills scenario-pills" aria-label="Сценарий данных">
            <span>{scenario === 'history' ? `${cycleMetrics.completedCycles} завершённых цикла` : scenario === 'first' ? 'Первый цикл' : 'Нет данных'}</span>
          </div>
        </div>

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
                    onboarding: { ...onboarding, completed: true },
                    notifications: onboarding.reminders,
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
            {screen === 'today' && <Today data={data} scenario={scenario} onOpen={open} onPatchEntry={patchEntry} onShowAttention={() => setOverlay('attention')} onOpenDailyPlan={() => setOverlay('daily-plan')} onOpenHomeSettings={() => setOverlay('home-settings')} onOpenPeriodStart={() => setOverlay('period-start')} onOpenQuickSymptoms={() => setOverlay('quick-symptoms')} />}
            {screen === 'calendar' && <Calendar data={data} scenario={scenario} onSelectDate={(date) => changeData((current) => ({ ...current, selectedDate: date }))} onBack={() => open('today')} onOpenDiary={() => open('diary')} />}
            {screen === 'diary' && <Diary data={data} persistStatus={persistStatus} onPatchEntry={patchEntry} onOpenCalendar={() => open('calendar')} onOpenSettings={() => setOverlay('diary-settings')} onNotify={setToast} />}
            {screen === 'analytics' && <Analytics data={data} scenario={scenario} section={analyticsSection} setSection={setAnalyticsSection} mode={wellbeingMode} setMode={setWellbeingMode} onOpenDiary={() => open('diary')} onOpenReport={() => open('report')} />}
            {screen === 'knowledge' && <Knowledge data={data} onChangeData={changeData} onOpenArticle={() => open('article')} />}
            {screen === 'article' && <Article saved={data.savedArticles.includes('pain-notes')} onToggleSaved={() => changeData((current) => ({ ...current, savedArticles: current.savedArticles.includes('pain-notes') ? current.savedArticles.filter((id) => id !== 'pain-notes') : [...current.savedArticles, 'pain-notes'] }))} onBack={() => open('knowledge')} onOpenDiary={() => open('diary')} />}
            {screen === 'report' && <Report data={data} onBack={() => open('analytics')} onNotify={setToast} />}
            {screen === 'profile' && <Profile data={data} onChangeData={changeData} onBack={() => open('today')} onOpenHomeSettings={() => setOverlay('home-settings')} onOpenDiarySettings={() => setOverlay('diary-settings')} onOpenData={() => setOverlay('data-controls')} onOpenSaved={() => open('knowledge')} onOpenFeedback={() => setOverlay('feedback')} onOpenSupport={() => setOverlay('support')} />}
          </div>
          {overlay === 'attention' && <AttentionModal
            evidence={deriveAttentionEvidence(data)}
            onClose={dismissAttention}
            onOpenAnalytics={() => {
              setOverlay(null);
              setAnalyticsSection('wellbeing');
              setWellbeingMode('symptoms');
              open('analytics');
            }}
            onOpenReport={() => {
              setOverlay(null);
              open('report');
            }}
          />}
          {overlay === 'daily-plan' && <DailyPlanModal day={data.entries[AURA_TODAY] ?? emptyAuraEntry()} onPatch={(patch) => patchEntry(AURA_TODAY, patch)} onClose={() => setOverlay(null)} />}
          {overlay === 'home-settings' && <SettingsSheet title="Главная страница" description="Выберите карточки, которые помогают вам сегодня." onClose={() => setOverlay(null)}>{(Object.entries(data.homeCards) as Array<[AuraHomeCardId, boolean]>).map(([id, checked]) => <ToggleRow key={id} title={{hormonoscope:'Hormonoscope',cycloscope:'Cycloscope',rhythm:'Ваш ритм',recommendation:'План на сегодня',knowledge:'Полезная статья'}[id]} note={{hormonoscope:'Контекст по фазе цикла',cycloscope:'Мягкий прогноз дня',rhythm:'Сон, вода и шаги',recommendation:'Вещи, движение и назначенные добавки',knowledge:'Одна статья по контексту'}[id]} checked={checked} onClick={() => changeData((current) => ({ ...current, homeCards: { ...current.homeCards, [id]: !checked } }))} />)}</SettingsSheet>}
          {overlay === 'diary-settings' && <SettingsSheet title="Разделы дневника" description="Показывайте только то, что действительно отмечаете." onClose={() => setOverlay(null)}>{(Object.entries(data.modules) as Array<[AuraModuleId, boolean]>).map(([id, checked]) => <ToggleRow key={id} title={{cycle:'Цикл и симптомы',mood:'Настроение и энергия',sleep:'Сон',daily:'Вода и шаги',activity:'Активность',intimate:'Интимная жизнь',nutrition:'Питание',body:'Показатели тела',note:'Заметка и контекст'}[id]} note={id === 'intimate' ? 'Чувствительный раздел · выключен по умолчанию' : 'Можно изменить в любой момент'} checked={checked} sensitive={id === 'intimate'} onClick={() => changeData((current) => ({ ...current, modules: { ...current.modules, [id]: !checked } }))} />)}</SettingsSheet>}
          {overlay === 'data-controls' && <DataControlsSheet data={data} onChangeData={changeData} onExport={exportData} onImport={importData} onDelete={() => setOverlay('delete-confirm')} onClose={() => setOverlay(null)} />}
          {overlay === 'delete-confirm' && <ConfirmDelete onCancel={() => setOverlay('data-controls')} onConfirm={deleteAllData} />}
          {overlay === 'feedback' && <FeedbackSheet onClose={() => setOverlay(null)} onSubmit={() => { setOverlay(null); setToast('Спасибо! Форма обратной связи готова к отправке'); }} />}
          {overlay === 'support' && <SupportSheet onClose={() => setOverlay(null)} onNotify={setToast} />}
          {overlay === 'period-start' && <PeriodStartSheet marked={data.periodStarts.includes(AURA_TODAY)} onClose={() => setOverlay(null)} onChooseDate={() => { setOverlay(null); open('calendar'); }} onConfirm={() => { changeData((current) => setAuraPeriodStart(current, AURA_TODAY, true)); setOverlay(null); setToast(`${formatRuDate(AURA_TODAY)} отмечено как начало нового цикла`); }} onRemove={() => { changeData((current) => setAuraPeriodStart(current, AURA_TODAY, false)); setOverlay(null); setToast('Отметка о начале цикла удалена'); }} />}
          {overlay === 'quick-symptoms' && <QuickSymptomsSheet day={data.entries[AURA_TODAY] ?? emptyAuraEntry()} onClose={() => setOverlay(null)} onSave={(patch) => { patchEntry(AURA_TODAY, patch); setOverlay(null); setToast('Самочувствие на сегодня сохранено'); }} />}
          {toast && <div className="aura-toast" role="status"><Check />{toast}</div>}
          {!['onboarding', 'article', 'report', 'profile', 'calendar'].includes(screen) && <BottomNav screen={screen} onOpen={open} />}
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
      <div className="simple-brand"><MiraMark className="brand-orb" /><strong>Mira</strong></div>
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
        <div className="period-length-visual" aria-hidden="true"><span className="period-drop"><Droplet /></span><i /><i /><i /><i /><i /></div>
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
        <button className={`onboarding-reminder ${draft.reminders ? 'selected' : ''}`} onClick={() => setDraft((current) => ({ ...current, reminders: !current.reminders }))}>
          <span className="choice-icon"><Bell /></span><span><strong>Мягкое напоминание вечером</strong><small>«Пора сделать короткую отметку»</small></span><span className={`toggle ${draft.reminders ? 'on' : ''}`}><b /></span>
        </button>
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

function AppHeader({ title = formatRuDate(AURA_TODAY), onProfile, onCalendar }: { title?: string; onProfile?: () => void; onCalendar?: () => void }) {
  return <header className="app-header">
    <button className="avatar-button" onClick={onProfile} aria-label="Профиль"><span>Л</span></button>
    <div><small className="app-header-brand"><MiraMark /> Сегодня</small><h1>{title}</h1></div>
    <button className="round-button" onClick={onCalendar} aria-label="Календарь"><CalendarRange /></button>
  </header>;
}

function DateStrip() {
  return <div className="date-strip">{Array.from({ length: 7 }, (_, index) => addDays(AURA_TODAY, index - 3)).map((value) => {
    const date = localDate(value);
    const active = value === AURA_TODAY;
    return <button key={value} className={active ? 'active' : ''} disabled={!active}><small>{ruWeekdays[date.getDay()].slice(0, 1)}</small><strong>{date.getDate()}</strong>{active && <i />}</button>;
  })}</div>;
}

function Today({ data, scenario, onOpen, onPatchEntry, onShowAttention, onOpenDailyPlan, onOpenHomeSettings, onOpenPeriodStart, onOpenQuickSymptoms }: { data: AuraState; scenario: PrototypeScenario; onOpen: (screen: Screen) => void; onPatchEntry: (date: string, patch: Partial<AuraDayEntry>) => void; onShowAttention: () => void; onOpenDailyPlan: () => void; onOpenHomeSettings: () => void; onOpenPeriodStart: () => void; onOpenQuickSymptoms: () => void }) {
  const day = data.entries[AURA_TODAY] ?? emptyAuraEntry();
  const periodStartedToday = data.periodStarts.includes(AURA_TODAY);
  const todayPain = day.symptoms.find((symptom) => symptom.id === 'pain');
  const gentleMovement = Boolean(todayPain && (todayPain.severity === 3 || todayPain.affectsLife));
  const attention = deriveAttentionEvidence(data);
  const metrics = getAuraCycleMetrics(data);
  const range = formatRuRange(metrics.forecast?.start, metrics.forecast?.end);
  const forecast = scenario === 'empty'
    ? { title: 'Когда начались месячные?', text: 'После первой даты появится день цикла. Прогноз потребует больше истории.' }
    : scenario === 'first'
      ? { title: 'Прогноз пока предварительный', text: `Первый ориентир — ${range}. Он станет точнее после завершённых циклов.` }
      : { title: 'Цикл продолжается', text: `Следующие месячные ориентировочно ${range}.` };
  const timelineProgress = Math.min(96, Math.max(5, ((metrics.cycleDay ?? 1) / (metrics.expectedLength ?? 28)) * 100));
  return <div className="screen today-screen">
    <AppHeader onProfile={() => onOpen('profile')} onCalendar={() => onOpen('calendar')} />
    <DateStrip />
    <section className="cycle-status-card">
      <div className="cycle-status-main">
        <div className="cycle-day-value"><strong>{metrics.cycleDay ?? '—'}</strong><span>{metrics.cycleDay ? 'день цикла' : 'день пока неизвестен'}</span></div>
        <div className="cycle-status-copy"><h2>{forecast.title}</h2><p>{forecast.text}</p></div>
      </div>
      {scenario !== 'empty' ? <div className="cycle-timeline">
        <div className="cycle-timeline-track"><span className="period-part" /><i style={{ left: `${timelineProgress}%` }} /></div>
        <div className="cycle-timeline-labels"><span>Начало цикла</span><strong>Сегодня</strong><span>{range}</span></div>
      </div> : <button className="cycle-empty-action" onClick={onOpenPeriodStart}><Plus /> Добавить первый день месячных</button>}
      <button className="cycle-method" onClick={() => onOpen('calendar')}><Info /> Как работает ориентир</button>
    </section>
    <div className="quick-actions">
      <button onClick={onOpenPeriodStart}><span className="action-icon rose"><Droplet /></span><strong>Начало месячных</strong><small>{periodStartedToday ? 'Первый день отмечен' : 'Отметить первый день'}</small></button>
      <button onClick={onOpenQuickSymptoms}><span className="action-icon coral"><Heart /></span><strong>Симптомы</strong><small>{day.symptoms.length ? `${day.symptoms.length} отмечено` : day.symptomsChecked ? 'Всё в порядке' : 'Добавить'}</small></button>
    </div>
    <section className="surface compact-feeling">
      <div className="section-heading"><div><span className="eyebrow">Быстрая отметка</span><h2>Как вы сегодня?</h2></div><span className="soft-status">{day.rating ? dayRatings[day.rating - 1]?.label : 'Не отмечено'}</span></div>
      <div className="feeling-scale">{dayRatings.map(({ label }, index) => <button key={label} className={day.rating === index + 1 ? 'suggested' : ''} onClick={() => onPatchEntry(AURA_TODAY, { rating: index + 1 })}>{label}</button>)}</div>
    </section>
    {data.homeCards.recommendation && <section className="today-plan-preview">
      <div className="today-plan-title"><div><span className="eyebrow">Подсказки на сегодня</span><h2>Что может пригодиться</h2></div><button onClick={onOpenDailyPlan}>Все <ChevronRight /></button></div>
      <div className="today-plan-grid">
        <button className="kit" onClick={onOpenDailyPlan}><span><ShoppingBag /></span><small>Аптечка</small><strong>Прокладки<br/>+ ещё 2 вещи</strong><em>{day.careItems?.length ? `${day.careItems.length} из 3 собрано` : 'Собрать с собой'}</em></button>
        <button className="movement" onClick={onOpenDailyPlan}><span><PersonStanding /></span><small>Нагрузка</small><strong>{gentleMovement ? <>Мягкий<br/>режим</> : <>Ходьба<br/>15 минут</>}</strong><em>{day.recommendedActivityDone ? 'Выполнено' : 'По самочувствию'}</em></button>
        <button className="vitamins" onClick={onOpenDailyPlan}><span><Pill /></span><small>Витамины</small><strong>{day.b6Prescribed ? <>B6<br/>по схеме</> : <>Только<br/>назначенные</>}</strong><em>{day.b6Taken ? 'Принято' : day.b6Prescribed ? 'Отметить приём' : 'Без назначения нет'}</em></button>
      </div>
    </section>}
    {(data.homeCards.hormonoscope || data.homeCards.cycloscope) && <section className="scope-grid">
      {data.homeCards.hormonoscope && <article className="scope-card hormone"><span className="scope-icon"><Sparkle /></span><small>Hormonoscope · календарный ориентир</small><h2>{scenario === 'empty' ? 'Нужна дата цикла' : `${metrics.cycleDay}-й день цикла`}</h2><p>{scenario === 'empty' ? 'Добавьте начало месячных, чтобы получить контекст.' : 'Это календарный контекст, а не измерение уровня гормонов.'}</p><button>Почему так <ChevronRight /></button></article>}
      {data.homeCards.cycloscope && <article className="scope-card cyclo"><span className="scope-icon"><InfinityIcon /></span><small>Cycloscope</small><h2>День для мягкого фокуса</h2><p>Короткий ориентир для настроения, не медицинский прогноз.</p><button>На сегодня <ChevronRight /></button></article>}
    </section>}
    {data.homeCards.rhythm && <section className="surface">
      <div className="section-heading"><div><span className="eyebrow">Сегодня</span><h2>Ваш ритм</h2></div><button className="mini-link" onClick={onOpenHomeSettings}>Настроить</button></div>
      <div className="metric-row">
        <MetricCard icon={Moon} tone="indigo" label="Сон" value={day.sleepHours ? `${day.sleepHours} ч` : '—'} note={day.sleepQuality ?? 'не отмечено'} />
        <MetricCard icon={GlassWater} tone="cyan" label="Вода" value={day.water ? day.water.toLocaleString('ru-RU') : '—'} note={day.water ? 'мл' : 'не отмечено'} />
        <MetricCard icon={Footprints} tone="sage" label="Шаги" value={day.steps ? day.steps.toLocaleString('ru-RU') : '—'} note={day.steps ? 'сегодня' : 'не отмечено'} />
      </div>
    </section>}
    {data.homeCards.recommendation && attention.eligible && <section className="attention-summary">
      <div className="attention-summary-head"><span className="attention-icon"><Stethoscope /></span><div><span className="eyebrow">Рекомендация</span><h2>Стоит обратить внимание на боль</h2></div><button onClick={onShowAttention}>Открыть</button></div>
      <p>Выраженная боль повторилась в нескольких циклах и иногда мешала обычным делам.</p>
      <div className="attention-summary-metrics"><span><strong>{attention.painDays}</strong><small>отметки</small></span><span><strong>{attention.severeDays}</strong><small>сильные</small></span><span><strong>{attention.impactDays}</strong><small>мешали делам</small></span></div>
    </section>}
    {data.homeCards.knowledge && <section className="article-teaser" onClick={() => onOpen('article')}>
      <div className="article-art"><span className="art-moon" /><span className="art-line" /></div>
      <div><span className="eyebrow">Для вас · 4 минуты</span><h2>Спазмы в первые дни месячных</h2><p>Что наблюдать и когда обратиться за помощью.</p></div><ChevronRight />
    </section>}
  </div>;
}

const dailyCareItems = [
  { id: 'period-products', title: 'Прокладки или тампоны', note: 'Проверьте запас без спешки' },
  { id: 'heat-patch', title: 'Термопластырь', note: 'Если тепло обычно помогает' },
  { id: 'spare-underwear', title: 'Запасное бельё', note: 'Можно положить в сумку заранее' },
];

const quickMoodOptions: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Спокойствие', icon: Smile },
  { label: 'Радость', icon: Laugh },
  { label: 'Раздражение', icon: Annoyed },
  { label: 'Грусть', icon: Frown },
  { label: 'Тревога', icon: Meh },
  { label: 'Апатия', icon: Moon },
];

const quickSymptomOptions: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'pain', label: 'Боль внизу живота', icon: Heart },
  { id: 'fatigue', label: 'Усталость', icon: Activity },
  { id: 'headache', label: 'Головная боль', icon: CircleAlert },
  { id: 'back-pain', label: 'Боль в спине', icon: PersonStanding },
  { id: 'breast', label: 'Чувствительная грудь', icon: Heart },
  { id: 'bloating', label: 'Вздутие', icon: CircleGauge },
  { id: 'acne', label: 'Высыпания', icon: Sparkle },
  { id: 'insomnia', label: 'Бессонница', icon: Moon },
  { id: 'hot-flash', label: 'Приливы жара', icon: Thermometer },
  { id: 'joint-pain', label: 'Боль в суставах', icon: Activity },
  { id: 'appetite', label: 'Повышенный аппетит', icon: Utensils },
  { id: 'nausea', label: 'Тошнота', icon: Meh },
];

function QuickSymptomsSheet({ day, onClose, onSave }: { day: AuraDayEntry; onClose: () => void; onSave: (patch: Partial<AuraDayEntry>) => void }) {
  const [symptoms, setSymptoms] = useState<AuraSymptom[]>(day.symptoms);
  const [moods, setMoods] = useState(day.moods);
  const [energy, setEnergy] = useState(day.energy);
  const [clearMarked, setClearMarked] = useState(Boolean(day.symptomsChecked && day.symptoms.length === 0));
  const toggleMood = (value: string) => setMoods((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const toggleSymptom = (option: (typeof quickSymptomOptions)[number]) => {
    setClearMarked(false);
    setSymptoms((current) => current.some((item) => item.id === option.id) ? current.filter((item) => item.id !== option.id) : [...current, { id: option.id, label: option.label, severity: 1, affectsLife: false }]);
  };
  const setSeverity = (id: string, severity: 1 | 2 | 3) => setSymptoms((current) => current.map((item) => item.id === id ? { ...item, severity } : item));
  const markClear = () => { setSymptoms([]); setClearMarked(true); };
  return <div className="attention-overlay quick-checkin-overlay" onClick={onClose}>
    <section className="attention-modal quick-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="quick-checkin-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <header className="quick-checkin-header"><span><Heart /></span><div><span className="eyebrow">Быстрая отметка · 14 июля</span><h2 id="quick-checkin-title">Как вы себя чувствуете?</h2><p>Выберите всё, что подходит сегодня.</p></div><em>{symptoms.length + moods.length} выбрано</em></header>

      <section className="quick-checkin-section mood"><div className="quick-checkin-section-title"><div><span><Smile /></span><h3>Настроение</h3></div><small>Можно несколько</small></div><div className="quick-mood-grid">{quickMoodOptions.map(({ label, icon: Icon }) => <button key={label} className={moods.includes(label) ? 'active' : ''} aria-pressed={moods.includes(label)} onClick={() => toggleMood(label)}><Icon /><strong>{label}</strong>{moods.includes(label) && <Check />}</button>)}</div></section>

      <section className="quick-checkin-section energy"><div className="quick-checkin-section-title"><div><span><Activity /></span><h3>Энергия</h3></div><small>{energy ? `${energy} из 5` : 'Не отмечено'}</small></div><div className="quick-energy-scale">{[1,2,3,4,5].map((value) => <button key={value} className={energy === value ? 'active' : ''} aria-pressed={energy === value} onClick={() => setEnergy(value)}><strong>{value}</strong><small>{value === 1 ? 'мало' : value === 5 ? 'много' : ''}</small></button>)}</div></section>

      <section className="quick-checkin-section symptoms"><div className="quick-checkin-section-title"><div><span><Stethoscope /></span><h3>Симптомы</h3></div><small>Основные</small></div><button className={`all-good-option ${clearMarked ? 'active' : ''}`} aria-pressed={clearMarked} onClick={markClear}><span><Check /></span><div><strong>Всё в порядке</strong><small>Сегодня ничего из списка не беспокоит</small></div>{clearMarked && <Check />}</button><div className="quick-symptom-grid">{quickSymptomOptions.map(({ id,label,icon: Icon }) => { const active = symptoms.some((item) => item.id === id); return <button key={id} className={active ? 'active' : ''} aria-pressed={active} onClick={() => toggleSymptom({ id,label,icon:Icon })}><Icon /><strong>{label}</strong>{active && <Check />}</button>; })}</div></section>

      {symptoms.length > 0 && <section className="quick-severity"><div className="quick-checkin-section-title"><div><span><CircleGauge /></span><h3>Насколько выражено?</h3></div><small>Для выбранных симптомов</small></div>{symptoms.map((symptom) => <div className="quick-severity-row" key={symptom.id}><strong>{symptom.label}</strong><div>{([1,2,3] as const).map((value) => <button key={value} className={symptom.severity === value ? 'active' : ''} onClick={() => setSeverity(symptom.id, value)}>{value}<small>{value === 1 ? 'лёгк.' : value === 2 ? 'сред.' : 'сильн.'}</small></button>)}</div></div>)}</section>}

      <aside className="quick-checkin-note"><ShieldCheck /> Пустой день не считается «всё в порядке». Сохраняются только выбранные вами отметки.</aside>
      <button className="primary-button quick-checkin-save" onClick={() => onSave({ symptoms, symptomsChecked: clearMarked || symptoms.length > 0, moods, energy })}><Check /> Сохранить на сегодня</button>
    </section>
  </div>;
}

function DailyPlanModal({ day, onPatch, onClose }: { day: AuraDayEntry; onPatch: (patch: Partial<AuraDayEntry>) => void; onClose: () => void }) {
  const careItems = day.careItems ?? [];
  const pain = day.symptoms.find((symptom) => symptom.id === 'pain');
  const gentleDay = Boolean(pain && (pain.severity === 3 || pain.affectsLife));
  const completed = careItems.length + Number(Boolean(day.recommendedActivityDone)) + Number(Boolean(day.b6Prescribed && day.b6Taken));
  const toggleCareItem = (id: string) => onPatch({ careItems: careItems.includes(id) ? careItems.filter((item) => item !== id) : [...careItems, id] });
  return <div className="attention-overlay daily-plan-overlay" onClick={onClose}>
    <section className="attention-modal daily-plan-modal" role="dialog" aria-modal="true" aria-labelledby="daily-plan-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть план на сегодня"><X /></button>
      <header className="daily-plan-header">
        <span className="daily-plan-header-icon"><Sparkle /></span>
        <div><span className="eyebrow">План на 14 июля</span><h2 id="daily-plan-title">Небольшая забота о себе</h2><p>Только необязательные подсказки — выбирайте то, что подходит сегодня.</p></div>
        <span className="daily-plan-progress">{completed} готово</span>
      </header>

      <section className="daily-plan-section essentials">
        <div className="daily-plan-section-head"><span><ShoppingBag /></span><div><small>Собрать с собой</small><h3>Набор на ближайшие дни</h3></div></div>
        <p className="daily-plan-reason">До прогнозируемого окна ещё есть время — можно проверить запас заранее.</p>
        <div className="daily-plan-checks">{dailyCareItems.map((item) => {
          const checked = careItems.includes(item.id);
          return <button key={item.id} className={checked ? 'checked' : ''} onClick={() => toggleCareItem(item.id)} aria-pressed={checked}><span>{checked && <Check />}</span><div><strong>{item.title}</strong><small>{item.note}</small></div></button>;
        })}</div>
      </section>

      <section className="daily-plan-section movement">
        <div className="daily-plan-section-head"><span><PersonStanding /></span><div><small>Движение</small><h3>{gentleDay ? 'Мягкое движение по самочувствию' : 'Спокойная ходьба · 15 минут'}</h3></div></div>
        <p>{gentleDay ? 'Сегодня отмечена выраженная боль. Можно выбрать отдых, дыхание или короткую прогулку — только если движение не усиливает симптомы.' : 'Неспешная прогулка или лёгкая растяжка могут помочь переключиться и поддержать привычный ритм.'}</p>
        <button className={`daily-plan-action ${day.recommendedActivityDone ? 'done' : ''}`} onClick={() => onPatch({ recommendedActivityDone: !day.recommendedActivityDone })}>{day.recommendedActivityDone ? <><Check /> Выполнено</> : <><PersonStanding /> Отметить занятие</>}</button>
      </section>

      <section className="daily-plan-section supplements">
        <div className="daily-plan-section-head"><span><Pill /></span><div><small>Добавки</small><h3>Только по вашему назначению</h3></div></div>
        {!day.b6Prescribed ? <>
          <p>Приложение не назначает витамин B6 автоматически. Польза при ПМС изучается, но высокие дозы могут навредить.</p>
          <button className="daily-plan-outline" onClick={() => onPatch({ b6Prescribed: true, b6Taken: false })}>B6 уже назначен врачом</button>
        </> : <div className="supplement-prescribed">
          <div><span><Pill /></span><p><strong>Витамин B6</strong><small>Назначенная вам схема и дозировка</small></p></div>
          <button className={day.b6Taken ? 'taken' : ''} onClick={() => onPatch({ b6Taken: !day.b6Taken })}>{day.b6Taken ? <><Check /> Принято</> : 'Отметить приём'}</button>
        </div>}
      </section>

      <aside className="daily-plan-safety"><ShieldCheck /><p><strong>Почему именно эти подсказки?</strong><span>Вещи связаны с прогнозом цикла, движение — с сегодняшними отметками. Добавки отображаются только после подтверждения назначения.</span></p></aside>
      <button className="primary-button" onClick={onClose}><Check /> Готово на сегодня</button>
    </section>
  </div>;
}

function AttentionModal({ evidence, onClose, onOpenAnalytics, onOpenReport }: { evidence: ReturnType<typeof deriveAttentionEvidence>; onClose: () => void; onOpenAnalytics: () => void; onOpenReport: () => void }) {
  return <div className="attention-overlay" onClick={onClose}>
    <section className="attention-modal" role="dialog" aria-modal="true" aria-labelledby="attention-title" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" />
      <button className="attention-close" onClick={onClose} aria-label="Закрыть рекомендацию"><X /></button>
      <header className="attention-modal-header">
        <span className="attention-modal-icon"><Stethoscope /></span>
        <div><span className="eyebrow">Рекомендация на основе записей</span><h2 id="attention-title">Повторяющуюся боль лучше обсудить с врачом</h2></div>
      </header>
      <p className="attention-lead">За последние {evidence.cycles} цикла вы {evidence.painDays} раза отмечали среднюю или сильную боль. В {evidence.impactDays} случаях она мешала обычным делам.</p>

      <div className="attention-facts" aria-label="Факты из дневника">
        <span><strong>{evidence.painDays}</strong><small>дня с болью</small></span>
        <span><strong>{evidence.severeDays}</strong><small>сильные отметки</small></span>
        <span><strong>{evidence.impactDays} из {evidence.painDays}</strong><small>мешали делам</small></span>
      </div>

      <section className="attention-analysis">
        <div className="section-heading"><div><span className="eyebrow">Почему показано</span><h3>Выраженность боли</h3></div><span className="soft-status">{evidence.cycles} цикла</span></div>
        <div className="attention-bars" role="img" aria-label={`Отметки боли: ${evidence.entries.length}`}>
          {evidence.entries.slice(-4).map(({ date, value }) => <span key={date}><i style={{ height: `${value * 27}%` }}><b>{value}/3</b></i><small>{Number(date.slice(8))} {date.slice(5, 7) === '06' ? 'июн' : 'июл'}</small></span>)}
        </div>
        <p>Показаны только сохранённые отметки. Пустые дни не считаются отсутствием боли.</p>
      </section>

      <aside className="attention-urgent"><CircleAlert /><p><strong>Если боль сейчас сильная или сильнее обычной</strong> и обезболивающее не помогает, обратитесь за срочной медицинской помощью.</p></aside>
      <p className="attention-disclaimer">Это наблюдение по вашим записям, а не диагноз.</p>
      <div className="attention-actions">
        <button className="primary-button" onClick={onOpenReport}><FileHeart /> Подготовить отчёт врачу</button>
        <button className="secondary-button" onClick={onOpenAnalytics}><ChartSpline /> Посмотреть аналитику</button>
        <button className="text-button" onClick={onClose}>Не сейчас</button>
      </div>
    </section>
  </div>;
}

function MetricCard({ icon: Icon, tone, label, value, note }: { icon: LucideIcon; tone: string; label: string; value: string; note: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}><Icon /></span><small>{label}</small><strong>{value}</strong><span>{note}</span></article>;
}

function Calendar({ data, scenario, onSelectDate, onBack, onOpenDiary }: { data: AuraState; scenario: PrototypeScenario; onSelectDate: (date: string) => void; onBack: () => void; onOpenDiary: () => void }) {
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
  const selectedDay = selected.getDate();
  const selectedEntry = data.entries[data.selectedDate];
  const metrics = getAuraCycleMetrics(data);
  const forecastRange = formatRuRange(metrics.forecast?.start, metrics.forecast?.end);
  const confidence = metrics.forecast?.confidence;
  const monthIso = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const isForecast = (date: string) => Boolean(metrics.forecast && date >= metrics.forecast.start && date <= metrics.forecast.end);
  const isPeriod = (date: string) => data.periodStarts.includes(date) || Boolean(data.entries[date]?.period && data.entries[date]?.period !== 'none');
  const selectedLabel = `${formatRuDate(data.selectedDate)}${data.selectedDate === AURA_TODAY ? ' · сегодня' : ''}`;
  return <div className="screen calendar-screen">
    <TopBack title="Календарь" onBack={onBack} action={<button className="round-button"><Info /></button>} />
    <section className="calendar-summary aura-hero">
      <span className="glass-label"><Sparkle /> {confidence === 'personal' ? 'Личный диапазон' : 'Данных пока мало'}</span><h2>{forecastRange}</h2><p>{metrics.completedCycles ? `Диапазон рассчитан по ${metrics.completedCycles} завершённым циклам.` : 'Добавляйте фактические даты — пустые дни не считаются отсутствием месячных.'}</p>
      <div className="confidence-line"><span style={{ width: confidence === 'personal' ? '78%' : confidence === 'growing' ? '52%' : confidence === 'preliminary' ? '28%' : '0%' }} /></div><small>Уверенность растёт с новыми завершёнными циклами</small>
    </section>
    <section className="surface month-card">
      <div className="month-title"><button onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} aria-label="Предыдущий месяц"><ChevronLeft /></button><h2>{ruMonthTitles[month]} {year}</h2><button onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} aria-label="Следующий месяц"><ChevronRight /></button></div>
      <div className="weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="month-grid">{days.map((day, index) => {
        if (!day) return <i key={index} />;
        const date = monthIso(day);
        return <button key={date} onClick={() => onSelectDate(date)} className={`${isPeriod(date) ? 'period' : ''} ${isForecast(date) ? 'forecast' : ''} ${date === AURA_TODAY ? 'today' : ''} ${data.entries[date] ? 'has-entry' : ''} ${date === data.selectedDate ? 'selected' : ''}`}><span>{day}</span></button>;
      })}</div>
      <div className="calendar-legend"><span><i className="period" /> Месячные</span><span><i className="forecast" /> Прогноз</span><span><i className="entry" /> Есть запись</span></div>
    </section>
    <section className="surface selected-day-card"><div><span className="eyebrow">Выбрано</span><h2>{selectedLabel}</h2><p>{selectedEntry ? `${selectedEntry.symptoms.length ? 'Симптомы, ' : ''}${selectedEntry.sleepHours ? 'сон, ' : ''}${selectedEntry.water ? 'вода' : 'запись'} сохранены.` : data.selectedDate > AURA_TODAY ? 'Будущую дату можно посмотреть, но нельзя заполнять заранее.' : 'Пока нет записи. Можно добавить только то, что помните.'}</p></div><button className="primary-button small" disabled={data.selectedDate > AURA_TODAY} onClick={onOpenDiary}>{selectedEntry ? 'Редактировать день' : 'Добавить запись'} <ChevronRight /></button></section>
  </div>;
}

function Diary({ data, persistStatus, onPatchEntry, onOpenCalendar, onOpenSettings, onNotify }: { data: AuraState; persistStatus: PersistStatus; onPatchEntry: (date: string, patch: Partial<AuraDayEntry>) => void; onOpenCalendar: () => void; onOpenSettings: () => void; onNotify: (message: string) => void }) {
  const [openModule, setOpenModule] = useState('cycle');
  const day = data.entries[data.selectedDate] ?? emptyAuraEntry();
  const pain = day.symptoms.find((symptom) => symptom.id === 'pain');
  const toggleValue = (items: string[], value: string) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
  const update = (patch: Partial<AuraDayEntry>) => onPatchEntry(data.selectedDate, patch);
  const setPain = (severity: 0 | 1 | 2 | 3) => update({ symptoms: severity === 0 ? day.symptoms.filter((symptom) => symptom.id !== 'pain') : [...day.symptoms.filter((symptom) => symptom.id !== 'pain'), { id: 'pain', label: 'Боль внизу живота', severity, affectsLife: pain?.affectsLife ?? false }] });
  const statusCopy = persistStatus === 'saving' ? 'Сохраняем изменения…' : persistStatus === 'error' ? 'Не удалось сохранить' : 'Все изменения сохранены';
  return <div className="screen diary-screen">
    <AppHeader title={formatRuDate(data.selectedDate)} onCalendar={onOpenCalendar} />
    <div className={`save-status ${persistStatus}`} >{persistStatus === 'error' ? <CircleAlert /> : persistStatus === 'saving' ? <Save /> : <Check />} {statusCopy}</div>
    <section className="surface diary-rating">
      <div className="section-heading"><div><span className="eyebrow">Быстрая отметка</span><h2>Как прошёл день?</h2></div><span className="soft-status">{day.rating ? dayRatings[day.rating - 1]?.label : 'Не отмечено'}</span></div>
      <div className="rating-icons">{dayRatings.map(({ label, icon: Icon }, index) => <button key={label} className={day.rating === index + 1 ? 'active' : ''} onClick={() => update({ rating: index + 1 })}><Icon /><small>{label}</small></button>)}</div>
    </section>
    <div className="diary-title"><div><span className="eyebrow">Заполните только нужное</span><h2>Разделы дня</h2></div><button onClick={onOpenSettings}><SlidersHorizontal /> Настроить</button></div>
    {data.modules.cycle && <DiaryModule title="Цикл и симптомы" icon={Heart} tone="coral" summary={pain ? `${pain.label} · ${pain.severity}/3` : day.period && day.period !== 'none' ? 'Месячные отмечены' : 'Не отмечено'} open={openModule === 'cycle'} onToggle={() => setOpenModule(openModule === 'cycle' ? '' : 'cycle')}>
      <div className="cycle-question">
        <div className="cycle-question-head"><span className="cycle-question-icon period"><Droplet /></span><span><strong>Месячные</strong><small>Интенсивность сегодня</small></span></div>
        <div className="period-options">{([['none','Нет',0],['light','Слабые',1],['medium','Средние',2],['heavy','Обильные',3]] as const).map(([value,label,level]) => <button key={value} className={day.period === value ? 'active' : ''} aria-pressed={day.period === value} onClick={() => update({ period: value })}><span className={`flow-mark level-${level}`}>{Array.from({ length: Math.max(1, level) }, (_, index) => <i key={index} />)}</span><strong>{label}</strong>{day.period === value && <Check />}</button>)}</div>
      </div>
      <div className="cycle-question pain-question">
        <div className="cycle-question-head"><span className="cycle-question-icon pain"><Heart /></span><span><strong>Боль внизу живота</strong><small>Как ощущается сейчас?</small></span></div>
        <div className="pain-options">{([
          [0,'Нет','0 из 3',Check],
          [1,'Лёгкая','1 из 3',Smile],
          [2,'Средняя','2 из 3',Meh],
          [3,'Сильная','3 из 3',Frown],
        ] as const).map(([value,label,note,Icon]) => <button key={value} className={(pain?.severity ?? 0) === value ? 'active' : ''} aria-pressed={(pain?.severity ?? 0) === value} onClick={() => setPain(value)}><Icon /><span><strong>{label}</strong><small>{note}</small></span></button>)}</div>
      </div>
      {pain && <button className={`impact-toggle cycle-impact ${pain.affectsLife ? 'active' : ''}`} aria-pressed={pain.affectsLife} onClick={() => update({ symptoms: day.symptoms.map((symptom) => symptom.id === 'pain' ? { ...symptom, affectsLife: !symptom.affectsLife } : symptom) })}><span className="impact-check">{pain.affectsLife && <Check />}</span><span><strong>Мешала обычным делам</strong><small>Работе, сну, движению или отдыху</small></span></button>}
      <button className="secondary-button add-symptom-button" onClick={() => update({ symptoms: [...day.symptoms, { id: `symptom-${day.symptoms.length}`, label: 'Головная боль', severity: 1, affectsLife: false }] })}><Plus /> Добавить другой симптом</button>
    </DiaryModule>}
    {data.modules.mood && <DiaryModule title="Настроение и энергия" icon={Smile} tone="violet" summary={day.moods.length ? `${day.moods.slice(0, 2).join(', ')} · энергия ${day.energy ?? '—'}/5` : 'Не отмечено'} open={openModule === 'mood'} onToggle={() => setOpenModule(openModule === 'mood' ? '' : 'mood')}>
      <p className="module-prompt">Что ближе всего к вашему состоянию?</p><div className="choice-chips">{['Спокойствие','Радость','Раздражение','Грусть','Тревога'].map((value) => <button key={value} className={day.moods.includes(value) ? 'active' : ''} onClick={() => update({ moods: toggleValue(day.moods, value) })}>{value}</button>)}</div>
      <p className="module-prompt">Энергия</p><div className="number-scale">{[1,2,3,4,5].map((value) => <button key={value} className={day.energy === value ? 'active' : ''} onClick={() => update({ energy: value })}>{value}</button>)}</div>
    </DiaryModule>}
    {data.modules.sleep && <DiaryModule title="Сон" icon={Moon} tone="indigo" summary={day.sleepHours ? `${day.sleepHours} ч · ${day.sleepQuality?.toLowerCase() ?? 'качество не отмечено'}` : 'Не отмечено'} open={openModule === 'sleep'} onToggle={() => setOpenModule(openModule === 'sleep' ? '' : 'sleep')}>
      <SleepDurationEditor value={day.sleepHours ?? 0} onChange={(sleepHours) => update({ sleepHours })} />
      <p className="module-prompt">Как вы чувствуете себя после сна?</p>
      <div className="sleep-quality-options">{([
        ['Плохое','Не отдохнула','Есть усталость',Frown],
        ['Обычное','Нормально','Хватило сил',Meh],
        ['Хорошее','Хорошо','Есть отдых',Smile],
      ] as const).map(([value,title,note,Icon]) => <button key={value} className={day.sleepQuality === value ? 'active' : ''} onClick={() => update({ sleepQuality: value })}><Icon /><span><strong>{title}</strong><small>{note}</small></span>{day.sleepQuality === value && <Check />}</button>)}</div>
    </DiaryModule>}
    {data.modules.daily && <DiaryModule title="Вода" icon={Droplet} tone="cyan" summary={day.water ? `${day.water.toLocaleString('ru-RU')} мл` : 'Пока не отмечено'} open={openModule === 'water'} onToggle={() => setOpenModule(openModule === 'water' ? '' : 'water')}>
      <WaterEditor value={day.water ?? 0} onChange={(water) => update({ water })} />
    </DiaryModule>}
    {data.modules.daily && <DiaryModule title="Шаги" icon={Footprints} tone="sage" summary={day.steps ? `${day.steps.toLocaleString('ru-RU')} из 7 000` : 'Пока не отмечено'} open={openModule === 'steps'} onToggle={() => setOpenModule(openModule === 'steps' ? '' : 'steps')}>
      <StepsEditor value={day.steps ?? 0} onChange={(steps) => update({ steps })} />
    </DiaryModule>}
    {data.modules.activity && <DiaryModule title="Активность" icon={Dumbbell} tone="sage" summary={day.activity ?? 'Не отмечено'} open={openModule === 'activity'} onToggle={() => setOpenModule(openModule === 'activity' ? '' : 'activity')}><div className="choice-chips">{['Прогулка','Тренировка','Растяжка','День отдыха'].map((value) => <button key={value} className={day.activity === value ? 'active' : ''} onClick={() => update({ activity: value })}>{value}</button>)}</div></DiaryModule>}
    {data.modules.intimate && <DiaryModule title="Интимная жизнь" icon={LockKeyhole} tone="rose" summary={intimacySummary(day)} open={openModule === 'intimate'} onToggle={() => setOpenModule(openModule === 'intimate' ? '' : 'intimate')}><IntimacyEditor day={day} onChange={update} /></DiaryModule>}
    {data.modules.nutrition && <DiaryModule title="Питание" icon={Utensils} tone="coral" summary={day.calories ? `${day.calories.toLocaleString('ru-RU')} ккал` : day.nutrition.length ? day.nutrition.join(', ') : 'Не отмечено'} open={openModule === 'nutrition'} onToggle={() => setOpenModule(openModule === 'nutrition' ? '' : 'nutrition')}>
      <div className="calorie-editor"><span className="choice-icon"><Utensils /></span><div><small>Сколько получилось за день</small><label><input type="number" inputMode="numeric" min="0" max="6000" step="50" value={day.calories ?? ''} placeholder="Например, 1800" onChange={(event) => update({ calories: event.target.value ? Math.max(0, Number(event.target.value)) : undefined })}/><b>ккал</b></label></div></div>
      <input className="metric-range calorie-range" type="range" min="0" max="4000" step="50" value={day.calories ?? 0} onChange={(event) => update({ calories: Number(event.target.value) })} aria-label="Калории за день" />
      <p className="module-prompt">Если хочется, добавьте контекст</p><div className="choice-chips">{['Обычный аппетит','Повышенный аппетит','Тяга к сладкому','Вздутие'].map((value) => <button key={value} className={day.nutrition.includes(value) ? 'active' : ''} onClick={() => update({ nutrition: toggleValue(day.nutrition, value) })}>{value}</button>)}</div>
    </DiaryModule>}
    {data.modules.body && <DiaryModule title="Базальная температура" icon={Thermometer} tone="violet" summary={day.temperature ? `${day.temperature.toFixed(1).replace('.', ',')} °C` : 'Пока не отмечено'} open={openModule === 'temperature'} onToggle={() => setOpenModule(openModule === 'temperature' ? '' : 'temperature')}>
      <MeasurementEditor type="temperature" value={day.temperature} data={data} onChange={(temperature) => update({ temperature })} />
    </DiaryModule>}
    {data.modules.body && <DiaryModule title="Вес" icon={Weight} tone="coral" summary={day.weight ? `${day.weight.toFixed(1).replace('.', ',')} кг` : 'Пока не отмечено'} open={openModule === 'weight'} onToggle={() => setOpenModule(openModule === 'weight' ? '' : 'weight')}>
      <MeasurementEditor type="weight" value={day.weight} data={data} onChange={(weight) => update({ weight })} />
    </DiaryModule>}
    {data.modules.note && <DiaryModule title="Заметка" icon={MessageSquareText} tone="indigo" summary={day.note ? 'Есть заметка' : 'Можно написать что угодно'} open={openModule === 'note'} onToggle={() => setOpenModule(openModule === 'note' ? '' : 'note')}>
      <div className="note-invitation"><MessageSquareText /><p><strong>Здесь можно написать всё</strong><span>Мысли, ощущения, важные мелочи — без правил и оценки. Не стесняйтесь.</span></p></div>
      <textarea className="note-field free-note" value={day.note ?? ''} placeholder="Пишите свободно: как прошёл день, что чувствовали, что хочется запомнить…" onChange={(event) => update({ note: event.target.value })}/>
      <p className="module-prompt">Быстрый контекст, если подходит</p><div className="choice-chips">{['Стресс','Поездка','Болезнь','Лекарства'].map((value) => <button key={value} className={day.contexts.includes(value) ? 'active' : ''} onClick={() => update({ contexts: toggleValue(day.contexts, value) })}>{value}</button>)}</div>
      <aside className="note-privacy"><LockKeyhole /> Заметка хранится только на этом устройстве.</aside>
    </DiaryModule>}
    <button className="primary-button sticky-save" onClick={() => onNotify('Подробная запись сохранена')}><Check /> Готово</button>
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
  const goal = 2000;
  const percent = Math.min(100, Math.round((value / goal) * 100));
  const overflowing = value > goal;
  const waterTop = 194 - (percent / 100) * 144;
  const volumeLabelY = Math.min(180, Math.max(70, waterTop + 22));
  const litres = (value / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  return <div className={`hydration-editor ${overflowing ? 'overflowing' : ''}`}>
    <div className="water-bottle" role="img" aria-label={`Выпито ${value} миллилитров. Бутылка заполнена на ${percent}%${overflowing ? ', вода переливается через край' : ''}`}>
      <svg viewBox="0 0 112 224" aria-hidden="true">
        <defs>
          <linearGradient id="bottle-cap" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9edce0"/><stop offset="1" stopColor="#5da0a8"/></linearGradient>
          <linearGradient id="bottle-glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".96"/><stop offset="1" stopColor="#ddf3f4" stopOpacity=".78"/></linearGradient>
          <linearGradient id="bottle-water" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8ee8ee"/><stop offset="1" stopColor="#55bec9"/></linearGradient>
          <clipPath id="bottle-inner"><path d="M41 35h30c1 8 4 12 12 17 8 5 12 13 12 24v103c0 18-12 31-29 31H46c-17 0-29-13-29-31V76c0-11 4-19 12-24 8-5 11-9 12-17Z"/></clipPath>
          <filter id="bottle-shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#4e9199" floodOpacity=".2"/></filter>
        </defs>
        <ellipse className="bottle-floor-shadow" cx="56" cy="215" rx="32" ry="5"/>
        {overflowing && <g className="bottle-overflow"><ellipse className="overflow-puddle" cx="78" cy="216" rx="29" ry="5"/><path className="overflow-splash" d="M70 18c15 0 22 9 23 23"/><path className="overflow-stream" d="M93 40c13 21-2 40 9 67"/><circle className="overflow-drop drop-one" cx="101" cy="123" r="4"/><circle className="overflow-drop drop-two" cx="88" cy="98" r="2.5"/><circle className="overflow-drop drop-three" cx="106" cy="145" r="3"/></g>}
        <g filter="url(#bottle-shadow)">
          <rect className="bottle-cap" x="38" y="7" width="36" height="17" rx="6" fill="url(#bottle-cap)"/>
          <path className="bottle-cap-lines" d="M44 10v11m8-11v11m8-11v11m8-11v11"/>
          <path className="bottle-neck" d="M43 23h26v17H43z" fill="url(#bottle-glass)"/>
          <path className="bottle-body" d="M41 35h30c1 8 4 12 12 17 8 5 12 13 12 24v103c0 18-12 31-29 31H46c-17 0-29-13-29-31V76c0-11 4-19 12-24 8-5 11-9 12-17Z" fill="url(#bottle-glass)"/>
          <g clipPath="url(#bottle-inner)">
            <rect className="bottle-water-fill" x="15" y={waterTop} width="82" height={214 - waterTop} fill="url(#bottle-water)"/>
            <ellipse className="bottle-water-line" cx="56" cy={waterTop} rx="40" ry="6"/>
            {percent > 16 && <><circle className="water-bubble bubble-a" cx="35" cy={waterTop + 42} r="3"/><circle className="water-bubble bubble-b" cx="76" cy={waterTop + 71} r="2"/><circle className="water-bubble bubble-c" cx="47" cy={waterTop + 103} r="1.5"/></>}
          </g>
          <path className="bottle-outline" d="M41 35h30c1 8 4 12 12 17 8 5 12 13 12 24v103c0 18-12 31-29 31H46c-17 0-29-13-29-31V76c0-11 4-19 12-24 8-5 11-9 12-17Z"/>
          <path className="bottle-highlight" d="M34 54c-7 5-10 12-10 22v91"/>
          <g className="bottle-marks">
            <path d="M80 54h7M82 89h5M80 125h7M82 161h5"/>
            <text x="77" y="57">2</text><text x="78" y="92">1,5</text><text x="77" y="128">1</text><text x="78" y="164">0,5</text>
          </g>
          <g className="bottle-volume-label" transform={`translate(56 ${volumeLabelY})`}><rect x="-20" y="-10" width="40" height="20" rx="10"/><text y="3">{litres} л</text></g>
        </g>
      </svg>
    </div>
    <div className="water-controls"><div className="metric-step-buttons"><button onClick={() => onChange(Math.max(0, value - 250))}>− 250</button><button onClick={() => onChange(Math.min(5000, value + 250))}>+ 250</button></div><input className="metric-range water-range" type="range" min="0" max="5000" step="250" value={Math.min(5000, value)} onChange={(event) => onChange(Number(event.target.value))} aria-label="Количество воды"/><div className="range-labels water-range-labels"><span>0</span><span>5 л</span></div></div>
  </div>;
}

function StepsEditor({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const goal = 7000;
  const max = Math.max(14000, Math.ceil(value / goal) * goal);
  const percent = Math.min(100, Math.round((value / max) * 100));
  const goalPercent = Math.round((goal / max) * 100);
  const remaining = Math.max(0, goal - value);
  return <div className="steps-editor">
    <div className="steps-value"><span><small>Пройдено сегодня</small><strong>{value.toLocaleString('ru-RU')} <b>шагов</b></strong></span><em className={value >= goal ? 'done' : ''}>{value >= goal ? <Check /> : <Footprints />}{value >= goal ? 'Цель 7 000 выполнена' : `Ещё ${remaining.toLocaleString('ru-RU')}`}</em></div>
    <div className="steps-slider-wrap">
      <input className="steps-range" type="range" min="0" max={max} step="500" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label="Количество шагов" aria-valuetext={`${value.toLocaleString('ru-RU')} шагов из ориентира 7 000`} style={{ background: `linear-gradient(90deg, #9ac8ad 0%, #5f9b7d ${percent}%, #e8f1eb ${percent}%, #e8f1eb 100%)` }} />
      <span className="steps-goal-tick" style={{ left: `${goalPercent}%` }} aria-hidden="true" />
    </div>
    <div className="steps-scale"><span>0</span><strong><Check />7 000 · цель</strong><span>{max.toLocaleString('ru-RU')}</span></div>
    <div className="metric-step-buttons"><button onClick={() => onChange(Math.max(0, value - 500))}>− 500</button><button onClick={() => onChange(Math.min(30000, value + 500))}>+ 500</button></div>
    <p className="metric-context">7 000 шагов — выбранный ориентир интерфейса, а не обязательная медицинская норма.</p>
  </div>;
}

function MeasurementEditor({ type, value, data, onChange }: { type: 'temperature' | 'weight'; value?: number; data: AuraState; onChange: (value?: number) => void }) {
  const temperature = type === 'temperature';
  const points = Object.entries(data.entries).flatMap(([date, entry]) => {
    const amount = entry[type];
    return typeof amount === 'number' ? [{ date, value: amount }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  return <div className="measurement-editor">
    {temperature ? <TemperatureControl value={value} onChange={onChange} /> : <WeightControl value={value} onChange={onChange} />}
    <div className="measurement-history-head"><div><span className="eyebrow">История по дням</span><h3>{points.length ? `${points.length} последних измерений` : 'Пока нет истории'}</h3></div><ChartSpline /></div>
    {points.length > 1 ? <MiniMeasurementChart points={points} unit={temperature ? '°' : ' кг'} /> : <div className="measurement-empty"><ChartSpline /><p><strong>График появится после двух отметок</strong><span>Каждое новое измерение добавится в историю.</span></p></div>}
    <p className="metric-context">{temperature ? 'Для сравнения измеряйте примерно в одно время и одним способом.' : 'Изменения важнее отдельной цифры. Время и условия измерения могут влиять на вес.'}</p>
  </div>;
}

function TemperatureControl({ value, onChange }: { value?: number; onChange: (value?: number) => void }) {
  const min = 34;
  const max = 42;
  const safeValue = typeof value === 'number' ? Math.min(max, Math.max(min, value)) : 36.6;
  const setFromPointer = (element: HTMLDivElement, clientY: number) => {
    const rect = element.getBoundingClientRect();
    const ratio = 1 - Math.min(1, Math.max(0, (clientY - rect.top - 18) / 112));
    onChange(Math.round((min + (ratio * (max - min))) * 10) / 10);
  };
  const changeBy = (delta: number) => onChange(Math.min(max, Math.max(min, Math.round((safeValue + delta) * 10) / 10)));
  const percent = (safeValue - min) / (max - min);
  const mercuryTop = 112 - (percent * 78);
  const displayValue = typeof value === 'number' ? value.toFixed(1).replace('.', ',') : '—';
  const ticks = [42, 40, 38, 36, 34];
  return <div className="temperature-control">
    <div
      className={`temperature-scroll-control ${typeof value === 'number' ? '' : 'empty'}`}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setFromPointer(event.currentTarget, event.clientY); }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event.currentTarget, event.clientY); }}
      onWheel={(event) => { event.preventDefault(); changeBy(event.deltaY > 0 ? -0.1 : 0.1); }}
    >
      <svg className="temperature-visual" viewBox="0 0 104 160" aria-hidden="true">
        <defs><linearGradient id="temperature-mercury" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f096c9"/><stop offset="1" stopColor="#cf5f93"/></linearGradient><filter id="temperature-shadow" x="-40%" y="-30%" width="180%" height="190%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#71445f" floodOpacity=".16"/></filter></defs>
        <g filter="url(#temperature-shadow)"><rect className="temperature-tube" x="28" y="17" width="30" height="103" rx="15"/><circle className="temperature-bulb" cx="43" cy="128" r="25"/><rect className="temperature-mercury" x="38" y={mercuryTop} width="10" height={132 - mercuryTop} rx="5" fill="url(#temperature-mercury)"/><circle className="temperature-mercury-bulb" cx="43" cy="128" r="15" fill="url(#temperature-mercury)"/></g>
        <g className="temperature-ticks">{ticks.map((tick) => { const y = 112 - (((tick - min) / (max - min)) * 78); return <g key={tick}><path d={`M61 ${y}h${tick % 4 === 0 ? 10 : 7}`}/><text x="76" y={y + 3}>{tick}°</text></g>; })}</g>
      </svg>
      <input
        className="temperature-vertical-range"
        type="range"
        min={min}
        max={max}
        step="0.1"
        value={safeValue}
        aria-label="Базальная температура"
        aria-valuetext={typeof value === 'number' ? `${displayValue} градуса Цельсия` : 'Температура пока не отмечена'}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowRight') { event.preventDefault(); changeBy(0.1); }
          if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') { event.preventDefault(); changeBy(-0.1); }
        }}
      />
      <span className="temperature-drag-cue" aria-hidden="true"><i>↑</i><small>проведите</small><i>↓</i></span>
    </div>
    <div className="temperature-input-copy">
      <span className="metric-goal">Утренняя отметка</span>
      <span className="temperature-label">Температура сегодня</span>
      <strong className={`temperature-readout ${typeof value === 'number' ? '' : 'empty'}`}>{displayValue}<small>°C</small></strong>
      <p className="temperature-instruction">Проведите по термометру вверх или вниз</p>
      <span className="temperature-step">Шаг 0,1°</span>
    </div>
  </div>;
}

function WeightControl({ value, onChange }: { value?: number; onChange: (value?: number) => void }) {
  const min = 20;
  const max = 300;
  const center = typeof value === 'number' ? Math.min(max, Math.max(min, value)) : 58.5;
  const marks = [-1, -.5, 0, .5, 1].map((offset) => center + offset);
  const format = (amount: number) => amount.toLocaleString('ru-RU', { minimumFractionDigits: amount % 1 ? 1 : 0, maximumFractionDigits: 1 });
  const changeBy = (delta: number) => onChange(Math.min(max, Math.max(min, Math.round((center + delta) * 10) / 10)));
  const dragStart = useRef<{ x: number; value: number } | null>(null);
  const changeFromDrag = (clientX: number) => {
    if (!dragStart.current) return;
    const delta = Math.round((clientX - dragStart.current.x) / 8);
    onChange(Math.min(max, Math.max(min, Math.round((dragStart.current.value + (delta * 0.1)) * 10) / 10)));
  };
  return <div className="weight-control">
    <div className="weight-control-head"><span><small>Вес сегодня</small><strong>{typeof value === 'number' ? 'Отметка сохранена' : 'Проведите по шкале'}</strong></span><span className="weight-control-icon"><Weight /></span></div>
    <div className="weight-ruler" aria-hidden="true">{marks.map((mark,index) => <span key={index} className={index === 2 ? 'active' : ''}><i />{format(mark)}</span>)}</div>
    <div
      className="weight-scale-body"
      onPointerDown={(event) => { dragStart.current = { x: event.clientX, value: center }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) changeFromDrag(event.clientX); }}
      onPointerUp={(event) => { changeFromDrag(event.clientX); dragStart.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { dragStart.current = null; }}
      onWheel={(event) => { event.preventDefault(); changeBy(event.deltaY > 0 ? -0.1 : 0.1); }}
    >
      <span className="weight-pointer" aria-hidden="true" />
      <div className={`weight-display ${typeof value === 'number' ? '' : 'empty'}`}><strong>{typeof value === 'number' ? format(center) : '—'}</strong><small>кг</small></div>
      <input
        className="weight-scroll-range"
        type="range"
        min={min}
        max={max}
        step="0.1"
        value={center}
        aria-label="Вес сегодня"
        aria-valuetext={typeof value === 'number' ? `${format(center)} килограмма` : 'Вес пока не отмечен'}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); changeBy(0.1); }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); changeBy(-0.1); }
        }}
      />
      <span className="weight-swipe-cue" aria-hidden="true"><i>←</i> проведите по шкале <i>→</i></span>
      <span className="weight-foot left"/><span className="weight-foot right"/>
    </div>
    <p>Шаг 0,1 кг · значение сохранится в записи этого дня</p>
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

function DiaryModule({ title, icon: Icon, tone, summary, open, onToggle, children }: { title: string; icon: LucideIcon; tone: string; summary: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className={`diary-module ${open ? 'open' : ''}`}><button className="module-head" onClick={onToggle}><span className={`metric-icon ${tone}`}><Icon /></span><span><strong>{title}</strong><small>{summary}</small></span><ChevronDown /></button>{open && <div className="module-body">{children}</div>}</section>;
}

function intimacySummary(day: AuraDayEntry) {
  if (day.intimate !== true) return 'Не отмечено';
  const comfort = { comfortable: 'Комфортно', discomfort: 'Был дискомфорт', pain: 'Была боль' } as const;
  return day.intimacyComfort ? `Близость · ${comfort[day.intimacyComfort]}` : 'Близость отмечена';
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

function Analytics({ data, scenario, section, setSection, mode, setMode, onOpenDiary, onOpenReport }: { data: AuraState; scenario: PrototypeScenario; section: AnalyticsSection; setSection: (section: AnalyticsSection) => void; mode: WellbeingMode; setMode: (mode: WellbeingMode) => void; onOpenDiary: () => void; onOpenReport: () => void }) {
  const entryCount = Object.keys(data.entries).length;
  const metrics = getAuraCycleMetrics(data);
  return <div className="screen analytics-screen">
    <header className="analytics-header"><div><span className="eyebrow">Личная картина</span><h1>Аналитика</h1></div><button className="period-select">{metrics.completedCycles ? `${metrics.completedCycles} цикла` : 'С начала'} <ChevronDown /></button></header>
    <div className="analytics-tabs">{([['overview', 'Главное'], ['cycle', 'Цикл'], ['wellbeing', 'Самочувствие'], ['history', 'Записи']] as const).map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>)}</div>
    {scenario !== 'history' ? <AnalyticsDataState scenario={scenario} entryCount={entryCount} onOpenDiary={onOpenDiary} /> : <>
      {section === 'overview' && <AnalyticsOverview data={data} setSection={setSection} />}
      {section === 'cycle' && <CycleAnalytics data={data} />}
      {section === 'wellbeing' && <WellbeingAnalytics data={data} mode={mode} setMode={setMode} />}
      {section === 'history' && <HistoryAnalytics data={data} />}
      <section className="report-cta"><span><FileHeart /></span><div><small>Для консультации</small><strong>Отчёт из ваших отметок</strong><p>Только сохранённые факты — без диагнозов.</p></div><button onClick={onOpenReport}><ChevronRight /></button></section>
    </>}
  </div>;
}

function AnalyticsDataState({ scenario, entryCount, onOpenDiary }: { scenario: Exclude<PrototypeScenario, 'history'>; entryCount: number; onOpenDiary: () => void }) {
  const empty = scenario === 'empty';
  return <div className="analytics-content data-state-content">
    <section className="data-state-hero">
      <span className="data-state-icon">{empty ? <ChartSpline /> : <Sparkle />}</span>
      <span className="eyebrow">{empty ? 'Начало личной истории' : 'Первый цикл'}</span>
      <h2>{empty ? 'Аналитика появится из ваших записей' : 'Пока показываем только факты'}</h2>
      <p>{empty ? 'Добавьте начало месячных или самочувствие. Пустые дни не будут считаться отсутствием симптомов.' : 'Одна запись уже сохранена, но её недостаточно для сравнения циклов и личных закономерностей.'}</p>
      <button className="primary-button" onClick={onOpenDiary}><Plus /> {empty ? 'Добавить первую запись' : 'Продолжить наблюдение'}</button>
    </section>
    <section className="surface evidence-roadmap"><div className="section-heading"><div><span className="eyebrow">Что появится дальше</span><h2>По мере накопления данных</h2></div><span className="soft-status">{entryCount} запись</span></div>{[
      ['День текущего цикла','После первой даты начала',!empty],
      ['Длина завершённого цикла','После двух дат начала',false],
      ['Личный диапазон','После трёх завершённых циклов',false],
      ['Повтор симптома','Если он встречается минимум в двух циклах',false],
    ].map(([title,note,ready]) => <div className={`roadmap-row ${ready ? 'ready' : ''}`} key={String(title)}><span>{ready ? <Check /> : <LockKeyhole />}</span><div><strong>{title}</strong><small>{note}</small></div></div>)}</section>
    <aside className="privacy-inline"><ShieldCheck /> Выводы не строятся по одной записи. Отсутствующие данные не заменяются нулями.</aside>
  </div>;
}

function AnalyticsOverview({ data, setSection }: { data: AuraState; setSection: (section: AnalyticsSection) => void }) {
  const metrics = getAuraCycleMetrics(data);
  const evidence = deriveAttentionEvidence(data);
  const ratings = Object.values(data.entries).flatMap((day) => day.rating ? [day.rating] : []);
  const averageRating = ratings.length ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1).replace('.', ',') : '—';
  const range = metrics.personalMin && metrics.personalMax ? `${metrics.personalMin}–${metrics.personalMax}` : '—';
  const entryDates = Object.keys(data.entries).sort().slice(-14);
  return <div className="analytics-content">
    <section className="aura-hero analytics-aura">
      <span className="glass-label"><Sparkle /> {evidence.eligible ? 'Повторяется в циклах' : 'Только сохранённые факты'}</span><h2>{evidence.eligible ? 'Боль повторялась в нескольких циклах' : 'История цикла уже видна'}</h2><p>{evidence.eligible ? `Наблюдение основано на ${evidence.painDays} отметках в ${evidence.cycles} циклах.` : `Доступно ${metrics.completedCycles} завершённых цикла. Для наблюдений о симптомах нужно больше повторов.`}</p>
      <div className="hero-data"><span><strong>{evidence.painDays}</strong><small>дней с болью</small></span><span><strong>{evidence.severeDays}</strong><small>сильные</small></span><span><strong>{evidence.cycles}</strong><small>цикла с болью</small></span></div>
      <button onClick={() => setSection('wellbeing')}>Открыть симптомы <ChevronRight /></button>
    </section>
    <div className="overview-metrics"><article><span className="metric-icon rose"><Droplet /></span><small>День цикла</small><strong>{metrics.cycleDay ?? '—'}</strong><p>Сегодня</p></article><article><span className="metric-icon violet"><CalendarRange /></span><small>Ваш диапазон</small><strong>{range}</strong><p>{metrics.completedCycles} завершённых</p></article><article><span className="metric-icon indigo"><Smile /></span><small>Самочувствие</small><strong>{averageRating}</strong><p>{ratings.length ? `из 5 · ${ratings.length} записей` : 'ещё не отмечено'}</p></article></div>
    <section className="surface chart-card">
      <div className="section-heading"><div><span className="eyebrow">Последние циклы</span><h2>Динамика длины</h2></div><span className="soft-status">{metrics.completedCycles} цикла</span></div>
      <CycleLineChart lengths={metrics.cycleLengths} compact />
    </section>
    <section className="surface rhythm-card">
      <div className="section-heading"><div><span className="eyebrow">Последние 14 записей</span><h2>Ваш ритм</h2></div><span className="soft-status">{entryDates.length} дней</span></div>
      <div className="rhythm-days">{entryDates.map((date) => { const day = data.entries[date]; return <span key={date} className={`filled ${date === AURA_TODAY ? 'today' : ''}`}><small>{Number(date.slice(8))}</small><i>{day.period && day.period !== 'none' ? <Droplet /> : day.symptoms.length ? <Heart /> : day.rating ? <Smile /> : null}</i></span>; })}</div>
      <p className="chart-caption"><i /> Пунктир и пустые дни означают отсутствие записи, а не отсутствие симптома.</p>
    </section>
  </div>;
}

function CycleAnalytics({ data }: { data: AuraState }) {
  const metrics = getAuraCycleMetrics(data);
  const recentStarts = metrics.starts.slice(-6).reverse();
  const range = metrics.personalMin && metrics.personalMax ? `${metrics.personalMin}–${metrics.personalMax} дней` : 'собирается';
  return <div className="analytics-content">
    <div className="metric-banner"><div><span className="metric-icon rose"><Droplet /></span><small>Текущий цикл</small><strong>{metrics.cycleDay ? `${metrics.cycleDay}-й день` : 'Не начат'}</strong></div><div><small>Ваш недавний диапазон</small><strong>{range}</strong><p>{metrics.completedCycles} завершённых цикла</p></div></div>
    <section className="surface chart-card tall">
      <div className="section-heading"><div><span className="eyebrow">{metrics.completedCycles} завершённых циклов</span><h2>Длина цикла</h2></div><button className="info-button" aria-label="О расчёте"><Info /></button></div>
      <CycleLineChart lengths={metrics.cycleLengths} />
      <div className="chart-legend"><span><i className="line" /> Ваши циклы</span><span><i className="band" /> Ваш недавний диапазон</span></div>
      <div className="range-explanation"><span className="range-ok"><Check /></span><div><strong>Сравнение только с вашей историей</strong><p>Это не медицинская норма. Изменение одного цикла само по себе не является диагнозом.</p></div></div>
    </section>
    <section className="surface cycle-history"><div className="section-heading"><h2>История циклов</h2><span className="soft-status">{recentStarts.length}</span></div>{recentStarts.map((start) => {
      const index = metrics.starts.indexOf(start);
      const length = index < metrics.starts.length - 1 ? daysBetween(start, metrics.starts[index + 1]) : null;
      return <button key={start}><span><strong>{formatRuDate(start)}</strong><small>Начало цикла</small></span><span><strong>{length ? `${length} дней` : 'Текущий'}</strong><small>{length ? 'завершён' : `${metrics.cycleDay ?? '—'}-й день`}</small></span><ChevronRight /></button>;
    })}</section>
  </div>;
}

function CycleLineChart({ lengths, compact = false }: { lengths: number[]; compact?: boolean }) {
  if (lengths.length < 2) return <div className="chart-empty"><ChartSpline /><strong>Нужно ещё два завершённых цикла</strong><small>После этого появится динамика длины.</small></div>;
  const values = lengths.slice(-6);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(4, max - min);
  const x = (index: number) => 40 + index * (260 / Math.max(1, values.length - 1));
  const y = (value: number) => 150 - ((value - min) / spread) * 90;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  return <svg className={`cycle-line-chart ${compact ? 'compact' : ''}`} viewBox="0 0 360 190" role="img" aria-label={`Длина последних циклов: ${values.join(', ')} дней`}>
    <defs><linearGradient id="auraArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fba0e3" stopOpacity=".34"/><stop offset="1" stopColor="#fba0e3" stopOpacity="0"/></linearGradient></defs>
    <rect x="32" y="58" width="300" height="100" rx="18" fill="#fde6f8" />
    {[45,85,125,165].map(y => <line key={y} x1="30" x2="335" y1={y} y2={y} stroke="#e4deea" strokeWidth="1" />)}
    <polyline points={points} fill="none" stroke="#fba0e3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    {values.map((value, index) => <g key={`${value}-${index}`}><circle cx={x(index)} cy={y(value)} r="7" fill="#fff" stroke="#fba0e3" strokeWidth="4"/><text x={x(index)} y={y(value)-15} textAnchor="middle" fill="#3b2842" fontSize="12" fontWeight="700">{value}</text><text x={x(index)} y="186" textAnchor="middle" fill="#94899e" fontSize="10">{index + 1}</text></g>)}
  </svg>;
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
  return <>
    <section className="aura-hero wellbeing-hero"><span className="glass-label"><Smile /> Последние 30 записей</span><h2>{ratings.length ? 'Ваши оценки дня' : 'Пока нет оценки самочувствия'}</h2><p>{ratings.length ? `Средняя оценка ${average(ratings)} из 5 по ${ratings.length} сохранённым дням.` : 'Поставьте оценку дня — пустые даты не будут считаться плохим самочувствием.'}</p><div className="wellbeing-score"><strong>{average(ratings)}</strong><span>из 5</span></div></section>
    <div className="two-metrics"><article><small>Энергия</small><strong>{average(energy)} <span>из 5</span></strong><p>{energy.length} записей</p></article><article><small>Дней с болью</small><strong>{painDays}</strong><p>из {recent.length} записанных дней</p></article></div>
    <section className="surface chart-card"><div className="section-heading"><div><span className="eyebrow">Динамика</span><h2>Оценка дня</h2></div><span className="soft-status">{ratings.length} оценок</span></div><MoodAreaChart values={ratings} /><p className="chart-caption">Показаны только дни, когда вы сохранили оценку.</p></section>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">{[...moods.values()].reduce((sum, count) => sum + count, 0)} отметок</span><h2>Частые состояния</h2></div></div>{frequentMoods.length ? <div className="mood-composition">{frequentMoods.map(([label, count], index) => <span key={label} style={{ flex: count }} className={['calm','joy','tired','anxious'][index]}>{label} · {count}</span>)}</div> : <div className="chart-empty"><Smile /><strong>Состояния ещё не отмечены</strong><small>Они появятся здесь после сохранения.</small></div>}</section>
  </>;
}

function MoodAreaChart({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="chart-empty"><ChartSpline /><strong>Нужно минимум две оценки</strong><small>График появится без заполнения пропущенных дней.</small></div>;
  const recent = values.slice(-12);
  const points = recent.map((value, index) => `${20 + index * (320 / Math.max(1, recent.length - 1))},${150 - (value - 1) * 28}`).join(' ');
  return <svg className="mood-chart" viewBox="0 0 360 170" role="img" aria-label={`Оценки дня: ${recent.join(', ')}`}>{[35,75,115,155].map(y => <line key={y} x1="18" x2="342" y1={y} y2={y} stroke="#f1ddea"/>)}<polyline points={points} fill="none" stroke="#fba0e3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{recent.map((value, index) => <circle key={index} cx={20 + index * (320 / Math.max(1, recent.length - 1))} cy={150 - (value - 1) * 28} r="5" fill="#fff" stroke="#fba0e3" strokeWidth="3"/>)}</svg>;
}

function SymptomsAnalytics({ data }: { data: AuraState }) {
  const evidence = deriveAttentionEvidence(data);
  return <>
    <section className="symptom-hero surface"><div className="section-heading"><div><span className="eyebrow">Чаще всего</span><h2>Боль внизу живота</h2></div><span className="soft-status coral">4 отметки</span></div><div className="severity-arc"><div className="arc-segments"><span className="arc-zero"/><span className="arc-one"/><span className="arc-two active"/><span className="arc-three"/></div><div className="arc-value"><strong>2</strong><span>из 3</span><small>средняя выраженность</small></div></div><div className="impact-row"><span><Timer /><strong>2 из 4</strong><small>мешала обычным делам</small></span><span><ListChecks /><strong>2 цикла</strong><small>повторялась</small></span></div></section>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">По дням цикла</span><h2>Когда отмечалась боль</h2></div><button className="info-button"><Info /></button></div><div className="cycle-heatmap"><div className="phase-labels"><span>Месячные</span><span>Первая половина</span><span>Вторая половина</span></div><div className="heat-days">{Array.from({ length: 31 }, (_, index) => <i key={index} className={[1,2,5,27].includes(index) ? `level-${index === 2 ? 3 : 2}` : ''} title={`${index + 1}-й день`} />)}</div><div className="heat-axis"><span>1</span><span>7</span><span>14</span><span>21</span><span>28</span></div></div><p className="chart-caption">Сопоставлено по 2 циклам. Это наблюдение, а не медицинский вывод.</p></section>
    <section className="surface symptom-list"><div className="section-heading"><h2>Все симптомы</h2><span className="soft-status">8 записей</span></div>{[['Боль внизу живота',4,2],['Усталость',3,1],['Головная боль',2,2],['Чувствительная грудь',1,1]].map(([label,count,severity]) => <div key={String(label)}><span><strong>{label}</strong><small>{count} отметки · {severity}/3</small></span><i><b style={{ width: `${Number(count)*22}%` }} /></i></div>)}</section>
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
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">Последние {sleep.length} записей</span><h2>Длительность сна</h2></div></div>{sleep.length ? <div className="sleep-bars">{sleep.map((item,index) => <div key={item.date}><span style={{ height: `${item.hours*12}px` }}><b>{item.hours}</b></span><small>{index+1}</small></div>)}</div> : <div className="chart-empty"><Moon /><strong>График появится после первой отметки</strong><small>Пустые дни не считаются нулём.</small></div>}<div className="personal-band"><i /> Ваш недавний диапазон, не медицинская норма</div></section>
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
    <section className="surface habit-main"><div className="section-heading"><div><span className="eyebrow">Вода · последние записи</span><h2>В дни с отметками</h2></div><span className="soft-status sage">{waterValues.length} записей</span></div><div className="habit-value"><strong>{averageWater?.toLocaleString('ru-RU') ?? '—'}</strong><span>мл в среднем</span></div><div className="water-bars">{water.map(({date,value}) => <div key={date}><span className={value === undefined ? 'missing' : ''} style={{ height: value === undefined ? '12px' : `${Math.max(16,value/18)}px` }}><b>{value === undefined ? '—' : `${value/1000}`}</b></span><small>{ruWeekdays[localDate(date).getDay()]}</small></div>)}</div><p className="chart-caption">Пустой день означает, что вода не отмечалась. Он не считается нулём.</p></section>
    <section className="surface body-grid"><div className="section-heading"><h2>Измерения</h2></div><div><MetricCard icon={Weight} tone="coral" label="Вес" value={latestWeight ? `${latestWeight[1].weight}` : '—'} note={latestWeight ? `кг · ${formatRuDate(latestWeight[0])}` : 'не отмечено'}/><MetricCard icon={Thermometer} tone="violet" label="Температура" value={latestTemperature ? `${latestTemperature[1].temperature}°` : '—'} note={latestTemperature ? formatRuDate(latestTemperature[0]) : 'не отмечено'}/></div></section>
  </>;
}

function HistoryAnalytics({ data }: { data: AuraState }) {
  const [filter, setFilter] = useState('Все');
  const rows = Object.entries(data.entries).sort(([left], [right]) => right.localeCompare(left)).filter(([, day]) => {
    if (filter === 'Все') return true;
    if (filter === 'Цикл') return Boolean(day.period && day.period !== 'none');
    if (filter === 'Симптомы') return day.symptoms.length > 0;
    if (filter === 'Состояние') return Boolean(day.rating || day.moods.length);
    return day.sleepHours !== undefined;
  });
  const latest = rows.slice(0, 12);
  const currentMonth = localDate(AURA_TODAY);
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const activeDays = new Set(Object.keys(data.entries).filter((date) => date.slice(0, 7) === AURA_TODAY.slice(0, 7)).map((date) => Number(date.slice(8))));
  const summary = (day: AuraDayEntry) => day.symptoms[0] ? `${day.symptoms[0].label} · ${day.symptoms[0].severity}/3` : day.rating ? `Оценка дня · ${day.rating}/5` : day.sleepHours !== undefined ? `Сон · ${day.sleepHours} ч` : day.period && day.period !== 'none' ? 'Месячные отмечены' : 'Сохранённая запись';
  const detail = (day: AuraDayEntry) => day.water !== undefined ? `Вода · ${day.water.toLocaleString('ru-RU')} мл` : day.energy ? `Энергия · ${day.energy}/5` : day.moods[0] ?? 'Без дополнительной отметки';
  return <div className="history-view">
    <section className="surface history-calendar"><div className="section-heading"><div><span className="eyebrow">{ruMonthTitles[currentMonth.getMonth()]}</span><h2>История записей</h2></div><span className="soft-status">{activeDays.size} дней</span></div><div className="history-dots">{Array.from({length:daysInMonth},(_,index)=><i key={index} className={activeDays.has(index + 1) ? `active tone-${index%4}` : ''}><span>{index+1}</span></i>)}</div></section>
    <div className="filter-chips">{['Все','Цикл','Симптомы','Состояние','Сон'].map(item=><button key={item} className={filter===item?'active':''} onClick={()=>setFilter(item)}>{item}</button>)}</div>
    <div className="history-list">{latest.map(([date, day], index)=><button key={date}><span className={`history-date ${['coral','violet','sage','rose'][index%4]}`}><strong>{Number(date.slice(8))}</strong><small>{ruMonths[localDate(date).getMonth()].slice(0,3)}</small></span><span><small>{date === AURA_TODAY ? 'Сегодня' : formatRuDate(date)}</small><strong>{summary(day)}</strong><p>{detail(day)}</p></span><ChevronRight /></button>)}</div>
    {!latest.length && <div className="chart-empty"><NotebookTabs /><strong>Таких записей пока нет</strong><small>Смените фильтр или добавьте отметку в дневнике.</small></div>}
  </div>;
}

function Knowledge({ data, onChangeData, onOpenArticle }: { data: AuraState; onChangeData: (updater: (current: AuraState) => AuraState) => void; onOpenArticle: () => void }) {
  const [category, setCategory] = useState<KnowledgeCategory>('all');
  const [tab, setTab] = useState<KnowledgeTab>('for-you');
  const [query, setQuery] = useState('');
  const visibleArticles = knowledgeArticles.filter((article) => {
    const categoryMatch = category === 'all' || article.categoryId === category;
    const searchMatch = article.title.toLowerCase().includes(query.trim().toLowerCase()) || article.category.toLowerCase().includes(query.trim().toLowerCase());
    const savedMatch = tab !== 'saved' || data.savedArticles.includes(article.id);
    return categoryMatch && searchMatch && savedMatch;
  });
  const toggleSaved = (id: string) => onChangeData((current) => ({ ...current, savedArticles: current.savedArticles.includes(id) ? current.savedArticles.filter((item) => item !== id) : [...current.savedArticles, id] }));

  return <div className="screen knowledge-screen">
    <header className="knowledge-header"><div><span className="eyebrow">Спокойно и по делу</span><h1>Знания</h1></div><button className="round-button" onClick={() => setTab('saved')} aria-label="Сохранённые статьи"><Bookmark /></button></header>
    <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: боль или сон"/>{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X /></button>}</label>
    <div className="knowledge-tabs">{([['for-you','Для вас'],['all','Все материалы'],['saved',`Сохранённые · ${data.savedArticles.length}`]] as const).map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'for-you' && !query && <section className="featured-article" onClick={onOpenArticle}>
      <div className="featured-art clear-article-cover" aria-label="Тема статьи: боль во время месячных">
        <div className="cover-topic"><span><Droplet /></span><div><small>Тема материала</small><strong>Боль во время месячных</strong></div></div>
        <div className="cover-checks"><span><CircleGauge /> Сила</span><span><Timer /> Длительность</span><span><Activity /> Влияние на день</span></div>
      </div>
      <div className="featured-copy"><span className="glass-label"><Heart /> Симптомы · 4 минуты</span><h2>Спазмы в первые дни месячных</h2><p>Что помогает наблюдать боль и когда стоит обратиться за помощью.</p><div><span>Почему сейчас: отмечена боль</span><button>Читать <ChevronRight /></button></div></div>
    </section>}
    <div className="section-heading knowledge-title"><div><span className="eyebrow">Подобрано по вашим отметкам</span><h2>Может быть полезно</h2></div></div>
    <div className="category-filter" aria-label="Категории статей">
      {knowledgeCategories.map(({ id, label, icon: Icon }) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}><Icon /><span>{label}</span></button>)}
    </div>
    <div className="article-list">{visibleArticles.map(article => <ArticleCard key={article.id} {...article} saved={data.savedArticles.includes(article.id)} onToggleSaved={() => toggleSaved(article.id)} onOpen={article.categoryId === 'symptoms' ? onOpenArticle : undefined}/>)}</div>
    {!visibleArticles.length && <section className="empty-search"><Search /><h2>{tab === 'saved' ? 'Здесь будут сохранённые статьи' : 'Ничего не найдено'}</h2><p>{tab === 'saved' ? 'Нажмите на закладку у материала, чтобы вернуться к нему позже.' : 'Попробуйте другое слово или выберите категорию «Все».'}</p>{query && <button className="secondary-button" onClick={() => { setQuery(''); setCategory('all'); }}>Сбросить поиск</button>}</section>}
    <p className="knowledge-disclaimer"><ShieldCheck /> Материалы помогают наблюдать за самочувствием, но не заменяют консультацию специалиста.</p>
  </div>;
}

function ArticleCard({ tone, category, time, title, icon: Icon, saved, onToggleSaved, onOpen }: { tone: string; category: string; time: string; title: string; icon: LucideIcon; saved: boolean; onToggleSaved: () => void; onOpen?: () => void }) {
  return <article className="article-card"><button className={`bookmark-card ${saved ? 'saved' : ''}`} aria-label={saved ? `Убрать «${title}» из сохранённых` : `Сохранить «${title}»`} onClick={onToggleSaved}><Bookmark /></button><span className={`article-thumb ${tone}`}><i/><Icon /></span><div onClick={onOpen}><small>{category} · {time}</small><strong>{title}</strong><p>Простой разбор с примерами и источниками.</p></div><button aria-label={`Открыть статью «${title}»`} onClick={onOpen}><ChevronRight /></button></article>;
}

function Article({ saved, onToggleSaved, onBack, onOpenDiary }: { saved: boolean; onToggleSaved: () => void; onBack: () => void; onOpenDiary: () => void }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  return <div className="screen article-screen">
    <TopBack title="Статья" onBack={onBack} action={<button className={`round-button ${saved ? 'is-saved' : ''}`} onClick={onToggleSaved} aria-label={saved ? 'Убрать из сохранённых' : 'Сохранить статью'}><Bookmark /></button>} />
    <article className="reading-article">
      <header className="reading-header">
        <span className="reading-badge"><Heart /> Симптомы</span>
        <h1>Спазмы в первые дни месячных</h1>
        <p>Почему возникает боль, что полезно записать и когда стоит обратиться за помощью.</p>
        <div className="reading-meta"><span>4 минуты чтения</span><i/><span>Обновлено 13 июля 2026</span></div>
        <div className="reading-review"><ShieldCheck /><span><strong>Проверено по медицинским материалам</strong><small>Источники доступны в конце статьи</small></span></div>
      </header>

      <section className="reading-section">
        <h2>Что важно знать</h2>
        <p>Спазмы во время месячных могут ощущаться как тянущая или схваткообразная боль внизу живота. У некоторых людей они также сопровождаются дискомфортом в спине, усталостью или тошнотой.</p>
        <p>Важно не сравнивать себя с универсальной «нормой», а замечать изменения относительно своего обычного состояния. Сильную, новую или усиливающуюся боль не нужно терпеть.</p>
      </section>

      <section className="reading-section">
        <h2>Что записать в дневник</h2>
        <ul className="reading-checklist">
          <li><Check /><span><strong>Силу боли</strong><small>Например, 2 из 3</small></span></li>
          <li><Check /><span><strong>Сколько она длилась</strong><small>Несколько минут или часов</small></span></li>
          <li><Check /><span><strong>Как повлияла на день</strong><small>Мешала ли работать, спать или двигаться</small></span></li>
        </ul>
      </section>

      <section className="reading-section">
        <h2>Пример понятной записи</h2>
        <blockquote className="reading-example">«Боль 2 из 3, длилась четыре часа. Пришлось отменить тренировку».</blockquote>
        <p>Такая запись полезнее короткого «болел живот»: в ней есть сила, длительность и влияние на обычный день.</p>
      </section>

      <aside className="reading-callout">
        <CircleAlert />
        <div><strong>Когда обратиться за помощью</strong><p>Если боль сильная, новая, усиливается, возникает вне месячных или мешает обычной жизни.</p></div>
      </aside>

      <button className="primary-button reading-action" onClick={onOpenDiary}><Plus /> Отметить боль в дневнике</button>

      <footer className="reading-sources">
        <button className="sources-toggle" type="button" aria-expanded={sourcesOpen} onClick={() => setSourcesOpen((open) => !open)}>
          <span className="sources-toggle-icon"><BookOpenText /></span>
          <span><strong>Источники статьи</strong><small>2 медицинских материала · откроются отдельно</small></span>
          <ChevronDown />
        </button>
        {sourcesOpen && <div className="sources-panel">
          <p>Материалы для дополнительного чтения. Статья носит информационный характер и не заменяет консультацию врача.</p>
          <a href="https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods" target="_blank" rel="noreferrer"><span><strong>ACOG</strong><small>Dysmenorrhea: Painful Periods</small></span><ChevronRight /></a>
          <a href="https://www.nhs.uk/conditions/period-pain/" target="_blank" rel="noreferrer"><span><strong>NHS</strong><small>Period pain</small></span><ChevronRight /></a>
        </div>}
      </footer>
    </article>
  </div>;
}

function Report({ data, onBack, onNotify }: { data: AuraState; onBack: () => void; onNotify: (message: string) => void }) {
  const [notes, setNotes] = useState(false);
  const [intimate, setIntimate] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({ cycle: true, symptoms: true, wellbeing: true, sleep: true });
  const evidence = deriveAttentionEvidence(data);
  const entryCount = Object.keys(data.entries).length;
  return <div className="screen report-screen">
    <TopBack title="Отчёт для врача" onBack={onBack} action={<span className="secure-badge"><ShieldCheck /> Локально</span>} />
    <section className="aura-hero report-hero"><span className="glass-label"><FileHeart /> Факты для консультации</span><h2>Подготовьте понятную историю</h2><p>Выберите только те данные, которыми готовы поделиться.</p></section>
    <section className="surface"><div className="section-heading"><div><span className="eyebrow">Период</span><h2>Последние 3 цикла</h2></div><button className="period-select">Изменить <ChevronDown /></button></div><div className="report-summary"><span><strong>89</strong><small>дней</small></span><span><strong>{data.periodStarts.length}</strong><small>цикла</small></span><span><strong>{entryCount}</strong><small>записей</small></span></div></section>
    <section className="surface report-options"><div className="section-heading"><div><span className="eyebrow">Состав отчёта</span><h2>Что включить</h2></div><span className="soft-status">{Object.values(sections).filter(Boolean).length + Number(notes) + Number(intimate)} разделов</span></div>{([['cycle','Циклы и месячные','Даты, длительность и диапазон'],['symptoms','Боль и симптомы','Частота, выраженность и влияние'],['wellbeing','Состояние и энергия','Средние оценки по записям'],['sleep','Сон','Длительность и качество']] as const).map(([id,title,note])=><ToggleRow key={id} title={title} note={note} checked={sections[id]} onClick={() => setSections((current) => ({ ...current, [id]: !current[id] }))}/>)}<div className="sensitive-label"><LockKeyhole /> Чувствительные данные выключены</div><ToggleRow title="Личные заметки" note={`${Object.values(data.entries).filter((day) => day.note).length} заметки`} checked={notes} onClick={()=>setNotes(!notes)} sensitive/><ToggleRow title="Интимная жизнь" note={`${Object.values(data.entries).filter((day) => day.intimate !== undefined).length} отметки`} checked={intimate} onClick={()=>setIntimate(!intimate)} sensitive/></section>
    <section className="report-preview"><div className="report-logo"><MiraMark /> Mira</div><h2>Цикл и самочувствие</h2><p>14 апреля – 14 июля 2026</p><div className="preview-metrics"><span><small>Циклы</small><strong>29 дней</strong><i>26–31</i></span><span><small>Месячные</small><strong>4,8 дня</strong><i>{data.periodStarts.length} цикла</i></span><span><small>Симптом</small><strong>Боль · {evidence.painDays}</strong><i>{evidence.severeDays} сильные</i></span></div><div className="preview-line"><span style={{height:'44%'}}/><span style={{height:'65%'}}/><span style={{height:'55%'}}/><span style={{height:'82%'}}/><span style={{height:'58%'}}/></div><small>Отчёт содержит самостоятельные отметки и не является медицинским заключением.</small></section>
    <button className="primary-button" onClick={() => { onNotify('Открыто системное окно печати'); window.print(); }}><FileDown /> Открыть печать / сохранить PDF</button>
  </div>;
}

function ToggleRow({ title, note, checked, onClick, sensitive = false }: { title: string; note: string; checked: boolean; onClick?: () => void; sensitive?: boolean }) {
  return <button className={`toggle-row ${sensitive ? 'sensitive' : ''}`} onClick={onClick}><span><strong>{title}{sensitive && <i>личное</i>}</strong><small>{note}</small></span><i className={`toggle ${checked ? 'on' : ''}`}><b /></i></button>;
}

function Profile({ data, onChangeData, onBack, onOpenHomeSettings, onOpenDiarySettings, onOpenData, onOpenSaved, onOpenFeedback, onOpenSupport }: { data: AuraState; onChangeData: (updater: (current: AuraState) => AuraState) => void; onBack: () => void; onOpenHomeSettings: () => void; onOpenDiarySettings: () => void; onOpenData: () => void; onOpenSaved: () => void; onOpenFeedback: () => void; onOpenSupport: () => void }) {
  return <div className="screen profile-screen">
    <TopBack title="Профиль" onBack={onBack} action={<button className="round-button"><SlidersHorizontal /></button>} />
    <section className="profile-person"><span className="profile-avatar">Л</span><div><h2>Личная история</h2><p>Локальный профиль · без аккаунта</p></div><button>Изменить</button></section>
    <section className="privacy-aura"><span><ShieldCheck /></span><div><small>Приватность</small><h2>Данные остаются на этом устройстве</h2><p>Ничего не отправляется на сервер.</p><button onClick={onOpenData}>Управлять данными <ChevronRight /></button></div></section>
    <section className="profile-group"><span className="eyebrow">Настройки</span><ProfileRow icon={Droplet} tone="rose" title="Цикл и прогноз" note="28 дней · месячные 5 дней"/><ProfileRow icon={NotebookTabs} tone="violet" title="Дневник" note={`${Object.values(data.modules).filter(Boolean).length} разделов включено`} onClick={onOpenDiarySettings}/><ProfileRow icon={House} tone="coral" title="Главная страница" note={`${Object.values(data.homeCards).filter(Boolean).length} карточек`} onClick={onOpenHomeSettings}/><button className="profile-toggle-row" onClick={() => onChangeData((current) => ({ ...current, notifications: !current.notifications }))}><span className="metric-icon indigo"><Bell /></span><span><strong>Напоминания</strong><small>{data.notifications ? 'Включены · нейтральный текст' : 'Выключены'}</small></span><i className={`toggle ${data.notifications ? 'on' : ''}`}><b /></i></button></section>
    <section className="profile-group"><span className="eyebrow">Ваши данные</span><ProfileRow icon={FileDown} tone="sage" title="Экспорт и резервная копия" note="Создать или восстановить копию" onClick={onOpenData}/><ProfileRow icon={LockKeyhole} tone="violet" title="Данные и приватность" note="Хранение, перенос и удаление" onClick={onOpenData}/><ProfileRow icon={BookOpenText} tone="coral" title="Сохранённые материалы" note={`${data.savedArticles.length} статьи`} onClick={onOpenSaved}/></section>
    <section className="community-card"><MiraMark className="community-mark" /><div><span className="eyebrow">Проект создаётся вместе с вами</span><h2>Помогите Mira оставаться бесплатной</h2><p>Расскажите, чего не хватает, подпишитесь на новости или поддержите разработку добровольным донатом.</p></div><div className="community-actions"><button onClick={onOpenFeedback}><MessageSquareText /> Написать нам</button><button onClick={onOpenSupport}><Heart /> Поддержать</button></div><small>Поддержка добровольна и не открывает платные функции.</small></section>
    <section className="surface about-card"><MiraMark className="about-brand-mark" /><div><strong>Mira</strong><p>Не является медицинским устройством и не заменяет консультацию специалиста.</p></div><Info /></section>
  </div>;
}

function ProfileRow({ icon: Icon, tone, title, note, onClick }: { icon: LucideIcon; tone: string; title: string; note: string; onClick?: () => void }) {
  return <button className="profile-row" onClick={onClick}><span className={`metric-icon ${tone}`}><Icon /></span><span><strong>{title}</strong><small>{note}</small></span><ChevronRight /></button>;
}

function PeriodStartSheet({ marked, onClose, onChooseDate, onConfirm, onRemove }: { marked: boolean; onClose: () => void; onChooseDate: () => void; onConfirm: () => void; onRemove: () => void }) {
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet period-start-sheet" role="dialog" aria-modal="true" aria-label="Начало месячных" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className={`period-start-icon ${marked ? 'marked' : ''}`}>{marked ? <Check /> : <Droplet />}</span>
      <span className="eyebrow">Первый день нового цикла</span><h2>{marked ? 'Начало уже отмечено' : 'Месячные начались сегодня?'}</h2>
      <p>{marked ? `${formatRuDate(AURA_TODAY)} сохранено как первый день. Прогноз и день цикла считаются от этой даты.` : `${formatRuDate(AURA_TODAY)} станет первым днём нового цикла. Прогноз пересчитается по вашей истории.`}</p>
      <div className="period-start-date"><CalendarRange /><span><small>Дата начала</small><strong>{formatRuDate(AURA_TODAY, true)}</strong></span>{marked && <em><Check /> Отмечено</em>}</div>
      {!marked ? <><button className="primary-button" onClick={onConfirm}><Droplet /> Да, отметить начало</button><button className="secondary-button" onClick={onChooseDate}><CalendarRange /> Выбрать другую дату</button></> : <><button className="secondary-button" onClick={onChooseDate}><CalendarRange /> Открыть календарь</button><button className="period-start-remove" onClick={onRemove}><Trash2 /> Удалить отметку о начале</button></>}
      <small className="period-start-hint">Интенсивность выделений можно отдельно указать в дневнике.</small>
    </section>
  </div>;
}

function FeedbackSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [category, setCategory] = useState<'idea' | 'problem' | 'question'>('idea');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet feedback-sheet" role="dialog" aria-modal="true" aria-label="Обратная связь" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className="feedback-icon"><MessageSquareText /></span><span className="eyebrow">Прямо команде Mira</span><h2>Что вы хотите изменить?</h2><p>Можно предложить идею, рассказать о проблеме или задать вопрос. Мы читаем каждое сообщение.</p>
      <div className="feedback-categories" role="group" aria-label="Тема сообщения">{([['idea','Идея'],['problem','Проблема'],['question','Вопрос']] as const).map(([value,label]) => <button key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
      <label className="feedback-field"><span>Сообщение</span><textarea autoFocus value={message} maxLength={1200} placeholder="Например: хочу видеть сравнение боли по циклам…" onChange={(event) => setMessage(event.target.value)}/><small>{message.length} / 1200</small></label>
      <label className="feedback-field compact"><span>Как с вами связаться <i>необязательно</i></span><input type="text" value={contact} placeholder="Email или @username" onChange={(event) => setContact(event.target.value)}/></label>
      <aside className="feedback-privacy"><ShieldCheck /><span><strong>Данные дневника не прикрепляются</strong>Отправятся только сообщение и контакт, если вы его указали.</span></aside>
      <button className="primary-button" disabled={!message.trim()} onClick={onSubmit}><Send /> Отправить команде</button>
      <small className="prototype-connection">В прототипе показан готовый сценарий. Для реальной отправки нужно подключить адрес или сервер.</small>
    </section>
  </div>;
}

function SupportSheet({ onClose, onNotify }: { onClose: () => void; onNotify: (message: string) => void }) {
  const [amount, setAmount] = useState(199);
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet support-sheet" role="dialog" aria-modal="true" aria-label="Поддержать Mira" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle"/><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <div className="support-hero"><span><Heart /></span><small>Mira остаётся бесплатной</small><h2>Спасибо, что помогаете проекту жить</h2><p>Подписка помогает нам расти, а добровольные донаты — оплачивать разработку и медицинскую редактуру.</p></div>
      <div className="support-option"><span className="metric-icon violet"><Bell /></span><div><strong>Подписаться на новости</strong><small>Обновления продукта, опросы и приглашения в тестирование.</small></div><button onClick={() => onNotify('Добавьте ссылку на Telegram-канал перед запуском')}>Подписаться</button></div>
      <div className="donation-block"><span className="eyebrow">Разовая поддержка</span><div className="donation-amounts">{[99,199,499].map((value) => <button key={value} className={amount === value ? 'active' : ''} onClick={() => setAmount(value)}>{value} ₽</button>)}</div><button className="primary-button" onClick={() => onNotify(`Выбрано ${amount} ₽ · подключите платёжную ссылку перед запуском`)}><Heart /> Поддержать на {amount} ₽</button></div>
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
  return <div className="attention-overlay settings-overlay" onClick={onClose}>
    <section className="settings-sheet data-controls-sheet" role="dialog" aria-modal="true" aria-label="Данные и приватность" onClick={(event) => event.stopPropagation()}>
      <div className="attention-handle" /><button className="attention-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <span className="eyebrow">Локально и под вашим контролем</span><h2>Данные и приватность</h2><p>Записи хранятся в этом браузере. Mira не отправляет их на сервер.</p>
      <div className="data-trust-card"><ShieldCheck /><div><strong>Только на устройстве</strong><small>{Object.keys(data.entries).length} записей · версия данных {data.version}</small></div></div>
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
  return <header className="top-back"><button className="round-button" onClick={onBack}><ChevronLeft /></button><h1>{title}</h1>{action ?? <span />}</header>;
}

function BottomNav({ screen, onOpen }: { screen: Screen; onOpen: (screen: Screen) => void }) {
  return <nav className="bottom-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => onOpen(id)}><span><Icon /></span><small>{label}</small></button>)}</nav>;
}

const root = document.getElementById('aura-root');
const auraGlobal = globalThis as typeof globalThis & { __lunaAuraRoot?: ReturnType<typeof createRoot> };
if (root) {
  auraGlobal.__lunaAuraRoot ??= createRoot(root);
  auraGlobal.__lunaAuraRoot.render(<StartupGate><App /></StartupGate>);
}
