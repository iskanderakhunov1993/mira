"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RelatedArticle = {
  title: string;
  id: string;
};

type Article = {
  id: string;
  title: string;
  emoji: string;
  readTime: number;
  content: {
    intro: string;
    short: string;
    why: string;
    help: string[];
    warning: string;
  };
  related: RelatedArticle[];
};

type ArticlePageProps = {
  articleId?: string;
  onBack?: () => void;
  onOpenArticle?: (id: string) => void;
};

const articles: Article[] = [
  {
    id: "spasms",
    title: "Как быстро снять спазмы",
    emoji: "🔥",
    readTime: 2,
    content: {
      intro: "У тебя сегодня спазмы? Это неприятно, но есть способы быстро облегчить состояние.",
      short: "Тепло, магний, растяжка, тёплый чай и обезболивающее помогут снять спазмы.",
      why: "Спазмы возникают, когда мышцы матки сокращаются, чтобы отторгнуть слизистую. Это нормально, но может быть болезненно.",
      help: [
        "Грелка на живот (15–20 минут) — расслабляет мышцы",
        "Магний + В6 — снижает мышечные спазмы, прими 300 мг вечером",
        "Лёгкая растяжка — поза ребёнка или кошка-корова",
        "Тёплый чай (ромашка или мята) — снимает воспаление",
        "Ибупрофен — если боль сильная, по инструкции",
      ],
      warning: "Если боль не проходит через 2 часа, если боль 5/5, если есть температура или рвота — обратись к врачу без записи.",
    },
    related: [
      { title: "Почему болит живот перед месячными", id: "period-pain" },
      { title: "Что такое эндометриоз и когда идти к врачу", id: "endometriosis" },
    ],
  },
  {
    id: "acne",
    title: "Почему перед месячными выскакивают прыщи",
    emoji: "🧴",
    readTime: 2,
    content: {
      intro: "За 3–5 дней до месячных у многих девушек появляются прыщи. Это не грязь и не неправильный уход — это гормоны.",
      short: "В лютеиновой фазе падает эстроген, растёт прогестерон → кожа становится жирнее → появляются прыщи.",
      why: "В лютеиновой фазе (после овуляции) падает уровень эстрогена и растёт прогестерон. Это увеличивает выработку кожного сала и закупоривает поры.",
      help: [
        "Цинк (15 мг в день) — снижает воспаление, утром с едой",
        "Магний + В6 — снижает стресс, который тоже влияет на кожу, вечером с водой",
        "Не дави прыщи — будет хуже",
        "Используй лёгкий увлажняющий крем",
        "Пей 2 л воды в день — помогает выводить токсины",
      ],
      warning: "Если прыщи не проходят после месячных, появились болезненные кисты или акне сильно влияет на твою жизнь — обратись к дерматологу.",
    },
    related: [
      { title: "Цинк и ПМС: как он помогает при акне", id: "zinc" },
      { title: "ПМС: 7 симптомов и как с ними жить", id: "pms" },
    ],
  },
  {
    id: "delay",
    title: "Задержка: спокойный гайд без паники",
    emoji: "🧘",
    readTime: 2,
    content: {
      intro: "Задержка — это страшно, но часто это нормальная реакция организма на стресс, перелёты или болезнь.",
      short: "Задержка до 7 дней часто бывает вариантом нормы. Если больше — сделай тест и покажи врачу.",
      why: "Цикл может сдвигаться из-за стресса, недосыпа, перелётов, болезни, резкой смены веса или гормональных изменений.",
      help: [
        "Сделай тест на беременность, если есть риск",
        "Если тест отрицательный — продолжай наблюдать",
        "Если задержка больше 14 дней — покажи этот отчёт гинекологу",
        "Если есть боль, слабость, кровотечение — обратись к врачу без записи",
      ],
      warning: "Если задержка больше 14 дней, есть сильная боль, кровотечение или слабость — обратись к врачу без записи.",
    },
    related: [
      { title: "5 признаков, что пора к гинекологу", id: "doctor-signs" },
      { title: "Стресс и цикл: как они связаны", id: "stress" },
    ],
  },
  {
    id: "cycle-basics",
    title: "Что такое цикл? Простыми словами",
    emoji: "🌸",
    readTime: 2,
    content: {
      intro: "Менструальный цикл — это не только месячные. Это полный цикл изменений в твоём теле, который длится в среднем 28 дней.",
      short: "Цикл — это подготовка тела к возможной беременности. Если она не наступает — начинаются месячные.",
      why: "Каждый месяц организм готовится к беременности: созревает яйцеклетка, растёт эндометрий. Если беременность не наступает, эндометрий отторгается — это месячные.",
      help: [
        "Отмечай первый день месячных — это начало нового цикла",
        "Наблюдай за своим телом: боль, настроение, энергия — всё часть цикла",
        "Веди дневник хотя бы 3 месяца, чтобы увидеть свои повторы",
        "Не сравнивай себя с другими — каждый цикл уникален",
      ],
      warning: "Если цикл нестабилен, есть очень сильная боль или кровотечение — покажи это врачу.",
    },
    related: [
      { title: "Фазы цикла: что происходит в каждый день", id: "cycle-phases" },
      { title: "ПМС: 7 симптомов и как с ними жить", id: "pms" },
    ],
  },
];

function getSavedKey(id: string) {
  return `mira-saved-article-${id}`;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`rounded-2xl border-0 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${className}`}>
      {children}
    </Card>
  );
}

function ArticlePageComponent({ articleId = "spasms", onBack, onOpenArticle }: ArticlePageProps) {
  const article = useMemo(() => articles.find((item) => item.id === articleId), [articleId]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!article) return;
    setSaved(window.localStorage.getItem(getSavedKey(article.id)) === "true");
  }, [article]);

  function goBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  }

  function openArticle(id: string) {
    if (onOpenArticle) {
      onOpenArticle(id);
      return;
    }
    window.location.href = `/article/${id}`;
  }

  function toggleSaved() {
    if (!article) return;
    const next = !saved;
    setSaved(next);
    window.localStorage.setItem(getSavedKey(article.id), String(next));
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] px-4 py-6 text-[#1A1A1A]">
        <div className="mx-auto max-w-3xl">
          <SectionCard>
            <h1 className="text-2xl font-black">Статья не найдена</h1>
            <p className="mt-2 text-sm font-semibold text-[#8E8E93]">Возможно, ссылка устарела или статья ещё не добавлена.</p>
            <Button type="button" className="mt-5 rounded-2xl bg-[#E872A0] text-white" onClick={goBack}>
              ← Назад
            </Button>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-6 text-[#1A1A1A] sm:px-5">
      <div className="mx-auto max-w-3xl" style={{ animation: "articleIn 420ms ease both" }}>
        <style jsx global>{`
          @keyframes articleIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <header className="flex items-start justify-between gap-4">
          <button type="button" className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]" onClick={goBack}>
            ← Назад
          </button>
          <div className="min-w-0 flex-1 text-right">
            <h1 className="text-2xl font-black leading-tight text-[#1A1A1A]">📖 {article.title}</h1>
            <p className="mt-2 text-sm font-bold text-[#8E8E93]">⏱️ {article.readTime} минуты чтения</p>
          </div>
        </header>

        <article className="mt-6 space-y-6">
          <SectionCard>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0F5] text-3xl">
              {article.emoji}
            </div>
            <p className="text-lg font-semibold leading-relaxed text-[#1A1A1A]">{article.content.intro}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#E872A0]">📌 Коротко</h2>
            <p className="mt-3 text-base font-semibold leading-relaxed text-[#1A1A1A]">{article.content.short}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">❓ Почему это происходит?</h2>
            <p className="mt-3 text-base font-semibold leading-relaxed text-[#1A1A1A]">{article.content.why}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#34C759]">💡 Что помогает?</h2>
            <ol className="mt-4 space-y-3">
              {article.content.help.map((item, index) => (
                <li key={item} className="rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold leading-relaxed text-[#1A1A1A]">
                  {index + 1}. {item}
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard className="border border-[#FFD2D2] bg-[#FFF5F5]">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#FF6B6B]">⚠️ Когда нужен врач?</h2>
            <p className="mt-3 text-base font-bold leading-relaxed text-[#1A1A1A]">{article.content.warning}</p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">📖 Похожие статьи</h2>
            <div className="mt-4 space-y-3">
              {article.related.map((related) => (
                <div key={related.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3">
                  <p className="text-sm font-semibold leading-relaxed text-[#1A1A1A]">• {related.title}</p>
                  <button type="button" className="shrink-0 text-sm font-black text-[#E872A0]" onClick={() => openArticle(related.id)}>
                    Читать
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <Button
            type="button"
            variant={saved ? "default" : "outline"}
            className={`h-14 w-full rounded-2xl text-base font-black ${
              saved ? "bg-[#E872A0] text-white hover:bg-[#D95F8E]" : "border-[#E8DDE3] bg-white text-[#1A1A1A] hover:bg-[#FFF4F8]"
            }`}
            onClick={toggleSaved}
          >
            {saved ? "❤️ Сохранено" : "❤️ Сохранить статью"}
          </Button>
        </article>
      </div>
    </main>
  );
}

export const ArticlePage = memo(ArticlePageComponent);
ArticlePage.displayName = "ArticlePage";

export default ArticlePage;
