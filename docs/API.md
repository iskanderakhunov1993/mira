# Mira API

## Назначение

Mira API хранит одну зашифрованную историю пользователя и предоставляет к ней доступ Telegram Mini App. Активный frontend не сохраняет health-данные в IndexedDB или localStorage.

Текущая архитектура:

```text
Telegram Mini App
       │ initData
       ▼
Mira API ───── PostgreSQL
       │        ciphertext
       ▼
AES-256-GCM
```

API реализован на встроенном HTTP-сервере Node.js. Единственная runtime-зависимость backend — драйвер PostgreSQL `pg`.

## Статус реализации

Реализовано:

- проверка подписи Telegram Mini App `initData`;
- короткоживущая Bearer-сессия;
- получение, сохранение и удаление истории;
- optimistic locking через `revision`;
- AES-256-GCM шифрование состояния перед записью в PostgreSQL;
- привязка ciphertext к внутреннему `user_id` через Additional Authenticated Data;
- ограничение request body до 2 МБ;
- CORS для явно разрешённого origin;
- development-вход без Telegram, недоступный в production.

Ещё не реализовано:

- Telegram OIDC для входа в Mira из обычного браузера;
- смена и ротация ключа шифрования;
- полное удаление аккаунта и политика очистки резервных копий;
- rate limiting;
- audit trail административного доступа;
- автоматическое объединение конфликтующих версий;
- end-to-end encryption. Backend имеет ключ и технически может расшифровать данные.

## Переменные окружения

| Переменная | Обязательная | Назначение |
| --- | --- | --- |
| `DATABASE_URL` | Да | PostgreSQL connection string |
| `DATABASE_SSL` | Нет | Значение `require` включает проверяемый TLS |
| `TELEGRAM_BOT_TOKEN` | Да | Проверка подписи Telegram `initData` |
| `MIRA_SESSION_SECRET` | Да | HMAC-подпись сессионных токенов, минимум 32 символа |
| `MIRA_DATA_ENCRYPTION_KEY` | Да | Base64-ключ длиной 32 байта для AES-256-GCM |
| `MIRA_WEB_ORIGIN` | Для cross-origin | Разрешённый frontend origin для CORS |
| `MIRA_ALLOW_DEV_AUTH` | Нет | Development-вход; запрещён при `NODE_ENV=production` |
| `PORT` | Нет | Порт API, по умолчанию `8787` |

Секреты можно сгенерировать независимо:

```bash
openssl rand -base64 32
```

Нельзя использовать один секрет одновременно как `MIRA_SESSION_SECRET` и `MIRA_DATA_ENCRYPTION_KEY`.

Frontend использует:

| Переменная | Назначение |
| --- | --- |
| `VITE_MIRA_API_URL` | URL API; пустое значение означает same-origin `/api` |
| `VITE_MIRA_DEV_USER_ID` | Тестовый Telegram ID только для Vite development |

## Подготовка PostgreSQL

Применить схему:

```bash
DATABASE_URL=postgresql://user:password@host:5432/mira npm run db:migrate
```

Миграция находится в `server/migrations/001_server_state.sql`.

Создаются таблицы:

### `users`

| Поле | Тип | Назначение |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Внутренний ID пользователя |
| `telegram_user_id` | `TEXT UNIQUE` | Подтверждённый Telegram ID |
| `created_at` | `TIMESTAMPTZ` | Создание аккаунта |
| `last_seen_at` | `TIMESTAMPTZ` | Последняя успешная авторизация |

Имя, username и фотография Telegram не сохраняются.

### `user_states`

| Поле | Тип | Назначение |
| --- | --- | --- |
| `user_id` | `BIGINT` | Внешний ключ на `users.id` |
| `state_ciphertext` | `BYTEA` | Зашифрованный `AuraState` |
| `state_iv` | `BYTEA` | Уникальный AES-GCM IV |
| `state_tag` | `BYTEA` | Authentication tag |
| `revision` | `BIGINT` | Монотонная версия состояния |
| `updated_at` | `TIMESTAMPTZ` | Время последнего изменения |

## Запуск

```bash
npm run db:migrate
npm run dev:api
```

Для локального запуска без Telegram:

```bash
NODE_ENV=development \
MIRA_ALLOW_DEV_AUTH=true \
MIRA_SESSION_SECRET=replace-with-at-least-32-characters \
MIRA_DATA_ENCRYPTION_KEY=BASE64_32_BYTE_KEY \
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/mira \
npm run dev:api
```

В production `MIRA_ALLOW_DEV_AUTH=true` игнорируется.

## Авторизация

### Telegram Mini App

Frontend получает строку из `window.Telegram.WebApp.initData` и отправляет её API. Нельзя передавать или доверять `initDataUnsafe`.

```http
POST /api/v1/auth/telegram
Content-Type: application/json

{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

Backend:

1. строит Telegram data-check-string;
2. проверяет HMAC-SHA-256 с использованием bot token;
3. проверяет срок действия `auth_date`;
4. извлекает только подтверждённый Telegram user ID;
5. создаёт внутреннего пользователя или обновляет `last_seen_at`;
6. выдаёт подписанный сессионный токен.

Ответ:

```json
{
  "token": "payload.signature"
}
```

Все последующие запросы:

```http
Authorization: Bearer payload.signature
```

Сессия по умолчанию действует 12 часов и хранится frontend только в памяти открытой страницы.

### Development-вход

Доступен только при `MIRA_ALLOW_DEV_AUTH=true` и `NODE_ENV` не равном `production`:

```http
POST /api/v1/auth/telegram
Content-Type: application/json

{
  "devUserId": "1001"
}
```

## Endpoints

### Проверка API

```http
GET /api/health
```

Ответ:

```json
{
  "ok": true
}
```

Авторизация не требуется.

### Получить историю

```http
GET /api/v1/state
Authorization: Bearer TOKEN
```

Ответ нового пользователя:

```json
{
  "state": null,
  "revision": 0,
  "updatedAt": "2026-07-24T10:00:00.000Z"
}
```

Ответ пользователя с историей:

```json
{
  "state": {
    "version": 3,
    "entries": {},
    "periodStarts": []
  },
  "revision": 4,
  "updatedAt": "2026-07-24T10:05:00.000Z"
}
```

### Сохранить историю

```http
PUT /api/v1/state
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "state": {
    "version": 3,
    "entries": {},
    "periodStarts": []
  },
  "revision": 4
}
```

`revision` должна совпадать с текущей серверной версией.

Успешный ответ:

```json
{
  "revision": 5,
  "updatedAt": "2026-07-24T10:06:00.000Z"
}
```

Если другой клиент успел сохранить новую версию:

```http
409 Conflict
```

```json
{
  "error": "REVISION_CONFLICT"
}
```

API не перезаписывает более свежую историю автоматически.

### Удалить историю

```http
DELETE /api/v1/state?revision=5
Authorization: Bearer TOKEN
```

Успешный ответ:

```json
{
  "revision": 6,
  "updatedAt": "2026-07-24T10:07:00.000Z"
}
```

Удаляются encrypted state, IV и authentication tag. Запись пользователя и новый номер `revision` сохраняются, чтобы не допустить восстановления устаревшей версии.

## Ошибки

| HTTP | Код | Значение |
| --- | --- | --- |
| `400` | `BODY_INVALID` | Body не является JSON |
| `400` | `STATE_INVALID` | Некорректный формат состояния или revision |
| `400` | `REVISION_INVALID` | Некорректная revision при удалении |
| `401` | `TELEGRAM_AUTH_INVALID` | Неверная подпись или структура `initData` |
| `401` | `TELEGRAM_AUTH_EXPIRED` | Истёк `auth_date` |
| `401` | `SESSION_INVALID` | Неверная подпись сессии |
| `401` | `SESSION_EXPIRED` | Сессия истекла |
| `404` | `USER_NOT_FOUND` | Пользовательская запись отсутствует |
| `404` | `NOT_FOUND` | Endpoint не существует |
| `409` | `REVISION_CONFLICT` | Сервер уже содержит другую версию |
| `413` | `BODY_TOO_LARGE` | Body превышает 2 МБ |
| `500` | `INTERNAL_ERROR` | Непредвиденная серверная ошибка |

Все ответы содержат `Cache-Control: no-store`. Health-данные и request body не должны попадать в application logs.

## Пример через curl

```bash
TOKEN="$(
  curl -sS http://127.0.0.1:8787/api/v1/auth/telegram \
    -H 'Content-Type: application/json' \
    -d '{"devUserId":"1001"}' |
  jq -r '.token'
)"

curl -sS http://127.0.0.1:8787/api/v1/state \
  -H "Authorization: Bearer $TOKEN"
```

Development-вход должен быть явно включён на backend.

## Проверки

```bash
npm run test:server
npm test
npm run build
npm run verify:pwa
```

Server tests проверяют:

- корректную и изменённую Telegram-подпись;
- срок действия сессии;
- шифрование и привязку ciphertext к пользователю;
- авторизацию API;
- сохранение и `revision`-конфликт.

## Требования перед production

1. Развернуть PostgreSQL с TLS и зашифрованными резервными копиями.
2. Хранить encryption key и session secret в secret manager, отдельно от БД.
3. Настроить HTTPS и точный `MIRA_WEB_ORIGIN`.
4. Никогда не включать development auth.
5. Добавить rate limiting перед публичным доступом.
6. Определить срок хранения и удаления резервных копий.
7. Настроить мониторинг только по техническим метрикам без содержимого дневника.
8. Провести privacy/security review применимого законодательства.
9. Подключить Telegram OIDC для browser PWA.
