"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CartSummaryProps {
  subtotal: string;
  total: string;
  tokenSymbol?: string;
  classes?: AnySpendCheckoutClasses;
}

export function CartSummary({ subtotal, total, tokenSymbol, classes }: CartSummaryProps) {
  return (
    <div className={cn("border-t border-gray-200 pt-3 dark:border-gray-700", classes?.cartSummary)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {subtotal} {tokenSymbol}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
        <span className={cn("text-base font-semibold text-gray-900 dark:text-gray-100", classes?.cartTotal)}>
          {total} {tokenSymbol}
        </span>
      </div>
    </div>
  );
}
