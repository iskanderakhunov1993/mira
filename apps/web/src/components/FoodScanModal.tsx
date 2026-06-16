import { Camera, Check, CircleGauge, ImagePlus, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { analyzeMealImage, demoMealAnalysis } from "../lib/mealAnalysis";
import type {
  MealVisionAnalysis,
  MealAnalysisResponse
} from "../types";
import { Modal } from "./Modal";

type FoodScanModalProps = {
  onClose: () => void;
};

export function FoodScanModal({ onClose }: FoodScanModalProps) {
  const [phase, setPhase] = useState<"upload" | "analyzing" | "result">(
    "upload"
  );
  const [analysis, setAnalysis] =
    useState<MealVisionAnalysis>(demoMealAnalysis);
  const [source, setSource] =
    useState<MealAnalysisResponse["source"]>("demo");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyze = async (image: File | null) => {
    setError("");
    setPhase("analyzing");
    try {
      const result = await analyzeMealImage(image);
      setAnalysis(result.analysis);
      setSource(result.source);
      setPhase("result");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось проанализировать фото"
      );
      setPhase("upload");
    }
  };

  return (
    <Modal
      title="Покажи Ayla свою еду"
      eyebrow="AI FOOD VISION"
      onClose={onClose}
      className="food-modal"
    >
      {phase === "upload" && (
        <>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const image = event.target.files?.[0] ?? null;
              if (image) void analyze(image);
              event.target.value = "";
            }}
          />
          <button
            className="food-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="camera-orbit">
              <Camera size={30} />
            </div>
            <strong>Сделать или выбрать фото</strong>
            <span>
              Лучше сверху, при хорошем свете и со всеми ингредиентами в кадре
            </span>
            <ImagePlus size={19} />
          </button>
          {error && <p className="food-error">{error}</p>}
          <p className="safety-inline">
            Оценка приблизительная: масло, соусы и размер порции могут быть
            распознаны неточно.
          </p>
          <button
            className="food-demo-button"
            onClick={() => void analyze(null)}
          >
            Посмотреть demo без фото
          </button>
        </>
      )}

      {phase === "analyzing" && (
        <div className="analyzing-state">
          <div className="analysis-loader">
            <Sparkles size={25} />
          </div>
          <h3>Рассматриваю блюдо...</h3>
          <p>Определяю продукты, порцию и пищевую ценность</p>
          <div className="analysis-steps">
            <span className="done">
              <Check size={14} /> Продукты
            </span>
            <span className="active">Порция</span>
            <span>Нутриенты</span>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="food-result">
          <div className="result-visual">
            <span className="plate large">
              <i />
              <i />
              <i />
            </span>
          </div>
          <span className="ai-badge">
            <CircleGauge size={15} />{" "}
            {Math.round(analysis.confidence * 100)}% уверенность
            {source === "demo" ? " · demo" : ""}
          </span>
          <h3>{analysis.dishName}</h3>
          <p>
            Ориентировочно {analysis.calories.min}–{analysis.calories.max} ккал
          </p>
          <div className="macro-row">
            <span>
              <strong>
                {analysis.macrosG.protein.min}–{analysis.macrosG.protein.max} г
              </strong>{" "}
              белки
            </span>
            <span>
              <strong>
                {analysis.macrosG.carbs.min}–{analysis.macrosG.carbs.max} г
              </strong>{" "}
              углеводы
            </span>
            <span>
              <strong>
                {analysis.macrosG.fat.min}–{analysis.macrosG.fat.max} г
              </strong>{" "}
              жиры
            </span>
          </div>
          {analysis.uncertainFactors.length > 0 && (
            <div className="food-uncertainty">
              <strong>Что может повлиять на оценку</strong>
              <span>{analysis.uncertainFactors.join(" · ")}</span>
            </div>
          )}
          {analysis.followUpQuestion && (
            <p className="food-question">{analysis.followUpQuestion}</p>
          )}
          <div className="result-actions">
            <button className="secondary-button">Быстро поправить</button>
            <button className="primary-button" onClick={onClose}>
              <Check size={17} /> Всё верно
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
