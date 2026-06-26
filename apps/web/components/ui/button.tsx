import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mira-primary/30 active:scale-[0.95] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&>*]:relative",
  {
    variants: {
      variant: {
        // глянцевый: верхний внутренний блик + глубокая тень + лёгкий подъём
        default: "bg-gradient-to-b from-[#A99BD0] via-mira-primary to-mira-primary-deep text-white shadow-[0_8px_24px_rgba(155,142,196,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_14px_40px_rgba(155,142,196,0.45),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5",
        secondary: "bg-mira-lavender-light text-mira-text shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-mira-lavender/40 hover:shadow-card hover:-translate-y-0.5",
        ghost: "text-mira-text hover:bg-mira-lavender-light/70",
        outline: "border-2 border-mira-lavender/40 bg-white/80 backdrop-blur-sm text-mira-text hover:border-mira-primary/40 hover:bg-mira-lavender-light/30 hover:shadow-card hover:-translate-y-0.5",
        cycle: "bg-gradient-to-r from-mira-cycle via-[#B888B0] to-mira-primary text-white shadow-[0_8px_24px_rgba(196,126,155,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_14px_40px_rgba(196,126,155,0.45)] hover:-translate-y-0.5"
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
