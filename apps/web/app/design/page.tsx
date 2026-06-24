"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, Sun, Heart, Droplets, Flame, Brain,
  BedDouble, Sparkles, Activity, ChevronRight,
  Calendar, ChartNoAxesCombined, Dumbbell, Salad,
  UserRound, BookOpen, Shield, Eye, EyeOff,
  Plus, Check, X, ArrowRight, Clock,
  TrendingUp, Zap, Apple, Utensils, Coffee,
  Infinity, Star, Bell, Lock, Download, Trash2,
  ChevronDown, Play, Minus, RotateCcw
} from "lucide-react";
import { useState } from "react";

/* ─── Reusable section wrapper ─── */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20">
      <h2 className="mb-6 text-2xl font-bold text-mira-text">{title}</h2>
      {children}
    </section>
  );
}

/* ─── Logo ─── */
function MiraLogo({ size = 48 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[22%] bg-gradient-to-br from-[#C9B8E8] via-[#B8A5D8] to-[#A08CC8] shadow-glow"
      style={{ width: size, height: size }}
    >
      <Infinity className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.5} />
    </div>
  );
}

/* ─── Cycle Wheel SVG ─── */
function CycleWheel({ size = 280 }: { size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r; // ~263.9
  const total = 28;
  const mensDays = 5;
  const follDays = 8;
  const ovulDays = 3;
  const lutealDays = 12;
  const today = 16;

  const mensLen = (mensDays / total) * c;
  const follLen = (follDays / total) * c;
  const ovulLen = (ovulDays / total) * c;
  const lutealLen = (lutealDays / total) * c;

  const mensOffset = c * 0.25;
  const follOffset = mensOffset - mensLen;
  const ovulOffset = follOffset - follLen;
  const lutealOffset = ovulOffset - ovulLen;

  const todayAngle = ((today - 1) / total) * 360 - 90;
  const todayRad = (todayAngle * Math.PI) / 180;
  const todayX = 50 + 42 * Math.cos(todayRad);
  const todayY = 50 + 42 * Math.sin(todayRad);

  // prediction dash
  const predStart = 24;
  const predDays = 5;
  const predLen = (predDays / total) * c;
  const predOffset = mensOffset - ((predStart - 1) / total) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-[0deg]">
        {/* bg ring */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EDE8F5" strokeWidth="7" />
        {/* menstruation */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E8A0B8" strokeWidth="7"
          strokeDasharray={`${mensLen} ${c - mensLen}`} strokeDashoffset={mensOffset} strokeLinecap="round" />
        {/* follicular */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#B8A5D8" strokeWidth="7"
          strokeDasharray={`${follLen} ${c - follLen}`} strokeDashoffset={follOffset} strokeLinecap="round" opacity="0.7" />
        {/* ovulation */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#D4A0C8" strokeWidth="7"
          strokeDasharray={`${ovulLen} ${c - ovulLen}`} strokeDashoffset={ovulOffset} strokeLinecap="round" opacity="0.7" />
        {/* luteal */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#D4CCE6" strokeWidth="7"
          strokeDasharray={`${lutealLen} ${c - lutealLen}`} strokeDashoffset={lutealOffset} strokeLinecap="round" opacity="0.5" />
        {/* prediction dashes */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E8A0B8" strokeWidth="7"
          strokeDasharray={`3 5`} strokeDashoffset={predOffset} strokeLinecap="round" opacity="0.4"
          pathLength={c} />
        {/* today dot */}
        <circle cx={todayX} cy={todayY} r="4.5" fill="#9B8EC4" stroke="white" strokeWidth="2.5" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-mira-text">16</span>
        <span className="mt-0.5 text-sm font-semibold text-mira-primary">Фолликулярная</span>
        <span className="mt-1 text-xs text-mira-muted">~5 дней до месячных</span>
      </div>
    </div>
  );
}

/* ─── Progress bar ─── */
function Progress({ value, color = "bg-mira-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-mira-lavender-light">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/* ─── Chip ─── */
function Chip({ label, active, color }: { label: string; active?: boolean; color?: string }) {
  const activeClass = color
    ? `border-transparent ${color}`
    : "border-mira-primary bg-mira-lavender-light text-mira-primary";
  return (
    <button className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
      active ? activeClass : "border-mira-lavender/40 bg-white text-mira-muted hover:border-mira-primary/30"
    }`}>
      {label}
    </button>
  );
}

/* ─── Toggle switch ─── */
function Toggle({ on }: { on?: boolean }) {
  return (
    <div className={`relative h-7 w-12 rounded-full transition ${on ? "bg-mira-primary" : "bg-mira-lavender"}`}>
      <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </div>
  );
}

/* ─── Nav Table of Contents ─── */
const toc = [
  { id: "palette", label: "Палитра" },
  { id: "typography", label: "Типографика" },
  { id: "logo", label: "Логотип" },
  { id: "buttons", label: "Кнопки" },
  { id: "badges", label: "Бейджи" },
  { id: "chips", label: "Чипы" },
  { id: "cards", label: "Карточки" },
  { id: "inputs", label: "Инпуты" },
  { id: "cycle-wheel", label: "Круг цикла" },
  { id: "tracking", label: "Категории трекинга" },
  { id: "navigation", label: "Навигация" },
  { id: "today-desktop", label: "Сегодня — Desktop" },
  { id: "today-mobile", label: "Сегодня — Mobile" },
  { id: "checkin", label: "Отследить сегодня" },
  { id: "periods", label: "Месячные" },
  { id: "pain", label: "Боль" },
  { id: "mood", label: "Настроение" },
  { id: "energy", label: "Энергия" },
  { id: "sleep", label: "Сон" },
  { id: "intimacy", label: "Интимность" },
  { id: "nutrition", label: "Питание" },
  { id: "nutrition-ai", label: "AI рекомендация питания" },
  { id: "workout", label: "Тренировка" },
  { id: "analytics", label: "Аналитика" },
  { id: "profile", label: "Профиль" },
  { id: "privacy", label: "Приватность" },
  { id: "religious", label: "Дополнительный режим" },
  { id: "islamic", label: "Исламский режим" },
  { id: "onboarding", label: "Онбординг" },
];

const phases = [
  { name: "Менструация", days: "1–5", color: "bg-[#E8A0B8]" },
  { name: "Фолликулярная", days: "6–13", color: "bg-[#B8A5D8]" },
  { name: "Овуляция", days: "14–16", color: "bg-[#D4A0C8]" },
  { name: "Лютеиновая", days: "17–28", color: "bg-[#D4CCE6]" },
];

const trackingCategories = [
  { icon: Droplets, label: "Месячные", color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { icon: Activity, label: "Боль", color: "text-[#C4A07E] bg-[#F5ECE0]" },
  { icon: Brain, label: "Настроение", color: "text-[#9B8EC4] bg-[#EDE8F5]" },
  { icon: Flame, label: "Энергия", color: "text-[#C4B07E] bg-[#F5F0E0]" },
  { icon: BedDouble, label: "Сон", color: "text-[#7E8EC4] bg-[#E0E8F5]" },
  { icon: Heart, label: "Интимность", color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { icon: Sparkles, label: "ПМС", color: "text-[#A07EC4] bg-[#EDE0F5]" },
  { icon: Salad, label: "Питание", color: "text-[#7BAF8D] bg-[#E0F5E8]" },
  { icon: BookOpen, label: "Заметка", color: "text-mira-muted bg-mira-lavender-light" },
];

const sidebarItems = [
  { icon: Sun, label: "Сегодня" },
  { icon: Calendar, label: "Цикл" },
  { icon: BookOpen, label: "Дневник" },
  { icon: Salad, label: "Питание" },
  { icon: Dumbbell, label: "Тренировка" },
  { icon: ChartNoAxesCombined, label: "Аналитика" },
  { icon: UserRound, label: "Профиль" },
];

const bottomNavItems = [
  { icon: Sun, label: "Сегодня" },
  { icon: Calendar, label: "Цикл" },
  { icon: BookOpen, label: "Дневник" },
  { icon: ChartNoAxesCombined, label: "Аналитика" },
  { icon: UserRound, label: "Профиль" },
];

export default function DesignPage() {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <div className="min-h-screen bg-mira-bg">
      {/* Floating TOC */}
      <nav className="fixed right-4 top-4 z-50 hidden max-h-[90vh] w-52 overflow-y-auto rounded-2xl border border-mira-lavender/30 bg-white/90 p-3 shadow-soft backdrop-blur-sm xl:block">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Содержание</p>
        {toc.map(t => (
          <a key={t.id} href={`#${t.id}`} className="block rounded-lg px-2 py-1 text-xs text-mira-muted transition hover:bg-mira-lavender-light hover:text-mira-primary">
            {t.label}
          </a>
        ))}
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 xl:mr-60">

        {/* ── Header ── */}
        <div className="mb-20 text-center">
          <div className="mx-auto mb-6">
            <MiraLogo size={80} />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-mira-text">Mira</h1>
          <p className="mt-2 text-lg text-mira-muted">Слушай себя</p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-mira-muted">
            Дизайн-система адаптивного веб-приложения для отслеживания цикла, самочувствия, питания и активности.
          </p>
        </div>

        {/* ══════════════════════════════════════════
            1. ПАЛИТРА
        ══════════════════════════════════════════ */}
        <Section id="palette" title="Палитра">
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { name: "Background", hex: "#F8F5FE", token: "mira-bg", cls: "bg-mira-bg border border-mira-lavender/30" },
              { name: "Card", hex: "#FFFFFF", token: "white", cls: "bg-white border border-mira-lavender/30" },
              { name: "Text", hex: "#2D2640", token: "mira-text", cls: "bg-mira-text text-white" },
              { name: "Muted", hex: "#9B95A8", token: "mira-muted", cls: "bg-mira-muted text-white" },
              { name: "Primary", hex: "#9B8EC4", token: "mira-primary", cls: "bg-mira-primary text-white" },
              { name: "Primary Deep", hex: "#7B6BA8", token: "mira-primary-deep", cls: "bg-mira-primary-deep text-white" },
              { name: "Cycle", hex: "#C47E9B", token: "mira-cycle", cls: "bg-mira-cycle text-white" },
              { name: "Rose", hex: "#E8B4C8", token: "mira-rose", cls: "bg-mira-rose" },
              { name: "Rose Light", hex: "#F5E0EA", token: "mira-rose-light", cls: "bg-mira-rose-light" },
              { name: "Lavender", hex: "#D4CCE6", token: "mira-lavender", cls: "bg-mira-lavender" },
              { name: "Lavender Light", hex: "#EDE8F5", token: "mira-lavender-light", cls: "bg-mira-lavender-light" },
              { name: "Success", hex: "#7BAF8D", token: "mira-success", cls: "bg-mira-success text-white" },
            ].map(c => (
              <div key={c.name} className="text-center">
                <div className={`h-16 rounded-2xl ${c.cls} shadow-card`} />
                <p className="mt-2 text-xs font-semibold text-mira-text">{c.name}</p>
                <p className="text-[10px] text-mira-muted">{c.hex}</p>
                <p className="text-[10px] text-mira-primary">{c.token}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-8 mb-4 text-lg font-semibold text-mira-text">Градиенты</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-20 rounded-2xl bg-gradient-to-br from-[#C9B8E8] via-[#B8A5D8] to-[#A08CC8] shadow-card" />
            <div className="h-20 rounded-2xl bg-gradient-to-br from-mira-rose-light to-mira-lavender-light shadow-card" />
            <div className="h-20 rounded-2xl bg-gradient-to-r from-mira-cycle to-mira-primary shadow-card" />
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-3 text-center">
            <p className="text-xs text-mira-muted">Логотип / Акцент</p>
            <p className="text-xs text-mira-muted">Карточка цикла</p>
            <p className="text-xs text-mira-muted">CTA Gradient</p>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            2. ТИПОГРАФИКА
        ══════════════════════════════════════════ */}
        <Section id="typography" title="Типографика">
          <Card className="space-y-5 p-6">
            <div>
              <p className="text-4xl font-bold tracking-tight text-mira-text">Заголовок H1</p>
              <p className="mt-1 text-xs text-mira-muted">Plus Jakarta Sans · 36px · Bold · tracking-tight</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-mira-text">Заголовок H2</p>
              <p className="mt-1 text-xs text-mira-muted">24px · Bold</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-mira-text">Заголовок H3</p>
              <p className="mt-1 text-xs text-mira-muted">18px · Semibold</p>
            </div>
            <div>
              <p className="text-base text-mira-text">Основной текст — 16px</p>
              <p className="mt-1 text-xs text-mira-muted">16px · Regular</p>
            </div>
            <div>
              <p className="text-sm text-mira-muted">Вторичный текст — 14px</p>
              <p className="mt-1 text-xs text-mira-muted">14px · Regular · muted</p>
            </div>
            <div>
              <p className="text-xs text-mira-muted">Подпись — 12px</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">LABEL — 10PX · UPPERCASE</p>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            3. ЛОГОТИП
        ══════════════════════════════════════════ */}
        <Section id="logo" title="Логотип">
          <Card className="p-8">
            <div className="flex flex-wrap items-end gap-8">
              <div className="text-center">
                <MiraLogo size={120} />
                <p className="mt-2 text-xs text-mira-muted">120px</p>
              </div>
              <div className="text-center">
                <MiraLogo size={80} />
                <p className="mt-2 text-xs text-mira-muted">80px</p>
              </div>
              <div className="text-center">
                <MiraLogo size={48} />
                <p className="mt-2 text-xs text-mira-muted">48px</p>
              </div>
              <div className="text-center">
                <MiraLogo size={32} />
                <p className="mt-2 text-xs text-mira-muted">32px</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <MiraLogo size={48} />
              <div>
                <p className="text-2xl font-bold text-mira-text">Mira</p>
                <p className="text-sm text-mira-muted">Слушай себя</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#C9B8E8] via-[#B8A5D8] to-[#A08CC8] p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22%] bg-white/20 backdrop-blur-sm">
                  <Infinity className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Mira</p>
                  <p className="text-sm text-white/80">Слушай себя</p>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            4. КНОПКИ
        ══════════════════════════════════════════ */}
        <Section id="buttons" title="Кнопки">
          <Card className="space-y-6 p-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Варианты</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Отследить сегодня</Button>
                <Button variant="secondary">Подробнее</Button>
                <Button variant="outline">Пропустить</Button>
                <Button variant="ghost">Отмена</Button>
                <Button variant="cycle">Начать</Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Размеры</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large — Начать тренировку</Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">С иконками</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Отследить сегодня <ChevronRight className="h-4 w-4" /></Button>
                <Button variant="secondary"><Plus className="h-4 w-4" /> Добавить</Button>
                <Button variant="cycle"><Play className="h-4 w-4" /> Начать тренировку</Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Состояния</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Активная</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            5. БЕЙДЖИ
        ══════════════════════════════════════════ */}
        <Section id="badges" title="Бейджи">
          <Card className="flex flex-wrap gap-3 p-6">
            <Badge>День 16</Badge>
            <Badge className="border-[#E8A0B8]/30 bg-[#F5E0EA] text-[#C47E9B]">Менструация</Badge>
            <Badge className="border-[#B8A5D8]/30 bg-[#EDE8F5] text-[#9B8EC4]">Фолликулярная</Badge>
            <Badge className="border-[#D4A0C8]/30 bg-[#F0E0F0] text-[#B07EA8]">Овуляция</Badge>
            <Badge className="border-[#D4CCE6]/30 bg-[#EDE8F5] text-mira-muted">Лютеиновая</Badge>
            <Badge className="border-mira-success/30 bg-[#E0F5E8] text-mira-success">Норма</Badge>
            <Badge className="border-[#C4B07E]/30 bg-[#F5F0E0] text-[#A09060]">Энергия растёт</Badge>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            6. ЧИПЫ
        ══════════════════════════════════════════ */}
        <Section id="chips" title="Чипы выбора">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-mira-text">Настроение</p>
              <div className="flex flex-wrap gap-2">
                {["Нормально", "Радость", "Грусть", "Злость", "Тревога", "Перепады"].map((m, i) => (
                  <Chip key={m} label={m} active={i === 0} />
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-mira-text">Энергия</p>
              <div className="flex flex-wrap gap-2">
                {["Истощение", "Мало сил", "Нормально", "Много сил"].map((e, i) => (
                  <Chip key={e} label={e} active={i === 2} color="bg-[#F5F0E0] text-[#A09060]" />
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-mira-text">Боль</p>
              <div className="flex flex-wrap gap-2">
                {["Нет боли", "Спазмы", "Низ живота", "Голова", "Грудь", "Спина"].map((p, i) => (
                  <Chip key={p} label={p} active={i === 0} color="bg-[#E0F5E8] text-mira-success" />
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            7. КАРТОЧКИ
        ══════════════════════════════════════════ */}
        <Section id="cards" title="Карточки">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Стандартная</p>
              <p className="mt-2 text-lg font-bold text-mira-text">Белый фон</p>
              <p className="mt-1 text-sm text-mira-muted">border-radius: 1.5rem, shadow-card, border lavender/30</p>
            </Card>
            <Card className="border-mira-cycle/20 bg-gradient-to-br from-mira-rose-light to-mira-lavender-light">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-cycle">Цикл</p>
              <p className="mt-2 text-lg font-bold text-mira-text">Градиент rose → lavender</p>
              <p className="mt-1 text-sm text-mira-muted">Для фаз цикла и главной карточки</p>
            </Card>
            <Card className="border-mira-success/20 bg-[#E0F5E8]/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-success">Успех</p>
              <p className="mt-2 text-lg font-bold text-mira-text">Мягкий зелёный</p>
              <p className="mt-1 text-sm text-mira-muted">Для подтверждений и позитивных метрик</p>
            </Card>
            <Card className="border-mira-primary/20 bg-mira-lavender-light/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Акцентная</p>
              <p className="mt-2 text-lg font-bold text-mira-text">Лавандовый фон</p>
              <p className="mt-1 text-sm text-mira-muted">Для AI-рекомендаций и подсказок</p>
            </Card>
            <Card className="border-[#C4B07E]/20 bg-[#F5F0E0]/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A09060]">Тёплая</p>
              <p className="mt-2 text-lg font-bold text-mira-text">Мягкий жёлтый</p>
              <p className="mt-1 text-sm text-mira-muted">Полезное сегодня, подсказки</p>
            </Card>
            <Card className="p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#C9B8E8] to-[#A08CC8] p-4">
                <p className="text-sm font-bold text-white">Hero-карточка</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-mira-muted">Gradient header + white body</p>
              </div>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            8. ИНПУТЫ / ПЕРЕКЛЮЧАТЕЛИ
        ══════════════════════════════════════════ */}
        <Section id="inputs" title="Инпуты и переключатели">
          <Card className="space-y-6 p-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Toggle</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Toggle on />
                  <span className="text-sm text-mira-text">Включено</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle />
                  <span className="text-sm text-mira-muted">Выключено</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Progress bar</p>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-mira-muted">Белок</span>
                    <span className="font-semibold text-mira-text">45 / 90 г</span>
                  </div>
                  <Progress value={50} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-mira-muted">Калории</span>
                    <span className="font-semibold text-mira-text">950 / 1800</span>
                  </div>
                  <Progress value={53} color="bg-mira-success" />
                </div>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Stepper / Selector</p>
              <div className="flex items-center gap-2 rounded-2xl border border-mira-lavender/30 bg-mira-bg p-1">
                {["5 ч", "6 ч", "7 ч", "8 ч"].map((v, i) => (
                  <button key={v} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    i === 2 ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
                  }`}>{v}</button>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            9. КРУГ ЦИКЛА
        ══════════════════════════════════════════ */}
        <Section id="cycle-wheel" title="Круг цикла">
          <Card className="flex flex-col items-center p-8">
            <CycleWheel size={280} />
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {phases.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${p.color}`} />
                  <span className="text-xs text-mira-muted">{p.name} ({p.days})</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-mira-muted">
              Розовый пунктир — прогноз следующих месячных · Фиолетовая точка — сегодня
            </p>
          </Card>

          <h3 className="mt-6 mb-3 text-lg font-semibold text-mira-text">Размеры</h3>
          <Card className="flex flex-wrap items-end justify-center gap-8 p-8">
            <div className="text-center">
              <CycleWheel size={200} />
              <p className="mt-2 text-xs text-mira-muted">Desktop — 280px</p>
            </div>
            <div className="text-center">
              <CycleWheel size={160} />
              <p className="mt-2 text-xs text-mira-muted">Tablet — 200px</p>
            </div>
            <div className="text-center">
              <CycleWheel size={120} />
              <p className="mt-2 text-xs text-mira-muted">Карточка — 96px</p>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            10. КАТЕГОРИИ ТРЕКИНГА
        ══════════════════════════════════════════ */}
        <Section id="tracking" title="Категории трекинга">
          <Card className="p-6">
            <p className="mb-4 text-sm text-mira-muted">9 категорий для ежедневного отслеживания</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
              {trackingCategories.map(cat => (
                <button key={cat.label} className="flex flex-col items-center gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-4 shadow-card transition hover:shadow-soft active:scale-[0.98]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-mira-text">{cat.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            11. НАВИГАЦИЯ
        ══════════════════════════════════════════ */}
        <Section id="navigation" title="Навигация">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Desktop Sidebar */}
            <Card className="overflow-hidden p-0">
              <p className="px-5 pt-5 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Desktop — Sidebar</p>
              <div className="mt-4 flex h-96">
                <div className="w-56 border-r border-mira-lavender/20 bg-mira-bg p-4">
                  <div className="mb-6 flex items-center gap-2.5 px-3">
                    <MiraLogo size={32} />
                    <span className="text-base font-bold text-mira-text">Mira</span>
                  </div>
                  {sidebarItems.map((item, i) => (
                    <button key={item.label} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      i === 0 ? "bg-mira-lavender-light font-semibold text-mira-primary" : "text-mira-muted hover:bg-mira-lavender-light/50"
                    }`}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 bg-mira-bg p-6">
                  <p className="text-xs text-mira-muted">← Sidebar всегда видимый на desktop (≥1024px)</p>
                  <p className="mt-2 text-xs text-mira-muted">Контент: max-width 1200px, padding 24px</p>
                </div>
              </div>
            </Card>

            {/* Mobile Bottom Nav */}
            <Card className="overflow-hidden p-0">
              <p className="px-5 pt-5 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Mobile — Bottom Navigation</p>
              <div className="relative mx-auto mt-4 h-96 w-[340px] overflow-hidden rounded-[2.5rem] border-2 border-mira-lavender/30 bg-mira-bg">
                <div className="p-5 pt-10">
                  <div className="flex items-center gap-2">
                    <MiraLogo size={28} />
                    <span className="text-sm font-bold text-mira-text">Mira</span>
                  </div>
                  <p className="mt-4 text-xs text-mira-muted">Нижняя навигация: 5 пунктов</p>
                  <p className="mt-1 text-xs text-mira-muted">Питание и тренировка — с экрана «Сегодня»</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-around border-t border-mira-lavender/20 bg-white/80 px-2 pb-5 pt-2 backdrop-blur-sm">
                  {bottomNavItems.map((item, i) => (
                    <button key={item.label} className={`flex flex-col items-center gap-1 ${
                      i === 0 ? "text-mira-primary" : "text-mira-muted"
                    }`}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            12. ЭКРАН СЕГОДНЯ — DESKTOP
        ══════════════════════════════════════════ */}
        <Section id="today-desktop" title="Экран «Сегодня» — Desktop">
          <Card className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-mira-muted">Добрый день</p>
                <p className="text-2xl font-bold text-mira-text">Привет, Амина</p>
              </div>
              <Badge>24 июня, вторник</Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                {/* Cycle card */}
                <div className="rounded-3xl border border-mira-cycle/15 bg-gradient-to-br from-mira-rose-light/80 to-mira-lavender-light/80 p-6">
                  <div className="flex items-center gap-6">
                    <CycleWheel size={120} />
                    <div>
                      <p className="text-xl font-bold text-mira-text">День 16</p>
                      <p className="text-sm font-semibold text-mira-primary">Фолликулярная фаза</p>
                      <p className="mt-1 text-sm text-mira-muted">Следующие месячные ~через 12 дней</p>
                      <Badge className="mt-2 border-[#B8A5D8]/30 bg-[#EDE8F5] text-[#9B8EC4]">Энергия растёт</Badge>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Отследить сегодня <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Nutrition card */}
                  <Card className="border-mira-success/15 bg-[#E0F5E8]/30 p-4">
                    <div className="flex items-center gap-2">
                      <Salad className="h-4 w-4 text-mira-success" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Питание сегодня</span>
                    </div>
                    <p className="mt-3 text-xl font-bold text-mira-text">950 / 1800 ккал</p>
                    <p className="mt-1 text-xs text-mira-muted">47% от ориентира</p>
                    <div className="mt-3">
                      <Progress value={47} color="bg-mira-success" />
                    </div>
                    <div className="mt-3 flex gap-3 text-xs text-mira-muted">
                      <span>Б: 45г</span>
                      <span>Ж: 28г</span>
                      <span>У: 110г</span>
                    </div>
                  </Card>

                  {/* Workout card */}
                  <Card className="border-mira-primary/15 bg-mira-lavender-light/30 p-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-mira-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Тренировка</span>
                    </div>
                    <p className="mt-3 text-xl font-bold text-mira-text">20 мин</p>
                    <p className="mt-1 text-sm text-mira-muted">Лёгкая силовая</p>
                    <p className="mt-2 text-xs text-mira-primary">Подходит вашему состоянию</p>
                    <Button size="sm" className="mt-3 w-full">
                      <Play className="h-3.5 w-3.5" /> Начать
                    </Button>
                  </Card>
                </div>
              </div>

              {/* Sidebar column */}
              <div className="space-y-4">
                <Card className="border-[#C4B07E]/15 bg-[#F5F0E0]/30 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#C4B07E]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A09060]">Полезное сегодня</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-mira-text">Как поддержать энергию во второй половине цикла</p>
                  <p className="mt-1 text-xs text-mira-muted">2 мин чтения</p>
                </Card>

                <Card className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сегодня отмечено</p>
                  <div className="mt-3 space-y-2.5">
                    {[
                      { color: "bg-[#B8A5D8]", text: "Настроение: нормально" },
                      { color: "bg-[#C4B07E]", text: "Энергия: много сил" },
                      { color: "bg-[#7E8EC4]", text: "Сон: 7.5 ч, хороший" },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                        <span className="text-mira-text">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-mira-primary/10 bg-mira-lavender-light/30 p-4">
                  <div className="flex items-center gap-2">
                    <Infinity className="h-4 w-4 text-mira-primary" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Рекомендация</span>
                  </div>
                  <p className="mt-2 text-sm text-mira-text">Сегодня можно добавить белок и фрукты: йогурт, яйца или ягоды.</p>
                  <p className="mt-1 text-xs text-mira-muted italic">Mira подобрала · ориентир</p>
                </Card>
              </div>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            13. ЭКРАН СЕГОДНЯ — MOBILE
        ══════════════════════════════════════════ */}
        <Section id="today-mobile" title="Экран «Сегодня» — Mobile">
          <div className="mx-auto max-w-[375px]">
            <div className="overflow-hidden rounded-[2.5rem] border-2 border-mira-lavender/30 bg-mira-bg">
              {/* Status bar mock */}
              <div className="flex items-center justify-between bg-mira-bg px-6 pt-3">
                <span className="text-xs font-semibold text-mira-text">9:41</span>
                <div className="flex gap-1">
                  <div className="h-2.5 w-4 rounded-sm bg-mira-text" />
                  <div className="h-2.5 w-2.5 rounded-full bg-mira-text" />
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-sm text-mira-muted">Добрый день</p>
                  <p className="text-xl font-bold text-mira-text">Привет, Амина</p>
                </div>

                {/* Cycle wheel centered */}
                <div className="flex flex-col items-center rounded-3xl border border-mira-cycle/15 bg-gradient-to-br from-mira-rose-light/80 to-mira-lavender-light/80 p-6">
                  <CycleWheel size={180} />
                  <Badge className="mt-3 border-[#B8A5D8]/30 bg-white/60 text-[#9B8EC4]">Энергия растёт</Badge>
                </div>

                <Button className="w-full" size="lg">
                  Отследить сегодня <ChevronRight className="h-4 w-4" />
                </Button>

                <Card className="border-mira-success/15 bg-[#E0F5E8]/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Salad className="h-4 w-4 text-mira-success" />
                      <span className="text-xs font-semibold text-mira-muted">Питание</span>
                    </div>
                    <span className="text-xs text-mira-muted">47%</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-mira-text">950 / 1800 ккал</p>
                  <Progress value={47} color="bg-mira-success" />
                </Card>

                <Card className="border-mira-primary/15 bg-mira-lavender-light/30 p-4">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-mira-primary" />
                    <span className="text-xs font-semibold text-mira-muted">Тренировка</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-mira-text">20 мин · лёгкая</p>
                  <p className="mt-1 text-xs text-mira-primary">Подходит вашему состоянию</p>
                </Card>

                <Card className="border-[#C4B07E]/15 bg-[#F5F0E0]/30 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#C4B07E]" />
                    <span className="text-xs font-semibold text-[#A09060]">Полезное</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-mira-text">Как поддержать энергию</p>
                  <p className="mt-1 text-xs text-mira-muted">2 мин чтения</p>
                </Card>
              </div>

              {/* Bottom nav */}
              <div className="flex justify-around border-t border-mira-lavender/20 bg-white/80 px-2 pb-6 pt-2 backdrop-blur-sm">
                {bottomNavItems.map((item, i) => (
                  <button key={item.label} className={`flex flex-col items-center gap-1 ${
                    i === 0 ? "text-mira-primary" : "text-mira-muted"
                  }`}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            14. ОТСЛЕДИТЬ СЕГОДНЯ — CHECK-IN
        ══════════════════════════════════════════ */}
        <Section id="checkin" title="Отследить сегодня">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Desktop — side panel */}
            <Card className="p-0 overflow-hidden">
              <p className="px-5 pt-5 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Desktop — Side Panel / Modal</p>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-mira-text">Отследить сегодня</h3>
                  <button className="rounded-xl p-2 text-mira-muted hover:bg-mira-lavender-light"><X className="h-4 w-4" /></button>
                </div>
                <Button variant="secondary" size="sm" className="mb-4 w-full">
                  <RotateCcw className="h-3.5 w-3.5" /> Повторить вчерашние отметки
                </Button>
                <div className="grid grid-cols-3 gap-3">
                  {trackingCategories.map(cat => (
                    <button key={cat.label} className="flex flex-col items-center gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-3 shadow-card transition hover:shadow-soft active:scale-[0.98]">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.color}`}>
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-mira-text">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Mobile — bottom sheet */}
            <Card className="p-0 overflow-hidden">
              <p className="px-5 pt-5 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Mobile — Bottom Sheet</p>
              <div className="mx-auto mt-4 max-w-[340px]">
                <div className="rounded-t-3xl border border-mira-lavender/20 bg-white p-5 shadow-soft">
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mira-lavender" />
                  <h3 className="mb-1 text-lg font-bold text-mira-text">Отследить сегодня</h3>
                  <p className="mb-4 text-xs text-mira-muted">Выберите что отметить</p>
                  <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-mira-lavender/30 bg-mira-lavender-light/50 py-2.5 text-xs font-semibold text-mira-primary">
                    <RotateCcw className="h-3.5 w-3.5" /> Повторить вчерашние отметки
                  </button>
                  <div className="grid grid-cols-3 gap-2.5">
                    {trackingCategories.map(cat => (
                      <button key={cat.label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-mira-lavender/15 bg-mira-bg p-3 active:scale-[0.97]">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.color}`}>
                          <cat.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-semibold text-mira-text">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            15. МЕСЯЧНЫЕ
        ══════════════════════════════════════════ */}
        <Section id="periods" title="Месячные">
          <Card className="max-w-md p-6">
            <h3 className="mb-1 text-lg font-bold text-mira-text">Месячные</h3>
            <p className="mb-4 text-xs text-mira-muted">Отметьте интенсивность и тип</p>

            <p className="mb-2 text-sm font-semibold text-mira-text">Интенсивность</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Скудная", "Умеренная", "Обильная", "Очень сильная"].map((v, i) => (
                <Chip key={v} label={v} active={i === 1} color="bg-mira-rose-light text-mira-cycle" />
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Тип выделений</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Обычные", "Мажущие", "Коричневые", "Сгустки"].map((v, i) => (
                <Chip key={v} label={v} active={i === 0} color="bg-mira-rose-light text-mira-cycle" />
              ))}
            </div>

            <div className="mb-4 rounded-2xl border border-[#C4B07E]/20 bg-[#F5F0E0]/50 p-3">
              <p className="text-xs text-[#A09060]">
                💛 Если «Очень сильная» необычна для вас или сопровождается сильной слабостью, лучше обратиться к специалисту.
              </p>
            </div>

            <Button className="w-full">Сохранить</Button>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            16. БОЛЬ
        ══════════════════════════════════════════ */}
        <Section id="pain" title="Боль">
          <Card className="max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold text-mira-text">Боль</h3>

            <p className="mb-2 text-sm font-semibold text-mira-text">Тип</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Нет боли", "Спазмы", "Низ живота", "Голова", "Грудь", "Спина", "Овуляторная"].map((v, i) => (
                <Chip key={v} label={v} active={i === 0} color="bg-[#E0F5E8] text-mira-success" />
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Сила</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Лёгкая", "Средняя", "Сильная"].map((v, i) => (
                <Chip key={v} label={v} active={i === 0} />
              ))}
            </div>

            <div className="mb-4 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/30 p-3">
              <p className="text-xs text-mira-cycle">
                При сильной боли Mira не предложит интенсивную тренировку — только мягкий режим или отдых.
              </p>
            </div>

            <Button className="w-full">Сохранить</Button>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            17. НАСТРОЕНИЕ
        ══════════════════════════════════════════ */}
        <Section id="mood" title="Настроение">
          <Card className="max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold text-mira-text">Настроение</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {["Нормально", "Радость", "Грусть", "Злость", "Тревога", "Перепады"].map((m, i) => (
                <Chip key={m} label={m} active={i === 1} />
              ))}
            </div>
            <button className="mb-4 text-xs font-semibold text-mira-primary">Ещё →</button>
            <Button className="w-full">Сохранить</Button>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            18. ЭНЕРГИЯ
        ══════════════════════════════════════════ */}
        <Section id="energy" title="Энергия">
          <Card className="max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold text-mira-text">Энергия</h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { label: "Истощение", emoji: "😔" },
                { label: "Мало сил", emoji: "😐" },
                { label: "Нормально", emoji: "🙂" },
                { label: "Много сил", emoji: "😊" },
              ].map((e, i) => (
                <button key={e.label} className={`flex items-center gap-2 rounded-2xl border p-3 text-sm font-semibold transition ${
                  i === 3 ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted hover:border-mira-primary/30"
                }`}>
                  <span className="text-lg">{e.emoji}</span> {e.label}
                </button>
              ))}
            </div>
            <p className="mb-4 text-xs text-mira-muted">Энергия влияет на рекомендации по тренировке и питанию</p>
            <Button className="w-full">Сохранить</Button>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            19. СОН
        ══════════════════════════════════════════ */}
        <Section id="sleep" title="Сон">
          <Card className="max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold text-mira-text">Сон</h3>

            <p className="mb-2 text-sm font-semibold text-mira-text">Качество</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Хороший", "Нормальный", "Плохой", "Мало сна", "Бессонница"].map((v, i) => (
                <Chip key={v} label={v} active={i === 0} color="bg-[#E0E8F5] text-[#7E8EC4]" />
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Продолжительность</p>
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-mira-lavender/30 bg-mira-bg p-1">
              {["5 ч", "6 ч", "7 ч", "8 ч"].map((v, i) => (
                <button key={v} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  i === 2 ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
                }`}>{v}</button>
              ))}
            </div>

            <Button className="w-full">Сохранить</Button>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            20. ИНТИМНОСТЬ
        ══════════════════════════════════════════ */}
        <Section id="intimacy" title="Интимность">
          <Card className="max-w-md p-6">
            <h3 className="mb-1 text-lg font-bold text-mira-text">Интимность</h3>
            <p className="mb-4 text-xs text-mira-muted">Данные приватны и скрыты по умолчанию</p>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button className="rounded-2xl border border-mira-lavender/30 p-3 text-sm font-semibold text-mira-muted">
                Не было
              </button>
              <button className="rounded-2xl border border-mira-primary bg-mira-lavender-light p-3 text-sm font-semibold text-mira-primary">
                Была
              </button>
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Детали</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["С защитой", "Без защиты", "Прерванный акт", "Мастурбация", "Секс-игрушка"].map((v, i) => (
                <Chip key={v} label={v} active={i === 0} />
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Ощущения</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Хорошо", "Нормально", "Дискомфорт", "Боль"].map((v, i) => (
                <Chip key={v} label={v} active={i === 0} />
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-mira-muted" />
                <span className="text-sm text-mira-text">Показывать в календаре</span>
              </div>
              <Toggle />
            </div>

            <Button className="w-full">Сохранить</Button>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            21. ПИТАНИЕ
        ══════════════════════════════════════════ */}
        <Section id="nutrition" title="Питание">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Overview */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold text-mira-text">Питание сегодня</h3>

              <div className="mb-4 rounded-2xl bg-mira-bg p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Ориентир на день</p>
                <p className="mt-1 text-2xl font-bold text-mira-text">1800–2000 ккал</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { label: "Белки", value: "90 г", color: "bg-mira-primary" },
                    { label: "Жиры", value: "65 г", color: "bg-mira-cycle" },
                    { label: "Углеводы", value: "220 г", color: "bg-[#C4B07E]" },
                  ].map(n => (
                    <div key={n.label} className="text-center">
                      <div className={`mx-auto h-1.5 w-8 rounded-full ${n.color} mb-1 opacity-60`} />
                      <p className="text-xs text-mira-muted">{n.label}</p>
                      <p className="text-sm font-bold text-mira-text">{n.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Отмечено примерно</p>
                <p className="mt-1 text-xl font-bold text-mira-text">950 ккал</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><span className="font-semibold text-mira-text">45 г</span> <span className="text-mira-muted">белка</span></div>
                  <div><span className="font-semibold text-mira-text">28 г</span> <span className="text-mira-muted">жиров</span></div>
                  <div><span className="font-semibold text-mira-text">110 г</span> <span className="text-mira-muted">углев.</span></div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-mira-muted">Прогресс</span>
                    <span className="font-semibold text-mira-success">47%</span>
                  </div>
                  <Progress value={47} color="bg-mira-success" />
                </div>
              </div>

              <Button className="w-full" variant="secondary">
                <Plus className="h-4 w-4" /> Добавить приём пищи
              </Button>
            </Card>

            {/* Add meal */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold text-mira-text">Добавить приём пищи</h3>

              <p className="mb-2 text-sm font-semibold text-mira-text">Тип</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {["Завтрак", "Обед", "Ужин", "Перекус"].map((v, i) => (
                  <Chip key={v} label={v} active={i === 0} />
                ))}
              </div>

              <p className="mb-2 text-sm font-semibold text-mira-text">Размер</p>
              <div className="mb-4 flex gap-2">
                {["Маленький", "Средний", "Большой"].map((v, i) => (
                  <Chip key={v} label={v} active={i === 1} />
                ))}
              </div>

              <p className="mb-2 text-sm font-semibold text-mira-text">Состав</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {["Белок", "Овощи", "Фрукты", "Крупы", "Молочное", "Сладкое", "Фастфуд"].map((v, i) => (
                  <Chip key={v} label={v} active={i === 0 || i === 1} />
                ))}
              </div>

              <div className="mb-4 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-success">Примерная оценка</p>
                <p className="mt-1 text-lg font-bold text-mira-text">450–600 ккал</p>
                <p className="mt-1 text-xs text-mira-muted">Белок: средне · Углеводы: достаточно</p>
              </div>

              <Button className="w-full">Добавить</Button>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            22. AI РЕКОМЕНДАЦИЯ ПИТАНИЯ
        ══════════════════════════════════════════ */}
        <Section id="nutrition-ai" title="AI рекомендация по питанию">
          <Card className="max-w-lg border-mira-primary/15 bg-gradient-to-br from-mira-lavender-light/50 to-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mira-primary/10">
                <Infinity className="h-4 w-4 text-mira-primary" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-mira-primary">Рекомендация на сегодня</span>
            </div>
            <p className="text-sm text-mira-text leading-relaxed">
              Сегодня можно добавить белок и фрукты: йогурт, яйца, рыбу, курицу, бобовые или ягоды. Это поможет поддержать энергию во второй половине дня.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-mira-success/30 bg-[#E0F5E8] text-mira-success">Добавить</Badge>
              <span className="text-xs text-mira-muted">белок · фрукты · ягоды</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="border-[#C4B07E]/30 bg-[#F5F0E0] text-[#A09060]">Можно меньше</Badge>
              <span className="text-xs text-mira-muted">быстрые углеводы</span>
            </div>
            <p className="mt-4 text-[10px] text-mira-muted italic">Mira подобрала · ориентир · не является медицинской рекомендацией</p>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            23. ТРЕНИРОВКА
        ══════════════════════════════════════════ */}
        <Section id="workout" title="Тренировка">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Workout card */}
            <Card className="border-mira-primary/15 bg-gradient-to-br from-mira-lavender-light/50 to-white p-6">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="h-5 w-5 text-mira-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Тренировка сегодня</span>
              </div>
              <p className="text-2xl font-bold text-mira-text">20 минут</p>
              <p className="text-sm text-mira-primary">Лёгкая силовая</p>

              <div className="mt-4 rounded-2xl bg-white/60 p-4">
                <p className="mb-2 text-xs font-semibold text-mira-text">Почему подходит:</p>
                <div className="space-y-1.5">
                  {[
                    "Фолликулярная фаза — энергия растёт",
                    "Сон: 7 ч 30 мин, хороший",
                    "Боль не отмечена",
                    "Энергия: много сил",
                  ].map(r => (
                    <div key={r} className="flex items-start gap-2 text-xs text-mira-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-mira-success" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white/60 p-4">
                <p className="mb-2 text-xs font-semibold text-mira-text">Что вас ждёт:</p>
                <div className="space-y-1.5 text-xs text-mira-muted">
                  <p>🔥 Разминка — 3 мин</p>
                  <p>💪 Лёгкая силовая — 14 мин</p>
                  <p>🧘 Заминка — 3 мин</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button className="w-full"><Play className="h-4 w-4" /> Начать</Button>
                <Button variant="secondary" className="w-full">Сделать легче</Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">Другая активность</Button>
                <Button variant="ghost" className="w-full">Пропустить</Button>
              </div>
            </Card>

            {/* Rest recommendation */}
            <Card className="border-[#C4B07E]/15 bg-[#F5F0E0]/30 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Moon className="h-5 w-5 text-[#A09060]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Защитная рекомендация</span>
              </div>
              <p className="mt-2 text-lg font-bold text-mira-text">Сегодня лучше отдохнуть</p>
              <p className="mt-2 text-sm text-mira-muted leading-relaxed">
                Сегодня лучше выбрать мягкий режим. Можно сделать дыхание, лёгкую растяжку или просто отдохнуть.
              </p>

              <div className="mt-4 rounded-2xl bg-white/60 p-4">
                <p className="mb-2 text-xs font-semibold text-mira-text">Почему:</p>
                <div className="space-y-1.5">
                  {[
                    "Сильная боль внизу живота",
                    "Истощение",
                    "Сон: 4 ч, бессонница",
                    "Обильные месячные",
                  ].map(r => (
                    <div key={r} className="flex items-start gap-2 text-xs text-[#C47E9B]">
                      <span className="mt-0.5 h-3 w-3 shrink-0">⚠</span>
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 mb-2 text-xs font-semibold text-mira-text">Мягкие варианты:</p>
              <div className="flex flex-wrap gap-2">
                {["Отдых", "Дыхание", "Растяжка", "Прогулка"].map(v => (
                  <Chip key={v} label={v} />
                ))}
              </div>
            </Card>
          </div>

          <h3 className="mt-6 mb-3 text-lg font-semibold text-mira-text">Варианты активности</h3>
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: "🛌", label: "Отдых" },
                { icon: "🌬", label: "Дыхание" },
                { icon: "🧘", label: "Растяжка" },
                { icon: "🚶‍♀️", label: "Прогулка" },
                { icon: "🧘‍♀️", label: "Йога" },
                { icon: "💪", label: "Лёгкая силовая" },
                { icon: "🏋️", label: "Умеренная силовая" },
                { icon: "🏃‍♀️", label: "Лёгкое кардио" },
              ].map(a => (
                <button key={a.label} className="flex items-center gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-3 text-sm font-semibold text-mira-text shadow-card transition hover:shadow-soft">
                  <span className="text-lg">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            24. АНАЛИТИКА
        ══════════════════════════════════════════ */}
        <Section id="analytics" title="Аналитика">
          <Card className="p-6">
            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-2xl bg-mira-bg p-1">
              {["Циклы", "Настроение", "Энергия", "Сон", "Питание"].map((t, i) => (
                <button key={t} className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                  i === 0 ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
                }`}>{t}</button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cycle length */}
              <div className="rounded-2xl bg-mira-bg p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Длительность цикла</p>
                <p className="mt-1 text-3xl font-bold text-mira-text">28 <span className="text-lg font-normal text-mira-muted">дней</span></p>
                <p className="text-xs text-mira-muted">Среднее за 3 цикла</p>
                {/* Bar chart mock */}
                <div className="mt-4 flex items-end gap-2 h-20">
                  {[26, 28, 29, 27, 28, 30].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-lg ${i === 5 ? 'bg-mira-primary' : 'bg-mira-lavender'}`}
                        style={{ height: `${(v / 32) * 100}%` }}
                      />
                      <span className="text-[9px] text-mira-muted">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase donut */}
              <div className="rounded-2xl bg-mira-bg p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Фазы цикла</p>
                <div className="mt-4 flex items-center gap-6">
                  <div className="relative h-24 w-24">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#EDE8F5" strokeWidth="12" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#E8A0B8" strokeWidth="12"
                        strokeDasharray="43 196" strokeDashoffset="60" strokeLinecap="round" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#B8A5D8" strokeWidth="12"
                        strokeDasharray="67 172" strokeDashoffset="17" strokeLinecap="round" opacity="0.7" />
                    </svg>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { color: "bg-[#E8A0B8]", label: "Менструация", days: "5 дн." },
                      { color: "bg-[#B8A5D8]", label: "Фолликулярная", days: "11 дн." },
                      { color: "bg-[#D4A0C8]", label: "Овуляция", days: "3 дн." },
                      { color: "bg-[#D4CCE6]", label: "Лютеиновая", days: "9 дн." },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                        <span className="text-mira-text">{p.label}</span>
                        <span className="text-mira-muted">{p.days}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Frequent symptoms */}
              <div className="rounded-2xl bg-mira-bg p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Частые симптомы</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Спазмы", value: 72 },
                    { label: "Усталость", value: 58 },
                    { label: "Головная боль", value: 35 },
                    { label: "Тревога", value: 22 },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-mira-text">{s.label}</span>
                        <span className="text-mira-muted">{s.value}%</span>
                      </div>
                      <Progress value={s.value} color="bg-mira-cycle" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood chart mock */}
              <div className="rounded-2xl bg-mira-bg p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение за месяц</p>
                <div className="mt-4 flex items-end gap-1.5 h-16">
                  {Array.from({ length: 28 }, (_, i) => {
                    const h = [30, 45, 60, 55, 70, 80, 75, 50, 40, 65, 70, 85, 90, 80, 60, 55, 50, 45, 35, 40, 55, 65, 70, 60, 50, 45, 55, 60][i];
                    return (
                      <div key={i} className="flex-1">
                        <div
                          className={`w-full rounded-t-sm ${i === 15 ? 'bg-mira-primary' : 'bg-mira-lavender'}`}
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            25. ПРОФИЛЬ
        ══════════════════════════════════════════ */}
        <Section id="profile" title="Профиль">
          <Card className="max-w-lg p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mira-rose-light to-mira-lavender-light text-2xl font-bold text-mira-primary">
                А
              </div>
              <div>
                <p className="text-lg font-bold text-mira-text">Амина</p>
                <p className="text-sm text-mira-muted">amina@example.com</p>
              </div>
            </div>

            <div className="space-y-1">
              {[
                { icon: UserRound, label: "Мои данные", desc: "Рост, вес, возраст, активность" },
                { icon: Calendar, label: "Настройки цикла", desc: "Длина цикла, длительность" },
                { icon: Shield, label: "Приватность", desc: "PIN, уведомления, отметки" },
                { icon: Salad, label: "Питание", desc: "Калории вкл/выкл, ограничения" },
                { icon: Star, label: "Дополнительный режим", desc: "Ислам · активен" },
                { icon: Download, label: "Экспорт данных", desc: "Скачать свои данные" },
                { icon: Trash2, label: "Удалить данные", desc: "Безвозвратно удалить всё", danger: true },
              ].map(item => (
                <button key={item.label} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-mira-bg ${
                  (item as any).danger ? "" : ""
                }`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    (item as any).danger ? "bg-red-50 text-red-400" : "bg-mira-lavender-light text-mira-primary"
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${(item as any).danger ? "text-red-500" : "text-mira-text"}`}>{item.label}</p>
                    <p className="text-xs text-mira-muted">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-mira-lavender" />
                </button>
              ))}
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            26. ПРИВАТНОСТЬ
        ══════════════════════════════════════════ */}
        <Section id="privacy" title="Приватность">
          <Card className="max-w-lg p-6">
            <h3 className="mb-4 text-lg font-bold text-mira-text">Приватность</h3>
            <div className="space-y-4">
              {[
                { icon: Lock, label: "PIN-код", desc: "Защита входа в приложение", on: true },
                { icon: Bell, label: "Скрытые уведомления", desc: "Без деталей на экране блокировки", on: false },
                { icon: Heart, label: "Приватные отметки", desc: "Интимность скрыта по умолчанию", on: true },
                { icon: Eye, label: "Калории", desc: "Показывать калории в питании", on: true },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                    <p className="text-xs text-mira-muted">{item.desc}</p>
                  </div>
                  <Toggle on={item.on} />
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            27. ДОПОЛНИТЕЛЬНЫЙ РЕЖИМ
        ══════════════════════════════════════════ */}
        <Section id="religious" title="Дополнительный режим">
          <Card className="max-w-lg p-6">
            <h3 className="mb-1 text-lg font-bold text-mira-text">Дополнительный режим</h3>
            <p className="mb-4 text-sm text-mira-muted">
              Mira может добавить специальные отметки и настройки. Это необязательно, приватно и можно изменить позже.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Без режима", enabled: true, active: false },
                { label: "Ислам", enabled: true, active: true },
                { label: "Христианство", enabled: false },
                { label: "Иудаизм", enabled: false },
                { label: "Буддизм", enabled: false },
              ].map(opt => (
                <button key={opt.label} className={`rounded-2xl border p-4 text-left transition ${
                  opt.active
                    ? "border-mira-primary bg-mira-lavender-light shadow-card"
                    : opt.enabled
                      ? "border-mira-lavender/30 bg-white hover:border-mira-primary/30"
                      : "border-mira-lavender/20 bg-mira-bg opacity-50"
                }`}>
                  <p className={`text-sm font-semibold ${opt.active ? "text-mira-primary" : "text-mira-text"}`}>
                    {opt.label}
                  </p>
                  {!opt.enabled && <p className="mt-1 text-[10px] text-mira-muted">Скоро</p>}
                  {opt.active && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["Хайд", "Нифас", "Гусль", "Пост"].map(tag => (
                        <span key={tag} className="rounded-full bg-mira-primary/10 px-2 py-0.5 text-[10px] font-semibold text-mira-primary">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/50 p-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-mira-success" />
              <p className="text-xs text-mira-success">Mira не является источником фетв. В спорных вопросах лучше обратиться к знающему специалисту.</p>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            28. ИСЛАМСКИЙ РЕЖИМ
        ══════════════════════════════════════════ */}
        <Section id="islamic" title="Исламский режим">
          <Card className="max-w-lg p-6">
            <h3 className="mb-4 text-lg font-bold text-mira-text">Исламский режим</h3>
            <p className="mb-4 text-sm text-mira-muted">Дополнительные категории трекинга:</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Хайд", desc: "Менструация (фикх)", icon: "🔴" },
                { label: "Истихада", desc: "Кровотечение вне хайда", icon: "🟡" },
                { label: "Нифас", desc: "Послеродовое кровотечение", icon: "🟣" },
                { label: "Чистота", desc: "Состояние тахара", icon: "⚪" },
                { label: "Пост", desc: "Дни поста / пропуска", icon: "🌙" },
                { label: "Гусль", desc: "Полное омовение", icon: "💧" },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-mira-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-mira-primary/15 bg-mira-lavender-light/50 p-4">
              <p className="text-sm font-semibold text-mira-text">Дни к восполнению</p>
              <p className="mt-1 text-2xl font-bold text-mira-primary">3 <span className="text-sm font-normal text-mira-muted">дня</span></p>
              <p className="mt-1 text-xs text-mira-muted">Пропущенные дни поста</p>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════
            29. ОНБОРДИНГ
        ══════════════════════════════════════════ */}
        <Section id="onboarding" title="Онбординг">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Step 1: Welcome */}
            <Card className="flex flex-col items-center p-8 text-center">
              <Badge className="mb-2">1 / 7</Badge>
              <MiraLogo size={64} />
              <p className="mt-4 text-2xl font-bold text-mira-text">Mira</p>
              <p className="mt-1 text-sm text-mira-muted">Слушай себя</p>
              <p className="mt-3 text-xs text-mira-muted">Приватный трекер цикла и самочувствия</p>
              <Button className="mt-6 w-full">Начать</Button>
            </Card>

            {/* Step 2: Cycle */}
            <Card className="p-6">
              <Badge className="mb-3">2 / 7</Badge>
              <h3 className="text-lg font-bold text-mira-text">Настройка цикла</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                  <p className="text-xs text-mira-muted">Дата последних месячных</p>
                  <p className="text-sm font-semibold text-mira-text">10 июня 2026</p>
                </div>
                <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                  <p className="text-xs text-mira-muted">Длина цикла</p>
                  <p className="text-sm font-semibold text-mira-text">28 дней</p>
                </div>
                <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                  <p className="text-xs text-mira-muted">Длительность месячных</p>
                  <p className="text-sm font-semibold text-mira-text">5 дней</p>
                </div>
              </div>
              <Button className="mt-4 w-full">Далее</Button>
            </Card>

            {/* Step 3: What to track */}
            <Card className="p-6">
              <Badge className="mb-3">3 / 7</Badge>
              <h3 className="text-lg font-bold text-mira-text">Что отслеживать</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Цикл", "Боль", "Настроение", "Энергия", "Сон", "Питание", "Тренировка", "Интимность"].map((item, i) => (
                  <button key={item} className={`rounded-2xl border p-2.5 text-xs font-semibold transition ${
                    i < 5 ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
                  }`}>
                    {i < 5 && <Check className="mr-1 inline h-3 w-3" />}{item}
                  </button>
                ))}
              </div>
              <Button className="mt-4 w-full">Далее</Button>
            </Card>

            {/* Step 4: Body data */}
            <Card className="p-6">
              <Badge className="mb-3">4 / 7</Badge>
              <h3 className="text-lg font-bold text-mira-text">Данные для питания</h3>
              <p className="mt-1 text-xs text-mira-muted">Можно пропустить</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Рост", value: "165 см" },
                  { label: "Вес", value: "58 кг" },
                  { label: "Возраст", value: "27 лет" },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                    <span className="text-xs text-mira-muted">{f.label}</span>
                    <span className="text-sm font-semibold text-mira-text">{f.value}</span>
                  </div>
                ))}
                <div>
                  <p className="mb-2 text-xs text-mira-muted">Уровень активности</p>
                  <div className="flex gap-2">
                    {["Низкий", "Средний", "Высокий"].map((v, i) => (
                      <Chip key={v} label={v} active={i === 1} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" className="flex-1">Пропустить</Button>
                <Button className="flex-1">Далее</Button>
              </div>
            </Card>

            {/* Step 5: Mode */}
            <Card className="p-6">
              <Badge className="mb-3">5 / 7</Badge>
              <h3 className="text-lg font-bold text-mira-text">Дополнительный режим</h3>
              <p className="mt-1 text-xs text-mira-muted">Необязательно и приватно</p>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Без режима", enabled: true, active: true },
                  { label: "Ислам", enabled: true },
                  { label: "Христианство · скоро", enabled: false },
                  { label: "Иудаизм · скоро", enabled: false },
                  { label: "Буддизм · скоро", enabled: false },
                ].map(opt => (
                  <button key={opt.label} className={`w-full rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                    opt.active
                      ? "border-mira-primary bg-mira-lavender-light text-mira-primary"
                      : opt.enabled
                        ? "border-mira-lavender/30 text-mira-text"
                        : "border-mira-lavender/20 text-mira-muted opacity-50"
                  }`}>{opt.label}</button>
                ))}
              </div>
              <Button className="mt-4 w-full">Далее</Button>
            </Card>

            {/* Step 6: Privacy */}
            <Card className="p-6">
              <Badge className="mb-3">6 / 7</Badge>
              <h3 className="text-lg font-bold text-mira-text">Приватность</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "PIN-код", desc: "Защита входа", on: false },
                  { label: "Скрытые уведомления", desc: "Без деталей", on: false },
                  { label: "Приватные отметки", desc: "Интимность скрыта", on: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
                    <div>
                      <p className="text-sm font-semibold text-mira-text">{item.label}</p>
                      <p className="text-xs text-mira-muted">{item.desc}</p>
                    </div>
                    <Toggle on={item.on} />
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full">Далее</Button>
            </Card>

            {/* Step 7: Done */}
            <Card className="flex flex-col items-center p-8 text-center sm:col-span-2 lg:col-span-1">
              <Badge className="mb-3">7 / 7</Badge>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mira-success/10">
                <Check className="h-8 w-8 text-mira-success" />
              </div>
              <p className="mt-4 text-2xl font-bold text-mira-text">Mira настроена</p>
              <p className="mt-2 text-sm text-mira-muted">Всё готово для отслеживания</p>
              <Button className="mt-6 w-full" size="lg">Начать</Button>
            </Card>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            30. DESIGN TOKENS REFERENCE
        ══════════════════════════════════════════ */}
        <Section id="tokens" title="Дизайн-токены (справка)">
          <Card className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Скругления</p>
                <div className="space-y-2">
                  {[
                    { label: "Кнопки, бейджи", value: "rounded-2xl (16px)" },
                    { label: "Карточки", value: "rounded-3xl (24px)" },
                    { label: "Чипы", value: "rounded-full" },
                    { label: "Логотип", value: "22% от размера" },
                  ].map(t => (
                    <div key={t.label} className="flex justify-between text-xs">
                      <span className="text-mira-text">{t.label}</span>
                      <span className="text-mira-muted">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Тени</p>
                <div className="space-y-2">
                  {[
                    { label: "shadow-card", value: "0 2px 12px rgba(45,38,64,0.04)" },
                    { label: "shadow-soft", value: "0 8px 32px rgba(45,38,64,0.06)" },
                    { label: "shadow-glow", value: "0 12px 40px rgba(155,142,196,0.2)" },
                  ].map(t => (
                    <div key={t.label} className="flex justify-between text-xs">
                      <span className="text-mira-text">{t.label}</span>
                      <span className="font-mono text-mira-muted">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Breakpoints</p>
                <div className="space-y-2">
                  {[
                    { label: "Mobile", value: "< 640px" },
                    { label: "Tablet", value: "640–1023px" },
                    { label: "Desktop", value: "≥ 1024px" },
                    { label: "Wide", value: "≥ 1440px" },
                  ].map(t => (
                    <div key={t.label} className="flex justify-between text-xs">
                      <span className="text-mira-text">{t.label}</span>
                      <span className="text-mira-muted">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-mira-muted">Адаптивность</p>
                <div className="space-y-2 text-xs text-mira-muted">
                  <p>Desktop: sidebar + 2-3 колонки + max-w 1200px</p>
                  <p>Tablet: compact sidebar + 2 колонки</p>
                  <p>Mobile: bottom nav + 1 колонка + bottom sheet</p>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Footer */}
        <div className="mt-20 border-t border-mira-lavender/20 pt-8 text-center">
          <MiraLogo size={32} />
          <p className="mt-3 text-xs text-mira-muted">Mira Design System · v1.0</p>
          <p className="mt-1 text-xs text-mira-muted">Lavender palette · Plus Jakarta Sans · iOS-like</p>
        </div>
      </div>
    </div>
  );
}
