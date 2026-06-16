import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  FileText,
  LockKeyhole,
  MoonStar,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { useState } from "react";
import type { BodyScanResult, UserProfile } from "../types";
import { BodyScanModal } from "../components/BodyScanModal";
import { Logo } from "../components/Logo";

type OnboardingProps = {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile, scan?: BodyScanResult) => void;
};

const goals = [
  "Похудеть",
  "Подтянуть тело",
  "Ягодицы и фигура",
  "Toned body",
  "Здоровье",
  "Больше энергии",
  "Восстановление формы"
];

const levels = ["Новичок", "Средний", "Продвинутый"];
const limitations = [
  { value: "Поясница", helper: "Учтём нагрузку на спину" },
  { value: "Колени", helper: "Подберём мягкие варианты для ног" },
  { value: "Плечо", helper: "Ограничим амплитуду жимов" },
  { value: "Шея", helper: "Уберём лишнее напряжение" },
  { value: "Сколиоз", helper: "Учтём нагрузку на спину" },
  { value: "Грыжа", helper: "Избежим осевой перегрузки" },
  { value: "Травмы", helper: "Будем осторожнее с прогрессией" },
  { value: "Mobility issues", helper: "Добавим больше мобильности" }
];
const cycleSymptoms = [
  "Низкая энергия",
  "Cravings",
  "Болезненность",
  "Отёчность",
  "Раздражительность",
  "Хорошее самочувствие"
];
const optionalDocuments = [
  "Анализ крови",
  "Гормоны",
  "MRI",
  "Рекомендации врача"
];
const wearableSources = ["Apple Health", "Garmin", "Fitbit", "Oura / wearable"];

export function Onboarding({
  initialProfile,
  onComplete
}: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResult, setScanResult] = useState<BodyScanResult>();
  const totalSteps = 6;

  const toggleLimitation = (value: string) => {
    setProfile((current) => ({
      ...current,
      limitations: current.limitations.includes(value)
        ? current.limitations.filter((item) => item !== value)
        : [...current.limitations, value]
    }));
  };

  const toggleArrayValue = (
    key: "cycleSymptoms" | "optionalDocuments" | "wearableSources",
    value: string
  ) => {
    setProfile((current) => {
      const selected = current[key] ?? [];
      return {
        ...current,
        [key]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value]
      };
    });
  };

  return (
    <div className="onboarding-shell">
      <header className="onboarding-header">
        <Logo />
        <div className="onboarding-progress">
          <span style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
        <small>{step + 1} из {totalSteps}</small>
      </header>

      <main className="onboarding-main">
        {step === 0 && (
          <section className="onboarding-step">
            <span className="onboarding-symbol">
              <UserRound size={28} />
            </span>
            <p className="eyebrow">ШАГ 1 · ХАРАКТЕРИСТИКА</p>
            <h1>Расскажи, с кем Ayla будет работать</h1>
            <p className="lead">
              Эти данные помогают настроить тон, нагрузку, рекомендации по
              восстановлению и ежедневные подсказки.
            </p>
            <div className="body-data-grid profile-basics-grid">
              <label>
                <span>Возраст</span>
                <div>
                  <input
                    type="number"
                    min="13"
                    max="85"
                    value={profile.age}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        age: Number(event.target.value)
                      })
                    }
                  />
                  <small>лет</small>
                </div>
              </label>
              <label>
                <span>Пол / контекст</span>
                <select
                  value={profile.gender}
                  onChange={(event) =>
                    setProfile({ ...profile, gender: event.target.value })
                  }
                >
                  <option>Женщина</option>
                  <option>Мужчина</option>
                  <option>Не указывать</option>
                </select>
              </label>
              <label>
                <span>Где тренируешься</span>
                <select
                  value={profile.trainingPlace}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      trainingPlace: event.target.value
                    })
                  }
                >
                  <option>Дом + зал</option>
                  <option>Дома</option>
                  <option>В зале</option>
                  <option>На улице</option>
                </select>
              </label>
              <label>
                <span>Время на тренировку</span>
                <div>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={profile.availableTime}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        availableTime: Number(event.target.value)
                      })
                    }
                  />
                  <small>мин</small>
                </div>
              </label>
            </div>
            <h3 className="onboarding-subtitle">Главная цель</h3>
            <div className="choice-grid">
              {goals.map((goal) => (
                <button
                  className={profile.goal === goal ? "selected" : ""}
                  key={goal}
                  onClick={() => setProfile({ ...profile, goal })}
                >
                  {profile.goal === goal && <Check size={16} />}
                  {goal}
                </button>
              ))}
            </div>
            <h3 className="onboarding-subtitle">План по частоте</h3>
            <div className="chip-picker">
              {[
                "2 тренировки в неделю",
                "3 тренировки в неделю",
                "4+ тренировки",
                "По самочувствию"
              ].map((plan) => (
                  <button
                    className={profile.weeklyPlan === plan ? "selected" : ""}
                    key={plan}
                    onClick={() =>
                      setProfile({ ...profile, weeklyPlan: plan })
                    }
                  >
                    {profile.weeklyPlan === plan && <Check size={14} />}
                    {plan}
                  </button>
                ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-step">
            <span className="onboarding-symbol">
              <Dumbbell size={28} />
            </span>
            <p className="eyebrow">ШАГ 2 · УРОВЕНЬ</p>
            <h1>Какой у тебя сейчас уровень подготовки?</h1>
            <p className="lead">
              Это влияет на объём, темп, отдых и сложность упражнений.
            </p>
            <div className="level-list featured">
              {levels.map((level) => (
                <button
                  className={profile.level === level ? "selected" : ""}
                  key={level}
                  onClick={() => setProfile({ ...profile, level })}
                >
                  <Activity size={18} />
                  <span>
                    <strong>{level}</strong>
                    <small>
                      {level === "Новичок" &&
                        "Плавный старт, техника и уверенность"}
                      {level === "Средний" &&
                        "Регулярные тренировки и мягкий прогресс"}
                      {level === "Продвинутый" &&
                        "Больше вариативности и контроль нагрузки"}
                    </small>
                  </span>
                  {profile.level === level && <Check size={17} />}
                </button>
              ))}
            </div>
            <h3 className="onboarding-subtitle">Базовые данные</h3>
            <div className="body-data-grid">
              <label>
                <span>Рост</span>
                <div>
                  <input
                    type="number"
                    min="120"
                    max="220"
                    value={profile.heightCm}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        heightCm: Number(event.target.value)
                      })
                    }
                  />
                  <small>см</small>
                </div>
              </label>
              <label>
                <span>Вес</span>
                <div>
                  <input
                    type="number"
                    min="35"
                    max="250"
                    value={profile.weightKg}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        weightKg: Number(event.target.value)
                      })
                    }
                  />
                  <small>кг</small>
                </div>
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-step">
            <span className="onboarding-symbol">
              <ShieldCheck size={28} />
            </span>
            <p className="eyebrow">ШАГ 3 · ОГРАНИЧЕНИЯ</p>
            <h1>Что важно учитывать в нагрузке?</h1>
            <p className="lead">
              Это не диагнозы. Мы используем ответы только чтобы бережно
              подобрать упражнения и не давать лишнюю нагрузку.
            </p>
            <div className="limitation-grid">
              {limitations.map((item) => (
                <button
                  className={
                    profile.limitations.includes(item.value) ? "selected" : ""
                  }
                  key={item.value}
                  onClick={() => toggleLimitation(item.value)}
                >
                  {profile.limitations.includes(item.value) && (
                    <Check size={14} />
                  )}
                  <strong>{item.value}</strong>
                  <small>{item.helper}</small>
                </button>
              ))}
            </div>
            <article className="medical-boundary">
              <ShieldCheck size={20} />
              <p>
                Ayla не пишет «у вас сколиоз» или другие медицинские выводы.
                Формулировка всегда нейтральная: «учтём нагрузку на спину».
              </p>
            </article>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-step">
            <span className="onboarding-symbol">
              <MoonStar size={28} />
            </span>
            <p className="eyebrow">ШАГ 4 · ЦИКЛ</p>
            <h1>Хочешь, чтобы Ayla учитывала цикл?</h1>
            <p className="lead">
              Фаза цикла помогает мягче подбирать интенсивность, recovery,
              cravings и рекомендации по питанию.
            </p>
            <label className="cycle-toggle prominent">
              <div>
                <MoonStar size={20} />
                <span>
                  <strong>Учитывать цикл</strong>
                  <small>Можно выключить или изменить в любой момент</small>
                </span>
              </div>
              <input
                type="checkbox"
                checked={profile.cycleTracking}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    cycleTracking: event.target.checked
                  })
                }
              />
            </label>
            {profile.cycleTracking && (
              <>
                <div className="cycle-data-grid">
                  <label>
                    <CalendarDays size={17} />
                    <span>Длительность цикла</span>
                    <div>
                      <input
                        type="number"
                        min="18"
                        max="45"
                        value={profile.cycleLength ?? 28}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            cycleLength: Number(event.target.value)
                          })
                        }
                      />
                      <small>дней</small>
                    </div>
                  </label>
                  <label>
                    <CalendarDays size={17} />
                    <span>Последняя менструация</span>
                    <input
                      type="date"
                      value={profile.lastPeriodDate ?? ""}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          lastPeriodDate: event.target.value
                        })
                      }
                    />
                  </label>
                </div>
                <h3 className="onboarding-subtitle">Симптомы сейчас</h3>
                <div className="chip-picker">
                  {cycleSymptoms.map((item) => (
                    <button
                      className={
                        (profile.cycleSymptoms ?? []).includes(item)
                          ? "selected"
                          : ""
                      }
                      key={item}
                      onClick={() => toggleArrayValue("cycleSymptoms", item)}
                    >
                      {(profile.cycleSymptoms ?? []).includes(item) && (
                        <Check size={14} />
                      )}
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {step === 4 && (
          <section className="onboarding-step scan-onboarding-step">
            <span className="onboarding-symbol">
              <LockKeyhole size={28} />
            </span>
            <p className="eyebrow">ШАГ 5 · ФОТО ТЕЛА</p>
            <h1>Создадим безопасную точку отсчёта</h1>
            <p className="lead">
              Три ракурса помогут видеть изменения формы и устойчивости. Ayla
              не оценивает привлекательность, не угадывает вес и не делает
              медицинских выводов.
            </p>
            <div className="onboarding-scan-preview">
              {["Спереди", "Сбоку", "Сзади", "Сидя · optional"].map(
                (label, index) => (
                  <div key={label}>
                    <span className={`pose pose-${index}`} />
                    <small>{label}</small>
                    {scanResult && (
                      <i>
                        <Check size={13} />
                      </i>
                    )}
                  </div>
                )
              )}
            </div>
            <button
              className="primary-button full"
              onClick={() => setScanOpen(true)}
            >
              {scanResult ? (
                <>
                  <Check size={17} /> Body scan готов
                </>
              ) : (
                <>
                  <Sparkles size={17} /> Начать guided scan
                </>
              )}
            </button>
            <button
              className="skip-scan"
              onClick={() => setStep(5)}
            >
              Пропустить сейчас
            </button>
          </section>
        )}

        {step === 5 && (
          <section className="onboarding-step">
            <span className="onboarding-symbol">
              <FileText size={28} />
            </span>
            <p className="eyebrow">ШАГ 6 · ДОПОЛНИТЕЛЬНО</p>
            <h1>Добавить данные для более умной персонализации?</h1>
            <p className="lead">
              Это необязательно. Ayla использует такие данные только как
              контекст для рекомендаций, не для диагностики.
            </p>
            <h3 className="onboarding-subtitle">Документы</h3>
            <div className="choice-grid compact">
              {optionalDocuments.map((item) => (
                <button
                  className={
                    (profile.optionalDocuments ?? []).includes(item)
                      ? "selected"
                      : ""
                  }
                  key={item}
                  onClick={() => toggleArrayValue("optionalDocuments", item)}
                >
                  {(profile.optionalDocuments ?? []).includes(item) && (
                    <Check size={16} />
                  )}
                  {item}
                </button>
              ))}
            </div>
            <h3 className="onboarding-subtitle">Wearables / Health data</h3>
            <div className="chip-picker">
              {wearableSources.map((item) => (
                <button
                  className={
                    (profile.wearableSources ?? []).includes(item)
                      ? "selected"
                      : ""
                  }
                  key={item}
                  onClick={() => toggleArrayValue("wearableSources", item)}
                >
                  {(profile.wearableSources ?? []).includes(item) && (
                    <Check size={14} />
                  )}
                  {item}
                </button>
              ))}
            </div>
            <article className="medical-boundary">
              <LockKeyhole size={20} />
              <p>
                MVP сохраняет только выбранные типы данных. Реальная загрузка
                файлов и Apple Health / Garmin / Fitbit подключаются через
                приватное хранилище и consent screen.
              </p>
            </article>
          </section>
        )}
      </main>

      <footer className="onboarding-footer">
        <button
          className="back-button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ArrowLeft size={17} /> Назад
        </button>
        {step < totalSteps - 1 ? (
          <button
            className="primary-button"
            onClick={() => setStep(step + 1)}
          >
            Продолжить <ArrowRight size={17} />
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={() => onComplete(profile, scanResult)}
          >
            Открыть мою Ayla <ArrowRight size={17} />
          </button>
        )}
      </footer>

      {scanOpen && (
        <BodyScanModal
          profile={profile}
          onClose={() => setScanOpen(false)}
          onComplete={(result) => {
            setScanResult(result);
            setScanOpen(false);
          }}
        />
      )}
    </div>
  );
}
