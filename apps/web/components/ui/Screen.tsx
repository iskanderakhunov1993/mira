import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function Screen({ title, eyebrow, action, className, children, ...props }: ScreenProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-[var(--mira-token-background)] px-5 pb-28 pt-6 text-[var(--mira-token-foreground)]",
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-md">
        {(title || eyebrow || action) && (
          <header className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--mira-token-muted)]">{eyebrow}</p>}
              {title && <h1 className="mt-1 text-[32px] font-black leading-none">{title}</h1>}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </main>
  );
}
