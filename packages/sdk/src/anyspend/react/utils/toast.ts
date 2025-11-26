/**
 * Re-export toast from global-account for consistency
 * This allows anyspend components to continue using the same toast API
 */
export { toast } from "@b3dotfun/sdk/global-account/react/components/Toast/toastApi";
export type { ToastItem, ToastType } from "@b3dotfun/sdk/global-account/react/components/Toast/ToastContext";
