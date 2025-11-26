import { cn } from "@b3dotfun/sdk/shared/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";

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
  return <TabsPrimitive.List className={cn("", className)} {...props} />;
}

export function TabTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "text-md inline-flex h-full items-center justify-center whitespace-nowrap px-3 font-semibold transition-all",
        "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:font-bold data-[state=active]:text-[#0B57C2]",
        "hover:text-b3-react-foreground data-[state=inactive]:text-b3-react-muted-foreground",
        "flex-1",
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
