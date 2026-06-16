import {
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Droplets,
  Edit3,
  ImagePlus,
  Sparkles
} from "lucide-react";
import { meals } from "../data/demo";

type NutritionScreenProps = {
  onAddMeal: () => void;
};

export function NutritionScreen({ onAddMeal }: NutritionScreenProps) {
  return (
    <div className="screen nutrition-screen">
      <section className="screen-title-row">
        <div>
          <p className="eyebrow">БЕЗ РУЧНОГО ПОДСЧЁТА</p>
          <h1>Питание сегодня</h1>
          <p className="lead">
            Показывай Ayla еду. Она сама собирает картину и подсказывает мягко,
            без давления цифр.
          </p>
        </div>
        <button className="primary-button" onClick={onAddMeal}>
          <Camera size={18} /> Сфотографировать еду
        </button>
      </section>

      <section className="nutrition-summary-grid">
        <article className="protein-card">
          <div className="protein-ring">
            <strong>69</strong>
            <span>г белка</span>
          </div>
          <div>
            <p className="eyebrow">ФОКУС ДНЯ</p>
            <h3>Добавь ещё один белковый приём</h3>
            <p>
              Например, творог, яйца, тофу или птицу. Без необходимости
              взвешивать порцию.
            </p>
          </div>
        </article>
        <article className="hydration-card">
          <div className="hydration-head">
            <span className="metric-icon">
              <Droplets size={18} />
            </span>
            <span>1,1 / 2,2 л</span>
          </div>
          <h3>Водный ритм</h3>
          <div className="water-track">
            <i />
          </div>
          <p>Стакан воды сейчас мягко поддержит энергию до вечера.</p>
          <button>+ 250 мл</button>
        </article>
      </section>

      <section className="meal-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">РАСПОЗНАНО AYLА</p>
            <h2>Приёмы пищи</h2>
          </div>
          <span className="muted-label">2 сегодня</span>
        </div>

        <div className="meal-list">
          {meals.map((meal) => (
            <article className="meal-card" key={meal.id}>
              <div className={`meal-photo ${meal.tone}`}>
                <span className="plate">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="meal-info">
                <span>{meal.time}</span>
                <h3>{meal.name}</h3>
                <div>
                  <strong>{meal.energy}</strong>
                  <span>{meal.protein}</span>
                </div>
              </div>
              <div className="confidence">
                <CircleGauge size={16} />
                <span>{meal.confidence}% уверенность</span>
              </div>
              <button className="icon-button" aria-label="Исправить результат">
                <Edit3 size={17} />
              </button>
            </article>
          ))}
        </div>

        <button className="photo-dropzone" onClick={onAddMeal}>
          <ImagePlus size={25} />
          <strong>Добавить фото следующего приёма пищи</strong>
          <span>Ayla распознает блюдо и покажет confidence score</span>
          <ChevronRight size={18} />
        </button>
      </section>

      <article className="nutrition-insight">
        <span className="ai-badge">
          <Sparkles size={15} /> AI insight
        </span>
        <div>
          <h3>Твой день выглядит устойчиво</h3>
          <p>
            Энергии достаточно для запланированной тренировки. Перед ней
            подойдет лёгкий перекус, если почувствуешь голод.
          </p>
        </div>
        <CheckCircle2 size={22} />
      </article>
    </div>
  );
}
