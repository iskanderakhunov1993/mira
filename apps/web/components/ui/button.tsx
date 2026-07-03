import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B6FB3]/20 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 [&>*]:relative",
  {
    variants: {
      variant: {
        default: "bg-[#B3FF6A] text-[#11100F] shadow-[0_12px_30px_rgba(179,255,106,0.18)] hover:bg-[#9DFA45]",
        secondary: "border border-[#DED6E8] bg-white text-[#262235] shadow-[0_8px_22px_rgba(62,52,83,0.06)] hover:bg-[#FCFAF8]",
        ghost: "text-[#262235] hover:bg-white/72",
        outline: "border border-[#DED6E8] bg-white/86 text-[#262235] shadow-[0_8px_22px_rgba(62,52,83,0.05)] hover:border-[#8B6FB3]/35 hover:bg-white",
        cycle: "bg-[#7C5FA8] text-white shadow-[0_10px_24px_rgba(124,95,168,0.18)] hover:bg-[#694E91]"
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-base font-bold"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
