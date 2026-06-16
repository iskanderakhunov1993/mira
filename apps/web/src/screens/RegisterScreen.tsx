import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { UserProfile } from "../types";
import { Logo } from "../components/Logo";

type RegisterScreenProps = {
  profile: UserProfile;
  onBack: () => void;
  onChange: (profile: UserProfile) => void;
  onComplete: () => void;
};

export function RegisterScreen({
  profile,
  onBack,
  onChange,
  onComplete
}: RegisterScreenProps) {
  const canContinue = profile.name.trim().length > 1 && profile.email.includes("@");

  return (
    <div className="auth-shell">
      <header className="landing-header">
        <Logo />
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} /> Назад
        </button>
      </header>
      <main className="auth-main">
        <section className="auth-card">
          <span className="onboarding-symbol">
            <UserRound size={28} />
          </span>
          <p className="eyebrow">АККАУНТ AYLА</p>
          <h1>Создадим твой приватный профиль</h1>
          <p className="lead">
            После регистрации откроется обязательный onboarding, чтобы Ayla
            собрала контекст о цели, теле, цикле и ограничениях.
          </p>
          <div className="account-fields auth-fields">
            <label>
              <UserRound size={17} />
              <input
                value={profile.name}
                placeholder="Как тебя зовут?"
                onChange={(event) =>
                  onChange({ ...profile, name: event.target.value })
                }
              />
            </label>
            <label>
              <Mail size={17} />
              <input
                value={profile.email}
                type="email"
                placeholder="Email"
                onChange={(event) =>
                  onChange({ ...profile, email: event.target.value })
                }
              />
            </label>
            <label>
              <LockKeyhole size={17} />
              <input type="password" placeholder="Пароль для MVP" />
            </label>
          </div>
          <article className="auth-privacy">
            <ShieldCheck size={19} />
            <p>
              MVP хранит профиль локально. В production здесь будет Supabase
              Auth, Apple / Google login и защищённое хранение данных.
            </p>
          </article>
          <button
            className="primary-button large full"
            disabled={!canContinue}
            onClick={onComplete}
          >
            Продолжить к onboarding <ArrowRight size={18} />
          </button>
        </section>
      </main>
    </div>
  );
}
