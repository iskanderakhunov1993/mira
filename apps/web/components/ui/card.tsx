import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/60 bg-white/80 backdrop-blur-sm p-4 shadow-[0_2px_16px_rgba(45,38,64,0.04),0_0_0_1px_rgba(212,204,230,0.15)] transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(45,38,64,0.06),0_0_0_1px_rgba(212,204,230,0.2)] sm:p-5",
        className
      )}
      {...props}
    />
  );
}
