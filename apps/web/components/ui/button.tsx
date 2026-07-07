"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--mira-token-primary)] text-[var(--mira-token-primary-contrast)]",
  secondary: "border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] text-[var(--mira-token-foreground)]",
  ghost: "bg-transparent text-[var(--mira-token-foreground)] hover:bg-[var(--mira-token-card-muted)]",
  outline: "border border-[var(--mira-token-border)] bg-transparent text-[var(--mira-token-foreground)] hover:bg-[var(--mira-token-card-muted)]",
  danger: "bg-[#E5484D] text-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-[14px] px-3 text-xs",
  md: "min-h-11 rounded-[18px] px-4 text-sm",
  lg: "min-h-14 rounded-[20px] px-5 text-base",
  icon: "h-11 w-11 rounded-full p-0",
};

export function Button({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
