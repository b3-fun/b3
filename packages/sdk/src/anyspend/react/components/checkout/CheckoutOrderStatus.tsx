"use client";

import { getErrorDisplay, getExplorerTxUrl, getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendOrderAndTransactions";
import { useOnOrderSuccess } from "@b3dotfun/sdk/anyspend/react/hooks/useOnOrderSuccess";
import { TextShimmer, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { ExternalLink, Loader2, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { useAnySpendCustomization } from "../context/AnySpendCustomizationContext";
import { OrderStatus } from "../common/OrderStatus";
import { OrderDetailsCollapsible } from "../common/OrderDetailsCollapsible";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CheckoutOrderStatusProps {
  /** The order ID to track */
  orderId: string;
  /** The destination token address */
  destinationTokenAddress: string;
  /** The destination chain ID */
  destinationTokenChainId: number;
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
  /** Custom class names */
  classes?: AnySpendCheckoutClasses;
}

export function CheckoutOrderStatus({
  orderId,
  destinationTokenAddress,
  destinationTokenChainId,
  themeColor,
  returnUrl,
  returnLabel,
  onSuccess,
  onError,
  onRetry,
  classes,
}: CheckoutOrderStatusProps) {
  const { orderAndTransactions, isLoadingOrderAndTransactions } =
    useAnyspendOrderAndTransactions(orderId);
  const order = orderAndTransactions?.data?.order;
  const executeTx = orderAndTransactions?.data?.executeTx;
  const points = orderAndTransactions?.data?.points;

  const { content } = useAnySpendCustomization();

  const { data: dstTokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  const dstToken: components["schemas"]["Token"] | undefined = useMemo(() => {
    if (!dstTokenData) return undefined;
    return {
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      decimals: dstTokenData.decimals || 18,
      symbol: dstTokenData.symbol || "",
      name: dstTokenData.name || "",
      metadata: { logoURI: dstTokenData.logoURI || "" },
    };
  }, [destinationTokenAddress, destinationTokenChainId, dstTokenData]);

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
    if (
      order.status === "failure" ||
      order.status === "expired" ||
      order.status === "refunded"
    ) {
      const { description } = getStatusDisplay(order);
      onError?.(new Error(description || `Order ${order.status}`));
      onErrorCalled.current = true;
    }
  }, [order, onError]);

  // Reset error flag if orderId changes
  const prevOrderId = useRef(orderId);
  useEffect(() => {
    if (prevOrderId.current !== orderId) {
      onErrorCalled.current = false;
      prevOrderId.current = orderId;
    }
  }, [orderId]);

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

  const { status: displayStatus } = getStatusDisplay(order);
  const isTerminalFailure = ["failure", "expired", "refunded"].includes(order.status);
  const isExecuted = order.status === "executed";
  const isRefunding = order.status === "refunding";

  // Formatted destination amount for collapsible
  const formattedExpectedDstAmount = useMemo(() => {
    if (!dstToken || !order) return undefined;
    const expectedDstAmount =
      order.type === "mint_nft" || order.type === "join_tournament" || order.type === "fund_tournament"
        ? "0"
        : order.type === "custom" || order.type === "deposit_first"
          ? order.payload.amount?.toString() || "0"
          : order.payload.expectedDstAmount?.toString() || "0";
    return formatTokenAmount(BigInt(expectedDstAmount), dstToken.decimals);
  }, [order, dstToken]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "anyspend-checkout-order-status flex flex-col items-center gap-5 py-6",
        classes?.orderStatusPanel,
      )}
    >
      {/* Step progress / terminal state icon */}
      <OrderStatus order={order} />

      {/* Order details collapsible */}
      {dstToken && (
        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
          points={points ?? undefined}
          className="w-full"
        />
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
            "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please wait while your funds are being returned.
        </p>
      )}
    </motion.div>
  );
}
