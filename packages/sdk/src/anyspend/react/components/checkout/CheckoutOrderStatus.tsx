"use client";

import { getErrorDisplay, getExplorerTxUrl, getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendOrderAndTransactions";
import { useOnOrderSuccess } from "@b3dotfun/sdk/anyspend/react/hooks/useOnOrderSuccess";
import { TextShimmer } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { ExternalLink, Loader2, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useAnySpendCustomization } from "../context/AnySpendCustomizationContext";
import { OrderStatus } from "../common/OrderStatus";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CheckoutOrderStatusProps {
  /** The order ID to track */
  orderId: string;
  /** Theme color (hex) */
  themeColor?: string;
  /** Return URL for the terminal success state */
  returnUrl?: string;
  /** Label for the return button */
  returnLabel?: string;
  /** Called when the order reaches "executed" */
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  /** Called when the order reaches a failure/expired/refunded terminal state */
  onError?: (error: Error) => void;
  /** Called when the user clicks "Try again" on failure */
  onRetry?: () => void;
  /** Show the points row in the order status summary. Defaults to false. */
  showPoints?: boolean;
  /** Show the order ID row in the order status summary. Defaults to false. */
  showOrderId?: boolean;
  /** Custom class names */
  classes?: AnySpendCheckoutClasses;
}

export function CheckoutOrderStatus({
  orderId,
  themeColor,
  returnUrl,
  returnLabel,
  onSuccess,
  onError,
  onRetry,
  showPoints = false,
  showOrderId = false,
  classes,
}: CheckoutOrderStatusProps) {
  // Stable refs for callback props to avoid re-triggering effects
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const { orderAndTransactions, isLoadingOrderAndTransactions } = useAnyspendOrderAndTransactions(orderId);
  const order = orderAndTransactions?.data?.order;
  const executeTx = orderAndTransactions?.data?.executeTx;
  const points = orderAndTransactions?.data?.points;

  const { content } = useAnySpendCustomization();

  // Fire onSuccess when order reaches "executed"
  useOnOrderSuccess({
    orderData: orderAndTransactions,
    orderId,
    onSuccess: (txHash?: string) => onSuccess?.({ orderId, txHash }),
  });

  // Fire onError once for terminal failure states
  const onErrorCalled = useRef(false);
  useEffect(() => {
    if (!order || onErrorCalled.current) return;
    if (order.status === "failure" || order.status === "expired" || order.status === "refunded") {
      const { description } = getStatusDisplay(order);
      onErrorRef.current?.(new Error(description || `Order ${order.status}`));
      onErrorCalled.current = true;
    }
  }, [order]);

  // Reset error flag if orderId changes
  const prevOrderId = useRef(orderId);
  useEffect(() => {
    if (prevOrderId.current !== orderId) {
      onErrorCalled.current = false;
      prevOrderId.current = orderId;
    }
  }, [orderId]);

  // Clear persisted orderId when order reaches a terminal state
  const orderStatus = order?.status;
  useEffect(() => {
    if (orderStatus && ["executed", "failure", "expired", "refunded"].includes(orderStatus)) {
      sessionStorage.removeItem("anyspend_checkout_orderId");
    }
  }, [orderStatus]);

  // Loading state
  if (isLoadingOrderAndTransactions || !order) {
    return (
      <div className={cn("flex flex-col items-center gap-3 py-12", classes?.orderStatusPanel)}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Loading order status...
        </TextShimmer>
      </div>
    );
  }

  const isExecuted = order.status === "executed";
  const isRefunding = order.status === "refunding";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("anyspend-checkout-order-status flex flex-col items-center gap-5 py-6", classes?.orderStatusPanel)}
    >
      {/* Step progress / terminal state icon */}
      <OrderStatus order={order} />

      {/* Checkout-relevant order summary: points + order ID (opt-in) */}
      {(showPoints || showOrderId) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="bg-as-surface-secondary border-as-border-secondary w-full rounded-xl border px-4 py-3"
        >
          <div className="flex flex-col gap-2 text-sm">
            {showPoints && points != null && points > 0 && (
              <>
                <div className="flex w-full justify-between">
                  <span className="text-as-tertiary">Points</span>
                  <span className="text-as-brand font-semibold">+{formatNumber(points)} pts</span>
                </div>
                {showOrderId && <div className="divider w-full" />}
              </>
            )}
            {showOrderId && (
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-as-tertiary shrink-0">Order ID</span>
                <span className="text-as-primary min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {order.id}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Transaction link for executed orders */}
      {isExecuted && executeTx && (
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          href={getExplorerTxUrl(order.dstChain, executeTx.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400",
            classes?.transactionLink,
          )}
        >
          View Transaction
          <ExternalLink className="h-3.5 w-3.5" />
        </motion.a>
      )}

      {/* Error details for failure */}
      {order.status === "failure" && order.errorDetails && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="max-w-[40ch] text-center text-sm text-red-500 dark:text-red-400"
        >
          {getErrorDisplay(order.errorDetails)}
        </motion.p>
      )}

      {/* Retry button for failure/expired */}
      {(order.status === "failure" || order.status === "expired") && onRetry && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.3 }}
          onClick={onRetry}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-colors",
            "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700",
            classes?.retryButton,
          )}
        >
          <RefreshCcw className="h-4 w-4" />
          {content.retryButtonLabel || "Try Again"}
        </motion.button>
      )}

      {/* Return button for success and refunded */}
      {(isExecuted || order.status === "refunded") && returnUrl && (
        <motion.a
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.4 }}
          href={returnUrl}
          className={cn(
            "inline-flex rounded-xl px-6 py-3 text-sm font-medium transition-colors",
            classes?.returnButton,
          )}
          style={{ backgroundColor: themeColor || "#111827", color: "#fff" }}
        >
          {content.returnButtonLabel || returnLabel || "Return to Store"}
        </motion.a>
      )}

      {/* Refunding message (transient state — no action needed) */}
      {isRefunding && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while your funds are being returned.</p>
      )}
    </motion.div>
  );
}
