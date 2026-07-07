import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
