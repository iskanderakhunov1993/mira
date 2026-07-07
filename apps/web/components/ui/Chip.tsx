import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ChipTone = "neutral" | "accent" | "success";

const tones: Record<ChipTone, string> = {
  neutral: "bg-[var(--mira-token-card-muted)] text-[var(--mira-token-muted)]",
  accent: "bg-[color-mix(in_srgb,var(--mira-token-accent)_14%,transparent)] text-[var(--mira-token-accent)]",
  success: "bg-[color-mix(in_srgb,var(--mira-token-success)_16%,transparent)] text-[var(--mira-token-success)]",
};

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
}

export function Chip({ className, tone = "neutral", ...props }: ChipProps) {
  return (
    <span
      className={cn("inline-flex min-h-8 items-center rounded-full px-3 text-xs font-black", tones[tone], className)}
      {...props}
    />
  );
}
