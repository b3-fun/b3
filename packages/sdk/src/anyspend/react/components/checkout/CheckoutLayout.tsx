"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import type { ReactNode } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CheckoutLayoutProps {
  mode: "page" | "embedded";
  paymentPanel: ReactNode;
  cartPanel: ReactNode;
  classes?: AnySpendCheckoutClasses;
}

export function CheckoutLayout({ mode, paymentPanel, cartPanel, classes }: CheckoutLayoutProps) {
  const rightColumnWidth = mode === "page" ? 380 : 340;

  return (
    <div
      className={cn("anyspend-checkout mx-auto w-full", classes?.root)}
      style={{
        ...(mode === "page" ? { maxWidth: 1100, padding: "2rem 1rem" } : undefined),
        "--anyspend-cart-width": `${rightColumnWidth}px`,
      } as React.CSSProperties}
    >
      <div className={cn("anyspend-checkout-grid", classes?.layout)}>
        {/* LEFT: Payment Methods (appears second on mobile, first on desktop) */}
        <div
          className={cn(
            "anyspend-payment-col order-2",
            "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900",
            classes?.paymentColumn,
          )}
        >
          {paymentPanel}
        </div>

        {/* RIGHT: Cart / Invoice (appears first on mobile, second on desktop) */}
        <div
          className={cn(
            "anyspend-cart-col order-1",
            "rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50",
            classes?.cartColumn,
          )}
        >
          {cartPanel}
        </div>
      </div>
    </div>
  );
}
