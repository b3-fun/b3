"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { Check, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CheckoutSuccessProps {
  txHash?: string;
  orderId?: string;
  returnUrl?: string;
  returnLabel?: string;
  classes?: AnySpendCheckoutClasses;
}

export function CheckoutSuccess({ txHash, orderId, returnUrl, returnLabel, classes }: CheckoutSuccessProps) {
  return (
    <div className={cn("anyspend-checkout-success flex flex-col items-center py-8 text-center", classes?.successPanel)}>
      {/* Animated success icon - scale + opacity entry */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="anyspend-success-icon mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
      >
        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
      </motion.div>

      {/* Staggered text entry */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        className="anyspend-success-title text-xl font-semibold text-gray-900 dark:text-gray-100"
      >
        Payment Successful
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
        className="anyspend-success-description mt-2 text-sm text-gray-500 dark:text-gray-400"
      >
        Your payment has been processed successfully.
      </motion.p>

      {txHash && (
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
          href={`https://explorer.b3.fun/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="anyspend-success-tx-link mt-4 flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          View Transaction
          <ExternalLink className="h-3.5 w-3.5" />
        </motion.a>
      )}

      {!txHash && orderId && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
          className="anyspend-success-order-id mt-4 text-xs text-gray-400 dark:text-gray-500"
        >
          Order ID: {orderId}
        </motion.p>
      )}

      {returnUrl && (
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
          href={returnUrl}
          className={cn(
            "anyspend-success-return-btn mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-medium transition-colors",
            classes?.returnButton,
          )}
          style={{ backgroundColor: "#111827", color: "#fff" }}
        >
          {returnLabel || "Return to Store"}
        </motion.a>
      )}
    </div>
  );
}
