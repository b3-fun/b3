import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import type { ToastItem, ToastType } from "./ToastContext";

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  theme?: "light" | "dark";
}

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case "success":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16.6666 5L7.49998 14.1667L3.33331 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "error":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 5L5 15M5 5L15 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "info":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 13.3333V10M10 6.66667H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "warning":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

const getToastStyles = (type: ToastType, theme: "light" | "dark" = "light") => {
  const isDark = theme === "dark";

  const baseStyles = "flex items-start gap-3 p-4 rounded-xl border shadow-sm";

  switch (type) {
    case "success":
      return cn(
        baseStyles,
        isDark ? "bg-green-950/50 border-green-800/50 text-green-100" : "bg-green-50 border-green-200 text-green-900",
      );
    case "error":
      return cn(
        baseStyles,
        isDark ? "bg-red-950/50 border-red-800/50 text-red-100" : "bg-red-50 border-red-200 text-red-900",
      );
    case "info":
      return cn(
        baseStyles,
        isDark ? "bg-blue-950/50 border-blue-800/50 text-blue-100" : "bg-blue-50 border-blue-200 text-blue-900",
      );
    case "warning":
      return cn(
        baseStyles,
        isDark
          ? "bg-yellow-950/50 border-yellow-800/50 text-yellow-100"
          : "bg-yellow-50 border-yellow-200 text-yellow-900",
      );
  }
};

const getIconColorClass = (type: ToastType, theme: "light" | "dark" = "light") => {
  const isDark = theme === "dark";

  switch (type) {
    case "success":
      return isDark ? "text-green-400" : "text-green-600";
    case "error":
      return isDark ? "text-red-400" : "text-red-600";
    case "info":
      return isDark ? "text-blue-400" : "text-blue-600";
    case "warning":
      return isDark ? "text-yellow-400" : "text-yellow-600";
  }
};

export function Toast({ toast, onDismiss, theme = "light" }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={getToastStyles(toast.type, theme)}
    >
      <div className={cn("mt-0.5 flex-shrink-0", getIconColorClass(toast.type, theme))}>{getToastIcon(toast.type)}</div>
      <p className="font-inter flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "flex-shrink-0 transition-opacity hover:opacity-70",
          theme === "dark" ? "text-gray-400" : "text-gray-500",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  theme?: "light" | "dark";
  className?: string;
}

export function ToastContainer({ toasts, onDismiss, theme = "light", className }: ToastContainerProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} theme={theme} />
        ))}
      </AnimatePresence>
    </div>
  );
}
