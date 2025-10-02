"use client";

import { cn } from "@b3dotfun/sdk/shared/utils";
import * as React from "react";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown-menu]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative" data-dropdown-menu>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  if (asChild) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
        onClick: handleClick,
      });
    }
  }

  return <button onClick={handleClick}>{children}</button>;
}

export function DropdownMenuContent({ children, align = "start", className }: DropdownMenuContentProps) {
  const { isOpen } = React.useContext(DropdownMenuContext);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground absolute top-full z-50 mt-1 min-w-32 overflow-hidden rounded-md border p-1 shadow-md",
        "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        alignmentClasses[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    onClick?.();
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        "hover:bg-accent hover:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        className,
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn("bg-muted -mx-1 my-1 h-px", "bg-gray-200 dark:bg-gray-600", className)} />;
}
