import type { MiraLocalData, CyclePhase, DailyCheckIn } from "./types";
import { getCyclePhase, getCheckIn, dateKey } from "./store";
import { getCycleNorm } from "./cycleEngine";

export type VitaminRec = {
  name: string;
  dose: string;
  why: string;
  how: string;
  priority: "high" | "medium" | "low";
  icon: string;
};

export type VitaminCard = {
  title: string;
  subtitle: string;
  recs: VitaminRec[];
};

function getYesterdayCheckIn(data: MiraLocalData): DailyCheckIn | undefined {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return data.checkIns[dateKey(y)];
}

function getRecentHeavyDays(data: MiraLocalData, daysBack: number): number {
  let count = 0;
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const c = data.checkIns[dateKey(d)];
    if (c?.period?.intensity === "heavy" || c?.period?.intensity === "very_heavy") count++;
  }
  return count;
}

export function getVitaminRecommendations(data: MiraLocalData): VitaminCard | null {
  const profile = data.profile;
  if (!profile) return null;

  const norm = getCycleNorm(profile);
  const cycleDay = norm.isDelayed ? norm.cycleLength : norm.cycleDay;
  const cycleLength = norm.cycleLength;
  const periodLength = profile.cycleConfig.periodLength;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const today = getCheckIn(data);
  const yesterday = getYesterdayCheckIn(data);
  const recentHeavy = getRecentHeavyDays(data, 3);

  const recs: VitaminRec[] = [];

  // ── Blood loss → Iron + Vitamin C ──
  if (recentHeavy >= 1) {
    recs.push({
      name: "Железо",
      dose: "обсудить анализы",
      why: `Обильные месячные ${recentHeavy} ${recentHeavy === 1 ? "день" : "дня"} подряд — это повод обратить внимание на запасы железа.`,
      how: "Добавь продукты с железом и витамином C. Добавки лучше подбирать после анализов и консультации.",
      priority: "high",
      icon: "🩸",
    });
    recs.push({
      name: "Витамин C",
      dose: "из еды или по назначению",
      why: "Витамин C в еде помогает усвоению железа из рациона.",
      how: "Цитрус, ягоды или сладкий перец рядом с железосодержащей едой — мягкий вариант поддержки.",
      priority: "high",
      icon: "🍊",
    });
  }

  // ── Pain → Magnesium ──
  if (today?.pain?.level === "strong" || today?.pain?.level === "medium" || yesterday?.pain?.level === "strong") {
    recs.push({
      name: "Магний",
      dose: "обсудить дозировку",
      why: "Магний некоторым помогает легче переносить спазмы и напряжение.",
      how: "Если ты уже принимаешь добавки, сверяй дозировку и противопоказания с врачом или инструкцией.",
      priority: "high",
      icon: "💊",
    });
  }

  // ── Bad sleep in luteal → Magnesium + B6 ──
  if ((phase === "luteal" || phase === "menstruation") && (today?.sleep?.quality === "bad" || today?.sleep?.quality === "insomnia" || yesterday?.sleep?.quality === "bad" || yesterday?.sleep?.quality === "insomnia")) {
    if (!recs.some(r => r.name === "Магний")) {
      recs.push({
        name: "Магний",
        dose: "обсудить дозировку",
        why: "Магний иногда используют как поддержку расслабления и сна.",
        how: "Сначала проверь противопоказания и совместимость с лекарствами или другими добавками.",
        priority: "high",
        icon: "🌙",
      });
    }
    recs.push({
      name: "Витамин B6",
      dose: "по инструкции",
      why: "B6 участвует в работе нервной системы и может быть частью поддержки при ПМС.",
      how: "Не превышай дозировку из инструкции; при регулярном приёме лучше обсудить с врачом.",
      priority: "medium",
      icon: "😴",
    });
  }

  // ── PMS → Calcium + Magnesium + B6 ──
  if (today?.pms && today.pms.symptoms.length > 0) {
    if (!recs.some(r => r.name === "Магний")) {
      recs.push({
        name: "Магний",
        dose: "обсудить дозировку",
        why: "Магний некоторым помогает при напряжении, сне и спазмах.",
        how: "Добавки лучше подбирать с учётом противопоказаний и других препаратов.",
        priority: "high",
        icon: "😤",
      });
    }
    recs.push({
      name: "Кальций",
      dose: "по рациону/анализам",
      why: "Кальций важен для костей и общего самочувствия, особенно если его мало в рационе.",
      how: "Лучше начать с еды; добавки обсуди с врачом, особенно если есть заболевания почек.",
      priority: "medium",
      icon: "🦴",
    });
  }

  // ── Low energy → Iron check + B12 + D ──
  if (today?.energy?.value === "exhausted" || today?.energy?.value === "low" || yesterday?.energy?.value === "exhausted") {
    if (!recs.some(r => r.name === "Железо")) {
      recs.push({
        name: "Витамин D",
        dose: "проверить уровень",
        why: "Низкий витамин D может быть связан с усталостью, но это лучше подтверждать анализом.",
        how: "Обсуди анализ 25(OH)D и дозировку со специалистом.",
        priority: "medium",
        icon: "☀️",
      });
    }
    recs.push({
      name: "Витамин B12",
      dose: "по анализам",
      why: "B12 важен для нервной системы и энергии; дефицит лучше проверять лабораторно.",
      how: "Особенно стоит обсудить, если ты не ешь продукты животного происхождения.",
      priority: "medium",
      icon: "⚡",
    });
  }

  // ── Anxiety/sadness in luteal → B6 + Omega-3 ──
  if ((today?.mood?.value === "anxiety" || today?.mood?.value === "sadness") && phase === "luteal") {
    if (!recs.some(r => r.name === "Витамин B6")) {
      recs.push({
        name: "Витамин B6",
        dose: "по инструкции",
        why: "B6 участвует в работе нервной системы и иногда используется как поддержка в лютеиновой фазе.",
        how: "Не превышай дозировку из инструкции; при регулярном приёме лучше обсудить с врачом.",
        priority: "medium",
        icon: "🧠",
      });
    }
    recs.push({
      name: "Омега-3",
      dose: "по рациону/инструкции",
      why: "Омега-3 может быть частью рациона для поддержки сердца и нервной системы.",
      how: "Рыба 1-2 раза в неделю или добавки по инструкции; учитывай аллергию и препараты.",
      priority: "low",
      icon: "🐟",
    });
  }

  // ── Phase-based baseline (if nothing specific) ──
  if (recs.length === 0) {
    if (phase === "menstruation") {
      recs.push({
        name: "Магний",
        dose: "обсудить дозировку",
        why: "Может быть мягкой поддержкой мышц и нервной системы.",
        how: "Проверь противопоказания и совместимость.",
        priority: "low",
        icon: "💊",
      });
    } else if (phase === "follicular") {
      recs.push({
        name: "Витамин D",
        dose: "проверить уровень",
        why: "Витамин D лучше подбирать по анализам, а не по фазе цикла.",
        how: "Обсуди анализ и дозировку со специалистом.",
        priority: "low",
        icon: "☀️",
      });
    } else if (phase === "ovulation") {
      recs.push({
        name: "Цинк",
        dose: "по рациону/инструкции",
        why: "Цинк важен для иммунитета, но добавки нужны не всем.",
        how: "Начни с продуктов; добавки лучше согласовать, если планируешь принимать регулярно.",
        priority: "low",
        icon: "✨",
      });
    } else {
      recs.push({
        name: "Магний + B6",
        dose: "по инструкции",
        why: "Иногда используется как поддержка сна и самочувствия перед месячными.",
        how: "Сверь дозировки с инструкцией и противопоказаниями.",
        priority: "low",
        icon: "🌙",
      });
    }
  }

  // Build title
  let title = "Что может помочь сегодня";
  let subtitle = "На основе твоей фазы";

  if (recentHeavy >= 2) {
    title = "Поддержи запасы";
    subtitle = `Обильные месячные ${recentHeavy} дня — стоит обратить внимание на железо`;
  } else if (today?.pain?.level === "strong") {
    title = "Поддержка при боли";
    subtitle = "Мягкая поддержка и повод прислушаться к боли";
  } else if (today?.pms && today.pms.symptoms.length >= 2) {
    title = "Против ПМС";
    subtitle = "Варианты поддержки, которые лучше подбирать индивидуально";
  } else if (today?.energy?.value === "exhausted") {
    title = "Верни энергию";
    subtitle = "Если повторяется, стоит обсудить анализы";
  } else if (recs.some(r => r.priority === "high")) {
    subtitle = "На основе твоих вчерашних и сегодняшних данных";
  }

  return { title, subtitle, recs: recs.slice(0, 4) };
}
