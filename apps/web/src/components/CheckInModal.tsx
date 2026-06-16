import { useState } from "react";
import type { ReadinessInput } from "../types";
import { Modal } from "./Modal";

type CheckInModalProps = {
  initial: ReadinessInput;
  onSave: (value: ReadinessInput) => void;
  onClose: () => void;
};

const fields: Array<{
  key: keyof ReadinessInput;
  label: string;
  low: string;
  high: string;
}> = [
  { key: "sleep", label: "Как ты спала?", low: "Плохо", high: "Отлично" },
  { key: "energy", label: "Сколько энергии?", low: "Нет сил", high: "Много" },
  { key: "mood", label: "Как настроение?", low: "Тяжело", high: "Легко" },
  {
    key: "soreness",
    label: "Есть усталость в мышцах?",
    low: "Нет",
    high: "Сильная"
  }
];

export function CheckInModal({
  initial,
  onSave,
  onClose
}: CheckInModalProps) {
  const [values, setValues] = useState(initial);

  return (
    <Modal
      title="Как твоё тело сегодня?"
      eyebrow="CHECK-IN · МЕНЬШЕ МИНУТЫ"
      onClose={onClose}
      className="checkin-modal"
    >
      <p className="modal-intro">
        Здесь нет правильных ответов. Ayla адаптирует рекомендации под твой
        реальный ресурс.
      </p>
      <div className="checkin-fields">
        {fields.map((field) => (
          <label className="range-field" key={field.key}>
            <span>
              <strong>{field.label}</strong>
              <b>{values[field.key]} / 10</b>
            </span>
            <input
              type="range"
              min="1"
              max="10"
              value={values[field.key]}
              onChange={(event) =>
                setValues({
                  ...values,
                  [field.key]: Number(event.target.value)
                })
              }
            />
            <small>
              <span>{field.low}</span>
              <span>{field.high}</span>
            </small>
          </label>
        ))}
      </div>
      <button className="primary-button full" onClick={() => onSave(values)}>
        Обновить состояние
      </button>
    </Modal>
  );
}
