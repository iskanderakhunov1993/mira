# Mira — Слушай себя

Приватное веб-приложение для отслеживания цикла и самочувствия, которое помогает понять личную норму и подготовить понятный отчёт врачу.

**Не диагноз, а дневник наблюдений. Не контроль, а забота. Не по памяти, а с фактами.**

🌐 **Прод**: http://201.51.9.114
📱 **PWA**: устанавливается на телефон из браузера

---

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:4173

```bash
npm run build && npm start
```

## Архитектура

```
mira/
├── apps/web/              # Next.js 15 web app
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Entry → /today
│   │   ├── today/         # Daily summary route
│   │   ├── track/         # Manual medical diary route
│   │   ├── care/          # Lifestyle tracking route
│   │   ├── analysis/      # Cautious pattern insights
│   │   ├── report/        # Doctor-ready report
│   │   ├── profile/       # Profile, privacy, sync
│   │   └── api/           # Health/API routes
│   ├── components/
│   │   ├── layout/        # RouterShell and tab navigation
│   │   ├── screens/       # All screen components
│   │   └── ui/            # Button, Card, Badge, MiraLogo
│   ├── lib/
│   │   ├── types.ts       # Local-first health data types
│   │   ├── store.ts       # localStorage CRUD + cycle calculations
│   │   └── routeData.ts   # Route data adapters
│   └── public/
│       ├── icons/         # PWA icons (192, 512, maskable)
│       └── sw.js          # Service worker (offline support)
├── shared/                # Future shared AI contracts
├── docs/                  # Product & architecture docs
└── supabase/              # Future Supabase config (migrations, functions)
```

## Навигация

**MVP routes**:
Сегодня → Забота → Отслеживать → Анализ → Отчёт → Профиль

## Функции

### Трекинг (9 категорий)
Месячные · Боль · Настроение · Энергия · Сон · Интимность · ПМС · Питание · Заметка

### Дневник и личная норма
История дней · Паттерны по симптомам · Норма-скан · Подготовка вопросов врачу

### Забота
Вода · движение · нагрузка · еда как контекст · вес

### Приватность
PIN · Скрытые уведомления · Экспорт/удаление данных

### Отчёт врачу
Краткое резюме · Факты за период · Вопросы на приём · Печать/экспорт TXT

## Стек

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Анимации**: Framer Motion
- **Хранение**: localStorage (local-first)
- **PWA**: Service Worker, Web App Manifest
- **Деплой**: PM2 + Nginx на VPS
- **Дизайн**: лавандовый (#9B8EC4), Plus Jakarta Sans, glassmorphism ∞

---

## Бэклог

### Фаза 1 — AI интеграция
- [ ] Claude/GPT для рекомендаций по питанию
- [ ] AI-генерация тренировок с учётом истории
- [ ] Персональные советы по паттернам цикла

### Фаза 2 — Облако и авторизация
- [ ] Supabase auth (email + social)
- [ ] Синхронизация между устройствами
- [ ] Row Level Security

### Фаза 3 — Мобильное приложение
- [ ] Expo / React Native
- [ ] Push-уведомления
- [ ] Apple Health

### Фаза 4 — Монетизация
- [ ] Free tier + Premium (AI, аналитика)
- [ ] Подписка Stripe / App Store

### Улучшения
- [ ] Контент/статьи
- [ ] Режим партнёра
- [ ] Исламский режим
- [ ] Анализы как отдельный экран
- [ ] Генерация тренировок
- [ ] КБЖУ и полноценный дневник питания
- [ ] Тёмная тема
- [ ] Мультиязычность (en, ar)
- [ ] Импорт данных
- [ ] Интеграция с фитнес-трекерами

---

## Деплой

```bash
# На сервере (201.51.9.114)
cd /root/mira && git pull
cd apps/web && npx next build
pm2 restart mira
```

## Лицензия

MIT
