import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin rounded-full border-2 border-gray-600 border-t-blue-500", sizeClasses[size])} />
    </div>
  );
}
