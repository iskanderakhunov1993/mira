# Полный продуктовый аудит Mira

Дата среза: 18 июля 2026

Объект: текущая документация и рабочее дерево репозитория Mira

Режим: продуктовый аудит; код и дизайн не изменялись
Статус рабочего дерева: учтены незакоммиченные изменения в `src/aura.tsx`, `docs/product/FEATURES.md`, `docs/product/DECISIONS.md` и удаление `src/home/TodayHome.tsx`, `src/home/todayHome.css`; они не изменялись в рамках аудита.

## 1. Executive Summary

Mira — уже не макет, а функциональный local-first прототип: онбординг, цикл, дневник, календарь, аналитика, знания, отчёты, импорт, экспорт и удаление связаны единым `AuraState` и сохраняются локально. Сильная продуктовая идея — не «ещё один календарь», а превращение собственных отметок в осторожный личный контекст: **метрика → контекст → вывод → действие**.

Главное обещание пока выполняется неравномерно. Метрика и контекст реализованы хорошо; вывод появляется поздно и размывается множеством поверхностей; действие часто сводится к открытию ещё одной карточки. На Today одновременно конкурируют прогноз цикла, календарная карта фаз, фертильное окно, метрики дня, Hormonoscope, Циклоскоп, статьи, поддержка и тренировки. Пользователь быстрее получает данные, чем понимание.

Публичный health-релиз сейчас не рекомендован. P0-блокеры: возможная рассинхронизация IndexedDB/localStorage; непроверяемое удаление; чувствительные поля в обычном backup; смешение окна начала месячных с ожидаемой длительностью; активный фазово-гормональный Hormonoscope рядом с персональным; календарное фертильное окно и карта фаз на главной без отдельного fertility-режима. Закрытое исследование допустимо после устранения P0.

**Главный продуктовый приоритет на 30 дней:** не расширять функциональность, а сделать один надёжный core loop: быстро отметить факт → увидеть сохранённый итог → понять прогресс к личному наблюдению → получить один объяснимый вывод → выбрать действие.

## 2. Оценка продукта от 0 до 10

**6,3/10 — сильная основа MVP, но ещё не доказанный и не release-ready продукт.**

| Область | Оценка | Вывод |
| --- | ---: | --- |
| Проблема и стратегия | 7,2 | Частая задача и ясная формула, но ценность личных выводов не подтверждена пользователями |
| Core tracking | 7,4 | Основные записи и календарь работают на реальных данных |
| Activation | 6,1 | Онбординг функционален, но первый результат и Aha не сфокусированы |
| Retention | 5,5 | Накопительная ценность возможна, но прогресс к ней почти не объяснён |
| Trust и safety | 5,2 | Правильные принципы конфликтуют с активными прогнозными поверхностями и storage/export рисками |
| Privacy | 6,4 | Local-first и контроль данных сильны, но backup/delete требуют исправления |
| Метрики | 3,5 | Метрики описаны, instrumentation отсутствует |
| Техническая готовность | 6,2 | Build проходит; один тест падает, нет E2E/offline/a11y baseline |

**Strategy score: 6,8/10.** Тезис сильнее текущего исполнения: Mira уже хорошо сохраняет факты, но ещё недостаточно последовательно помогает «понимать себя».

## 3. Главное продуктовое обещание

**Для людей, которые хотят спокойно отслеживать цикл и самочувствие без сложной медицинской анкеты, Mira за несколько коротких отметок показывает контекст сегодняшнего дня и осторожные закономерности только по личной истории, сохраняя чувствительные данные на устройстве.**

Главная проблема: человеку трудно связать изменяющееся самочувствие с контекстом и подготовиться без ложной точности. Текущие альтернативы — обычный календарь, заметки, память, таблица или крупный трекер. Обычный календарь отвечает «когда», но не отвечает «что у меня повторяется и что с этим сделать».

Результат по горизонту:

- **После одного дня:** сохранённый факт, текущий день цикла и осторожный календарный ориентир. Это полезность, но ещё не персональное понимание.
- **После одного цикла:** история фактов и первое сравнение, но закономерность заявлять нельзя.
- **После трёх циклов:** личный диапазон и первые наблюдения по похожим дням — основной Aha Moment.

Главный момент ценности: пользователь видит объяснимое наблюдение, узнаёт в нём себя, открывает основания и понимает один следующий шаг. До этого Mira конкурирует с календарём; после этого появляется собственная дифференциация.

## 4. Что уже сделано хорошо

- Реальный active entrypoint — `src/aura.tsx`; все основные экраны связаны одним состоянием (`index.html:17`, `src/aura.tsx:145`).
- Нет обязательного аккаунта; IndexedDB используется как основное хранилище, localStorage — как совместимая копия (`src/auraDb.ts:61`).
- Missing data не превращается в zero: coverage различает запись, явное отсутствие и отсутствие данных (`src/auraState.ts:520`).
- Прогноз меняет статус достаточности по истории, а завершённые циклы вне 18–60 дней исключаются из расчёта (`src/auraState.ts:928`).
- Есть wellbeing-only путь: дату последних месячных можно пропустить, а модули выбираются в онбординге (`src/aura.tsx:647`).
- Импорт проверяет структуру и не заменяет данные при невалидном файле (`src/aura.tsx:451`, `src/auraState.ts:509`).
- Циклоскоп в новой мини-карточке явно маркирован как игровой и немедицинский (`src/aura.tsx:1591`).
- Контент содержит первоисточники; отчёты отделяют факты от диагноза (`src/knowledge.ts`, `src/aura.tsx:2817`).
- Доменные тесты покрывают цикл, state, IndexedDB, check-in, feedback, knowledge и workout.
- Базовые функции не закрыты оплатой; это соответствует доверительной модели продукта.

## 5. Пять критических проблем

| ID | Приоритет | Проблема | Доказательство | Решение | Метрика | Сложность |
| --- | --- | --- | --- | --- | --- | --- |
| R-01 | P0 | Возможна загрузка устаревшей копии данных | IndexedDB всегда выигрывает у localStorage; revision отсутствует (`src/auraDb.ts:61–83`) | Добавить revision/updatedAt, reconciliation и repair обеих копий | storage conflict recovery 100%; подтверждённых потерь 0 | M |
| R-02 | P0 | Пользователь может получить сообщение об удалении до фактической очистки | `clearAuraDatabaseState()` не awaited, а ошибки IndexedDB подавляются (`src/aura.tsx:467`, `src/auraDb.ts:86`) | Await + read-back verification + честная ошибка/повтор | verified delete success ≥99,9% | S–M |
| R-03 | P0 | На главной создаётся ложная физиологическая точность | Fertile window и четыре фазы выводятся из ожидаемой длины; карта не подтверждает овуляцию (`src/aura.tsx:891–936`) | Убрать из default Today; оставить только в отдельно подтверждённом режиме с клиническим review | comprehension ≥90%; unsafe interpretation <5% | M |
| R-04 | P0 | У Hormonoscope два несовместимых контракта | Personal similar-days (`src/aura.tsx:1505–1560`) соседствует с эстрогеном/прогестероном и фазовыми советами (`src/aura.tsx:1458–1585`) | Оставить только personal observation; удалить phase implementation из bundle | 0 phase/hormone claims; source comprehension ≥90% | S–M |
| R-05 | P0 | Обычный backup сохраняет чувствительный period check-in | Исключается только `after-sex`, остаются pregnancy/test/pain/flow fields (`src/aura.tsx:423–438`, `src/auraState.ts:67`) | Allowlist для default export; весь sensitive check-in только opt-in | sensitive fields in default export = 0 | M |

Шестая системная проблема уровня P1: Today и Analytics дают слишком много равноправных направлений, поэтому пользователь видит функции, но не единую историю ценности.

## 6. Целевая аудитория

| Сегмент | Ситуация и потребность | JTBD | Барьеры / причины ухода | Причины доверять | Самые ценные функции |
| --- | --- | --- | --- | --- | --- |
| Core cycle tracker | Цикл относительно наблюдаем; нужно понимать сегодня и ближайшее окно | «Помоги быстро сориентироваться и подготовиться» | Ложная точность, сложный ввод, неверный прогноз | Диапазон, объяснение, local-first | Сегодня, календарь, начало/конец месячных, прогноз |
| Pattern seeker | Самочувствие меняется, причины неясны | «Покажи, что повторяется лично у меня» | Слабые/очевидные выводы, долгий путь до ценности | Основания, denominator, осторожный язык | Check-in, Hormonoscope personal, аналитика |
| Privacy-first diarist | Не хочет аккаунт или серверное хранение | «Дай вести приватную историю и полностью ею управлять» | Потеря устройства, неясный backup, недоверие к telemetry | Local-first, export/delete, прозрачность | Дневник, backup, приватность |
| Wellbeing-only | Хочет отслеживать настроение, сон, симптомы без обязательного цикла | «Помоги замечать изменения без menstrual-first давления» | Пустые cycle-карточки, нерелевантный fertility-контент | Возможность пропустить цикл, настраиваемые модули | Дневник, симптомы, сон, энергия, аналитика достаточности |

Не основной сегмент MVP: TTC, контрацепция, беременность, подростковая медицина, диагностика, лечение. Появившийся fertility-контекст на Today фактически расширяет обещание в запрещённый сегмент без продуктового решения.

## 7. Jobs To Be Done

1. Когда я открываю Mira утром или при изменении самочувствия, помоги за пять секунд понять текущий контекст и нужное действие.
2. Когда я замечаю кровотечение, боль, настроение или энергию, дай записать факт менее чем за 40 секунд.
3. Когда накопилась история, покажи одну повторяемость лично у меня и объясни, на каких днях она основана.
4. Когда прогноз неопределён, покажи диапазон и причину неопределённости, а не точную физиологическую фазу.
5. Когда я готовлюсь к консультации, собери мои факты без диагноза и причинных выводов.
6. Когда я ухожу или меняю устройство, дай безопасно экспортировать, восстановить или удалить данные.

## 8. Позиционирование

Mira соответствует «Понимай себя» на уровне принципов и частично на уровне продукта. Дневник и calendar context сформированы; personal observation существует. Но текущий Today делает продукт похожим на комбинацию cycle tracker + wellbeing tracker + editorial feed + workout/care + entertainment. Это снижает ясность.

Сравнение категорий по официальному позиционированию на дату аудита:

| Продукт | Сильная территория | Что это значит для Mira |
| --- | --- | --- |
| Flo | Масштабный lifecycle-продукт, много симптомов и контента, прогнозы, Anonymous Mode | Mira не выиграет количеством функций; local-only контроль должен быть проще и доказуемее |
| Clue | Science-based, privacy-first, cycle modes, predictions и pattern analysis | «Наука + приватность» уже занята; Mira нужна более конкретная территория личной объяснимости |
| Обычный календарь | Простота, привычность, быстрый ответ «когда» | Mira обязана дать полезный личный вывод, иначе дополнительный ввод не оправдан |

Внешние источники сравнения: официальный [Flo Product Tour](https://flo.health/product-tour), [Flo Anonymous Mode](https://flo.health/product-tour/anonymous-mode) и официальный [Clue product page](https://helloclue.com/). Сравнение относится к заявленному позиционированию, а не к независимой оценке качества продуктов.

Рекомендуемая дифференциация: **не самая широкая и не самая “умная”, а самая объяснимая local-first история личных наблюдений**. Defensibility возникает не из календарной фазы, а из накопленной пользователем истории, прозрачного метода, доверия к данным и быстрого daily loop.

Strategic contradictions:

- Hormonoscope обещает личные наблюдения, но название и phase legacy создают гормональное ожидание.
- Циклоскоп корректно отделён текстом, но расположен рядом с health-инсайтом и использует те же реакции `matched/neutral/missed`.
- Wellbeing-only заявлен, но Today остаётся menstrual/fertility-first.
- Core free обещан, но бизнес-модель пока не проверена; это не проблема MVP, а открытый риск устойчивости.

## 9. User Journey

```text
Первый запуск → цель → данные цикла или пропуск → модули → Today
     → быстрый факт → сохранённый итог → прогресс достаточности
     → календарь/история → первое личное наблюдение → основание → действие
     → следующая короткая отметка → недельный контекст → новый цикл
```

| Этап | Цель / действие | Фактический результат | Фрикция и риск ухода | Рекомендация |
| --- | --- | --- | --- | --- |
| 1. Первый запуск | Понять пользу и безопасность | Local-first объясняется | PWA/offline обещание не подтверждено | Одно обещание + честное ограничение одного устройства |
| 2. Регистрация/вход | Начать без барьера | Аккаунта нет | Потеря устройства неочевидна | Keep; раньше объяснить backup |
| 3. Onboarding | Настроить релевантность | 7 шагов: цель, цикл, pattern, focus, privacy | Длинно; цель почти не меняет Today | Свести к цели → минимум данных → опциональные модули |
| 4. Данные цикла | Добавить известный факт | Дату можно пропустить | Cycle-first копия может давить на wellbeing-only | Явный «без цикла» режим и релевантный Today |
| 5. Первый Today | Понять сегодня | Прогноз, фазы, fertility, статьи и карточки | Неясен главный CTA; риск ложной точности | Только context + один CTA + итог |
| 6. Первый check-in | Быстро отметить факт | Quick symptoms и полный Diary доступны | Две точки входа; Diary перегружен модулями | Один CTA, 3–5 частых полей, «Ещё» |
| 7. Первый вывод | Получить пользу | При малых данных — preview/общий контекст | Preview Hormonoscope может выглядеть персональным | Показывать прогресс и только фактический итог |
| 8. Calendar | Различить факт и прогноз | Месяц, выбор дня, переход в Diary | Окно старта и период могут смешиваться | Раздельная легенда факт / окно старта / выбранный день |
| 9. Hormonoscope | Узнать личную повторяемость | Personal module работает при 3 днях; рядом phase legacy | Два источника и слово «прогноз» | Один evidence-first модуль |
| 10. Циклоскоп | Получить лёгкую эмоцию | Статичная игровая карта, chips, знак, feedback | Может конкурировать с core и имитировать accuracy | Opt-in, отдельный визуальный слой, нейтральная реакция |
| 11. Analytics | Понять историю | Overview, cycle, wellbeing, history, reports | Лабиринт и много слабых блоков | Sufficiency → один вывод → факты |
| 12. Следующий день | Быстро продолжить | Today снова доступен | Нет явного «что изменилось / что осталось» | Вчерашний итог + один новый шаг, без streak |
| 13. После цикла | Увидеть накопление | Цикл появляется в истории | Milestone не обозначен | Короткий factual cycle recap |
| 14. После трёх циклов | Получить личный диапазон/паттерн | Расчёты доступны | Aha спрятан внутри Analytics/Scopes | Показать один explainable milestone на Today |

Broken/missing states: нет service worker/offline recovery; нет verified delete; нет storage reconciliation; нет telemetry denominator; нет доказанного focus trap для активных модалок `aura.tsx`; нет отдельной обработки импортированной тестовой истории в метриках.

## 10. Activation и Aha Moment

- **Time to Value (первичная):** от первого открытия до сохранённого факта и понятного контекста. Цель: медиана ≤2 минуты, p75 ≤4 минуты.
- **Activation Moment:** в первые 7 дней пользователь завершил onboarding, сохранил ≥3 meaningful days и увидел экран достаточности/первое наблюдение. Дата цикла не обязательна для wellbeing-only.
- **Aha Moment:** пользователь открывает личное наблюдение, видит denominator и факты-основания и оценивает его как понятное/полезное.
- **Core loop:** короткая запись → сохранённый итог → прогресс данных → личное наблюдение → действие → следующая запись.
- **Daily return:** отметить изменение или проверить текущий context; не обязательная серия.
- **Weekly return:** factual recap и прогресс к личному наблюдению.
- **Long-term return:** личный диапазон, повторяемость, подготовка к следующему циклу и переносимая история.

Activation acceptance criteria:

- ≥80% usability participants самостоятельно сохраняют первую запись ≤40 секунд после Today.
- ≥80% правильно различают факт, календарное предположение и личное наблюдение.
- Ни один обязательный шаг не требует даты цикла.
- Пропуск 3–7 дней не создаёт shame copy и не ломает продолжение.

## 11. Реестр функций

Легенда состояния: **работает** — реальный state + сохранение + результат; **частично** — ключевая часть есть, но flow/edge cases неполны; **UI/legacy** — присутствует в bundle или интерфейсе, но не соответствует утверждённому контракту; **нет** — документация без реализации.

| Функция | Проблема / сегмент | Частота | Вход → результат | Формула | Зависимость | Состояние | Риск | Метрика | Рекомендация |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Onboarding | Быстрый старт / все | 1 раз | цель, даты, modules → настроенный state | context | state | Работает, 7 шагов | Drop-off | completion, TTV | **Simplify / Упростить** |
| Cycle start/end | Фактическая история / core | 1–5×/цикл | дата → episode | metric/context | calendar | Работает | Ошибка редактирования | save/edit success | **Keep / Оставить** |
| Cycle forecast | Подготовка / core | несколько раз/цикл | starts → range | context/assumption | 1–3+ cycles | Частично | Смешение диапазонов | comprehension, correction | **Simplify / Упростить** |
| Fertile window | Fertility / не MVP | ежедневно | expected length → calendar window | assumption | cycle | UI/новое | Контрацептивная интерпретация | unsafe comprehension | **Remove / Удалить сейчас** |
| Phase map | Общий context / core | ежедневно | cycle day → 4 phases | assumption/info | cycle | UI/новое | Ложная физиология | comprehension | **Postpone / Отложить** |
| Today | Ориентация / все | ежедневно | state → context/actions | вся цепочка | все core | Работает, перегружен | Слабый focus | first action, clarity | **Simplify / Упростить** |
| Quick symptoms | Быстрый факт / pattern | 3–7×/нед | symptom → saved day | metric | diary | Работает | Дублирование | completion time | **Keep / Оставить** |
| Diary | Полная запись / все | 2–7×/нед | modules → day entry | metric | state | Работает | Cognitive load | completion | **Simplify / Упростить** |
| Mood | Контекст wellbeing | 3–7×/нед | mood → history | metric/context | diary | Работает | Семантика rating | adoption | **Keep / Оставить** |
| Energy | Контекст wellbeing | 3–7×/нед | 1–5 → history | metric/context | diary | Работает | Слабый action | adoption/insight | **Keep / Оставить** |
| Symptoms | Повторяемость / pattern | по событию | label+severity → facts | metric/insight | diary | Работает | Мед. интерпретация | meaningful days | **Keep / Оставить** |
| Sleep | Контекст / wellbeing | ежедневно | hours/quality → trend | metric/context | diary | Работает | Self-report quality | adoption | **Keep / Оставить**, opt-in |
| Water | Habit context | ежедневно | ml → total/history | metric | diary | Работает | Goal without insight | adoption→value | **Validate with experiment** |
| Steps | Activity context | ежедневно | count → history | metric | diary | Работает | Manual burden | adoption→value | **Validate with experiment** |
| Nutrition/calories | Возможный context | ежедневно | items/kcal → history | metric only | diary | Частично | Scope creep | completion/value | **Postpone / Отложить** |
| Basal temperature | Нишевый body metric | ежедневно | °C → trend | metric | diary | Работает как поле | Fertility implication | adoption | **Postpone / Отложить**, off by default |
| Weight | Body context | редко | kg → trend | metric | diary | Работает как поле | Sensitivity/body image | adoption | **Postpone / Отложить**, off by default |
| Intimacy | Чувствительный context | по событию | intimate fields → local history | metric/context | diary/privacy | Работает | Disclosure | opt-in, export safety | **Keep / Оставить**, off by default |
| Calendar | Факт/ориентир | 1–4×/нед | month/date → selected day | context | cycle/diary | Работает | Legend ambiguity | diary conversion | **Keep / Оставить**, clarify |
| Analytics overview | Понимание / pattern | еженедельно | history → sufficiency/insight | insight | data sufficiency | Частично | Перегрузка | insight comprehension | **Simplify / Упростить** |
| Cycle analytics | Личный диапазон | раз/цикл | 3+ cycles → range | context/insight | cycle history | Работает | False certainty | evidence open | **Keep / Оставить** |
| Reports | Консультация / power user | редко | facts → report | action | history | Частично | Мед. видимость | report success | **Validate with experiment** |
| Hormonoscope personal | Личная повторяемость | 1–3×/нед | similar days → frequencies | insight/action | 3 prior days | Работает | Weak method/copy | helpful + evidence | **Keep / Оставить**, fix contract |
| Hormonoscope phase | Phase advice | ежедневно | calendar phase → advice | assumption | cycle | Legacy active | Medical/trust | unsafe interpretation | **Remove / Удалить** |
| Циклоскоп | Emotional delight | опционально | content → mood/chips | entertainment | none | Работает, mostly static | Trust dilution | repeat/hide/trust | **Validate with experiment** |
| Day/week/month progress | Понимание накопления | daily/weekly | records → progress | context | event/history | Частично/нет | Streak pressure | qualified weeks | **Simplify / Упростить** to sufficiency |
| Knowledge | Education | по событию | context/query → article | action/info | editorial | Работает частично | Review freshness | useful open | **Keep / Оставить**, narrow |
| Workout | Action | эпизодически | context → generated plan | action | workout engine | Работает | Distraction/safety | completion/value | **Postpone / Отложить** |
| Care/support | Situational help | эпизодически | symptom → options | action | day state | Работает | Duplicate cards | action completion | **Simplify / Упростить** |
| Notifications | Return | ежедневно | opt-in/time → reminder | action | PWA | Нет | Pressure/permissions | opt-in return | **Validate with experiment** |
| Streak | Motivation | ежедневно | consecutive days → reward | none | events | Нет | Manipulation | — | **Remove / Не делать** |
| Import/export | Control / privacy | редко | JSON ↔ state | action | storage | Работает частично | Sensitive leak/overwrite | success | **Keep / Оставить**, harden P0 |
| Delete | Exit/control | редко | confirm → empty state | action | storage | Частично | False success | verified delete | **Keep / Оставить**, harden P0 |
| Privacy settings | Trust | редко | opt-in → export behavior | action | state | Работает частично | Incomplete classification | comprehension | **Keep / Оставить** |
| Feedback | Discovery | редко | message → API/share | action | external endpoint | Работает при config | No impression denominator | delivery success | **Keep / Оставить** |
| PWA install/offline | Reliable access | часто | browser install/cache | action | SW/assets | Частично | No offline guarantee | install/offline pass | **Keep / Оставить**, implement |

## 12. Дублирование и перегрузка

| Случай | Доказательство | Решение |
| --- | --- | --- |
| Два Hormonoscope | Phase card/modal и personal Scopes module в одном bundle | Удалить phase implementation; переименовать feedback «совпал» в «полезно/не полезно» |
| Два Циклоскопа | Mini entertainment и analytical legacy functions/modal | Оставить только entertainment; evidence перенести в Hormonoscope |
| Today как Analytics | Phase chart, fertility, rhythm, insight, knowledge, scopes | Оставить orientation + CTA + one insight; остальное ниже сгиба/opt-in |
| Несколько entry points в Diary | Quick symptoms, cards, bottom nav, calendar | Один основной CTA + contextual shortcuts |
| Care kit / support / workout | Разные карточки обещают «что поможет» | Объединить в один optional action block |
| Analytics navigation | 4 top sections + modes + reports | Overview: sufficiency → insight → source; details открывать из insight |
| Введённые, но малоценные metrics | water, steps, calories, weight, temperature без ясного insight | Сделать opt-in; убрать default до доказательства value |
| Два доменных контура | Active `aura.tsx/auraState.ts` и legacy `App.tsx/cycle.ts/data.ts` | Зафиксировать source of truth; legacy вынести из production после проверки |

## 13. Аудит Hormonoscope

**Классификация целевой функции: personal observation.** Это не scientific information, не measurement гормонов и не прогноз состояния.

Проблема: пользователь хочет подготовиться к повторяющемуся состоянию, а не прочитать общую фазовую статью. Самостоятельная ценность Hormonoscope появляется только тогда, когда он отвечает: «что повторялось лично у меня в похожие дни, насколько часто и что можно сделать».

Текущий personal method выбирает заполненные дни из предыдущих циклов около текущего дня и показывает результат при ≥3 похожих днях (`src/aura.tsx:1505–1560`). Ограничения: один день на цикл; не показаны даты-основания; `rating` может смешиваться с настроением; копия говорит «прогноз»; UI рисует максимум пять точек независимо от полной истории. Параллельный phase Hormonoscope использует календарные фазы, эстроген и прогестерон (`src/aura.tsx:1458–1585`) и должен быть удалён.

### MVP

- Один вопрос: «Что повторялось в похожие дни?»
- Порог: ≥3 похожих дня из разных завершённых циклов; окно ±2 дня.
- Максимум один сильный вывод и один secondary observation.
- Формат: «В 3 из 4 похожих дней вы отмечали низкую энергию» → «Показать даты» → «Сегодня можно запланировать более гибкий темп».
- Empty state: «Пока 2 из 3 нужных дней. Это не означает, что закономерности нет».
- Нерегулярный цикл: не использовать calendar phase; сравнивать только с оговорённым relative day либо отключать вывод при нестабильной привязке.
- Безопасные действия: отметить состояние, подготовить comfort items, снизить необязательную нагрузку, обсудить устойчивый симптом со специалистом.
- Недопустимо: диагноз, причинность, гормональный уровень, подтверждение овуляции, контрацептивная безопасность, обязательный forecast состояния.

### Расширенная версия

Evidence drawer с датами и покрытием; отдельные метрики; confidence by coverage; сравнение «последние 3–6 циклов»; локальный feedback history. Только после проверки comprehension и helpful-rate.

### Критерии готовности

- В active bundle нет phase/hormone claims под именем Hormonoscope.
- ≥90% участников правильно называют источник личным, а не медицинским.
- Denominator и даты доступны за один tap.
- Empty/irregular/missing states протестированы.
- Primary metric: доля eligible users, которые открыли evidence и отметили вывод полезным; guardrail — misleading interpretation <5%.

## 14. Аудит Циклоскопа

**Классификация: entertainment.** Допустимые данные — дата для детерминированной ротации контента, локальный выбор карточки и реакция. Недопустимы cycle day, phase, hormones, symptoms, mood history, fertility и health analytics.

Текущая мини-карточка даёт образ дня, chips и «маленький знак», сообщает «Для настроения» и «Не медицинская рекомендация» (`src/aura.tsx:1591–1615`). Это корректная основа, но текст длинный, карточка визуально близка к health modules, а реакции «совпал/не совпал» имитируют проверку прогноза.

Рекомендуемая механика: одна карточка 40–70 слов, один образ, 2–3 playful prompts, кнопка «другой образ». Реакция — «понравилось / не моё», не «совпало». Контент детерминирован по локальной дате, не по health data.

Размещение: выключено по умолчанию; включается в настройках; ниже core loop и персонального observation; не в hero Today. Визуальное отделение — отдельный label «Игра», иная palette/illustration, отсутствие медицинских и аналитических иконок.

Primary metric: repeat view среди opt-in users за 4 недели. Guardrails: hide rate, trust score, доля считающих функцию научной. Инвестиции продолжать только если repeat ≥25%, hide <30%, а trust не снижается более чем на 3 п.п. относительно control.

## 15. Метрики

### North Star Metric

**Useful Context Weeks per Eligible Active User (UCW): доля активных пользовательских недель, в которых было ≥3 meaningful days и пользователь увидел хотя бы одно готовое личное наблюдение с основанием.**

Числитель: user-weeks с ≥3 записями в разные дни + `personal_observation_viewed` при достаточности. Знаменатель: недели пользователей, завершивших onboarding и имевших возможность пользоваться ≥7 дней. Imported/test history исключается.

Почему: метрика соединяет вклад пользователя, накопление данных и фактическое получение ценности. Искусственный рост предотвращают: максимум 1 UCW на пользователя в неделю; impression сам по себе без достаточности не считается; повторные открытия не увеличивают NSM; guardrails trust/storage обязательны.

### Определения

| Метрика | Определение |
| --- | --- |
| Onboarding completion | completed / first onboarding started; eligible = новые установки |
| Activation rate | activated in first 7 days / onboarding completed users with 7-day observation window |
| TTV | median time first_open → first_meaningful_fact_saved + context_seen |
| Daily check-in completion | completed check-ins / check-in starts; отдельно quick/full |
| D1/D7/D30 | вернулся и сделал meaningful action на day 1/7/30 window, не просто открыл app |
| Feature adoption | unique eligible users with meaningful feature action / eligible active users |
| Useful observations | observation viewed + evidence opened или helpful feedback; max 1/type/day |
| Return after first cycle | users with meaningful action in next cycle / users completing first cycle and observable next window |
| Data sufficiency | users reaching 3 meaningful days and 3 completed cycles, отдельно |
| Trust | source comprehension, export/delete success, complaint rate, hide rate, unsafe interpretation |
| Negative signals | storage failure, rage retry, delete failure, early uninstall proxy, reminder opt-out, Cycloscope hide |

### Минимальная event taxonomy

| Event | Когда | Безопасные параметры | Метрика/гипотеза |
| --- | --- | --- | --- |
| `app_opened` | foreground | version, returning_bucket | retention |
| `onboarding_started` | первый шаг | experiment_variant | funnel denominator |
| `onboarding_step_completed` | переход далее | step_id, skipped, duration_bucket | drop-off |
| `onboarding_completed` | finish | goal_id, modules_count, cycle_skipped | completion |
| `context_viewed` | Today rendered | scenario, sufficiency_tier | TTV |
| `checkin_started` | CTA | entry_point, quick/full | funnel |
| `meaningful_fact_saved` | успешное локальное сохранение | category_count, today/past, duration_bucket | activation; без values |
| `storage_write_failed` | save error | backend, error_code | trust guardrail |
| `calendar_opened` | open | entry_point | adoption |
| `personal_observation_eligible` | local threshold reached | coverage_tier | eligibility |
| `personal_observation_viewed` | visible impression | type, coverage_tier | NSM |
| `observation_evidence_opened` | dates opened | type, evidence_count_bucket | Aha |
| `observation_feedback` | explicit reaction | helpful/not_helpful | value |
| `analytics_opened` | open | section, sufficiency_tier | adoption |
| `cycloscope_enabled` | opt-in | source | experiment |
| `cycloscope_viewed` | visible impression | content_id, repeat_bucket | entertainment retention |
| `cycloscope_feedback` | explicit reaction | liked/not_for_me | value; separate namespace |
| `export_completed` | file created | sensitive_opt_in, success | trust |
| `import_completed` | state verified | success, source_type | trust; no file content |
| `delete_completed` | read-back verified | success | trust |

Нельзя отправлять: даты цикла, симптомы, notes, mood, pregnancy/test, intimacy, article query, report content, exact birth date, exported state. Предпочтение: локальная агрегация и явный consent на отправку обезличенных недельных счётчиков.

## 16. Retention

| Механика | Класс | Решение |
| --- | --- | --- |
| Контекст сегодняшнего дня при реальном изменении | Полезное напоминание | Keep, но без обязательного daily open |
| Opt-in reminder в выбранное время | Полезное напоминание | Validate после PWA baseline |
| «2 из 3 дней для первого наблюдения» | Мягкая мотивация | Keep; без потери прогресса |
| Factual weekly recap | Накопительная ценность | Build after event foundation |
| Личный диапазон после 3 циклов | Накопительная ценность | Core milestone |
| Streak, flame, shame, reset | Токсичная геймификация | Не делать |
| Тревожный reminder о задержке | Токсичная геймификация/trust risk | Не делать |

Если пользователь пропустил дни, Mira должна сказать: «Продолжите с сегодняшнего дня; пропуски останутся пропусками». Нельзя интерполировать отсутствие симптомов или обнулять прогресс. Daily return не должен быть самоцелью: для cycle tracker важнее meaningful weekly/cycle retention.

## 17. Риски

| ID | Тип | Вероятность | Влияние | Доказательство | Снижение | Приоритет |
| --- | --- | ---: | ---: | --- | --- | --- |
| RK-01 | Data loss | M | Critical | Нет revision между двумя stores | Reconciliation + fault tests | P0 |
| RK-02 | False delete | M | Critical | Async clear не awaited, error swallowed | Verified atomic flow | P0 |
| RK-03 | Privacy leak | H | High | Sensitive check-in остаётся в default backup | Export allowlist | P0 |
| RK-04 | Fertility misuse | M | Critical | Fertile window на Today | Remove/default-off + clinical/legal review | P0 |
| RK-05 | False physiology | H | High | Static phase curve и hormone copy | Remove phase Hormonoscope/map | P0 |
| RK-06 | False personalization | H | High | Preview и «прогноз» до personal data | Facts-only empty state | P0 |
| RK-07 | Entertainment/health mixing | M | High | Same surface and accuracy-like feedback | Separate visuals/events/copy | P1 |
| RK-08 | Overload | H | Medium | Many Today and Analytics routes | Core-only hierarchy | P1 |
| RK-09 | Device loss | M | High | Local-only, manual backup | Early disclosure + backup prompt | P1 |
| RK-10 | PWA mismatch | H | Medium | Manifest without SW/cache | Implement and test offline | P1 |
| RK-11 | Accessibility | M | Medium | Tiny 5–9 px CSS rules; no active E2E a11y | Token floor + automated/manual audit | P1 |
| RK-12 | Clinical copy | M | High | Urgent rules/content not externally reviewed | Clinical/legal sign-off | P1 |
| RK-13 | Analytics privacy | M | High | Taxonomy only documented | Consent, allowlist, retention policy | P1 |
| RK-14 | Monolith/legacy | H | Medium | 3k-line active file + second domain | Incremental extraction, no rewrite | P2 |

Release recommendation: **NO-GO public; conditional GO closed research after P0.**

## 18. Приоритизация

Reach/Impact/Confidence/Effort — directional 1–5; P0 prerequisites не ранжируются механическим RICE.

| Инициатива | R | I | C | E | Value/Retention | Risk/Data dependency | Группа | Решение |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Storage revision/reconciliation | 5 | 5 | 5 | 3 | Trust foundation | Technical | Must have | **Keep / Сделать сейчас** |
| Verified delete | 5 | 5 | 5 | 2 | Trust | Technical | Must have | **Keep / Сделать сейчас** |
| Sensitive export allowlist | 5 | 5 | 5 | 2 | Trust/control | Classification | Must have | **Keep / Сделать сейчас** |
| Remove phase Hormonoscope | 5 | 5 | 5 | 2 | Clarity/trust | None | Must have | **Remove / Удалить** |
| Remove fertility/phase from default Today | 5 | 5 | 4 | 2 | Safety/clarity | Research later | Must have | **Remove / Удалить сейчас** |
| Separate start window/duration | 5 | 5 | 5 | 2 | Forecast comprehension | Cycle data | Must have | **Simplify / Упростить** |
| Green date-stable tests | 5 | 4 | 5 | 1 | Release confidence | Technical | Must have | **Keep / Сделать сейчас** |
| Core-only Today | 5 | 5 | 4 | 3 | Activation/D7 | Experiment | Should have | **Validate with experiment** |
| Privacy-safe events | 5 | 5 | 4 | 3 | Enables decisions | Consent/governance | Should have | **Keep / Сделать следующим** |
| Progressive Diary | 5 | 4 | 4 | 3 | Completion/D7 | Usage data | Should have | **Simplify / Упростить** |
| One-insight Analytics | 3 | 4 | 4 | 3 | Aha/W4 | 3 cycles | Should have | **Simplify / Упростить** |
| PWA offline/install | 4 | 4 | 5 | 3 | Reliability | Technical | Should have | **Keep / Сделать следующим** |
| Weekly factual recap | 3 | 4 | 3 | 3 | W4 | Event/history | Later | **Validate with experiment** |
| Циклоскоп opt-in | 2 | 2 | 2 | 2 | Emotional retention | Trust study | Later | **Validate with experiment** |
| Notifications | 3 | 3 | 2 | 3 | Return | PWA/permission | Later | **Postpone / Отложить** |
| Reports expansion | 1 | 3 | 2 | 4 | Specialist action | Demand | Later | **Postpone / Отложить** |
| Workout/content expansion | 2 | 1 | 3 | 4 | Weak core link | Demand | Не делать сейчас | **Postpone / Отложить** |
| Streak | 4 | 1 | 4 | 2 | Opens, not value | Trust harm | Не делать сейчас | **Remove / Не делать** |
| Wearables/sync | 2 | 4 | 2 | 5 | Convenience | PMF/security | Не делать сейчас | **Postpone / Отложить** |

## 19. MVP-скоуп

Must have:

- local state с reconciliation, migrations, verified save/delete;
- cycle facts, start/end, honest start range and confidence;
- fast check-in: bleeding, symptoms, mood/energy; optional sleep;
- Calendar with fact/assumption distinction;
- one personal observation with evidence and insufficiency state;
- import/export/delete with sensitive opt-in;
- minimal knowledge/safety content with sources;
- mobile, offline, accessibility and E2E release baseline.

Should have: wellbeing-only Today; progressive Diary; one-insight Analytics; factual cycle recap; privacy-safe metrics.

Later: opt-in reminders, Циклоскоп experiment, expanded reports/content, encrypted sync, wearables.

Не делать сейчас: fertility/TTC features, phase-based advice, streak, AI chat, social/community, workout expansion, large editorial platform.

## 20. Что удалить или отложить

- Удалить `getHormonoscopePhase`, phase card/modal и hormone copy из active bundle.
- Удалить/скрыть fertility window и static phase curve с default Today до отдельного product decision.
- Удалить analytical legacy Циклоскоп; оставить один entertainment contract.
- Отложить nutrition/calories, weight, temperature и workout как default modules.
- Объединить care kit, support и workout entry в один optional block.
- Отложить content/report expansion до evidence of demand.
- Не строить streak и тревожные reminders.
- После проверки зависимостей вынести legacy `App.tsx/cycle.ts/data.ts` из production source-of-truth.

## 21. План развития на 30 дней

### Неделя 1 — Trustworthy data

Storage revision/reconciliation; verified delete; sensitive export allowlist; forecast range semantics; date-stable test. DoD: fault/import/export/delete tests зелёные, default backup не содержит sensitive fields.

### Неделя 2 — Один продуктовый контракт

Удалить phase Hormonoscope, fertility default и analytical Cycloscope; утвердить classification matrix; clinical review safety copy. DoD: каждый output относится ровно к scientific information, personal observation, assumption или entertainment.

### Неделя 3 — Fast first value

Прототип core-only Today и progressive Diary; privacy-safe local events; E2E core flow; mobile/a11y pass. DoD: первая запись ≤40 сек в 5/8 sessions, источник выводов понимают ≥90%.

### Неделя 4 — Validation

5–8 usability sessions и 10–15 problem interviews; A/B moderated comparison Today; comprehension Hormonoscope/Cycloscope/range; обновить `RESEARCH.md`, `DECISIONS.md`, roadmap. DoD: решения принимаются по заранее заданным thresholds.

## 22. Следующие три продуктовые итерации

1. **Trustworthy Core:** storage/export/delete, один прогнозный контракт, safety classification, green CI/offline smoke.
2. **Fast First Value:** короткий onboarding, core-only Today, progressive Diary, один explainable observation.
3. **Measurable Retention:** UCW, local privacy-safe aggregation, factual weekly recap, решение по Циклоскопу/reminders на данных.

## 23. Гипотезы, которые требуют проверки

1. Personal observation с evidence повышает W4 сильнее, чем общий phase context.
2. Local-first является выборочным преимуществом, а не только baseline expectation.
3. ≥3 meaningful days/week достижимы без streak и push pressure.
4. Core-only Today повышает first-entry completion и не снижает calendar use.
5. Название Hormonoscope не создаёт ожидание измерения гормонов; альтернативу «Мой ритм» стоит сравнить.
6. Wellbeing-only сегмент достаточно велик для отдельного default Today.
7. Циклоскоп добавляет repeat use без снижения trust.
8. Water/steps/sleep улучшают личные выводы настолько, чтобы оправдать ввод.
9. Report решает реальную preparation job, а не выглядит полезной feature без использования.
10. Пользователи понимают разницу между expected start range и duration.

Три первоочередных эксперимента:

- Moderated first-use test: current vs core-only Today; success = clarity ≥80%, first save ≤40 сек.
- Hormonoscope comprehension test: personal evidence vs phase card; success = personal source ≥90%, helpful ≥50%, unsafe interpretation <5%.
- 4-week opt-in cohort: Циклоскоп on/off; продолжать только при repeat ≥25%, trust delta ≥−3 п.п. и без падения UCW.

## 24. Неизвестные данные и открытые вопросы

- Нет production cohorts, acquisition source, MAU, retention или completion data.
- Нет подтверждённых интервью с методом, датой и выборкой; `RESEARCH.md` содержит гипотезы.
- Неизвестна реальная частота irregular cycles, wellbeing-only use и пропусков.
- Неизвестно, какие modules дают полезные observations, а какие только увеличивают форму.
- Нет clinical owner и формального review процесса для safety copy/articles.
- Нет выбранной telemetry architecture, consent, retention period и data controller.
- Не определено, как local-only продукт восстанавливается после потери устройства без cloud account.
- Не проверена готовность пользователей платить за расширенную аналитику при бесплатном core.
- Неизвестно, воспринимают ли Hormonoscope и Циклоскоп как разные категории.
- Не проведена инструментальная accessibility и offline/installability проверка.

## Итоговая таблица рекомендаций

| ID | Приоритет | Проблема | Доказательство | Затронутый пользователь / влияние | Решение | Ожидаемый результат | Метрика | Сложность | Критерий готовности |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | P0 | Storage conflict | Два store без revision | Все; риск потери доверия | Reconciliation | Новейшая запись сохраняется | conflict recovery | M | Fault tests 100% |
| R-02 | P0 | False delete | Fire-and-forget clear | Privacy-first; данные могут остаться | Await/verify/retry | Честное удаление | verified success | S–M | Read-back empty |
| R-03 | P0 | Sensitive backup | Period check-in остаётся | Пользователь экспорта; disclosure | Allowlist | Безопасный default | sensitive fields 0 | M | Snapshot test |
| R-04 | P0 | False fertility certainty | Calendar-derived fertile window | Core/wellbeing; misuse | Remove default | Ясная граница MVP | comprehension | S | Нет default surface |
| R-05 | P0 | Dual Hormonoscope | Personal + phase/hormones | Pattern seeker; trust | One personal contract | Explainable insight | source comprehension | M | 0 hormone claims |
| R-06 | P0 | Wrong range semantics | `periodForecast` vs `forecast` | Core; планирование | Start range separately | Honest prediction | correction/comprehension | M | UI/snapshot tests |
| R-07 | P1 | Today overload | Many equal modules | New users; activation | Core-only variant | Faster first value | TTV/D7 | M | ≥80% task success |
| R-08 | P1 | Analytics maze | 4 sections + modes | 3-cycle users; Aha hidden | One insight → evidence | Higher comprehension | evidence-open | M | ≥80% understand |
| R-09 | P1 | No product instrumentation | Only docs metrics | PM/team; blind decisions | Privacy-safe local events | Measurable UCW | schema coverage | M | Funnel computed |
| R-10 | P1 | PWA incomplete | Manifest, no SW | All; unreliable return | App-shell cache/test | Offline reliability | offline pass | M | Cold/warm smoke |
| R-11 | P1 | Weak accessibility baseline | Tiny CSS/no E2E audit | Low vision/motor users | Token floor + audit | Usable mobile UI | violations/task success | M | No critical issues |
| R-12 | P2 | Secondary scope | Workout/nutrition/content | All; diluted product | Postpone | More focused MVP | UCW/feature value | S | Removed from default |
| R-13 | P2 | Entertainment trust | Same surface/reactions | Privacy/pattern users | Opt-in experiment | Delight without confusion | repeat/hide/trust | S–M | Thresholds met |

## Проверка репозитория

- `npm run build` — успешно; JS 577,01 kB (157,63 kB gzip), CSS 271,17 kB (51,89 kB gzip); Vite предупреждает о chunk >500 kB.
- `npm test` — 72 passed, 1 failed. Падает календарно-зависимый `src/cycle.test.ts:137`: ожидается 2500 мл/2 mood days, текущая неделя возвращает 1500 мл/1 mood day.
- Не найдены service worker/cache strategy, product analytics event layer, E2E, automated accessibility или visual regression tests.
- Код приложения не изменялся. Обновлён только этот продуктовый аудит.

### P0 implementation update — 18 июля 2026

После исходного audit snapshot начата реализация P0:

- добавлены revision/updatedAt и reconciliation IndexedDB/localStorage;
- удаление теперь ожидает очистку и проверяет отсутствие state;
- default backup исключает профиль, medical period check-in, интимные поля и заметки;
- Today и Calendar используют диапазон возможного начала `forecast`, а не ожидаемую длительность `periodForecast`;
- fertility window и карта фаз удалены из основного UI;
- фазово-гормональный Hormonoscope удалён, а personal module больше не показывает mock-прогноз при недостатке данных;
- календарно-зависимый unit-тест стабилизирован.

Проверка после изменений: `npm test` — 78/78, включая negative delete и legacy-backup migration; `npm run build` — успешно. P0 закрыт для текущего MVP-контракта. Рекомендация по публичному релизу остаётся условной до P1 E2E/offline/accessibility и клинической проверки safety copy.

### P1 PWA update — 18 июля 2026

- добавлены production-only service worker registration, versioned app-shell cache и offline navigation fallback;
- manifest переведён в статический public-контур и дополнен scope/id/lang/orientation;
- добавлены PNG 192×192, 512×512, maskable icon и Apple touch icon;
- UI сообщает об offline-режиме и подтверждает, что локальные записи продолжат сохраняться;
- `npm run verify:pwa` проверяет built manifest, SW fallback, shell-файлы и размеры install icons.

Ограничение среды проверки: встроенный браузер отображает production preview, но не предоставляет Service Worker API. Поэтому runtime registration/offline reload остаётся release-gate для Chrome/Safari; артефакты и cache contract проверены автоматически. Публичный release остаётся conditional до E2E/accessibility и реального browser offline smoke.
