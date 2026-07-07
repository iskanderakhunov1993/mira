import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  tone?: "success" | "error" | "info";
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toast({ message, tone = "info" }: ToastProps) {
  const Icon = icons[tone];

  return (
    <div
      role="status"
      className={cn(
        "fixed left-1/2 top-4 z-50 flex min-h-11 w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-[18px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] px-4 text-sm font-black text-[var(--mira-token-foreground)] shadow-[0_14px_34px_rgba(0,0,0,0.20)]"
      )}
    >
      <Icon className="h-5 w-5 text-[var(--mira-token-primary)]" aria-hidden="true" />
      {message}
    </div>
  );
}
