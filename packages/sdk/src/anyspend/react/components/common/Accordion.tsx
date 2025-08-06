"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@b3dotfun/sdk/shared/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => <AccordionPrimitive.Item ref={ref} className={cn("", className)} {...props} />);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Trigger
    ref={ref}
    className={cn(
      "border-as-border-secondary bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors hover:bg-gray-100/50 data-[state=open]:rounded-b-none dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700/50",
      className,
    )}
    {...props}
  >
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{children}</span>
    <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180 dark:text-gray-400" />
  </AccordionPrimitive.Trigger>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
    {...props}
  >
    <div
      className={cn(
        "border-as-border-secondary bg-as-surface-secondary w-full rounded-b-xl border-x border-b py-2 pr-4",
        className,
      )}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
