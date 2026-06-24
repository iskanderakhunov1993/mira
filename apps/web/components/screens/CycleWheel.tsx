"use client";

import type { CyclePhase } from "@/lib/types";
import { getPhaseLabel } from "@/lib/store";

type Props = {
  size?: number;
  cycleDay: number;
  phase: CyclePhase;
  cycleLength: number;
  periodLength: number;
  daysUntilPeriod: number;
};

export function CycleWheel({ size = 240, cycleDay, phase, cycleLength, periodLength, daysUntilPeriod }: Props) {
  const r = 42;
  const c = 2 * Math.PI * r;

  const seg = (days: number) => (days / cycleLength) * c;
  const follEnd = cycleLength - 16;
  const ovulEnd = cycleLength - 12;

  const mensLen = seg(periodLength);
  const follLen = seg(Math.max(0, follEnd - periodLength));
  const ovulLen = seg(Math.max(0, ovulEnd - follEnd));
  const lutealLen = seg(Math.max(0, cycleLength - ovulEnd));

  const offset0 = c * 0.25;
  const mensOff = offset0;
  const follOff = mensOff - mensLen;
  const ovulOff = follOff - follLen;
  const lutealOff = ovulOff - ovulLen;

  const todayAngle = ((cycleDay - 1) / cycleLength) * 360 - 90;
  const rad = (todayAngle * Math.PI) / 180;
  const tx = 50 + r * Math.cos(rad);
  const ty = 50 + r * Math.sin(rad);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EDE8F5" strokeWidth="7" />
        {/* Menstruation */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E8A0B8" strokeWidth="7"
          strokeDasharray={`${mensLen} ${c - mensLen}`} strokeDashoffset={mensOff} strokeLinecap="round" />
        {/* Follicular */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#B8A5D8" strokeWidth="7"
          strokeDasharray={`${follLen} ${c - follLen}`} strokeDashoffset={follOff} strokeLinecap="round" opacity="0.7" />
        {/* Ovulation */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#D4A0C8" strokeWidth="7"
          strokeDasharray={`${ovulLen} ${c - ovulLen}`} strokeDashoffset={ovulOff} strokeLinecap="round" opacity="0.7" />
        {/* Luteal */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#D4CCE6" strokeWidth="7"
          strokeDasharray={`${lutealLen} ${c - lutealLen}`} strokeDashoffset={lutealOff} strokeLinecap="round" opacity="0.5" />
        {/* Today marker */}
        <circle cx={tx} cy={ty} r="4.5" fill="#9B8EC4" stroke="white" strokeWidth="2.5" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-mira-text">{cycleDay}</span>
        <span className="mt-0.5 text-sm font-semibold text-mira-primary">{getPhaseLabel(phase)}</span>
        <span className="mt-1 text-xs text-mira-muted">
          {daysUntilPeriod > 0 ? `~${daysUntilPeriod} дн. до месячных` : "Сегодня"}
        </span>
      </div>
    </div>
  );
}
