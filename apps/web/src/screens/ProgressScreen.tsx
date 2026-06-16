import {
  Camera,
  ChevronRight,
  EyeOff,
  LockKeyhole,
  MoveUpRight,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";
import type { BodyScanResult } from "../types";

type ProgressScreenProps = {
  latestScan?: BodyScanResult;
  onNewScan: () => void;
};

export function ProgressScreen({
  latestScan,
  onNewScan
}: ProgressScreenProps) {
  return (
    <div className="screen progress-screen">
      <section className="screen-title-row">
        <div>
          <p className="eyebrow">НЕ ТОЛЬКО ВЕС</p>
          <h1>Как меняется твоё тело</h1>
          <p className="lead">
            Ayla замечает динамику формы, силы, энергии и самочувствия без
            критики внешности.
          </p>
        </div>
        <button className="secondary-button" onClick={onNewScan}>
          <Camera size={18} /> Новый body scan
        </button>
      </section>

      <section className="progress-hero">
        <div className="progress-illustration">
          <div className="scan-frame">
            <i className="corner one" />
            <i className="corner two" />
            <i className="corner three" />
            <i className="corner four" />
            <div className="silhouette">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
        <div className="progress-summary">
          <span className="status-chip sage">
            <TrendingUp size={14} /> 6 недель вместе
          </span>
          <h2>
            {latestScan
              ? "Baseline scan сохранён"
              : "Тело становится сильнее и устойчивее"}
          </h2>
          <p>
            {latestScan
              ? latestScan.observations[1]
              : "На последних фото заметна более стабильная позиция плеч и корпуса. Это наблюдение о динамике, не медицинская оценка осанки."}
          </p>
          <div className="progress-highlights">
            <div>
              <strong>+18%</strong>
              <span>регулярность</span>
            </div>
            <div>
              <strong>+12%</strong>
              <span>рабочий объём</span>
            </div>
            <div>
              <strong>4,2</strong>
              <span>энергия / 5</span>
            </div>
          </div>
        </div>
      </section>

      <section className="scan-history">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">BODY SCAN</p>
            <h2>История наблюдений</h2>
          </div>
          <button className="text-button">
            Все сканы <ChevronRight size={16} />
          </button>
        </div>
        <div className="scan-cards">
          {[
            latestScan?.completedAt ?? "15 июня",
            "1 июня",
            "18 мая"
          ].map((date, index) => (
            <article className="scan-card" key={date}>
              <div className="mini-scan">
                <div className="mini-silhouette" />
                {index === 0 && <span>Новый</span>}
              </div>
              <div>
                <strong>{date}</strong>
                <span>{index === 0 ? "Сегодня" : `${index * 2} нед. назад`}</span>
              </div>
              <MoveUpRight size={17} />
            </article>
          ))}
        </div>
      </section>

      <section className="privacy-card">
        <div className="privacy-icon">
          <ShieldCheck size={25} />
        </div>
        <div>
          <h3>Твои фото принадлежат только тебе</h3>
          <p>
            Шифруем хранение, удаляем метаданные и не используем body scans для
            рекламы или обучения публичных моделей.
          </p>
        </div>
        <div className="privacy-points">
          <span>
            <LockKeyhole size={15} /> Приватное хранение
          </span>
          <span>
            <EyeOff size={15} /> Без публичного профиля
          </span>
          <span>
            <Sparkles size={15} /> Только персонализация
          </span>
        </div>
      </section>
    </div>
  );
}
