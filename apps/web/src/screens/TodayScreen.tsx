import {
  BatteryCharging,
  Brain,
  ChevronRight,
  Droplets,
  HeartPulse,
  MoonStar,
  Salad,
  Sparkles,
  SunMedium
} from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { ReadinessRing } from "../components/ReadinessRing";

type TodayScreenProps = {
  readiness: number;
  insight: string;
  workoutMode: string;
  workoutDuration: number;
  onCheckIn: () => void;
  onGenerate: () => void;
  onNutrition: () => void;
};

export function TodayScreen({
  readiness,
  insight,
  workoutMode,
  workoutDuration,
  onCheckIn,
  onGenerate,
  onNutrition
}: TodayScreenProps) {
  return (
    <div className="screen today-screen">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ТВОЙ ДЕНЬ С AYLА</p>
          <h1>
            Доброе утро, <em>Алина</em>
          </h1>
          <p className="lead">
            Посмотрим, что будет поддерживать твоё тело сегодня.
          </p>
        </div>
        <button className="text-button" onClick={onCheckIn}>
          Обновить состояние <ChevronRight size={16} />
        </button>
      </section>

      <section className="hero-grid">
        <article className="readiness-card">
          <div className="readiness-copy">
            <p className="eyebrow">СОСТОЯНИЕ СЕГОДНЯ</p>
            <h2>Мягкий, устойчивый ресурс</h2>
            <p>
              Сон был хорошим, но энергия чуть ниже твоего обычного уровня.
              Сегодня важно двигаться без перегрузки.
            </p>
            <button className="quiet-button" onClick={onCheckIn}>
              <HeartPulse size={17} />
              Быстрый check-in
            </button>
          </div>
          <div className="readiness-score">
            <ReadinessRing score={readiness} />
            <span>Готовность</span>
          </div>
          <div className="orb orb-one" />
          <div className="orb orb-two" />
        </article>

        <article className="cycle-card">
          <div className="cycle-top">
            <span className="metric-icon">
              <MoonStar size={18} />
            </span>
            <span className="status-chip">День 22</span>
          </div>
          <div>
            <p className="eyebrow">ЦИКЛ</p>
            <h3>Лютеиновая фаза</h3>
            <p>
              Может быть меньше энергии и выше потребность в восстановлении.
            </p>
          </div>
          <div className="cycle-track">
            <span className="cycle-progress" />
            <i />
          </div>
          <small>Ориентировочно 6 дней до нового цикла</small>
        </article>
      </section>

      <section className="metrics-grid">
        <MetricCard
          icon={MoonStar}
          label="Сон"
          value="7 ч 42 мин"
          detail="Хорошее восстановление"
          tone="lavender"
        />
        <MetricCard
          icon={BatteryCharging}
          label="Энергия"
          value="6 из 10"
          detail="Ниже обычного"
          tone="rose"
        />
        <MetricCard
          icon={Brain}
          label="Настроение"
          value="Спокойное"
          detail="Стабильный фон"
          tone="beige"
        />
        <MetricCard
          icon={Droplets}
          label="Вода"
          value="1,1 из 2,2 л"
          detail="Добавь стакан сейчас"
          tone="sage"
        />
      </section>

      <section className="coach-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AYLA INSIGHT</p>
            <h2>Что лучше для тела сегодня</h2>
          </div>
          <span className="ai-badge">
            <Sparkles size={15} /> AI insight
          </span>
        </div>

        <div className="coach-grid">
          <article className="insight-card">
            <div className="insight-symbol">
              <SunMedium size={28} strokeWidth={1.6} />
            </div>
            <div>
              <h3>Сохраняем ритм, снижаем давление</h3>
              <p>{insight}</p>
              <div className="insight-factors">
                <span>сон 7:42</span>
                <span>энергия 6/10</span>
                <span>цикл: день 22</span>
              </div>
            </div>
          </article>

          <article className="workout-cta-card">
            <div className="workout-cta-head">
              <div>
                <p className="eyebrow">ТРЕНИРОВКА ДНЯ</p>
                <h3>{workoutMode}</h3>
              </div>
              <span>{workoutDuration} мин</span>
            </div>
            <div className="body-lines" aria-hidden="true">
              <i className="line line-a" />
              <i className="line line-b" />
              <i className="line line-c" />
              <i className="line line-d" />
            </div>
            <button className="primary-button" onClick={onGenerate}>
              <Sparkles size={18} />
              Сгенерировать тренировку
            </button>
            <small>
              Ayla учтёт сон, цикл, энергию, ограничения и вчерашнюю нагрузку.
            </small>
          </article>
        </div>
      </section>

      <section className="nutrition-preview">
        <div>
          <span className="metric-icon">
            <Salad size={20} />
          </span>
          <div>
            <p className="eyebrow">ПИТАНИЕ</p>
            <h3>Белка пока немного меньше твоего ритма</h3>
            <p>
              Не нужно ничего считать. Сфотографируй следующий приём пищи, и
              Ayla обновит картину дня.
            </p>
          </div>
        </div>
        <button className="secondary-button" onClick={onNutrition}>
          Добавить фото еды
        </button>
      </section>
    </div>
  );
}
