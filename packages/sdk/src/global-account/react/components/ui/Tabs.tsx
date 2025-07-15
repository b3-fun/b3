import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@b3dotfun/sdk/shared/utils";

export const Tabs = ({
  defaultValue,
  onValueChange,
  children,
}: {
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) => (
  <TabsPrimitive.Root defaultValue={defaultValue} onValueChange={onValueChange}>
    {children}
  </TabsPrimitive.Root>
);

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "border-b3-react-border bg-b3-react-background inline-flex h-12 w-full items-center justify-center rounded-lg border",
        className,
      )}
      {...props}
    />
  );
}

export function TabTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-full items-center justify-center whitespace-nowrap px-3 text-sm font-medium transition-all",
        "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-b3-react-subtle data-[state=active]:text-b3-react-primary data-[state=active]:font-bold",
        "border-b3-react-border hover:text-b3-react-foreground data-[state=inactive]:border-b3-react-border data-[state=inactive]:text-b3-react-muted-foreground",
        "flex-1 border-r",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "ring-offset-b3-react-background focus-visible:ring-b3-react-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}
