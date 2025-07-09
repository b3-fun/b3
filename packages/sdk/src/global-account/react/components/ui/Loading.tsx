import { cn } from "@b3dotfun/sdk/shared/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "white";
}

export function Loading({ className, size = "md", variant = "white" }: LoadingProps) {
  const sizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }[size];

  const variantClass = {
    primary: "text-b3-react-primary",
    white: "text-white opacity-50",
  }[variant];

  return (
    <div className={cn("relative", sizeClass, className)}>
      <Loader2 className={cn("animate-spin", sizeClass, variantClass)} />
    </div>
  );
}
