import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ChevronRight,
  Droplet,
  Footprints,
  HeartPulse,
  Info,
  Moon,
  Orbit,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react';
import './todayHome.css';

export type HomeDateItem = {
  iso: string;
  day: number;
  weekday: string;
  active: boolean;
  today: boolean;
  disabled: boolean;
  markerCount: number;
};

export type CycleSummary = {
  currentDay: number | null;
  averageLength: number | null;
  phaseLabel: string;
  predictedPeriodRange: string;
  confidenceLabel: string;
  energyLabel: string;
  energyDescription: string;
};

export type DailyMetrics = {
  symptoms: Array<{ id: string; label: string; severity: number }>;
  sleepHours?: number;
  sleepQuality?: string;
  sleepWeek: number[];
  water: number;
  steps: number;
  mood?: string;
  energy?: number;
};

export type HormonoscopeState = {
  status: 'learning' | 'ready';
  completedSimilarDays: number;
  requiredSimilarDays: number;
  observations: Array<{ title: string; text: string }>;
};

export type CycloscopeState = {
  archetype: string;
  description: string;
};

type HomePageProps = {
  currentDate: string;
  dates: HomeDateItem[];
  cycle: CycleSummary;
  metrics: DailyMetrics;
  hormonoscope?: HormonoscopeState;
  cycloscope?: CycloscopeState;
  insight?: { title: string; text: string };
  onProfile: () => void;
  onCalendar: () => void;
  onSelectDate: (date: string) => void;
  onCycle: () => void;
  onSymptoms: () => void;
  onSleep: () => void;
  onIncreaseWater: () => void;
  onPeriod: () => void;
  onCycloscope: () => void;
  onHormonoscope: () => void;
  onHelpfulAction: (action: 'kit' | 'workout' | 'support') => void;
};

function Card({ asButton = false, className = '', onClick, children, ariaLabel }: { asButton?: boolean; className?: string; onClick?: () => void; children: ReactNode; ariaLabel?: string }) {
  if (asButton) return <button className={`mira-home-card ${className}`} onClick={onClick} aria-label={ariaLabel}>{children}</button>;
  return <section className={`mira-home-card ${className}`}>{children}</section>;
}

function IconBadge({ children, tone = 'rose' }: { children: ReactNode; tone?: 'rose' | 'violet' | 'cyan' | 'sage' | 'amber' }) {
  return <span className={`home-icon-badge ${tone}`}>{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="home-tag">{children}</span>;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return <span className="home-progress" role="img" aria-label={label}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <header className="home-section-header"><h2>{title}</h2>{action}</header>;
}

export function HomeHeader({ currentDate, onProfile, onCalendar }: Pick<HomePageProps, 'currentDate' | 'onProfile' | 'onCalendar'>) {
  return <header className="home-header">
    <div><span className="home-wordmark">Mira</span><p>{currentDate}</p><small>Ваш день под контролем</small></div>
    <div className="home-header-actions"><button onClick={onCalendar} aria-label="Открыть календарь"><CalendarDays /></button><button onClick={onProfile} aria-label="Открыть профиль"><UserRound /></button></div>
  </header>;
}

export function WeekStrip({ dates, onSelectDate }: Pick<HomePageProps, 'dates' | 'onSelectDate'>) {
  return <nav className="home-week-strip" aria-label="Ближайшие дни">{dates.map((date) => <button key={date.iso} className={date.active ? 'active' : ''} disabled={date.disabled} aria-current={date.active ? 'date' : undefined} aria-label={`${date.day}, ${date.weekday}${date.today ? ', сегодня' : ''}`} onClick={() => onSelectDate(date.iso)}><small>{date.today ? 'Сегодня' : date.weekday}</small><strong>{date.day}</strong>{date.markerCount > 0 && <i aria-hidden="true" />}</button>)}</nav>;
}

export function CycleTrendChart({ currentDay, averageLength }: Pick<CycleSummary, 'currentDay' | 'averageLength'>) {
  const length = Math.max(18, averageLength ?? 28);
  const progress = Math.max(0, Math.min(1, ((currentDay ?? 1) - 1) / Math.max(1, length - 1)));
  const pointX = 16 + progress * 288;
  return <div className="cycle-trend-chart">
    <svg viewBox="0 0 320 112" role="img" aria-label={`Календарный тренд цикла. Выбран ${currentDay ?? 1}-й день из ориентировочных ${length}.`}>
      <defs><linearGradient id="homeTrendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e58acf" stopOpacity=".2"/><stop offset="1" stopColor="#e58acf" stopOpacity="0"/></linearGradient></defs>
      <path d="M16 82 C52 78 76 66 104 59 C137 50 158 29 188 35 C220 41 242 58 304 45 L304 98 L16 98Z" fill="url(#homeTrendFill)" />
      <path d="M16 82 C52 78 76 66 104 59 C137 50 158 29 188 35" fill="none" stroke="#d84d91" strokeWidth="3" strokeLinecap="round" />
      <path d="M188 35 C220 41 242 58 304 45" fill="none" stroke="#d84d91" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 7" opacity=".45" />
      <line x1={pointX} x2={pointX} y1="20" y2="95" stroke="#756775" strokeDasharray="3 5" />
      <circle cx={pointX} cy={progress < .62 ? 82 - progress * 76 : 35 + (progress - .62) * 28} r="7" fill="#fff" stroke="#d84d91" strokeWidth="3" />
      <text x="16" y="109">1</text><text x="154" y="109">14</text><text x="292" y="109">{length}</text>
    </svg>
    <span><i />Факт</span><span><i className="forecast" />Календарный ориентир</span>
  </div>;
}

export function CycleHeroCard({ cycle, onCycle }: Pick<HomePageProps, 'cycle' | 'onCycle'>) {
  return <Card asButton className="cycle-hero-card" onClick={onCycle} ariaLabel="Открыть календарь и детали цикла">
    <div className="cycle-hero-top"><div className="cycle-day"><strong>{cycle.currentDay ?? '—'}</strong><span>день цикла</span></div><div className="cycle-hero-copy"><Tag>{cycle.confidenceLabel}</Tag><small>{cycle.phaseLabel}</small><h1>{cycle.energyLabel}</h1><p>{cycle.energyDescription}</p></div><Info className="cycle-info" /></div>
    <div className="cycle-range"><ShieldCheck /><span><small>Ближайший прогноз</small><strong>{cycle.predictedPeriodRange}</strong></span><ChevronRight /></div>
    <CycleTrendChart currentDay={cycle.currentDay} averageLength={cycle.averageLength} />
  </Card>;
}

function MetricValue({ value, label }: { value: string; label: string }) {
  return <div className="metric-value"><strong>{value}</strong><small>{label}</small></div>;
}

export function SymptomsCard({ metrics, onSymptoms }: Pick<HomePageProps, 'metrics' | 'onSymptoms'>) {
  const lightCount = metrics.symptoms.filter((item) => item.severity <= 1).length;
  return <Card asButton className="metric-bento symptoms-card" onClick={onSymptoms} ariaLabel="Отметить симптомы"><header><IconBadge><HeartPulse /></IconBadge><span>Симптомы</span><ChevronRight /></header><MetricValue value={metrics.symptoms.length ? `${metrics.symptoms.length} ${lightCount === metrics.symptoms.length ? 'лёгких' : ''}` : 'Не отмечены'} label={metrics.symptoms.length ? 'Сохранено сегодня' : 'Как вы себя чувствуете?'} /><div className="metric-tags">{metrics.symptoms.slice(0, 2).map((item) => <Tag key={item.id}>{item.label}</Tag>)}</div></Card>;
}

export function SleepCard({ metrics, onSleep }: Pick<HomePageProps, 'metrics' | 'onSleep'>) {
  return <Card asButton className="metric-bento sleep-card" onClick={onSleep} ariaLabel="Открыть дневник сна"><header><IconBadge tone="violet"><Moon /></IconBadge><span>Сон</span><ChevronRight /></header><MetricValue value={metrics.sleepHours ? `${Math.floor(metrics.sleepHours)} ч ${Math.round(metrics.sleepHours % 1 * 60)} м` : 'Не отмечен'} label={metrics.sleepQuality ? `Качество: ${metrics.sleepQuality}` : 'Добавить прошлую ночь'} /><div className="sleep-bars" aria-label="Сон за семь последних дней">{metrics.sleepWeek.map((value, index) => <i key={index} style={{ height: `${Math.max(14, value / 9 * 100)}%` }} />)}</div></Card>;
}

export function HydrationActivityCard({ metrics, onIncreaseWater }: Pick<HomePageProps, 'metrics' | 'onIncreaseWater'>) {
  const glasses = Math.min(8, Math.round(metrics.water / 250));
  return <Card className="metric-bento hydration-card"><div className="split-metric"><header><IconBadge tone="cyan"><Droplet /></IconBadge><span>Вода</span><button onClick={onIncreaseWater} disabled={glasses >= 8} aria-label="Добавить стакан воды"><Plus /></button></header><MetricValue value={`${glasses} из 8`} label="стаканов" /><div className="water-glasses" aria-label={`${glasses} из 8 стаканов`}>{Array.from({ length: 8 }, (_, index) => <i key={index} className={index < glasses ? 'filled' : ''} />)}</div></div><div className="split-metric steps"><header><IconBadge tone="sage"><Footprints /></IconBadge><span>Шаги</span></header><MetricValue value={metrics.steps.toLocaleString('ru-RU')} label="цель 10 000" /><ProgressBar value={metrics.steps / 10000 * 100} label={`${metrics.steps} из 10000 шагов`} /></div></Card>;
}

export function CycloscopeCard({ state, onCycloscope }: { state: CycloscopeState; onCycloscope: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return <Card asButton className={`metric-bento cycloscope-bento ${expanded ? 'expanded' : ''}`} onClick={() => { setExpanded((value) => !value); onCycloscope(); }} ariaLabel={expanded ? 'Свернуть Циклоскоп' : 'Открыть Циклоскоп'}><header><IconBadge tone="violet"><Orbit /></IconBadge><span>Циклоскоп</span><Tag>Для настроения</Tag></header><div className="cycloscope-orbit" aria-hidden="true"><i /><b /></div><small>Фокус дня</small><h3>{state.archetype}</h3><p>{expanded ? 'Небольшая прогулка или смена привычного маршрута могут добавить дню лёгкости. Это игровой образ, а не рекомендация о здоровье.' : state.description}</p></Card>;
}

export function MetricBentoGrid({ children }: { children: ReactNode }) {
  return <section className="home-bento-grid" aria-label="Показатели дня">{children}</section>;
}

export function DailyInsightCard({ insight }: { insight: { title: string; text: string } }) {
  return <Card className="daily-insight-card"><IconBadge tone="amber"><Sparkles /></IconBadge><div><small>Инсайт дня</small><h2>{insight.title}</h2><p>{insight.text}</p></div><span className="insight-line-art" aria-hidden="true">⌁</span></Card>;
}

export function HormonoscopeCard({ state, onHormonoscope }: { state: HormonoscopeState; onHormonoscope: () => void }) {
  const progress = state.completedSimilarDays / state.requiredSimilarDays * 100;
  return <Card className="home-hormonoscope"><SectionHeader title="Hormonoscope" action={<Tag>По похожим дням</Tag>} />{state.status === 'learning' ? <div className="hormono-learning"><IconBadge><Zap /></IconBadge><div><h3>Пока изучаем ваш ритм</h3><p>Нужно хотя бы {state.requiredSimilarDays} похожих дня с отметками энергии или самочувствия.</p><strong>{state.completedSimilarDays} из {state.requiredSimilarDays} похожих дней</strong><ProgressBar value={progress} label={`${state.completedSimilarDays} из ${state.requiredSimilarDays} похожих дней`} /></div></div> : <div className="hormono-ready">{state.observations.slice(0, 3).map((item) => <article key={item.title}><small>{item.title}</small><p>{item.text}</p></article>)}</div>}<button className="home-secondary-button" onClick={onHormonoscope}>{state.status === 'learning' ? 'Отметить самочувствие' : 'Посмотреть наблюдения'}<ArrowRight /></button></Card>;
}

export function HelpfulActionsCard({ onHelpfulAction }: Pick<HomePageProps, 'onHelpfulAction'>) {
  return <Card className="helpful-actions"><SectionHeader title="Что может пригодиться" /><div>{([['kit','Аптечка',BookOpenText],['workout','Активность',Zap],['support','Поддержка',HeartPulse]] as const).map(([id, label, Icon]) => <button key={id} onClick={() => onHelpfulAction(id)}><IconBadge tone={id === 'kit' ? 'rose' : id === 'workout' ? 'sage' : 'amber'}><Icon /></IconBadge><span>{label}</span><ChevronRight /></button>)}</div></Card>;
}

export function HomePage(props: HomePageProps) {
  return <div className="mira-home-page">
    <HomeHeader currentDate={props.currentDate} onProfile={props.onProfile} onCalendar={props.onCalendar} />
    <WeekStrip dates={props.dates} onSelectDate={props.onSelectDate} />
    <CycleHeroCard cycle={props.cycle} onCycle={props.onCycle} />
    <MetricBentoGrid>
      <SymptomsCard metrics={props.metrics} onSymptoms={props.onSymptoms} />
      <SleepCard metrics={props.metrics} onSleep={props.onSleep} />
      <HydrationActivityCard metrics={props.metrics} onIncreaseWater={props.onIncreaseWater} />
      {props.cycloscope && <CycloscopeCard state={props.cycloscope} onCycloscope={props.onCycloscope} />}
    </MetricBentoGrid>
    {props.insight && <DailyInsightCard insight={props.insight} />}
    {props.hormonoscope && <HormonoscopeCard state={props.hormonoscope} onHormonoscope={props.onHormonoscope} />}
    <button className="period-quick-action" onClick={props.onPeriod}><Droplet />Отметить кровотечение<ChevronRight /></button>
    <HelpfulActionsCard onHelpfulAction={props.onHelpfulAction} />
  </div>;
}
