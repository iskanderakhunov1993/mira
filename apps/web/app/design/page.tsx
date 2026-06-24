"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, Sun, Heart, Droplets, Flame, Brain,
  BedDouble, Sparkles, Activity, Baby,
  Calendar, ChartNoAxesCombined, Dumbbell, Salad,
  UserRound, BookOpen, Shield, ChevronRight
} from "lucide-react";

const phases = [
  { name: "Менструация", days: "1–5", color: "bg-rose-400", desc: "Отдых и восстановление" },
  { name: "Фолликулярная", days: "6–13", color: "bg-violet-400", desc: "Энергия растёт" },
  { name: "Овуляция", days: "14–16", color: "bg-pink-400", desc: "Пик энергии" },
  { name: "Лютеиновая", days: "17–28", color: "bg-amber-400", desc: "Замедление" },
];

const trackingCategories = [
  { icon: Droplets, label: "Месячные", color: "text-rose-500 bg-rose-50" },
  { icon: Activity, label: "Боль", color: "text-orange-500 bg-orange-50" },
  { icon: Brain, label: "Настроение", color: "text-violet-500 bg-violet-50" },
  { icon: Flame, label: "Энергия", color: "text-amber-500 bg-amber-50" },
  { icon: BedDouble, label: "Сон", color: "text-indigo-500 bg-indigo-50" },
  { icon: Heart, label: "Интимность", color: "text-pink-500 bg-pink-50" },
  { icon: Sparkles, label: "ПМС", color: "text-purple-500 bg-purple-50" },
  { icon: Salad, label: "Питание", color: "text-emerald-500 bg-emerald-50" },
  { icon: BookOpen, label: "Заметка", color: "text-slate-500 bg-slate-50" },
];

const moodOptions = ["Нормально", "Радость", "Грусть", "Злость", "Тревога", "Перепады"];
const energyOptions = ["Истощение", "Мало сил", "Нормально", "Много сил"];
const painOptions = ["Нет боли", "Спазмы", "Низ живота", "Голова", "Грудь", "Спина"];

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F5]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C47E9B] to-[#9B8EC4] shadow-lg">
            <Moon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#2D2A26] sm:text-5xl">
            Mira
          </h1>
          <p className="mt-2 text-lg text-[#9B978F]">Слушай себя</p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-[#9B978F]">
            Дизайн-система приватного веб-приложения для отслеживания цикла, самочувствия, питания и активности.
          </p>
        </div>

        {/* ── Colors ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Палитра</h2>
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { name: "Background", hex: "#FBF8F5", cls: "bg-[#FBF8F5] border" },
              { name: "Card", hex: "#FFFFFF", cls: "bg-white border" },
              { name: "Text", hex: "#2D2A26", cls: "bg-[#2D2A26] text-white" },
              { name: "Muted", hex: "#9B978F", cls: "bg-[#9B978F] text-white" },
              { name: "Primary", hex: "#9B8EC4", cls: "bg-[#9B8EC4] text-white" },
              { name: "Cycle", hex: "#C47E9B", cls: "bg-[#C47E9B] text-white" },
              { name: "Success", hex: "#7BAF8D", cls: "bg-[#7BAF8D] text-white" },
              { name: "Warm", hex: "#E8C5A0", cls: "bg-[#E8C5A0]" },
            ].map(c => (
              <div key={c.name} className="text-center">
                <div className={`h-16 rounded-2xl ${c.cls} border-[#F0ECE6] shadow-sm`} />
                <p className="mt-2 text-xs font-semibold text-[#2D2A26]">{c.name}</p>
                <p className="text-[10px] text-[#9B978F]">{c.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Типографика</h2>
          <Card className="space-y-4 p-6">
            <p className="text-4xl font-bold tracking-tight text-[#2D2A26]">Заголовок H1 — Plus Jakarta Sans</p>
            <p className="text-2xl font-bold text-[#2D2A26]">Заголовок H2</p>
            <p className="text-lg font-semibold text-[#2D2A26]">Заголовок H3</p>
            <p className="text-base text-[#2D2A26]">Основной текст — 16px</p>
            <p className="text-sm text-[#9B978F]">Вторичный текст — 14px muted</p>
            <p className="text-xs text-[#9B978F]">Подпись — 12px</p>
          </Card>
        </section>

        {/* ── Buttons ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Кнопки</h2>
          <Card className="flex flex-wrap items-center gap-4 p-6">
            <Button>Отследить сегодня</Button>
            <Button variant="secondary">Подробнее</Button>
            <Button variant="outline">Пропустить</Button>
            <Button variant="ghost">Отмена</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Начать тренировку</Button>
          </Card>
        </section>

        {/* ── Badges ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Бейджи</h2>
          <Card className="flex flex-wrap gap-3 p-6">
            <Badge>День 16</Badge>
            <Badge className="border-rose-200 bg-rose-50 text-rose-600">Менструация</Badge>
            <Badge className="border-violet-200 bg-violet-50 text-violet-600">Фолликулярная</Badge>
            <Badge className="border-pink-200 bg-pink-50 text-pink-600">Овуляция</Badge>
            <Badge className="border-amber-200 bg-amber-50 text-amber-600">Лютеиновая</Badge>
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-600">Норма</Badge>
          </Card>
        </section>

        {/* ── Cards ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Карточки</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9B978F]">Карточка</p>
              <p className="mt-2 text-lg font-bold text-[#2D2A26]">Стандартная</p>
              <p className="mt-1 text-sm text-[#9B978F]">Белый фон, мягкая тень, скруглённые углы 2rem</p>
            </Card>
            <Card className="border-[#C47E9B]/20 bg-gradient-to-br from-rose-50 to-violet-50">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C47E9B]">Акцентная</p>
              <p className="mt-2 text-lg font-bold text-[#2D2A26]">Цикл</p>
              <p className="mt-1 text-sm text-[#9B978F]">Градиент rose → violet для фаз цикла</p>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7BAF8D]">Позитивная</p>
              <p className="mt-2 text-lg font-bold text-[#2D2A26]">Успех</p>
              <p className="mt-1 text-sm text-[#9B978F]">Мягкий зелёный для подтверждений</p>
            </Card>
          </div>
        </section>

        {/* ── Cycle Wheel Concept ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Круг цикла</h2>
          <Card className="flex flex-col items-center p-8">
            <div className="relative h-64 w-64">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                {/* Background ring */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#F0ECE6" strokeWidth="12" />
                {/* Menstruation segment (days 1-5, ~18%) */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#F472B6" strokeWidth="12"
                  strokeDasharray="96 438" strokeDashoffset="134" strokeLinecap="round" />
                {/* Follicular (days 6-13, ~29%) */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#A78BFA" strokeWidth="12"
                  strokeDasharray="154 380" strokeDashoffset="38" strokeLinecap="round" opacity="0.7" />
                {/* Ovulation (days 14-16, ~11%) */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#F9A8D4" strokeWidth="12"
                  strokeDasharray="57 477" strokeDashoffset="-116" strokeLinecap="round" opacity="0.7" />
                {/* Luteal (days 17-28, ~43%) */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#FBBF24" strokeWidth="12"
                  strokeDasharray="227 307" strokeDashoffset="-173" strokeLinecap="round" opacity="0.4" />
                {/* Today marker */}
                <circle cx="100" cy="18" r="8" fill="#9B8EC4" stroke="white" strokeWidth="3" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-[#2D2A26]">16</span>
                <span className="text-sm font-semibold text-[#9B8EC4]">Фолликулярная</span>
                <span className="mt-1 text-xs text-[#9B978F]">~5 дней до месячных</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {phases.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${p.color}`} />
                  <span className="text-xs text-[#9B978F]">{p.name} ({p.days})</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Tracking Categories ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Категории трекинга</h2>
          <Card className="p-6">
            <p className="mb-4 text-sm text-[#9B978F]">9 категорий для ежедневного отслеживания:</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
              {trackingCategories.map(cat => (
                <button key={cat.label} className="flex flex-col items-center gap-2 rounded-2xl border border-[#F0ECE6] bg-white p-4 shadow-sm transition hover:shadow-soft active:scale-[0.98]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#2D2A26]">{cat.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Mood/Energy/Pain Chips ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Чипы выбора</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-[#2D2A26]">Настроение</p>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((m, i) => (
                  <button key={m} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    i === 0 ? 'border-[#9B8EC4] bg-[#F0EDF5] text-[#9B8EC4]' : 'border-[#F0ECE6] bg-white text-[#9B978F] hover:border-[#9B8EC4]'
                  }`}>{m}</button>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-[#2D2A26]">Энергия</p>
              <div className="flex flex-wrap gap-2">
                {energyOptions.map((e, i) => (
                  <button key={e} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    i === 2 ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-[#F0ECE6] bg-white text-[#9B978F] hover:border-amber-300'
                  }`}>{e}</button>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-[#2D2A26]">Боль</p>
              <div className="flex flex-wrap gap-2">
                {painOptions.map((p, i) => (
                  <button key={p} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    i === 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-[#F0ECE6] bg-white text-[#9B978F] hover:border-orange-300'
                  }`}>{p}</button>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ── Navigation Concept ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Навигация</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Desktop Sidebar */}
            <Card className="p-0 overflow-hidden">
              <p className="px-5 pt-5 text-xs font-semibold uppercase tracking-wider text-[#9B978F]">Desktop — Sidebar</p>
              <div className="mt-4 flex h-80">
                <div className="w-56 border-r border-[#F0ECE6] bg-[#FBF8F5] p-4">
                  <div className="flex items-center gap-2 px-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C47E9B] to-[#9B8EC4]">
                      <Moon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base font-bold text-[#2D2A26]">Mira</span>
                  </div>
                  {[
                    { icon: Sun, label: "Сегодня", active: true },
                    { icon: Calendar, label: "Цикл" },
                    { icon: BookOpen, label: "Дневник" },
                    { icon: Salad, label: "Питание" },
                    { icon: Dumbbell, label: "Тренировка" },
                    { icon: ChartNoAxesCombined, label: "Аналитика" },
                    { icon: UserRound, label: "Профиль" },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                      item.active ? 'bg-[#F0EDF5] font-semibold text-[#9B8EC4]' : 'text-[#9B978F]'
                    }`}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-[#FBF8F5] p-4">
                  <p className="text-xs text-[#9B978F]">Контент страницы</p>
                </div>
              </div>
            </Card>

            {/* Mobile Bottom Nav */}
            <Card className="p-0 overflow-hidden">
              <p className="px-5 pt-5 text-xs font-semibold uppercase tracking-wider text-[#9B978F]">Mobile — Bottom Navigation</p>
              <div className="relative mt-4 mx-auto w-[320px] h-80 rounded-3xl border-2 border-[#E8E4DE] bg-[#FBF8F5] overflow-hidden">
                <div className="p-4">
                  <p className="text-xs text-[#9B978F]">Контент экрана</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-around border-t border-[#F0ECE6] bg-white px-2 py-3">
                  {[
                    { icon: Sun, label: "Сегодня", active: true },
                    { icon: Calendar, label: "Цикл" },
                    { icon: BookOpen, label: "Дневник" },
                    { icon: ChartNoAxesCombined, label: "Аналитика" },
                    { icon: UserRound, label: "Профиль" },
                  ].map(item => (
                    <div key={item.label} className={`flex flex-col items-center gap-1 ${
                      item.active ? 'text-[#9B8EC4]' : 'text-[#9B978F]'
                    }`}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── Dashboard Preview ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Экран «Сегодня» — концепт</h2>
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-[#9B978F]">Добрый день</p>
                <p className="text-2xl font-bold text-[#2D2A26]">Привет, Амина ✨</p>
              </div>
              <Badge>24 июня, вторник</Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              {/* Main column */}
              <div className="space-y-4">
                {/* Cycle card */}
                <div className="rounded-3xl border border-[#C47E9B]/15 bg-gradient-to-br from-rose-50/80 to-violet-50/80 p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#F0ECE6" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#A78BFA" strokeWidth="6"
                          strokeDasharray="152 112" strokeDashoffset="66" strokeLinecap="round" opacity="0.6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#F472B6" strokeWidth="6"
                          strokeDasharray="47 217" strokeDashoffset="66" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-[#2D2A26]">16</span>
                        <span className="text-[10px] text-[#9B978F]">день</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#2D2A26]">Фолликулярная фаза</p>
                      <p className="text-sm text-[#9B978F]">Следующие месячные ~через 12 дней</p>
                      <Badge className="mt-2 border-violet-200 bg-violet-50 text-violet-600">Энергия растёт</Badge>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full" size="lg">
                  Отследить сегодня
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Mini cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="border-emerald-100 bg-emerald-50/30 p-4">
                    <div className="flex items-center gap-2">
                      <Salad className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-[#9B978F]">Питание сегодня</span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-[#2D2A26]">950 / 1800 ккал</p>
                    <div className="mt-2 h-1.5 rounded-full bg-emerald-100">
                      <div className="h-full w-[53%] rounded-full bg-emerald-400" />
                    </div>
                  </Card>
                  <Card className="border-violet-100 bg-violet-50/30 p-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-violet-500" />
                      <span className="text-xs font-semibold text-[#9B978F]">Тренировка</span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-[#2D2A26]">20 мин · лёгкая</p>
                    <p className="mt-1 text-xs text-[#9B978F]">Подходит для вашего состояния</p>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card className="border-amber-100 bg-amber-50/30 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600">Полезное сегодня</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#2D2A26]">Как поддержать энергию</p>
                  <p className="mt-1 text-xs text-[#9B978F]">2 мин чтения</p>
                </Card>

                <Card className="p-4">
                  <p className="text-xs font-semibold text-[#9B978F]">Сегодня отмечено</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                      <span className="text-[#2D2A26]">Настроение: нормально</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-[#2D2A26]">Энергия: много сил</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      <span className="text-[#2D2A26]">Сон: 7.5 ч, хороший</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Islamic Mode Preview ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Дополнительный режим</h2>
          <Card className="p-6">
            <p className="text-sm text-[#9B978F] mb-4">
              Mira может добавить специальные отметки и настройки. Это необязательно, приватно и можно изменить позже.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Без режима", active: false, enabled: true },
                { label: "Ислам", active: true, enabled: true },
                { label: "Христианство", active: false, enabled: false },
                { label: "Иудаизм", active: false, enabled: false },
              ].map(opt => (
                <button key={opt.label} className={`rounded-2xl border p-4 text-left transition ${
                  opt.active
                    ? 'border-[#9B8EC4] bg-[#F0EDF5] shadow-sm'
                    : opt.enabled
                      ? 'border-[#F0ECE6] bg-white hover:border-[#9B8EC4]/30'
                      : 'border-[#F0ECE6] bg-[#F8F6F3] opacity-50'
                }`}>
                  <p className={`text-sm font-semibold ${opt.active ? 'text-[#9B8EC4]' : 'text-[#2D2A26]'}`}>{opt.label}</p>
                  {!opt.enabled && <p className="mt-1 text-xs text-[#9B978F]">Скоро</p>}
                  {opt.active && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Хайд", "Нифас", "Гусль", "Пост"].map(tag => (
                        <span key={tag} className="rounded-full bg-[#9B8EC4]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9B8EC4]">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-emerald-700">Mira не является источником фетв. В спорных вопросах лучше обратиться к знающему специалисту.</p>
            </div>
          </Card>
        </section>

        {/* ── Privacy ── */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[#2D2A26]">Приватность</h2>
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Shield, label: "PIN-код", desc: "Защита входа" },
                { icon: Moon, label: "Скрытые уведомления", desc: "Без деталей на экране блокировки" },
                { icon: Heart, label: "Приватные отметки", desc: "Интимность скрыта по умолчанию" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-[#F0ECE6] bg-[#FBF8F5] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EDF5] text-[#9B8EC4]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2D2A26]">{item.label}</p>
                    <p className="mt-0.5 text-xs text-[#9B978F]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
