"use client";

import { memo, useMemo, useState } from "react";
import { ArrowRight, Bell, Bookmark, CalendarDays, FileText, HeartPulse, Newspaper, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMiraStore } from "@/store";

type ContentCategory = "today" | "cycle" | "care" | "doctor" | "news";

type ContentItem = {
  id: string;
  title: string;
  description: string;
  readTime: string;
  category: ContentCategory;
  articleId?: string;
  tag: string;
  accent: string;
};

const contentItems: ContentItem[] = [
  {
    id: "delay-guide",
    title: "Задержка без паники",
    description: "Что проверить сначала: тест, стресс, перелёты, болезнь и когда лучше к врачу.",
    readTime: "2 мин",
    category: "today",
    articleId: "delay",
    tag: "Сегодня",
    accent: "#E872A0",
  },
  {
    id: "spasms",
    title: "Как быстро снять спазмы",
    description: "Тепло, отдых, вода и когда боль уже не стоит терпеть.",
    readTime: "2 мин",
    category: "today",
    articleId: "spasms",
    tag: "Боль",
    accent: "#FF6B6B",
  },
  {
    id: "cycle-basics",
    title: "Цикл простыми словами",
    description: "Что считается первым днём цикла и почему фазы влияют на состояние.",
    readTime: "2 мин",
    category: "cycle",
    articleId: "cycle-basics",
    tag: "Цикл",
    accent: "#8A6EF6",
  },
  {
    id: "acne-cycle",
    title: "Кожа и цикл",
    description: "Почему акне может усиливаться перед месячными и что можно отметить в Заботе.",
    readTime: "2 мин",
    category: "care",
    articleId: "acne",
    tag: "Забота",
    accent: "#5BCDEB",
  },
  {
    id: "doctor-visit",
    title: "Как подготовиться к врачу",
    description: "Какие факты взять на приём: даты, боль, обильность, задержки, анализы.",
    readTime: "3 мин",
    category: "doctor",
    tag: "Отчёт",
    accent: "#34C759",
  },
  {
    id: "privacy-note",
    title: "Что важно знать о приватности",
    description: "Какие интимные данные скрыты по умолчанию и как выбирать, что попадёт в отчёт.",
    readTime: "2 мин",
    category: "doctor",
    tag: "Безопасность",
    accent: "#1A1A1A",
  },
  {
    id: "checkup45",
    title: "45+: что обсудить на чекапе",
    description: "Гормоны, цикл, симптомы и вопросы врачу без самоназначений.",
    readTime: "3 мин",
    category: "news",
    tag: "Чекап",
    accent: "#FFB800",
  },
  {
    id: "pwa-news",
    title: "Mira работает как PWA",
    description: "Данные остаются на устройстве, а приложение можно открыть с главного экрана.",
    readTime: "1 мин",
    category: "news",
    tag: "Новости",
    accent: "#7B61C9",
  },
];

const categories: Array<{ id: ContentCategory; label: string }> = [
  { id: "today", label: "Сегодня" },
  { id: "cycle", label: "Цикл" },
  { id: "care", label: "Забота" },
  { id: "doctor", label: "Врач" },
  { id: "news", label: "Новости" },
];

function getRecommendedCategory(daysUntilPeriod: number): ContentCategory {
  if (daysUntilPeriod < 0 || daysUntilPeriod <= 3) return "today";
  return "care";
}

function ContentPageComponent() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("today");
  const [query, setQuery] = useState("");
  const daysUntilPeriod = useMiraStore((state) => state.cycle.daysUntilPeriod);
  const logsCount = useMiraStore((state) => state.logs.dailyLogs.length);
  const recommendedCategory = getRecommendedCategory(daysUntilPeriod);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return contentItems.filter((item) => {
      const matchesCategory = item.category === activeCategory;
      const matchesQuery = !normalizedQuery || `${item.title} ${item.description} ${item.tag}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  function openItem(item: ContentItem) {
    if (item.articleId) {
      router.push(`/article/${item.articleId}`);
      return;
    }
    if (item.id === "doctor-visit" || item.id === "privacy-note") router.push("/report");
    else if (item.id === "checkup45") router.push("/profile#content");
  }

  return (
    <main className="mira-screen px-5 py-6 text-[#202033]">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E872A0]">Контент</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1A1A1A]">
              Понятные ответы <span className="text-[#E872A0]">под твой день</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-[#8E8E93]">
              Короткие статьи, новости и подсказки Mira: без диагнозов, сложных терминов и лишнего шума.
            </p>
          </div>
          <div className="mira-card hidden shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-[#202033] sm:flex">
            <Bell className="h-4 w-4 text-[#E872A0]" />
            Новое
          </div>
        </header>

        <Card className="mira-gradient-cycle mt-6 overflow-hidden rounded-[34px] border-0 p-6 text-white shadow-[0_28px_72px_rgba(232,114,160,0.22)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">Рекомендация Mira</p>
              <h2 className="mt-2 text-2xl font-black leading-tight">
                {daysUntilPeriod < 0 ? "Начни с гайда про задержку" : daysUntilPeriod <= 3 ? "Подготовься к ближайшим месячным" : "Сегодня лучше укрепить базу заботы"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/80">
                {logsCount < 3
                  ? "Пока данных мало, поэтому Mira предлагает базовые материалы: цикл, симптомы и что отмечать."
                  : "Mira подбирает темы по твоим отметкам, циклу и ближайшим действиям."}
              </p>
            </div>
            <Button
              type="button"
              className="rounded-2xl bg-white text-[#202033] hover:bg-white/90"
              onClick={() => setActiveCategory(recommendedCategory)}
            >
              Смотреть подборку <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="mira-card flex items-center gap-3 rounded-[24px] px-4 py-3">
            <Search className="h-5 w-5 text-[#8E8E93]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск: боль, задержка, кожа, врач"
              className="w-full bg-transparent text-sm font-semibold text-[#1A1A1A] outline-none placeholder:text-[#8E8E93]"
            />
          </label>
          <div className="mira-card flex gap-2 overflow-x-auto rounded-[24px] p-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${
                  activeCategory === category.id ? "bg-[#E872A0] text-white shadow-[0_10px_20px_rgba(232,114,160,0.22)]" : "text-[#8E8E93] hover:bg-white"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="mira-card group overflow-hidden rounded-[30px] border-0 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(76,66,126,0.14)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                    style={{ backgroundColor: item.accent }}
                  >
                    {item.category === "doctor" ? <FileText className="h-5 w-5" /> : item.category === "news" ? <Newspaper className="h-5 w-5" /> : item.category === "care" ? <HeartPulse className="h-5 w-5" /> : item.category === "cycle" ? <CalendarDays className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FAF8F5] px-3 py-1 text-[11px] font-black text-[#8E8E93]">{item.tag}</span>
                      <span className="text-[11px] font-bold text-[#8E8E93]">{item.readTime}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-black leading-tight text-[#1A1A1A]">{item.title}</h2>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8E8E93]">{item.description}</p>
                  </div>
                </div>
                <Bookmark className="h-5 w-5 shrink-0 text-[#D8CDD6] transition group-hover:text-[#E872A0]" />
              </div>
              <Button type="button" variant="outline" className="mt-5 w-full rounded-2xl bg-white" onClick={() => openItem(item)}>
                Открыть <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </section>

        {filteredItems.length === 0 && (
          <Card className="mira-card mt-6 rounded-[30px] border-0 p-6 text-center">
            <p className="text-xl font-black text-[#1A1A1A]">Ничего не найдено</p>
            <p className="mt-2 text-sm font-semibold text-[#8E8E93]">Попробуй поискать “боль”, “задержка” или “врач”.</p>
          </Card>
        )}
      </div>
    </main>
  );
}

export const ContentPage = memo(ContentPageComponent);
ContentPage.displayName = "ContentPage";

export default ContentPage;
