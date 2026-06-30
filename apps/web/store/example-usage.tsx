"use client";

import { MiraWidget } from "@/components/ui/MiraWidget";
import { selectRedFlags, useMiraStore } from "@/store";

export function MiraStoreExample() {
  const cycle = useMiraStore((state) => state.cycle);
  const care = useMiraStore((state) => state.care);
  const addWater = useMiraStore((state) => state.addWater);
  const redFlags = useMiraStore(selectRedFlags);

  return (
    <div>
      <p>Текущий день: {cycle.currentDay}</p>
      <p>Фаза: {cycle.phase}</p>
      <p>Вода: {care.water.current} / {care.water.target} л</p>

      <MiraWidget
        percentage={83}
        daysTracked={25}
        totalDays={30}
        mood="happy"
        message="Ты заботишься о себе уже 3 месяца! ✨"
      />

      <button type="button" onClick={() => addWater(0.2)}>
        💧 Добавить стакан
      </button>

      {redFlags.length > 0 && (
        <div>
          <h3>🩺 Когда обратиться к врачу</h3>
          {redFlags.map((flag) => (
            <div key={flag}>✅ {flag}</div>
          ))}
        </div>
      )}
    </div>
  );
}
