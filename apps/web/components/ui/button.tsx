import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E872A0]/20 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 [&>*]:relative",
  {
    variants: {
      variant: {
        default: "bg-[#262235] text-white shadow-[0_10px_24px_rgba(38,34,53,0.16)] hover:bg-[#353047]",
        secondary: "border border-[#E8E1E7] bg-white text-[#262235] shadow-[0_8px_22px_rgba(62,52,83,0.06)] hover:bg-[#FCFAF8]",
        ghost: "text-[#262235] hover:bg-white/72",
        outline: "border border-[#E8E1E7] bg-white/86 text-[#262235] shadow-[0_8px_22px_rgba(62,52,83,0.05)] hover:border-[#E872A0]/35 hover:bg-white",
        cycle: "bg-[#E872A0] text-white shadow-[0_10px_24px_rgba(232,114,160,0.18)] hover:bg-[#D95F8E]"
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
