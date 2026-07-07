"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

interface BottomSheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function BottomSheet({ open, title, children, onClose }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/42" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Закрыть" onClick={onClose} />
      <section className="relative w-full rounded-t-[28px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] px-5 pb-7 pt-4 text-[var(--mira-token-foreground)] shadow-[0_-18px_50px_rgba(0,0,0,0.22)]">
        <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-[var(--mira-token-border)]" />
        <div className="mx-auto max-w-md">
          <header className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">{title}</h2>
            <IconButton label="Закрыть" onClick={onClose}>
              <X className="h-5 w-5" />
            </IconButton>
          </header>
          {children}
        </div>
      </section>
    </div>
  );
}
