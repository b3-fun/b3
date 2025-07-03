"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { TransitionPanel } from "@b3dotfun/sdk/global-account/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode, createContext, useContext } from "react";

interface TabsContextType {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsRootProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className = "" }: TabsRootProps) {
  return (
    <TabsContext.Provider value={{ selectedTab: value, onTabChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  hideGradient?: boolean;
}

export function TabsList({ children, className = "", hideGradient = false }: TabsListProps) {
  return (
    <div className="relative w-full">
      <div
        role="tablist"
        className={cn("no-scrollbar relative mb-4 flex items-center gap-2 whitespace-nowrap", className)}
      >
        {children}
      </div>
      <AnimatePresence mode="wait">
        {!hideGradient && (
          <motion.div
            key="gradients-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-[#15121c] to-transparent md:hidden" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-[#15121c] to-transparent md:hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TabTriggerProps {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export function TabTrigger({ value, children, icon, disabled = false }: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be used within Tabs");

  const { selectedTab, onTabChange } = context;
  const isSelected = selectedTab === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      onClick={() => onTabChange(value)}
      className={`relative rounded-full px-4 py-2 text-sm text-white transition-all duration-200 hover:text-white focus:outline-none`}
      disabled={disabled}
    >
      <span
        className={`${isSelected ? "opacity-100" : "opacity-50"} relative z-10 flex items-center gap-2 font-semibold uppercase`}
      >
        {children}
        {icon}
      </span>
      {isSelected && (
        <motion.span
          layoutId="activeTab"
          transition={{ type: "spring", duration: 0.4 }}
          className="from-as-light-brand to-as-brand/10 border-as-brand/30 absolute inset-0 z-0 rounded-full border border-t-white/15 bg-gradient-to-b shadow-lg"
        />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
}

export function TabsContent({ value, children }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  const { selectedTab } = context;
  const isSelected = selectedTab === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className="focus:outline-none"
    >
      {children}
    </div>
  );
}

export function TabsTransitionWrapper({ children }: { children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTransitionWrapper must be used within Tabs");

  // Find the index of the selected tab among the children
  const childrenArray = React.Children.toArray(children);
  const activeIndex = childrenArray.findIndex(
    child =>
      React.isValidElement(child) &&
      "value" in (child.props as any) &&
      (child.props as any).value === context.selectedTab
  );

  return (
    <TransitionPanel
      activeIndex={activeIndex}
      className="w-full"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      variants={{
        enter: { opacity: 0, filter: "blur(10px)", x: 20 },
        center: { opacity: 1, filter: "blur(0px)", x: 0 },
        exit: { opacity: 0, filter: "blur(10px)", x: -20 }
      }}
    >
      {childrenArray}
    </TransitionPanel>
  );
}
