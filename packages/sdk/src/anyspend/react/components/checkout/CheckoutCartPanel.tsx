"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { type ReactNode, useMemo } from "react";
import type { CheckoutItem, CheckoutSummaryLine, AnySpendCheckoutClasses } from "./AnySpendCheckout";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";
import { PoweredByBranding } from "./PoweredByBranding";

interface CheckoutCartPanelProps {
  items: CheckoutItem[];
  totalAmount: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  organizationName?: string;
  organizationLogo?: string;
  classes?: AnySpendCheckoutClasses;
  /** Custom footer. Pass `null` to hide, or a ReactNode to replace the default PoweredByBranding. */
  footer?: ReactNode | null;
  shipping?: { amount: string; label?: string };
  tax?: { amount: string; label?: string; rate?: string };
  discount?: { amount: string; label?: string; code?: string };
  summaryLines?: CheckoutSummaryLine[];
}

export function CheckoutCartPanel({
  items,
  totalAmount,
  tokenSymbol = "",
  tokenDecimals = 18,
  organizationName,
  organizationLogo,
  classes,
  footer,
  shipping,
  tax,
  discount,
  summaryLines,
}: CheckoutCartPanelProps) {
  const formattedTotal = useMemo(
    () => formatTokenAmount(BigInt(totalAmount), tokenDecimals),
    [totalAmount, tokenDecimals],
  );

  // Compute subtotal from items only (before adjustments)
  const formattedSubtotal = useMemo(() => {
    let subtotal = BigInt(0);
    for (const item of items) {
      subtotal += BigInt(item.amount) * BigInt(item.quantity);
    }
    return formatTokenAmount(subtotal, tokenDecimals);
  }, [items, tokenDecimals]);

  return (
    <div className={cn("anyspend-cart-panel flex flex-col", classes?.cartPanel)}>
      <h2
        className={cn(
          "anyspend-cart-title mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100",
          classes?.cartTitle,
        )}
      >
        Order Summary
      </h2>

      <div className="anyspend-cart-items divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item, index) => {
          const itemTotal = BigInt(item.amount) * BigInt(item.quantity);
          const formattedPrice = `${formatTokenAmount(itemTotal, tokenDecimals)} ${tokenSymbol}`;

          return <CartItemRow key={item.id || index} item={item} formattedPrice={formattedPrice} classes={classes} />;
        })}
      </div>

      <CartSummary
        total={formattedTotal}
        tokenSymbol={tokenSymbol}
        classes={classes}
        subtotal={formattedSubtotal}
        tokenDecimals={tokenDecimals}
        shipping={shipping}
        tax={tax}
        discount={discount}
        summaryLines={summaryLines}
      />

      {footer !== null &&
        (footer !== undefined ? (
          footer
        ) : (
          <PoweredByBranding
            organizationName={organizationName}
            organizationLogo={organizationLogo}
            classes={classes}
          />
        ))}
    </div>
  );
}
