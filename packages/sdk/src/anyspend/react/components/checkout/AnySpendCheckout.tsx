"use client";

import { useTokenData } from "@b3dotfun/sdk/global-account/react";
import { type ReactNode, useMemo } from "react";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import { CheckoutCartPanel } from "./CheckoutCartPanel";
import { CheckoutLayout } from "./CheckoutLayout";
import { CheckoutPaymentPanel, type PaymentMethod } from "./CheckoutPaymentPanel";

export type { AnySpendCheckoutClasses } from "../types/classes";
import type { AnySpendCheckoutClasses } from "../types/classes";

export interface CheckoutItem {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  /** Amount in wei (smallest unit of destination token) */
  amount: string;
  quantity: number;
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
}: AnySpendCheckoutProps) {
  // Compute total from items
  const computedTotal = useMemo(() => {
    if (totalAmountOverride) return totalAmountOverride;
    let total = BigInt(0);
    for (const item of items) {
      total += BigInt(item.amount) * BigInt(item.quantity);
    }
    return total.toString();
  }, [items, totalAmountOverride]);

  // Get destination token metadata
  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);
  const tokenSymbol = tokenData?.symbol || "";
  const tokenDecimals = tokenData?.decimals || 18;

  const fingerprint = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprint}>
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
          />
        }
        classes={classes}
      />
    </AnySpendFingerprintWrapper>
  );
}
