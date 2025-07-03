import { cn } from "@b3dotfun/sdk/shared/utils";
import type { JSX } from "react";
import { ReactNode } from "react";

interface PermissionItemProps {
  title: string;
  description: string | JSX.Element;
  icon: string | ReactNode;
  className?: string;
}

export function PermissionItem({ title, description, icon, className }: PermissionItemProps) {
  return (
    <div className={cn("bg-b3-react-card flex items-center gap-5 rounded-lg border p-5 py-4", className)}>
      <div className="text-2xl opacity-30">{icon}</div>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-b3-react-muted-foreground text-sm opacity-70">{description}</p>
      </div>
    </div>
  );
}
