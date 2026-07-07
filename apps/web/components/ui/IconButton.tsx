"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] text-[var(--mira-token-foreground)] transition active:scale-[0.97]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
