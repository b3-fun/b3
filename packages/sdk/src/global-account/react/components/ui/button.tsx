import * as React from "react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-b3-react-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-b3-react-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-b3-react-primary text-b3-react-primary-foreground hover:bg-b3-react-primary/90",
        destructive:
          "bg-destructive text-destructive-b3-react-foreground hover:bg-destructive/90 bg-red-600/80 border border-red-500/80 backdrop-blur-sm hover:bg-red-500 transition-colors",
        outline: "border border-input bg-b3-react-background hover:bg-accent hover:text-accent-b3-react-foreground",
        secondary: "bg-secondary text-secondary-b3-react-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-b3-react-foreground",
        link: "text-b3-react-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...(props as React.ComponentPropsWithoutRef<typeof Slot>)}
        />
      );
    }

    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
