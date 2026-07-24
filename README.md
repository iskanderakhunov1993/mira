# Mira

Mira — приватный трекер цикла и самочувствия. Telegram Mini App и PWA используют один Mira API; пользовательская история хранится в PostgreSQL в зашифрованном виде. Health-данные не сохраняются в IndexedDB или localStorage браузера.

Полный контракт backend, endpoints, переменные окружения и production checklist: [`docs/API.md`](docs/API.md).

## Локальный запуск

1. Установите зависимости: `npm install`.
2. Создайте PostgreSQL-базу и задайте переменные из `.env.example`.
3. Сгенерируйте отдельные секреты сессии и данных, например `openssl rand -base64 32`.
4. Примените схему: `npm run db:migrate`.
5. Запустите API: `npm run dev:api`.
6. В отдельном терминале запустите PWA: `npm run dev`.

Откройте `http://localhost:5173/`.

Для локального browser-тестирования без Telegram можно включить только development-режим:

```bash
MIRA_ALLOW_DEV_AUTH=true
VITE_MIRA_DEV_USER_ID=1001
```

`MIRA_ALLOW_DEV_AUTH` запрещено включать в production. В Telegram Mini App клиент передаёт `initData`, а backend проверяет подпись с помощью `TELEGRAM_BOT_TOKEN`.

## Тестовые профили

Каждый тестовый профиль — резервная копия в JSON. После входа откройте **Профиль → Управлять данными → Импортировать копию** и выберите нужный файл:

| Профиль | Сценарий | Файл |
| --- | --- | --- |
| Тест · без цикла | Онбординг завершён, месячные ещё не отмечались | [`public/test-profiles/no-cycle.json`](public/test-profiles/no-cycle.json) |
| Тест · первый цикл | Первый цикл начат, завершённой истории ещё нет | [`public/test-profiles/first-cycle.json`](public/test-profiles/first-cycle.json) |
| Тест · 1 завершённый цикл | Один завершённый цикл и текущий цикл | [`public/test-profiles/one-completed-cycle.json`](public/test-profiles/one-completed-cycle.json) |
| Тест · 3 завершённых цикла | Три завершённых цикла и текущий цикл | [`public/test-profiles/three-completed-cycles.json`](public/test-profiles/three-completed-cycles.json) |
| Тест · 5 завершённых циклов | Пять завершённых циклов и текущий цикл | [`public/test-profiles/five-completed-cycles.json`](public/test-profiles/five-completed-cycles.json) |

Профили содержат тестовые отметки кровотечения, самочувствия, сна, воды и шагов. Импорт полностью заменяет текущую серверную историю аккаунта. Чтобы пересоздать даты относительно текущего дня, выполните `npm run generate:test-profiles`.

## Продакшен-сборка

```bash
npm test
npm run test:server
npm run build
```

Готовая статическая сборка создаётся в `dist/`. Её можно разместить на любом статическом хостинге с HTTPS.

## PWA и работа без сети

Production-сборка регистрирует service worker и сохраняет только app shell после первого успешного открытия. Health API и пользовательская история не кешируются. Без сети shell может открыться, но история не загружается и новые записи не сохраняются.

Проверка PWA-артефактов:

```bash
npm run build
npm run verify:pwa
```

## Конфигурация

Frontend:

```bash
VITE_MIRA_API_URL=https://api.example.com
VITE_FEEDBACK_ENDPOINT=https://example.com/api/feedback
VITE_TELEGRAM_URL=https://t.me/example
VITE_DONATION_URL=https://example.com/support
```

Backend требует `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `MIRA_SESSION_SECRET` и `MIRA_DATA_ENCRYPTION_KEY`. Причина зависимости `pg`: это единственный runtime-драйвер для PostgreSQL; HTTP API реализован на встроенном Node.js без отдельного web-фреймворка.

Endpoint обратной связи должен принимать такой JSON-контракт:

```json
{
  "category": "idea",
  "message": "Feedback text",
  "contact": "optional",
  "clientVersion": "0.1.0"
}
```

После принятия сообщения endpoint должен вернуть любой ответ HTTP `2xx`. Без endpoint Mira использует системное меню «Поделиться» или копирует сообщение. Записи дневника к обратной связи не прикрепляются.

## Ограничения приватности

- Для загрузки и сохранения истории требуется интернет.
- Доступ к данным определяется проверенным Telegram-аккаунтом.
- Сервер хранит зашифрованное состояние; ключ задаётся отдельно от подключения к БД.
- Заметки и интимные данные исключены из обычной копии и отчёта по умолчанию.
- Mira не является медицинским устройством и не ставит диагноз.

Политика приватности включена в сборку по адресу `/privacy.html`. Перед публичным запуском настройте HTTPS, реальный контакт поддержки и принадлежащие проекту продакшен-ссылки выше.
