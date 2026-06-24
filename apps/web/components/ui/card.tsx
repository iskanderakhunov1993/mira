import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-mira-lavender/30 bg-white p-4 shadow-card sm:p-5",
        className
      )}
      {...props}
    />
  );
}
