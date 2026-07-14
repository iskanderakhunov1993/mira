import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Droplets,
  HeartPulse,
  Home,
  LockKeyhole,
  MoonStar,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Waves,
  NotebookPen,
  Gauge,
  UserRound,
  CalendarRange,
  LayoutDashboard,
  NotebookTabs,
  ChartSpline,
  LibraryBig,
} from "lucide-react";
import "./concepts.css";

type ConceptId =
  | "observatory"
  | "clinical"
  | "journal"
  | "health"
  | "bento"
  | "brutal"
  | "ambient"
  | "flo-soft"
  | "flo-aura";
type ScreenId = "today" | "diary" | "analytics" | "knowledge";

const concepts: Array<{
  id: ConceptId;
  name: string;
  tagline: string;
  palette: string[];
}> = [
  {
    id: "observatory",
    name: "Luna Observatory",
    tagline: "Спокойная персональная обсерватория",
    palette: ["#6D568B", "#D96C87", "#4E9A86"],
  },
  {
    id: "clinical",
    name: "Soft Clinical",
    tagline: "Чётко, доказательно, без тревоги",
    palette: ["#176B72", "#D9F0ED", "#F1B85B"],
  },
  {
    id: "journal",
    name: "Lunar Journal",
    tagline: "Тёплый эмоциональный дневник",
    palette: ["#332548", "#A9789E", "#E7B7A0"],
  },
  {
    id: "health",
    name: "Health Metrics",
    tagline: "Кольца, тренды и данные с первого взгляда",
    palette: ["#425B76", "#62A7A0", "#A78BC2"],
  },
  {
    id: "bento",
    name: "Bento Flow",
    tagline: "Асимметричная сетка и мягкий цвет",
    palette: ["#5E53D6", "#F4B8C6", "#A7DCCB"],
  },
  {
    id: "brutal",
    name: "Neo Brutal",
    tagline: "Смело, контрастно и без украшательства",
    palette: ["#FF5C8A", "#FFE66D", "#151515"],
  },
  {
    id: "ambient",
    name: "Ambient Nature",
    tagline: "Органические формы и природный ритм",
    palette: ["#386A5C", "#B9D5C5", "#E6C8A7"],
  },
  {
    id: "flo-soft",
    name: "Flow Infinity",
    tagline: "Мягкий цикл, крупный фокус и воздушные модули",
    palette: ["#7A67D8", "#F08DAA", "#C9BFF5"],
  },
  {
    id: "flo-aura",
    name: "Aura Infinity",
    tagline: "Тёплая персональная лента с глубоким фиолетовым",
    palette: ["#49366C", "#F49AAF", "#F4D7DE"],
  },
];

const screens: Array<{ id: ScreenId; label: string; icon: typeof Home }> = [
  { id: "today", label: "Сегодня", icon: Home },
  { id: "diary", label: "Дневник", icon: Activity },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "knowledge", label: "Знания", icon: BookOpen },
];

const healthScreens: Array<{ id: ScreenId; label: string; icon: typeof Home }> =
  [
    { id: "today", label: "Сводка", icon: LayoutDashboard },
    { id: "diary", label: "Записи", icon: NotebookTabs },
    { id: "analytics", label: "Тренды", icon: ChartSpline },
    { id: "knowledge", label: "Обзор", icon: LibraryBig },
  ];

function DesignLab() {
  const floCollection =
    window.location.pathname.includes("flo-concepts") ||
    new URLSearchParams(window.location.search).get("collection") === "flo";
  const visibleConcepts = floCollection
    ? concepts.filter(
        (item) => item.id === "flo-soft" || item.id === "flo-aura",
      )
    : concepts;
  const [concept, setConcept] = useState<ConceptId>(
    floCollection ? "flo-soft" : "observatory",
  );
  const [screen, setScreen] = useState<ScreenId>("today");
  const current = concepts.find((item) => item.id === concept)!;

  return (
    <main className="lab-shell">
      <aside className="lab-sidebar">
        <div className="lab-brand">
          <span className="brand-orbit">
            {floCollection ? <InfinityMark /> : <MoonStar />}
          </span>
          <div>
            <small>Mira</small>
            <strong>Design Lab</strong>
          </div>
        </div>
        <div className="lab-intro">
          <p>
            {floCollection
              ? "Два Flo-inspired направления"
              : "Девять направлений одного продукта"}
          </p>
          <h1>Выберите характер новой Mira</h1>
          <span>
            Все варианты используют одинаковые данные и пользовательские задачи.
          </span>
        </div>
        <div className="concept-list">
          {visibleConcepts.map((item, index) => (
            <button
              key={item.id}
              className={`concept-option ${concept === item.id ? "active" : ""}`}
              onClick={() => setConcept(item.id)}
            >
              <span className="concept-number">0{index + 1}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.tagline}</small>
                <i>
                  {item.palette.map((color) => (
                    <b key={color} style={{ background: color }} />
                  ))}
                </i>
              </span>
              <ChevronRight />
            </button>
          ))}
        </div>
        <div className="lab-note">
          <ShieldCheck />
          <span>
            <strong>
              {floCollection
                ? "Один ритм, две атмосферы"
                : "Один продукт, девять характеров"}
            </strong>
            <small>Прогнозы остаются осторожными, а данные — локальными.</small>
          </span>
        </div>
      </aside>

      <section className="preview-stage">
        <header className="preview-header">
          <div>
            <span>Концепция</span>
            <h2>{current.name}</h2>
            <p>{current.tagline}</p>
          </div>
          <div className="screen-switcher">
            {screens.map((item) => (
              <button
                key={item.id}
                className={screen === item.id ? "active" : ""}
                onClick={() => setScreen(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <div className={`phone-frame theme-${concept}`}>
          <div className="phone-status">
            <span>9:41</span>
            <span>● ● ◒</span>
          </div>
          <div className="phone-content">
            {screen === "today" && <TodayScreen concept={concept} />}
            {screen === "diary" && <DiaryScreen concept={concept} />}
            {screen === "analytics" && <AnalyticsScreen concept={concept} />}
            {screen === "knowledge" && <KnowledgeScreen concept={concept} />}
          </div>
          <nav className="phone-nav">
            {(concept === "health" ? healthScreens : screens).map(
              ({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={screen === id ? "active" : ""}
                  onClick={() => setScreen(id)}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ),
            )}
          </nav>
        </div>
        <div className="stage-caption">
          <span className="caption-dot" />
          <p>
            <strong>Интерактивный прототип.</strong> Переключайте концепции и
            разделы — данные остаются одинаковыми, меняются иерархия, характер и
            визуальный язык.
          </p>
        </div>
      </section>
    </main>
  );
}

function AppHeader({
  eyebrow,
  title,
  concept,
}: {
  eyebrow: string;
  title: string;
  concept?: ConceptId;
}) {
  const infinityTheme = concept === "flo-soft" || concept === "flo-aura";
  const ProfileIcon = concept === "health" ? UserRound : CircleUserRound;
  const DateIcon = concept === "health" ? CalendarRange : CalendarDays;
  return (
    <header className="app-header">
      <button>{infinityTheme ? <InfinityMark /> : <ProfileIcon />}</button>
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <button>
        <DateIcon />
      </button>
    </header>
  );
}

function InfinityMark() {
  return (
    <svg className="infinity-mark" viewBox="0 0 64 40" aria-hidden="true">
      <path
        d="M8 20c0-8 5-13 12-13 10 0 15 13 24 22 3 3 6 4 9 4 5 0 8-4 8-10s-3-10-8-10c-7 0-12 8-17 15-5 7-10 12-17 12C9 40 3 32 3 22S9 4 19 4c9 0 15 8 21 16 5 7 9 13 14 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TodayScreen({ concept }: { concept: ConceptId }) {
  if (concept === "flo-soft" || concept === "flo-aura")
    return <FloInspiredToday concept={concept} />;
  return (
    <div className="screen-page today-page">
      <AppHeader eyebrow="Воскресенье" title="13 июля" concept={concept} />
      <div className="week-row">
        {[
          ["Ч", "10"],
          ["П", "11"],
          ["С", "12"],
          ["В", "13"],
          ["П", "14"],
          ["В", "15"],
          ["С", "16"],
        ].map(([day, date], i) => (
          <button
            key={date}
            className={i === 3 ? "active" : i === 2 ? "period" : ""}
          >
            <span>{day}</span>
            <strong>{date}</strong>
            <small>{i === 2 ? "●" : i === 3 ? "·" : ""}</small>
          </button>
        ))}
      </div>
      <section className="cycle-hero">
        <div className="hero-copy">
          <span className="status-pill">2-й день цикла</span>
          <p>
            {concept === "clinical"
              ? "Следующая менструация"
              : concept === "journal"
                ? "Твой цикл сегодня"
                : "До следующей менструации"}
          </p>
          <h2>
            {concept === "journal" ? "Время быть мягче к себе" : "27 дней"}
          </h2>
          <small>
            {concept === "journal"
              ? "Менструальная фаза · воскресенье"
              : "Окно прогноза: 7–11 августа"}
          </small>
        </div>
        <div className="cycle-visual">
          <span>02</span>
          <small>день</small>
        </div>
      </section>
      <ConceptSignature concept={concept} />
      <div className="quick-row">
        <button>
          {concept === "health" ? <Waves /> : <Droplets />}
          <span>Месячные</span>
        </button>
        <button className="primary">
          {concept === "health" ? <NotebookPen /> : <Plus />}
          <span>Добавить</span>
        </button>
        <button>
          {concept === "health" ? <Gauge /> : <HeartPulse />}
          <span>Состояние</span>
        </button>
      </div>
      <section className="daily-card">
        <div className="section-heading">
          <div>
            <span>{concept === "journal" ? "Запись дня" : "Сегодня"}</span>
            <h3>Как ты себя чувствуешь?</h3>
          </div>
          <Sparkles />
        </div>
        <div className="mood-row">
          <button>
            ☺<span>Хорошо</span>
          </button>
          <button className="active">
            ◡<span>Обычно</span>
          </button>
          <button>
            ☹<span>Тяжело</span>
          </button>
        </div>
      </section>
      <section className="insight-card">
        <div>
          <span className="mini-icon">
            <MoonStar />
          </span>
          <div>
            <small>
              {concept === "clinical" ? "Календарный ориентир" : "Гормоноскоп"}
            </small>
            <strong>Менструальная фаза</strong>
            <p>Эстроген и прогестерон обычно находятся на низком уровне.</p>
          </div>
        </div>
        <button>
          <ArrowRight />
        </button>
      </section>
    </div>
  );
}

function FloInspiredToday({ concept }: { concept: "flo-soft" | "flo-aura" }) {
  return (
    <div className="screen-page flo-today">
      <AppHeader eyebrow="Сегодня" title="13 июля" concept={concept} />
      <div className="flo-week">
        {[
          ["Ч", "10"],
          ["П", "11"],
          ["С", "12"],
          ["В", "13"],
          ["П", "14"],
          ["В", "15"],
          ["С", "16"],
        ].map(([day, date], index) => (
          <button
            key={date}
            className={index === 3 ? "active" : index === 2 ? "period" : ""}
          >
            <span>{day}</span>
            <strong>{date}</strong>
            <small>{index === 2 ? "●" : ""}</small>
          </button>
        ))}
      </div>
      <section className="flo-cycle-focus">
        <div className="flo-cycle-ring">
          <div>
            <small>Месячные через</small>
            <strong>27</strong>
            <span>дней</span>
            <p>2-й день цикла</p>
          </div>
        </div>
        <p className="flo-range">Прогноз: 7–11 августа · предварительно</p>
        <button className="flo-log">
          <Droplets />
          Отметить месячные
        </button>
      </section>
      <section className="flo-daily">
        <div className="flo-section-title">
          <div>
            <small>Мои ежедневные инсайты</small>
            <h2>Для тебя сегодня</h2>
          </div>
          <button>
            Все <ArrowRight />
          </button>
        </div>
        <div className="flo-insight-scroll">
          <article>
            <span className="flo-card-icon">
              <HeartPulse />
            </span>
            <small>САМОЧУВСТВИЕ</small>
            <strong>Как ты себя чувствуешь?</strong>
            <p>Добавь короткую отметку за несколько секунд.</p>
          </article>
          <article>
            <span className="flo-card-icon">
              <MoonStar />
            </span>
            <small>2-Й ДЕНЬ</small>
            <strong>Что происходит с телом</strong>
            <p>Спокойное объяснение без диагнозов.</p>
          </article>
          <article>
            <span className="flo-card-icon">
              <Sparkles />
            </span>
            <small>ГОРМОНОСКОП</small>
            <strong>Менструальная фаза</strong>
            <p>Календарный ориентир, не анализ.</p>
          </article>
        </div>
      </section>
      <section className="flo-mini-stats">
        <button>
          <span>Сон</span>
          <strong>7 ч 20 мин</strong>
          <ChevronRight />
        </button>
        <button>
          <span>Энергия</span>
          <strong>Не отмечено</strong>
          <ChevronRight />
        </button>
      </section>
    </div>
  );
}

function ConceptSignature({ concept }: { concept: ConceptId }) {
  if (concept === "flo-soft")
    return (
      <section className="flo-modules">
        <div className="flo-wide">
          <small>Мой день</small>
          <strong>Сегодня можно быть мягче к себе</strong>
          <span>Менструальная фаза · 2-й день</span>
        </div>
        <div>
          <Sparkles />
          <small>Инсайт</small>
          <strong>Сон и энергия</strong>
        </div>
        <div>
          <HeartPulse />
          <small>Отметить</small>
          <strong>Самочувствие</strong>
        </div>
      </section>
    );
  if (concept === "flo-aura")
    return (
      <section className="aura-module">
        <div className="aura-infinity">
          <InfinityMark />
        </div>
        <div>
          <small>Твоя лента сегодня</small>
          <strong>Что важно знать на 2-й день</strong>
          <p>Короткий персональный материал и одна полезная отметка.</p>
        </div>
        <ArrowRight />
      </section>
    );
  if (concept === "health")
    return (
      <section className="health-summary">
        <div className="health-rings">
          <i>
            <b />
          </i>
          <i>
            <b />
          </i>
          <i>
            <b />
          </i>
          <span>
            72<small>%</small>
          </span>
        </div>
        <div>
          <small>Сводка здоровья</small>
          <strong>3 показателя сегодня</strong>
          <p>Цикл стабилен · сон 7 ч 20 мин</p>
          <div className="sparkline">
            {[26, 42, 31, 58, 49, 72, 64].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </section>
    );
  if (concept === "bento")
    return (
      <section className="bento-signature">
        <div>
          <small>Энергия</small>
          <strong>4/5</strong>
          <SunMedium />
        </div>
        <div>
          <small>Сон</small>
          <strong>7:20</strong>
          <MoonStar />
        </div>
        <div className="wide">
          <small>Мягкий фокус</small>
          <strong>Беречь темп</strong>
          <span>Сегодня достаточно одного важного дела.</span>
        </div>
      </section>
    );
  if (concept === "brutal")
    return (
      <section className="brutal-signature">
        <span>СЕГОДНЯ</span>
        <strong>
          ТЕЛО ГОВОРИТ:
          <br />
          НЕ СПЕШИ.
        </strong>
        <button>ЗАПИСАТЬ →</button>
      </section>
    );
  if (concept === "ambient")
    return (
      <section className="ambient-signature">
        <div className="leaf-orbit">
          <i />
          <i />
          <i />
        </div>
        <div>
          <small>Ритм дня</small>
          <strong>Тихое восстановление</strong>
          <p>Оставьте немного пространства между делами.</p>
        </div>
      </section>
    );
  return null;
}

function DiaryScreen({ concept }: { concept: ConceptId }) {
  const modules = [
    {
      icon: Droplets,
      title: "Цикл и боль",
      text: "Месячные · умеренно",
      done: true,
    },
    {
      icon: HeartPulse,
      title: "Самочувствие",
      text: "Обычный день",
      done: true,
    },
    {
      icon: MoonStar,
      title: "Сон и энергия",
      text: "Добавить данные",
      done: false,
    },
    { icon: LockKeyhole, title: "Личное", text: "Только для вас", done: false },
  ];
  return (
    <div className="screen-page diary-page">
      <AppHeader eyebrow="Дневник" title="13 июля" concept={concept} />
      <section className="diary-summary">
        <div>
          <span>Сегодня отмечено</span>
          <h2>
            {concept === "journal"
              ? "Два маленьких наблюдения"
              : "2 из 4 разделов"}
          </h2>
          <p>Можно остановиться здесь или добавить то, что важно.</p>
        </div>
        <span className="progress-ring">
          50<small>%</small>
        </span>
      </section>
      <div className="module-grid">
        {modules.map(({ icon: Icon, title, text, done }) => (
          <button key={title} className={done ? "done" : ""}>
            <span className="module-icon">
              <Icon />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            {done ? (
              <Check className="check" />
            ) : (
              <ChevronRight className="arrow" />
            )}
          </button>
        ))}
      </div>
      <section className="note-card">
        <span>Заметка дня</span>
        <textarea
          placeholder={
            concept === "journal"
              ? "Что хочется запомнить об этом дне?"
              : "Добавить короткую заметку…"
          }
        />
        <button>Сохранить запись</button>
      </section>
    </div>
  );
}

function AnalyticsScreen({ concept }: { concept: ConceptId }) {
  return (
    <div className="screen-page analytics-page">
      <AppHeader
        eyebrow="Последние 3 цикла"
        title="Аналитика"
        concept={concept}
      />
      <section className="evidence-card">
        <span>
          <ShieldCheck />
          Данных достаточно для сравнения
        </span>
        <h2>
          {concept === "journal"
            ? "Твой ритм становится яснее"
            : "Цикл остаётся в личном диапазоне"}
        </h2>
        <p>
          Последние циклы длились 27–30 дней. Это наблюдение, а не медицинское
          заключение.
        </p>
      </section>
      <div className="metric-row">
        <div>
          <small>Средний цикл</small>
          <strong>28</strong>
          <span>дней</span>
        </div>
        <div>
          <small>Диапазон</small>
          <strong>27–30</strong>
          <span>дней</span>
        </div>
        <div>
          <small>Месячные</small>
          <strong>5</strong>
          <span>дней</span>
        </div>
      </div>
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <span>Динамика</span>
            <h3>Длина цикла</h3>
          </div>
          <button>6 месяцев</button>
        </div>
        <div className="chart">
          <i style={{ height: "54%" }}>
            <b>28</b>
          </i>
          <i style={{ height: "70%" }}>
            <b>30</b>
          </i>
          <i style={{ height: "48%" }}>
            <b>27</b>
          </i>
          <i style={{ height: "58%" }}>
            <b>28</b>
          </i>
          <i style={{ height: "64%" }}>
            <b>29</b>
          </i>
        </div>
        <div className="chart-axis">
          <span>Фев</span>
          <span>Мар</span>
          <span>Апр</span>
          <span>Май</span>
          <span>Июн</span>
        </div>
      </section>
      <button className="report-button">
        <BookOpen />
        Подготовить отчёт для врача
        <ChevronRight />
      </button>
    </div>
  );
}

function KnowledgeScreen({ concept }: { concept: ConceptId }) {
  const articles = [
    ["Цикл", "Как считать день цикла", "3 мин"],
    ["Симптомы", "Когда боль требует внимания", "4 мин"],
    ["Самочувствие", "Сон перед месячными", "3 мин"],
  ];
  return (
    <div className="screen-page knowledge-page">
      <AppHeader
        eyebrow="Понятно о здоровье"
        title="Знания"
        concept={concept}
      />
      <label className="search-field">
        <Search />
        <input placeholder="Найти тему" />
      </label>
      <section className="featured-article">
        <span>Для вас сегодня</span>
        <h2>
          {concept === "journal"
            ? "Как услышать свой ритм"
            : "Как понять, что месячные обильные"}
        </h2>
        <p>
          Простое объяснение, жизненный пример и признаки, при которых стоит
          обратиться за помощью.
        </p>
        <div>
          <small>
            <ShieldCheck />
            Медицинские источники
          </small>
          <button>
            Читать <ArrowRight />
          </button>
        </div>
      </section>
      <div className="category-row">
        <button className="active">Все</button>
        <button>Цикл</button>
        <button>Симптомы</button>
        <button>Забота</button>
      </div>
      <div className="article-list">
        {articles.map(([category, title, time]) => (
          <button key={title}>
            <span className="article-symbol">
              {category === "Цикл" ? "○" : category === "Симптомы" ? "✦" : "☾"}
            </span>
            <span>
              <small>
                {category} · {time}
              </small>
              <strong>{title}</strong>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </div>
  );
}

const designWindow = window as typeof window & { __lunaDesignRoot?: Root };
const designRoot =
  designWindow.__lunaDesignRoot ??
  createRoot(document.getElementById("concept-root")!);
designWindow.__lunaDesignRoot = designRoot;
designRoot.render(
  <StrictMode>
    <DesignLab />
  </StrictMode>,
);
