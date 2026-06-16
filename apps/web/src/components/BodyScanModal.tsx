import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ImagePlus,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeBodyPhotos,
  createDemoBodyAnalysis
} from "../lib/bodyAnalysis";
import type {
  BodyScanContext,
  BodyScanResult,
  BodyScanView,
  BodyVisionAnalysis,
  UserProfile
} from "../types";
import { Modal } from "./Modal";

type BodyScanModalProps = {
  profile: UserProfile;
  previousScan?: BodyScanResult;
  onClose: () => void;
  onComplete: (result: BodyScanResult) => void;
};

const painOptions = [
  "Поясница",
  "Колени",
  "Шея",
  "Плечи",
  "Тазобедренные",
  "Голеностоп"
];

const views: Array<{
  id: BodyScanView;
  label: string;
  hint: string;
  optional?: boolean;
}> = [
  {
    id: "front",
    label: "Спереди",
    hint: "Стопы параллельно, руки свободно вдоль тела"
  },
  {
    id: "side",
    label: "Сбоку",
    hint: "Камера на уровне таза, взгляд прямо"
  },
  {
    id: "back",
    label: "Сзади",
    hint: "Не меняй расстояние и сохраняй нейтральную стойку"
  },
  {
    id: "seated",
    label: "Сидя",
    hint: "Опционально: сядь ровно, стопы на полу, камера на уровне корпуса",
    optional: true
  }
];

export function BodyScanModal({
  profile,
  previousScan,
  onClose,
  onComplete
}: BodyScanModalProps) {
  const [phase, setPhase] = useState<
    "intro" | "capture" | "context" | "analyzing" | "result"
  >("intro");
  const [activeView, setActiveView] = useState(0);
  const [photos, setPhotos] = useState<
    Partial<Record<BodyScanView, string>>
  >({});
  const [photoFiles, setPhotoFiles] = useState<
    Partial<Record<BodyScanView, File>>
  >({});
  const [context, setContext] = useState<BodyScanContext>({
    goal: profile.goal,
    painAreas: profile.limitations.filter((item) =>
      painOptions.includes(item)
    ),
    painLevel: 0
  });
  const [analysis, setAnalysis] = useState<BodyVisionAnalysis>(
    createDemoBodyAnalysis(
      {
        goal: profile.goal,
        painAreas: profile.limitations,
        painLevel: 0
      },
      Boolean(previousScan)
    )
  );
  const [source, setSource] = useState<"ai" | "demo">("demo");
  const [error, setError] = useState("");

  const current = views[activeView];
  const completedCount = Object.keys(photos).length;
  const requiredViews = views.filter((view) => !view.optional);
  const requiredCapturedCount = requiredViews.filter((view) => photos[view.id]).length;
  const allCaptured = requiredCapturedCount === requiredViews.length;
  const bmi = useMemo(
    () => profile.weightKg / Math.pow(profile.heightCm / 100, 2),
    [profile.heightCm, profile.weightKg]
  );

  const addPhoto = (file?: File) => {
    const preview = file ? URL.createObjectURL(file) : `demo-${current.id}`;
    setPhotos((value) => ({ ...value, [current.id]: preview }));
    if (file) {
      setPhotoFiles((value) => ({ ...value, [current.id]: file }));
    } else {
      setPhotoFiles((value) => {
        const next = { ...value };
        delete next[current.id];
        return next;
      });
    }
    if (activeView < views.length - 1) setActiveView(activeView + 1);
  };

  const togglePain = (area: string) => {
    setContext((value) => ({
      ...value,
      painAreas: value.painAreas.includes(area)
        ? value.painAreas.filter((item) => item !== area)
        : [...value.painAreas, area]
    }));
  };

  const analyze = async () => {
    setError("");
    setPhase("analyzing");
    try {
      const result = await analyzeBodyPhotos(
        photoFiles,
        context,
        Boolean(previousScan)
      );
      setAnalysis(result.analysis);
      setSource(result.source);
      setPhase("result");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось проанализировать body scan"
      );
      setPhase("context");
    }
  };

  const finish = () => {
    onComplete({
      completedAt: "Сегодня",
      ...analysis,
      painAreas: context.painAreas,
      painLevel: context.painLevel,
      goal: context.goal,
      source
    });
  };

  return (
    <Modal
      title={
        phase === "result"
          ? "Наблюдения Ayla"
          : "Guided body scan"
      }
      eyebrow="ПРИВАТНО · БЕЗ МЕДИЦИНСКИХ ВЫВОДОВ"
      onClose={onClose}
      className="body-scan-modal"
    >
      {phase === "intro" && (
        <div className="scan-intro">
          <div className="scan-intro-visual">
            {views.map((view, index) => (
              <div className="pose-preview" key={view.id}>
                <span className={`pose pose-${index}`} />
                <small>{view.label}</small>
              </div>
            ))}
          </div>
          <h3>Три фото для сравнимой динамики</h3>
          <p>
            Ayla оценивает качество кадра, видимые пропорции и изменения во
            времени. Сидячий ракурс можно добавить опционально. Вес и рост
            берутся из анкеты, а не угадываются по фото.
          </p>
          <div className="scan-rules">
            <span>
              <Check size={15} /> Одинаковое расстояние
            </span>
            <span>
              <Check size={15} /> Нейтральный свет
            </span>
            <span>
              <Check size={15} /> Облегающая одежда
            </span>
            <span>
              <Check size={15} /> Естественная стойка
            </span>
          </div>
          <article className="scan-privacy-inline">
            <ShieldCheck size={20} />
            <div>
              <strong>Фото не публикуются</strong>
              <span>
                В production они шифруются, очищаются от EXIF и удаляются по
                твоему запросу.
              </span>
            </div>
          </article>
          <button
            className="primary-button full"
            onClick={() => setPhase("capture")}
          >
            Начать сканирование <ChevronRight size={17} />
          </button>
        </div>
      )}

      {phase === "capture" && (
        <div className="scan-capture">
          <div className="scan-stepper">
            {views.map((view, index) => (
              <button
                className={`${index === activeView ? "active" : ""} ${
                  photos[view.id] ? "done" : ""
                }`}
                key={view.id}
                onClick={() => setActiveView(index)}
              >
                {photos[view.id] ? <Check size={14} /> : index + 1}
                <span>{view.label}</span>
              </button>
            ))}
          </div>

          <div
            className={`capture-stage ${
              photos[current.id] ? "has-photo" : ""
            }`}
            style={
              photos[current.id]?.startsWith("blob:")
                ? { backgroundImage: `url(${photos[current.id]})` }
                : undefined
            }
          >
            <div className="capture-guides">
              <i className="corner one" />
              <i className="corner two" />
              <i className="corner three" />
              <i className="corner four" />
              <span className={`capture-pose pose-${activeView}`} />
            </div>
            <div className="capture-copy">
              <strong>{current.label}</strong>
              <span>{current.hint}</span>
            </div>
          </div>

          <div className="capture-actions">
            <button
              className="secondary-button"
              onClick={() => addPhoto()}
            >
              <Sparkles size={17} /> Использовать демо
            </button>
            <label className="primary-button file-button">
              <Camera size={17} />
              Загрузить фото
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => addPhoto(event.target.files?.[0])}
              />
            </label>
          </div>

          <div className="capture-footer">
            <button
              className="text-button"
              onClick={() => setActiveView(Math.max(0, activeView - 1))}
              disabled={activeView === 0}
            >
              <ChevronLeft size={16} /> Назад
            </button>
            <span>
              {requiredCapturedCount} из 3 обязательных
              {completedCount > requiredCapturedCount ? " + сидя" : ""}
            </span>
            <button
              className="primary-button"
              disabled={!allCaptured}
              onClick={() => setPhase("context")}
            >
              Продолжить <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {phase === "context" && (
        <div className="scan-context">
          <button className="back-button" onClick={() => setPhase("capture")}>
            <ChevronLeft size={16} /> К ракурсам
          </button>
          <p className="eyebrow">СИГНАЛЫ ОТ ТЕБЯ</p>
          <h3>Что Ayla должна учесть сегодня?</h3>
          <p>
            Фото не показывает боль. Отметь ощущения сама — это важнее любого
            визуального предположения.
          </p>

          <div className="scan-context-block">
            <strong>Где есть дискомфорт или ограничение?</strong>
            <div className="scan-pain-grid">
              {painOptions.map((area) => (
                <button
                  className={context.painAreas.includes(area) ? "selected" : ""}
                  key={area}
                  onClick={() => togglePain(area)}
                >
                  {context.painAreas.includes(area) && <Check size={14} />}
                  {area}
                </button>
              ))}
            </div>
          </div>

          <label className="scan-pain-level">
            <span>
              Уровень боли сейчас
              <b>{context.painLevel} / 10</b>
            </span>
            <input
              type="range"
              min="0"
              max="10"
              value={context.painLevel}
              onChange={(event) =>
                setContext((value) => ({
                  ...value,
                  painLevel: Number(event.target.value)
                }))
              }
            />
            <small>
              <span>Нет боли</span>
              <span>Сильная</span>
            </small>
          </label>

          <div className="scan-goal-card">
            <span>Цель программы</span>
            <strong>{context.goal}</strong>
            <small>Берём из твоего профиля</small>
          </div>

          {context.painLevel >= 7 && (
            <article className="pain-warning">
              <AlertTriangle size={19} />
              <p>
                При сильной, новой или усиливающейся боли лучше не начинать
                тренировку и обратиться к квалифицированному специалисту.
              </p>
            </article>
          )}

          {error && <p className="food-error">{error}</p>}
          <button
            className="primary-button full"
            onClick={() => void analyze()}
          >
            Проанализировать и настроить план <Sparkles size={16} />
          </button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="body-analyzing">
          <div className="scan-beam">
            <span className="capture-pose pose-0" />
            <i />
          </div>
          <h3>Сравниваю ракурсы...</h3>
          <p>
            Проверяю качество кадра и формирую только нейтральные
            фитнес-наблюдения
          </p>
          <div className="analysis-steps">
            <span className="done">
              <Check size={14} /> Кадры
            </span>
            <span className="active">Визуальные ориентиры</span>
            <span>План нагрузки</span>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="body-result">
          <div className="result-status">
            <span className="status-chip sage">
              <Check size={14} /> Качество кадров{" "}
              {Math.round(analysis.captureQuality)}%
            </span>
            <span className="status-chip">
              {previousScan ? "Контрольный scan" : "Baseline scan"}
              {source === "demo" ? " · demo" : ""}
            </span>
          </div>

          <section className="body-profile-facts">
            <div>
              <span>Рост</span>
              <strong>{profile.heightCm} см</strong>
              <small>из анкеты</small>
            </div>
            <div>
              <span>Вес</span>
              <strong>{profile.weightKg} кг</strong>
              <small>из анкеты</small>
            </div>
            <div>
              <span>ИМТ</span>
              <strong>{bmi.toFixed(1)}</strong>
              <small>справочно</small>
            </div>
          </section>

          <article className="medical-boundary">
            <EyeOff size={20} />
            <p>
              Ayla не определяет диагнозы, процент жира или «нормальность»
              тела по фотографии. ИМТ — грубый справочный показатель, а не
              оценка здоровья или внешности.
            </p>
          </article>

          <section className="observation-list">
            <h3>Что можно наблюдать на кадрах</h3>
            {analysis.visibleIndicators.map((indicator, index) => (
              <div key={`${indicator.label}-${index}`}>
                <span>
                  {index === 0 ? (
                    <RotateCcw size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </span>
                <p>
                  <strong>
                    {indicator.label} ·{" "}
                    {Math.round(indicator.confidence * 100)}%
                  </strong>
                  {indicator.observation} {indicator.caveat}
                </p>
              </div>
            ))}
          </section>

          <section className="training-guidance-card">
            <div>
              <span>Фокус тренировки</span>
              <strong>{analysis.focusAreas.join(" · ")}</strong>
            </div>
            <p>{analysis.trainingGuidance.intensityNote}</p>
            {context.painAreas.length > 0 && (
              <small>
                Боль указана пользователем: {context.painAreas.join(", ")} ·{" "}
                {context.painLevel}/10
              </small>
            )}
          </section>

          <p className="comparison-note">{analysis.comparisonNote}</p>

          <div className="scan-security-row">
            <span>
              <LockKeyhole size={14} /> Приватно
            </span>
            <span>
              <EyeOff size={14} /> Без оценки внешности
            </span>
            <span>
              <ImagePlus size={14} /> Сравнение через 14 дней
            </span>
          </div>

          <button className="primary-button full" onClick={finish}>
            {previousScan
              ? "Сохранить check и обновить план"
              : "Сохранить scan и создать план"}
          </button>
        </div>
      )}
    </Modal>
  );
}
