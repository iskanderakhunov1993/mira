import {
  Apple,
  ChartNoAxesCombined,
  CircleUserRound,
  Dumbbell,
  House
} from "lucide-react";
import type { Exercise, NavItem } from "../types";

export const navigation: NavItem[] = [
  { id: "today", label: "Сегодня", icon: House },
  { id: "workout", label: "Тренировка", icon: Dumbbell },
  { id: "nutrition", label: "Питание", icon: Apple },
  { id: "progress", label: "Прогресс", icon: ChartNoAxesCombined },
  { id: "profile", label: "Профиль", icon: CircleUserRound }
];

export const initialExercises: Exercise[] = [
  {
    id: 1,
    name: "Дыхание 90/90",
    focus: "Корпус · восстановление",
    prescription: "2 × 6 дыханий",
    rest: "30 сек",
    cue: "Мягко прижми поясницу к полу, выдох длиннее вдоха.",
    completed: false,
    skipped: false
  },
  {
    id: 2,
    name: "Ягодичный мост",
    focus: "Ягодицы · задняя линия",
    prescription: "3 × 12",
    rest: "45 сек",
    cue: "Выдох на подъеме. Не переразгибай поясницу.",
    completed: false,
    skipped: false
  },
  {
    id: 3,
    name: "Тяга верхнего блока",
    focus: "Спина · осанка",
    prescription: "3 × 10",
    rest: "60 сек",
    cue: "Опусти плечи и веди локти к ребрам.",
    completed: false,
    skipped: false
  },
  {
    id: 4,
    name: "Сплит-присед с опорой",
    focus: "Ноги · стабильность",
    prescription: "3 × 8 / сторона",
    rest: "60 сек",
    cue: "Держи стопу устойчиво, двигайся в комфортной амплитуде.",
    completed: false,
    skipped: false
  }
];

export const meals = [
  {
    id: 1,
    name: "Греческий йогурт, ягоды, гранола",
    time: "08:42",
    energy: "410 ккал",
    protein: "26 г белка",
    confidence: 91,
    tone: "rose"
  },
  {
    id: 2,
    name: "Лосось, киноа и зеленые овощи",
    time: "13:15",
    energy: "620 ккал",
    protein: "43 г белка",
    confidence: 84,
    tone: "sage"
  }
];
