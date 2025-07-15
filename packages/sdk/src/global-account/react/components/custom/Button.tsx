import * as React from "react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-b3-react-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // TODO: these variats aren't working atm maybe since TW isn't properly installed on react sdk
      variant: {
        default: "bg-b3-react-primary text-b3-react-primary-foreground shadow hover:bg-b3-react-primary/90",
        destructive: "bg-destructive text-destructive-b3-react-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-b3-react-foreground",
        secondary: "bg-secondary text-secondary-b3-react-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-b3-react-foreground",
        link: "text-b3-react-primary underline-offset-4 hover:underline",
        b3: "bg-[#3368ef] text-white hover:bg-[#3368ef]/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-colors",
        variant === "default" && "bg-b3-react-primary text-b3-react-primary-foreground hover:bg-b3-react-primary/90",
        variant === "outline" &&
          "border-input bg-b3-react-background hover:bg-accent hover:text-accent-b3-react-foreground border",
        className,
      )}
      {...props}
    />
  );
}

export { buttonVariants };
