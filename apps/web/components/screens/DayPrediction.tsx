"use client";

import { motion } from "framer-motion";
import { Compass, Zap, Moon, Brain, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getDayPrediction } from "@/lib/insights";
import { getCycleNorm } from "@/lib/cycleEngine";
import type { MiraLocalData } from "@/lib/types";

export function DayPrediction({ data }: { data: MiraLocalData }) {
  const profile = data.profile;
  const norm = getCycleNorm(profile);
  const cycleDay = norm.isDelayed ? norm.cycleLength : norm.cycleDay;
  const tomorrowCycleDay = norm.isDelayed ? norm.cycleLength : cycleDay >= norm.cycleLength ? 1 : cycleDay + 1;
  const prediction = getDayPrediction(data, tomorrowCycleDay);

  if (!prediction) return null;

  const hasAnything = prediction.energy || prediction.sleep || prediction.pain || prediction.pms.length > 0;
  if (!hasAnything) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border-[#9B8EC4]/15 bg-gradient-to-br from-mira-lavender-light/40 to-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="h-4 w-4 text-mira-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">
            Прогноз на завтра
          </span>
          <span className="ml-auto rounded-full bg-mira-lavender-light px-2 py-0.5 text-[10px] font-semibold text-mira-muted">
            День {tomorrowCycleDay}
          </span>
        </div>

        <p className="text-sm text-mira-text leading-relaxed mb-3">
          {prediction.summary}
        </p>

        <div className="flex flex-wrap gap-2">
          {prediction.energy && prediction.energy !== "нормальная энергия" && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#F5F0E0] px-2.5 py-1">
              <Zap className="h-3 w-3 text-[#C4B07E]" />
              <span className="text-[11px] font-semibold text-[#A09060]">{prediction.energy}</span>
            </div>
          )}
          {prediction.sleep && prediction.sleep !== "нормальный сон" && prediction.sleep !== "хороший сон" && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#E0E8F5] px-2.5 py-1">
              <Moon className="h-3 w-3 text-[#7E8EC4]" />
              <span className="text-[11px] font-semibold text-[#5E6EA4]">{prediction.sleep}</span>
            </div>
          )}
          {prediction.pain && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#F5E0EA] px-2.5 py-1">
              <AlertCircle className="h-3 w-3 text-[#C47E9B]" />
              <span className="text-[11px] font-semibold text-[#A45E7B]">возможна боль</span>
            </div>
          )}
          {prediction.pms.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#EDE0F5] px-2.5 py-1">
              <Brain className="h-3 w-3 text-[#A07EC4]" />
              <span className="text-[11px] font-semibold text-[#805EA4]">ПМС</span>
            </div>
          )}
        </div>

        <p className="mt-3 text-[10px] text-mira-muted italic">
          На основе твоих прошлых циклов. Ориентируйся на самочувствие.
        </p>
      </Card>
    </motion.div>
  );
}
