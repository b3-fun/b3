"use client";

import { useTokenData } from "@b3dotfun/sdk/global-account/react";
import { type ReactNode, useMemo } from "react";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import { CheckoutCartPanel } from "./CheckoutCartPanel";
import { CheckoutLayout } from "./CheckoutLayout";
import { CheckoutPaymentPanel, type PaymentMethod } from "./CheckoutPaymentPanel";

export type { AnySpendCheckoutClasses } from "../types/classes";
import type { AnySpendCheckoutClasses } from "../types/classes";
import { AnySpendCustomizationProvider } from "../context/AnySpendCustomizationContext";
import type { AnySpendContent, AnySpendSlots, AnySpendTheme } from "../types/customization";

export interface CheckoutItem {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  /** Amount in wei (smallest unit of destination token) */
  amount: string;
  quantity: number;
  /** Custom metadata displayed as label: value pairs (e.g., { "Size": "Large", "Color": "Blue" }) */
  metadata?: Record<string, string>;
}

export interface CheckoutSummaryLine {
  /** Display label (e.g., "Platform Fee", "Service Charge") */
  label: string;
  /** Amount in token's smallest unit (wei). Negative values shown as deductions. */
  amount: string;
  /** Optional description or note */
  description?: string;
}

export interface AnySpendCheckoutProps {
  /** Display mode */
  mode?: "page" | "embedded";
  /** The recipient address */
  recipientAddress: string;
  /** The destination token address */
  destinationTokenAddress: string;
  /** The destination chain ID */
  destinationTokenChainId: number;
  /** Line items */
  items: CheckoutItem[];
  /** Override computed total */
  totalAmount?: string;
  /** Organization name */
  organizationName?: string;
  /** Organization logo URL */
  organizationLogo?: string;
  /** Theme color (hex) */
  themeColor?: string;
  /** Custom button text */
  buttonText?: string;
  /** Checkout session ID (used by pay link backend to track sessions) */
  checkoutSessionId?: string;
  /** Called on successful payment */
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  /** Called on payment error */
  onError?: (error: Error) => void;
  /** URL to redirect to after payment */
  returnUrl?: string;
  /** Label for the return button */
  returnLabel?: string;
  /** Custom class names */
  classes?: AnySpendCheckoutClasses;
  /** Custom footer for the order summary. Pass `null` to hide, or a ReactNode to replace the default. */
  footer?: ReactNode | null;
  /** Which payment method to expand initially. Defaults to none (all collapsed). */
  defaultPaymentMethod?: PaymentMethod;
  /** Optional sender (payer) address — pre-fills token balances in the crypto panel */
  senderAddress?: string;
  /** Render function overrides for replaceable UI elements */
  slots?: AnySpendSlots;
  /** String or ReactNode overrides for text/messages */
  content?: AnySpendContent;
  /** Structured color/theme configuration */
  theme?: AnySpendTheme;
  /** Show the points row in the order status summary. Defaults to false. */
  showPoints?: boolean;
  /** Show the order ID row in the order status summary. Defaults to false. */
  showOrderId?: boolean;
  /** Shipping cost. String = amount in wei. Object = amount + custom label. */
  shipping?: string | { amount: string; label?: string };
  /** Tax amount. String = amount in wei. Object = amount + custom label + optional rate display. */
  tax?: string | { amount: string; label?: string; rate?: string };
  /** Discount amount (displayed as negative). String = amount in wei. Object = amount + label + optional code. */
  discount?: string | { amount: string; label?: string; code?: string };
  /** Additional summary line items (fees, tips, etc.) */
  summaryLines?: CheckoutSummaryLine[];
}

export function AnySpendCheckout({
  mode = "page",
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  items,
  totalAmount: totalAmountOverride,
  organizationName,
  organizationLogo,
  themeColor,
  buttonText = "Pay",
  checkoutSessionId: _checkoutSessionId, // TODO: pass to payment panels for server-side session tracking
  onSuccess,
  onError,
  returnUrl,
  returnLabel,
  classes,
  footer,
  defaultPaymentMethod,
  senderAddress,
  slots,
  content,
  theme,
  showPoints,
  showOrderId,
  shipping,
  tax,
  discount,
  summaryLines,
}: AnySpendCheckoutProps) {
  // Compute total from items + adjustments
  const computedTotal = useMemo(() => {
    if (totalAmountOverride) return totalAmountOverride;
    let total = BigInt(0);
    for (const item of items) {
      total += BigInt(item.amount) * BigInt(item.quantity);
    }
    const shippingAmt = typeof shipping === "string" ? shipping : shipping?.amount;
    if (shippingAmt) total += BigInt(shippingAmt);
    const taxAmt = typeof tax === "string" ? tax : tax?.amount;
    if (taxAmt) total += BigInt(taxAmt);
    const discountAmt = typeof discount === "string" ? discount : discount?.amount;
    if (discountAmt) total -= BigInt(discountAmt);
    if (summaryLines) {
      for (const line of summaryLines) total += BigInt(line.amount);
    }
    return total.toString();
  }, [items, totalAmountOverride, shipping, tax, discount, summaryLines]);

  // Get destination token metadata
  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);
  const tokenSymbol = tokenData?.symbol || "";
  const tokenDecimals = tokenData?.decimals || 18;

  const fingerprint = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprint}>
      <AnySpendCustomizationProvider slots={slots} content={content} theme={theme}>
        <CheckoutLayout
          mode={mode}
          paymentPanel={
            <CheckoutPaymentPanel
              recipientAddress={recipientAddress}
              destinationTokenAddress={destinationTokenAddress}
              destinationTokenChainId={destinationTokenChainId}
              totalAmount={computedTotal}
              buttonText={buttonText}
              themeColor={themeColor}
              returnUrl={returnUrl}
              returnLabel={returnLabel}
              onSuccess={onSuccess}
              onError={onError}
              classes={classes}
              defaultPaymentMethod={defaultPaymentMethod}
              senderAddress={senderAddress}
              showPoints={showPoints}
              showOrderId={showOrderId}
            />
          }
          cartPanel={
            <CheckoutCartPanel
              items={items}
              totalAmount={computedTotal}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
              organizationName={organizationName}
              organizationLogo={organizationLogo}
              classes={classes}
              footer={footer}
              shipping={typeof shipping === "string" ? { amount: shipping } : shipping}
              tax={typeof tax === "string" ? { amount: tax } : tax}
              discount={typeof discount === "string" ? { amount: discount } : discount}
              summaryLines={summaryLines}
            />
          }
          classes={classes}
        />
      </AnySpendCustomizationProvider>
    </AnySpendFingerprintWrapper>
  );
}
