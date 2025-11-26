import { ToastType } from "./ToastContext";

// Global reference to the toast context functions
let toastContextRef: {
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
} | null = null;

export function setToastContext(context: {
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}) {
  toastContextRef = context;
}

// Sonner-compatible API
export const toast = {
  success: (message: string, options?: { duration?: number }) => {
    if (toastContextRef) {
      return toastContextRef.addToast("success", message, options?.duration);
    }
    console.warn("Toast context not initialized. Using fallback.");
    // Fallback to sonner if context not available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sonner = require("sonner");
      return sonner.toast.success(message, options);
    } catch {
      console.error("Failed to show toast:", message);
      return "";
    }
  },

  error: (message: string, options?: { duration?: number }) => {
    if (toastContextRef) {
      return toastContextRef.addToast("error", message, options?.duration);
    }
    console.warn("Toast context not initialized. Using fallback.");
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sonner = require("sonner");
      return sonner.toast.error(message, options);
    } catch {
      console.error("Failed to show toast:", message);
      return "";
    }
  },

  info: (message: string, options?: { duration?: number }) => {
    if (toastContextRef) {
      return toastContextRef.addToast("info", message, options?.duration);
    }
    console.warn("Toast context not initialized. Using fallback.");
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sonner = require("sonner");
      return sonner.toast.info(message, options);
    } catch {
      console.error("Failed to show toast:", message);
      return "";
    }
  },

  warning: (message: string, options?: { duration?: number }) => {
    if (toastContextRef) {
      return toastContextRef.addToast("warning", message, options?.duration);
    }
    console.warn("Toast context not initialized. Using fallback.");
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sonner = require("sonner");
      return sonner.toast.warning(message, options);
    } catch {
      console.error("Failed to show toast:", message);
      return "";
    }
  },

  dismiss: (toastId?: string) => {
    if (toastContextRef) {
      if (toastId) {
        toastContextRef.removeToast(toastId);
      } else {
        toastContextRef.clearAll();
      }
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sonner = require("sonner");
        sonner.toast.dismiss(toastId);
      } catch {
        console.error("Failed to dismiss toast");
      }
    }
  },
};
