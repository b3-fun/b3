"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { useMemo } from "react";
import type { CheckoutItem, AnySpendCheckoutClasses } from "./AnySpendCheckout";
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
}

export function CheckoutCartPanel({
  items,
  totalAmount,
  tokenSymbol = "",
  tokenDecimals = 18,
  organizationName,
  organizationLogo,
  classes,
}: CheckoutCartPanelProps) {
  const formattedTotal = useMemo(() => formatTokenAmount(BigInt(totalAmount), tokenDecimals), [totalAmount, tokenDecimals]);

  const formattedSubtotal = formattedTotal;

  return (
    <div className={cn("anyspend-cart-panel flex flex-col", classes?.cartPanel)}>
      <h2 className={cn("anyspend-cart-title mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100", classes?.cartTitle)}>
        Order Summary
      </h2>

      <div className="anyspend-cart-items divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item, index) => {
          const itemTotal = BigInt(item.amount) * BigInt(item.quantity);
          const formattedPrice = `${formatTokenAmount(itemTotal, tokenDecimals)} ${tokenSymbol}`;

          return <CartItemRow key={item.id || index} item={item} formattedPrice={formattedPrice} classes={classes} />;
        })}
      </div>

      <CartSummary subtotal={formattedSubtotal} total={formattedTotal} tokenSymbol={tokenSymbol} classes={classes} />

      <PoweredByBranding
        organizationName={organizationName}
        organizationLogo={organizationLogo}
        classes={classes}
      />
    </div>
  );
}
