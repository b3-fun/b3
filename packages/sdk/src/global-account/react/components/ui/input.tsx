import * as React from "react";
import { cn } from "@b3dotfun/sdk/shared/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "border-b3-react-border bg-b3-react-background ring-offset-b3-react-background placeholder:text-b3-react-muted-foreground focus-visible:ring-b3-react-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
