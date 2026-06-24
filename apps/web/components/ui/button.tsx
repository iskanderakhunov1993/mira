import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mira-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-mira-primary text-white shadow-glow hover:bg-mira-primary-deep",
        secondary: "bg-mira-lavender-light text-mira-text hover:bg-mira-lavender/40",
        ghost: "text-mira-text hover:bg-mira-lavender-light",
        outline: "border border-mira-lavender bg-white text-mira-text hover:bg-mira-lavender-light",
        cycle: "bg-gradient-to-r from-mira-cycle to-mira-primary text-white shadow-glow hover:opacity-90"
      },
      size: {
        default: "h-12 px-5",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-7 text-base"
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
