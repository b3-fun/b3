import * as React from "react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { type VariantProps, cva } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-b3-react-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-b3-react-primary text-b3-react-primary-foreground hover:bg-b3-react-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-b3-react-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive bg-destructive/50 text-destructive-b3-react-foreground hover:bg-destructive/80",
        outline: "text-b3-react-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
