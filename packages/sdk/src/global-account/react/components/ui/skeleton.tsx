import { cn } from "@b3dotfun/sdk/shared/utils/cn";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse-fade bg-b3-react-background rounded-md", className)} {...props} />;
}

export { Skeleton };
