"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getHealthSummary, statusMeta, type HealthMetric } from "@/lib/healthScore";
import type { MiraLocalData } from "@/lib/types";

// мини-график (спарклайн)
function Spark({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return null;
  const w = 64, h = 20;
  const sx = w / Math.max(1, points.length - 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${(i * sx).toFixed(1)} ${(h - (v / 100) * h).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-5" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

// статус-кольцо
function StatusRing({ status, size = 56 }: { status: HealthMetric["status"]; size?: number }) {
  const meta = statusMeta[status];
  const r = 24, c = 2 * Math.PI * r;
  const fill = status === "ok" ? 1 : status === "watch" ? 0.66 : status === "concern" ? 0.33 : 0.1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#EDE8F5" strokeWidth="5" />
        <motion.circle cx="28" cy="28" r={r} fill="none" stroke={meta.ring} strokeWidth="5" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${fill * c} ${c - fill * c}` }}
          transition={{ duration: 0.9, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl">{status === "nodata" ? "·" : ""}</span>
      </div>
    </div>
  );
}

export function HealthDashboard({ data }: { data: MiraLocalData }) {
  const summary = getHealthSummary(data);
  const heroMeta = statusMeta[summary.overall];

  return (
    <div className="space-y-4">
      {/* Hero verdict — мгновенно понятно */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 border-0" style={{ background: `linear-gradient(135deg, ${heroMeta.bg}, white)` }}>
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
              style={{ background: heroMeta.color + "22" }}>
              <span className="text-3xl">
                {summary.overall === "ok" ? "✅" : summary.overall === "watch" ? "🟡" : summary.overall === "concern" ? "🔴" : "📊"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-mira-text">{summary.headline}</p>
              <p className="text-sm text-mira-muted mt-0.5">{summary.subtext}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Метрики — светофор + спарклайн */}
      <div className="grid grid-cols-2 gap-3">
        {summary.metrics.map((m, i) => {
          const meta = statusMeta[m.status];
          return (
            <motion.div key={m.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-4 h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.emoji}</span>
                    <span className="text-sm font-semibold text-mira-text">{m.label}</span>
                  </div>
                  {/* цветная точка-светофор */}
                  <span className="h-2.5 w-2.5 rounded-full mt-1" style={{ background: meta.color }} />
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold" style={{ color: meta.color }}>{m.verdict}</p>
                    <p className="text-[10px] text-mira-muted leading-tight mt-0.5">{m.detail}</p>
                  </div>
                  {m.spark.length > 0 && <Spark points={m.spark} color={meta.color} />}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-mira-muted">{m.value}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
