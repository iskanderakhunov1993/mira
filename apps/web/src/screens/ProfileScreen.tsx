import {
  Activity,
  Apple,
  Bell,
  ChevronRight,
  FileHeart,
  HeartPulse,
  Link2,
  LockKeyhole,
  MoonStar,
  Settings2,
  ShieldCheck,
  Watch
} from "lucide-react";
import type { UserProfile } from "../types";

const settings = [
  {
    icon: HeartPulse,
    title: "Цель и уровень",
    detail: "Подтянуть тело · средний уровень"
  },
  {
    icon: Activity,
    title: "Ограничения",
    detail: "Бережная нагрузка на поясницу"
  },
  {
    icon: MoonStar,
    title: "Цикл",
    detail: "Подключен · день 22"
  },
  {
    icon: Watch,
    title: "Здоровье и устройства",
    detail: "Apple Health подключен"
  },
  {
    icon: FileHeart,
    title: "Документы и рекомендации",
    detail: "Нет загруженных файлов"
  },
  {
    icon: Bell,
    title: "Уведомления",
    detail: "Мягкое утреннее напоминание"
  }
];

type ProfileScreenProps = {
  profile: UserProfile;
  onRestartOnboarding: () => void;
};

export function ProfileScreen({
  profile,
  onRestartOnboarding
}: ProfileScreenProps) {
  return (
    <div className="screen profile-screen">
      <section className="profile-hero">
        <div className="profile-avatar">
          {profile.name.trim().charAt(0).toUpperCase() || "А"}
        </div>
        <div>
          <p className="eyebrow">ПРОФИЛЬ AYLА</p>
          <h1>{profile.name || "Алина"}</h1>
          <p>Вместе с Ayla с 4 мая · 6 недель</p>
        </div>
        <button className="icon-button">
          <Settings2 size={19} />
        </button>
      </section>

      <section className="profile-grid">
        <div className="settings-list">
          {settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <button className="settings-row" key={setting.title}>
                <span className="metric-icon">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{setting.title}</strong>
                  <small>{setting.detail}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>

        <aside className="profile-aside">
          <article className="membership-panel">
            <span className="membership-icon large">
              <Apple size={20} />
            </span>
            <p className="eyebrow">AYLA MEMBERSHIP</p>
            <h3>Твой персональный coach активен</h3>
            <p>
              Ежедневные тренировки, анализ питания и body-aware insights.
            </p>
            <button>Управление подпиской</button>
          </article>
          <article className="connected-panel">
            <div>
              <Link2 size={18} />
              <h3>Подключено</h3>
            </div>
            <span>Apple Health</span>
            <span>Email</span>
          </article>
          <article className="trust-panel">
            <div>
              <ShieldCheck size={20} />
              <h3>Приватность и контроль</h3>
            </div>
            <p>Экспортируй или полностью удали свои данные в любой момент.</p>
            <button>
              <LockKeyhole size={15} /> Управление данными
            </button>
            <button onClick={onRestartOnboarding}>
              Пройти онбординг заново
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
}
