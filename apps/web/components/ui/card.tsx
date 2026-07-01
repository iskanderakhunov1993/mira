import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#E8E1E7] bg-white/88 p-4 shadow-[0_12px_34px_rgba(62,52,83,0.07)] backdrop-blur-xl transition-all duration-200 sm:p-5",
        className
      )}
      {...props}
    />
  );
}
