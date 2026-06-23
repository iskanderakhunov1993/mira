# Ромашка

Ромашка — body-aware AI wellness coach для женщин. Продукт каждый день
отвечает на вопрос: «Что лучше для моего тела сегодня?», учитывая цикл,
сон, энергию, нагрузку и питание.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:4173](http://localhost:4173).

Production-сборка:

```bash
npm run build
```

## Текущее состояние

Веб-приложение (`apps/web`) реализует:
- Landing + регистрация + онбординг (цель, цикл, ритм, фокус)
- Десктоп-дашборд с сайдбаром и CycleWheel
- Мобильный adaptive layout с bottom nav
- Ежедневный check-in (энергия, сон, боль, симптомы, стресс)
- Цикл-трекинг с фазами и прогнозом овуляции/менструации
- AI-генерация тренировок (Groq + fallback)
- Анализ еды по фото (Yandex Vision / Groq)
- Календарь цикла с отметками по дням
- Вечерняя рефлексия и аналитика
- Guided tour для первого запуска
- Supabase auth (email sign-up/sign-in, password recovery)
- PWA manifest

Архитектура описана в [docs/MIRA_ARCHITECTURE.md](docs/MIRA_ARCHITECTURE.md).

---

## Бэклог продукта

### Неделя 1 — Фундамент облачного хранения

| # | Задача | Приоритет | Оценка |
|---|--------|-----------|--------|
| 1 | Создать `lib/supabaseSync.ts` — слой записи/чтения check-ins, workouts, meals в Supabase | P0 | 4ч |
| 2 | При наличии сессии автоматически сохранять check-in и в localStorage, и в Supabase | P0 | 2ч |
| 3 | Сохранять профиль онбординга в таблицу `profiles` после регистрации | P0 | 2ч |
| 4 | Сохранять workouts и workout_exercises в Supabase после завершения | P0 | 3ч |
| 5 | Сохранять meal_logs с результатами AI-анализа в Supabase | P0 | 2ч |
| 6 | Сохранять cycle_logs при отметке "Начались месячные" | P0 | 1ч |
| 7 | Загрузка данных из Supabase при логине на новом устройстве | P1 | 4ч |

### Неделя 2 — AI через Edge Functions

| # | Задача | Приоритет | Оценка |
|---|--------|-----------|--------|
| 8 | Перенести `generate-workout` из Next.js API route в Supabase Edge Function | P0 | 3ч |
| 9 | Перенести `analyze-meal` в Supabase Edge Function (ключи не в клиенте) | P0 | 3ч |
| 10 | Добавить Edge Function `daily-decision` — план дня через AI (structured output) | P1 | 4ч |
| 11 | Добавить Edge Function `replace-exercise` — замена при боли | P1 | 2ч |
| 12 | Логировать все AI-вызовы в таблицу `ai_runs` (модель, latency, cost) | P1 | 2ч |
| 13 | Добавить fallback на demo-данные если Edge Function недоступна | P1 | 2ч |

### Неделя 3 — Качество и polish

| # | Задача | Приоритет | Оценка |
|---|--------|-----------|--------|
| 14 | Offline-first: очередь записей, sync при восстановлении сети | P1 | 4ч |
| 15 | Анимации перехода между экранами (framer-motion page transitions) | P2 | 3ч |
| 16 | Skeleton loading для карточек при загрузке данных | P2 | 2ч |
| 17 | Тёмная тема (ТЕМА toggle в TopBar) | P2 | 4ч |
| 18 | Responsive polish: tablet breakpoint, iPad layout | P2 | 3ч |
| 19 | Error boundary + toast уведомления при ошибках сети | P1 | 2ч |
| 20 | E2E тесты: онбординг → check-in → тренировка → meal flow | P1 | 4ч |

### Неделя 4 — Подготовка к деплою

| # | Задача | Приоритет | Оценка |
|---|--------|-----------|--------|
| 21 | Настроить Vercel deployment (env vars, preview branches) | P0 | 2ч |
| 22 | Supabase production project + apply migrations | P0 | 1ч |
| 23 | Custom domain + SSL | P0 | 1ч |
| 24 | PWA: service worker, offline page, install prompt | P1 | 3ч |
| 25 | Open Graph мета-теги + социальная preview-картинка | P2 | 1ч |
| 26 | Rate limiting на API routes | P1 | 2ч |
| 27 | GDPR: кнопка экспорта/удаления данных в профиле | P0 | 3ч |
| 28 | Security audit: проверить RLS, убрать секреты из клиента | P0 | 2ч |

---

## Месячный план (после запуска)

### Месяц 1 — Валидация MVP

- [ ] Запустить с 10–15 тестовыми пользователями
- [ ] Собрать метрики: D7 retention, completion rate check-in, workout relevance score
- [ ] A/B: сравнить AI-план дня vs. статический план
- [ ] Добавить NPS-опрос после 7 дней использования
- [ ] Исправить top-3 UX-проблемы из обратной связи

### Месяц 2 — Expo Mobile App

- [ ] Expo Router + React Native приложение
- [ ] Apple/email auth через Supabase
- [ ] Push-уведомления (утренний check-in, вечерняя рефлексия)
- [ ] Apple Health интеграция (сон, шаги, HRV)
- [ ] Камера для meal photo + body scan
- [ ] StoreKit: trial + подписка

### Месяц 3 — Платный MVP

- [ ] Subscription entitlement service
- [ ] Usage limits для бесплатного tier
- [ ] Cohort analytics dashboard
- [ ] Model evaluation: точность рекомендаций vs. feedback
- [ ] Safety review: аудит всех AI-ответов на медицинские claims
- [ ] Deletion/export tooling (GDPR compliance)

---

## Метрики успеха

| Метрика | Цель |
|---------|------|
| D7 retention | ≥ 25% |
| 2+ check-ins за неделю 1 | ≥ 50% |
| 2+ тренировки | ≥ 70% от активных |
| Workout relevance (self-report) | ≥ 60% "relevant" |
| Meal correction < 15 сек | ≥ 80% |
| Inappropriate exercise reports | < 5% |

---

## AI-анализ еды по фото

Фото отправляется не напрямую в OpenAI, а через API route / Edge Function.
Так секретный ключ никогда не попадает в браузер.

## Legacy iOS prototype

Предыдущий SwiftUI-прототип сохранён в `FitFlow/`. После проверки веб-гипотезы
интерфейс Ромашки переносится в Expo/React Native.
