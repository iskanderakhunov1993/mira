# Ayla

Ayla — body-aware AI fitness & wellness coach для женщин. Продукт каждый день
отвечает на вопрос: «Что лучше для моего тела сегодня?»

## Web MVP

```bash
npm install
npm run dev
```

Откройте [http://localhost:4173](http://localhost:4173).

Production-сборка:

```bash
npm run build
```

Веб-приложение находится в `apps/web`. Оно реализует dashboard, ежедневный
check-in, адаптивную генерацию тренировки, замену болезненного упражнения,
питание по фото, body scan history и профиль.

Без настроенного backend экран питания работает в demo-режиме. Архитектура
production-версии описана в [docs/AYLA_ARCHITECTURE.md](docs/AYLA_ARCHITECTURE.md).

## AI-анализ еды по фото

Фото отправляется не напрямую в OpenAI, а в Supabase Edge Function
`analyze-meal`. Так секретный ключ никогда не попадает в браузер.

1. Создайте проект Supabase и установите Supabase CLI.
2. Скопируйте `.env.example` в `.env.local` и заполните публичные значения.
3. Добавьте серверный секрет:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

Локальный запуск функции:

```bash
supabase start
supabase functions serve analyze-meal
supabase functions serve analyze-body
```

Деплой:

```bash
supabase functions deploy analyze-meal
supabase functions deploy analyze-body
```

Функция использует vision-модель с Structured Outputs и возвращает диапазоны
калорий и БЖУ, confidence score, состав блюда и факторы неопределённости.
Результат остаётся приблизительным: одно фото не позволяет точно определить
массу, масло, соусы и скрытые ингредиенты.

`analyze-body` принимает три ракурса, отмеченные пользователем зоны боли и
цель. Она возвращает только нейтральные визуальные ориентиры, качество кадров
и рекомендации для тренировочного движка. Функция не угадывает вес или процент
жира и не ставит диагнозы по фотографии.

## Legacy iOS prototype

Предыдущий SwiftUI-прототип сохранён в `FitFlow/`. После проверки веб-гипотезы
интерфейс Ayla переносится в Expo/React Native с общей доменной логикой.
