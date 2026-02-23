"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount, safeBigInt } from "@b3dotfun/sdk/shared/utils/number";
import { useMemo } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";
import type { CheckoutSummaryLine } from "./AnySpendCheckout";

interface CartSummaryProps {
  /** Formatted total (final amount after all adjustments) */
  total: string;
  tokenSymbol?: string;
  classes?: AnySpendCheckoutClasses;
  /** Formatted subtotal (sum of items only — shown when adjustments exist) */
  subtotal?: string;
  tokenDecimals?: number;
  shipping?: { amount: string; label?: string };
  tax?: { amount: string; label?: string; rate?: string };
  discount?: { amount: string; label?: string; code?: string };
  summaryLines?: CheckoutSummaryLine[];
}

export function CartSummary({
  total,
  tokenSymbol,
  classes,
  subtotal,
  tokenDecimals = 18,
  shipping,
  tax,
  discount,
  summaryLines,
}: CartSummaryProps) {
  const hasAdjustments =
    !!shipping?.amount || !!tax?.amount || !!discount?.amount || (summaryLines && summaryLines.length > 0);

  const formattedShipping = useMemo(
    () => (shipping?.amount ? formatTokenAmount(safeBigInt(shipping.amount), tokenDecimals) : null),
    [shipping?.amount, tokenDecimals],
  );

  const formattedTax = useMemo(
    () => (tax?.amount ? formatTokenAmount(safeBigInt(tax.amount), tokenDecimals) : null),
    [tax?.amount, tokenDecimals],
  );

  const formattedDiscount = useMemo(
    () => (discount?.amount ? formatTokenAmount(safeBigInt(discount.amount), tokenDecimals) : null),
    [discount?.amount, tokenDecimals],
  );

  const formattedSummaryLines = useMemo(
    () =>
      summaryLines?.map(line => ({
        ...line,
        formattedAmount: formatTokenAmount(safeBigInt(line.amount), tokenDecimals),
        isNegative: safeBigInt(line.amount) < BigInt(0),
      })),
    [summaryLines, tokenDecimals],
  );

  return (
    <div className={cn("border-t border-gray-200 pt-3 dark:border-gray-700", classes?.cartSummary)}>
      {/* Subtotal — only shown when adjustments exist */}
      {hasAdjustments && subtotal && (
        <div className={cn("flex items-center justify-between py-1", classes?.cartSubtotal)}>
          <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {subtotal} {tokenSymbol}
          </span>
        </div>
      )}

      {/* Shipping */}
      {formattedShipping && (
        <div className={cn("flex items-center justify-between py-1", classes?.cartSummaryLine)}>
          <span className={cn("text-sm text-gray-500 dark:text-gray-400", classes?.cartSummaryLineLabel)}>
            {shipping?.label || "Shipping"}
          </span>
          <span className={cn("text-sm text-gray-500 dark:text-gray-400", classes?.cartSummaryLineAmount)}>
            {formattedShipping} {tokenSymbol}
          </span>
        </div>
      )}

      {/* Tax */}
      {formattedTax && (
        <div className={cn("flex items-center justify-between py-1", classes?.cartSummaryLine)}>
          <span className={cn("text-sm text-gray-500 dark:text-gray-400", classes?.cartSummaryLineLabel)}>
            {tax?.label || "Tax"}
            {tax?.rate && <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({tax.rate})</span>}
          </span>
          <span className={cn("text-sm text-gray-500 dark:text-gray-400", classes?.cartSummaryLineAmount)}>
            {formattedTax} {tokenSymbol}
          </span>
        </div>
      )}

      {/* Discount */}
      {formattedDiscount && (
        <div className={cn("flex items-center justify-between py-1", classes?.cartDiscount)}>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {discount?.label || "Discount"}
            {discount?.code && (
              <span className="ml-1 rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {discount.code}
              </span>
            )}
          </span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            -{formattedDiscount} {tokenSymbol}
          </span>
        </div>
      )}

      {/* Custom summary lines */}
      {formattedSummaryLines?.map(line => (
        <div key={line.label} className={cn("flex items-center justify-between py-1", classes?.cartSummaryLine)}>
          <span className={cn("text-sm text-gray-500 dark:text-gray-400", classes?.cartSummaryLineLabel)}>
            {line.label}
            {line.description && (
              <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({line.description})</span>
            )}
          </span>
          <span
            className={cn(
              "text-sm",
              line.isNegative ? "font-medium text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400",
              classes?.cartSummaryLineAmount,
            )}
          >
            {line.formattedAmount} {tokenSymbol}
          </span>
        </div>
      ))}

      {/* Total — always shown, separator when adjustments exist */}
      <div
        className={cn(
          "flex items-center justify-between",
          hasAdjustments && "mt-1 border-t border-gray-100 pt-2 dark:border-gray-800",
        )}
      >
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
        <span className={cn("text-base font-semibold text-gray-900 dark:text-gray-100", classes?.cartTotal)}>
          {total} {tokenSymbol}
        </span>
      </div>
    </div>
  );
}
