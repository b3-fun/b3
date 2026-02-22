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
      style={mode === "page" ? { maxWidth: 1100, padding: "2rem 1rem" } : undefined}
    >
      {/*
        Use CSS Grid with inline styles to ensure 2-column layout works
        regardless of host app's Tailwind configuration.
        On screens < 768px: single column (cart on top, payment below).
        On screens >= 768px: two columns (payment left, cart right).
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .anyspend-checkout-grid {
              display: grid;
              gap: 2rem;
              grid-template-columns: 1fr;
            }
            @media (min-width: 768px) {
              .anyspend-checkout-grid {
                grid-template-columns: 1fr ${rightColumnWidth}px;
              }
              .anyspend-checkout-grid > .anyspend-payment-col { order: 1; }
              .anyspend-checkout-grid > .anyspend-cart-col { order: 2; position: sticky; top: 32px; align-self: start; }
            }
          `,
        }}
      />
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
