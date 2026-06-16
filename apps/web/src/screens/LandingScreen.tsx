import {
  ArrowRight,
  Camera,
  HeartPulse,
  LockKeyhole,
  Sparkles,
  Utensils
} from "lucide-react";
import { Logo } from "../components/Logo";

type LandingScreenProps = {
  onCreateAccount: () => void;
};

export function LandingScreen({ onCreateAccount }: LandingScreenProps) {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <Logo />
        <button className="landing-login" onClick={onCreateAccount}>
          Начать
        </button>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="landing-pill">
              <Sparkles size={15} /> AI body-aware fitness coach
            </span>
            <h1>
              Ayla понимает твоё тело <em>каждый день</em>
            </h1>
            <p>
              Не просто трекер калорий и не план тренировок на месяц. Ayla
              учитывает цель, цикл, сон, питание, фото тела, ограничения и
              самочувствие, чтобы подсказать: что лучше для тебя сегодня.
            </p>
            <div className="landing-actions">
              <button className="primary-button large" onClick={onCreateAccount}>
                Создать аккаунт <ArrowRight size={18} />
              </button>
              <span>3–5 минут до персонального плана</span>
            </div>
          </div>

          <div className="landing-phone" aria-hidden="true">
            <div className="phone-status">
              <span>9:41</span>
              <i />
            </div>
            <div className="phone-premium">
              <Sparkles size={16} />
              <span>Personal coach active</span>
            </div>
            <article className="phone-progress">
              <span>Your readiness</span>
              <strong>92%</strong>
              <small>Сегодня лучше мягкая сила + mobility</small>
              <div className="phone-ring">
                <b>1480</b>
                <small>kcal</small>
              </div>
            </article>
            <div className="phone-macros">
              <span>
                <b>69г</b>
                protein
              </span>
              <span>
                <b>1.1л</b>
                water
              </span>
              <span>
                <b>32м</b>
                workout
              </span>
            </div>
            <article className="phone-task">
              <Camera size={18} />
              <div>
                <strong>Body scan готов</strong>
                <small>Без диагнозов, только fitness context</small>
              </div>
            </article>
          </div>
        </section>

        <section className="landing-feature-grid">
          <article>
            <HeartPulse size={22} />
            <h3>Daily AI decision</h3>
            <p>Каждый день новый план с учётом энергии, сна, цикла и боли.</p>
          </article>
          <article>
            <Utensils size={22} />
            <h3>Питание по фото</h3>
            <p>Фото еды, примерные калории, БЖУ и confidence score.</p>
          </article>
          <article>
            <Camera size={22} />
            <h3>Body-aware scan</h3>
            <p>Три ракурса для динамики формы без медицинских выводов.</p>
          </article>
          <article>
            <LockKeyhole size={22} />
            <h3>Privacy first</h3>
            <p>Фото и health context используются только для персонализации.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
