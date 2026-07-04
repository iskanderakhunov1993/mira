# Mira QA Smoke Checklist

## Перед проверкой

```bash
npm run dev --workspace=@mira/web
```

Открыть `http://localhost:4173`.

## Автосмок

```bash
npm run smoke --workspace=@mira/web
```

Smoke использует demo seed и проверяет:

- `/demo` создаёт пользователя и переводит в `/analysis`.
- Analysis CTA открывает `/report`.
- Report показывает privacy controls и export buttons.
- Today открывает календарь и режим отметки месячных.
- Today сохраняет воду, калории и вес в дневной лог текущего дня.
- Today показывает воду как `Вода` + литры, без процента цели и количества стаканов.
- Today показывает калории и вес двумя равными карточками 50/50 без food-context чипов.
- Today `Секс` сохраняет отметку через модалку.
- Profile shortcut открывает doctor report.

Если системный Chrome недоступен, установить Playwright browsers:

```bash
npx playwright install chromium
PLAYWRIGHT_CHROME_CHANNEL=chromium npm run smoke --workspace=@mira/web
```

## Ручной P0 Flow

1. Открыть `/demo`.
2. Убедиться, что пользователь попал в `/analysis`.
3. Нажать `Собрать отчёт врачу`.
4. Проверить в `/report`, что `Личные заметки` и `Секс и контрацепция` выключены по умолчанию.
5. Нажать `Скачать TXT`, `PDF / печать`, `Вопросы`.
6. Перейти на `/today`.
7. Нажать календарь в шапке: должен открыться красивый календарь просмотра.
8. Нажать `Месячные`: должен открыться календарь отметки месячных.
9. Нажать `Симптомы`: должен открыться `/track`.
10. Вернуться на `/today`, нажать `Секс`, выбрать вариант и сохранить.
11. Проверить блок воды: заголовок `Вода`, значение в литрах, текста `% цели` и `стаканов` нет.
12. Проверить блоки 50/50: слева `Калории` с вводом калорий, справа `Вес кг` с вводом веса.
13. Убедиться, что вариантов `обычно`, `мало еды`, `сладкое`, `тяжёлая еда` нет.
14. Сохранить воду, калории и вес.
15. Перейти в `/analysis` и `/report`, убедиться, что приложение не падает.

## Минимальный Release Gate

- TypeScript: `npm run lint --workspace=@mira/web`.
- Smoke: `npm run smoke --workspace=@mira/web`.
- Routes 200: `/today`, `/track`, `/analysis`, `/report`, `/profile`, `/demo`, `/offline`.
- Нет console/page errors в smoke.
- Sensitive report sections off by default.

## Известные ограничения MVP

- TXT download в headless Chrome может не всегда отдавать Playwright `download` event для blob URL, поэтому smoke проверяет runtime stability export-кнопки.
- PDF использует `window.print()`, финальный PDF зависит от браузера пользователя.
- Smoke предполагает локальный dev server на `http://localhost:4173` или `MIRA_BASE_URL`.
