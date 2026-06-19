import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mira-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-mira-primary text-mira-ink shadow-glow hover:bg-[#8ce0f7]",
        secondary: "bg-mira-card text-mira-text shadow-soft hover:bg-[#302f2b]",
        ghost: "text-mira-text hover:bg-white/10",
        outline: "border border-white/15 bg-mira-card text-mira-text hover:bg-[#302f2b]"
      },
      size: {
        default: "h-12 px-5",
        sm: "h-10 px-4",
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
