import type { PeriodKit, PeriodKitItemId } from "@/lib/types";

export const periodKitItems: Array<{ id: PeriodKitItemId; label: string; hint: string; essential?: boolean }> = [
  { id: "pads", label: "Прокладки", hint: "2-3 штуки в сумку", essential: true },
  { id: "tampons", label: "Тампоны", hint: "Если пользуешься" },
  { id: "cup", label: "Менструальная чаша", hint: "Если это твой вариант" },
  { id: "pain_relief", label: "Обезболивающее", hint: "Только привычное и разрешённое тебе", essential: true },
  { id: "heating_pad", label: "Грелка", hint: "Дома или мини-формат" },
  { id: "wet_wipes", label: "Влажные салфетки", hint: "Для дороги и работы", essential: true },
  { id: "spare_underwear", label: "Запасное бельё", hint: "На всякий случай", essential: true },
  { id: "water", label: "Вода", hint: "Маленькая бутылка", essential: true },
  { id: "snack", label: "Шоколад / перекус", hint: "Что-то маленькое и сытное" },
  { id: "pregnancy_test", label: "Тест на беременность", hint: "Если есть задержка или риск", essential: true },
];

export function normalizePeriodKit(kit?: PeriodKit): PeriodKit {
  const checked = new Map((kit?.items ?? []).map((item) => [item.id, item.checked]));
  return {
    updatedAt: kit?.updatedAt,
    items: periodKitItems.map((item) => ({ id: item.id, checked: checked.get(item.id) ?? false })),
  };
}
