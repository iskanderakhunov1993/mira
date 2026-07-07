import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] text-[var(--mira-token-foreground)] shadow-[0_18px_44px_rgba(86,70,104,0.07)]",
        className
      )}
      {...props}
    />
  );
}
