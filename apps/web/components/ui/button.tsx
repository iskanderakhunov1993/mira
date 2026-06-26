import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mira-primary/30 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-mira-primary to-mira-primary-deep text-white shadow-glow hover:shadow-[0_14px_44px_rgba(155,142,196,0.35)] hover:translate-y-[-1px]",
        secondary: "bg-mira-lavender-light text-mira-text hover:bg-mira-lavender/40 hover:shadow-card",
        ghost: "text-mira-text hover:bg-mira-lavender-light/70",
        outline: "border-2 border-mira-lavender/40 bg-white text-mira-text hover:border-mira-primary/40 hover:bg-mira-lavender-light/30 hover:shadow-card",
        cycle: "bg-gradient-to-r from-mira-cycle to-mira-primary text-white shadow-glow hover:shadow-[0_14px_44px_rgba(196,126,155,0.3)] hover:translate-y-[-1px]"
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
