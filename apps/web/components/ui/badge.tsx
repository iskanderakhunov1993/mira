import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-mira-lavender/20 bg-gradient-to-b from-mira-lavender-light to-[#E8E2F2] px-3 py-1 text-xs font-semibold text-mira-primary-deep shadow-[0_1px_3px_rgba(155,142,196,0.1)]",
        className
      )}
      {...props}
    />
  );
}
