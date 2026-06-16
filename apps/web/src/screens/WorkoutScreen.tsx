import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles
} from "lucide-react";
import type { Exercise } from "../types";

type WorkoutScreenProps = {
  exercises: Exercise[];
  generated: boolean;
  generating: boolean;
  workoutMode: string;
  workoutDuration: number;
  rationale: string;
  signals: string[];
  hasBodyScan: boolean;
  onGenerate: () => void;
  onUpdateExercise: (
    id: number,
    update: Partial<Pick<Exercise, "completed" | "skipped">>
  ) => void;
  onReplace: (id: number) => void;
  onBodyCheck: () => void;
  onBack: () => void;
};

export function WorkoutScreen({
  exercises,
  generated,
  generating,
  workoutMode,
  workoutDuration,
  rationale,
  signals,
  hasBodyScan,
  onGenerate,
  onUpdateExercise,
  onReplace,
  onBodyCheck,
  onBack
}: WorkoutScreenProps) {
  if (!generated) {
    return (
      <div className="screen generation-screen">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={18} /> Назад
        </button>
        <div className="generation-visual">
          <div className={generating ? "pulse-core active" : "pulse-core"}>
            <Sparkles size={30} />
          </div>
          <i />
          <i />
          <i />
        </div>
        <p className="eyebrow">AI WORKOUT ENGINE</p>
        <h1>
          {generating
            ? "Собираю тренировку под тебя..."
            : "Тренировка, подходящая именно сегодня"}
        </h1>
        <p className="lead">
          Учитываем восстановление, цель, ограничения, отмеченную боль и
          нейтральные ориентиры body scan.
        </p>
        <div className="generation-signals">
          {signals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
          {!hasBodyScan && <span>Можно добавить body scan</span>}
        </div>
        <button
          className="primary-button large"
          onClick={onGenerate}
          disabled={generating}
        >
          <Sparkles size={18} />
          {generating ? "Ayla анализирует..." : "Сгенерировать тренировку"}
        </button>
      </div>
    );
  }

  const completed = exercises.filter((exercise) => exercise.completed).length;

  return (
    <div className="screen workout-screen">
      <div className="workout-header">
        <div>
          <p className="eyebrow">ПОД ТВОЁ СОСТОЯНИЕ СЕГОДНЯ</p>
          <h1>{workoutMode}</h1>
          <p className="lead">
            Мягкая нагрузка на всё тело с акцентом на ягодицы и осанку.
          </p>
        </div>
        <div className="workout-meta">
          <span>
            <Clock3 size={16} /> {workoutDuration} мин
          </span>
          <span>Умеренная</span>
          <span>{exercises.length} упражнения</span>
        </div>
      </div>

      <article className="workout-rationale">
        <Sparkles size={18} />
        <p>{rationale}</p>
      </article>

      <div className="workout-progress-row">
        <span>
          Выполнено {completed} из {exercises.length}
        </span>
        <div className="progress-bar">
          <i style={{ width: `${(completed / exercises.length) * 100}%` }} />
        </div>
      </div>

      <section className="exercise-list">
        {exercises.map((exercise, index) => (
          <article
            className={`exercise-card ${
              exercise.completed ? "completed" : ""
            } ${exercise.skipped ? "skipped" : ""}`}
            key={exercise.id}
          >
            <div className="exercise-number">
              {exercise.completed ? <Check size={18} /> : index + 1}
            </div>
            <div className="exercise-visual">
              <div className="exercise-figure">
                <i />
                <i />
                <i />
              </div>
              <span>{exercise.focus}</span>
            </div>
            <div className="exercise-info">
              <div className="exercise-title-row">
                <div>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.focus}</p>
                </div>
                <strong>{exercise.prescription}</strong>
              </div>
              <p className="technique-cue">{exercise.cue}</p>
              <div className="exercise-actions">
                <button
                  className="complete-button"
                  onClick={() =>
                    onUpdateExercise(exercise.id, {
                      completed: !exercise.completed,
                      skipped: false
                    })
                  }
                >
                  {exercise.completed ? (
                    <RotateCcw size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  {exercise.completed ? "Вернуть" : "Выполнила"}
                </button>
                <button
                  onClick={() =>
                    onUpdateExercise(exercise.id, {
                      skipped: true,
                      completed: false
                    })
                  }
                >
                  <SkipForward size={16} /> Пропустить
                </button>
                <button className="pain-button" onClick={() => onReplace(exercise.id)}>
                  <AlertTriangle size={16} /> Больно
                </button>
              </div>
            </div>
            <div className="rest-timer">
              <span>
                <Pause size={13} /> отдых
              </span>
              <strong>{exercise.rest}</strong>
              <button aria-label="Запустить таймер">
                <Play size={14} fill="currentColor" />
              </button>
            </div>
          </article>
        ))}
      </section>

      {completed === exercises.length && exercises.length > 0 && (
        <article className="post-workout-check">
          <div className="post-workout-icon">
            <Camera size={22} />
          </div>
          <div>
            <p className="eyebrow">КОНТРОЛЬ ДИНАМИКИ</p>
            <h3>Тренировка завершена</h3>
            <p>
              Можно сделать повторный body scan. Для сравнения формы лучше
              сохранять одинаковый свет и интервал около 14 дней.
            </p>
          </div>
          <button className="secondary-button" onClick={onBodyCheck}>
            Сделать check
          </button>
        </article>
      )}
    </div>
  );
}
