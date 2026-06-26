import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/70 bg-white/75 backdrop-blur-md p-4 shadow-[0_4px_20px_rgba(45,38,64,0.05),0_1px_0_rgba(255,255,255,0.6)_inset,0_0_0_1px_rgba(212,204,230,0.12)] transition-all duration-300 sm:p-5",
        className
      )}
      {...props}
    />
  );
}
