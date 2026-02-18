"use client";

import { useTokenData } from "@b3dotfun/sdk/global-account/react";
import { useMemo } from "react";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import { CheckoutCartPanel } from "./CheckoutCartPanel";
import { CheckoutLayout } from "./CheckoutLayout";
import { CheckoutPaymentPanel } from "./CheckoutPaymentPanel";

export interface CheckoutItem {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  /** Amount in wei (smallest unit of destination token) */
  amount: string;
  quantity: number;
}

export interface AnySpendCheckoutClasses {
  // Layout
  root?: string;
  layout?: string;
  paymentColumn?: string;
  cartColumn?: string;

  // Payment panel
  paymentPanel?: string;
  paymentTitle?: string;
  paymentMethodSelector?: string;
  paymentMethodButton?: string;

  // Crypto panel
  cryptoPanel?: string;
  tokenSelector?: string;
  quoteDisplay?: string;
  payButton?: string;

  // Fiat / Stripe panel
  fiatPanel?: string;
  stripeForm?: string;
  stripeSubmitButton?: string;

  // Coinbase panel
  coinbasePanel?: string;

  // Cart panel
  cartPanel?: string;
  cartTitle?: string;
  cartItemRow?: string;
  cartItemImage?: string;
  cartItemName?: string;
  cartItemDescription?: string;
  cartItemPrice?: string;
  cartSummary?: string;
  cartTotal?: string;

  // Branding
  poweredBy?: string;

  // Success
  successPanel?: string;
  returnButton?: string;
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
  /** Checkout session ID */
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
  checkoutSessionId: _checkoutSessionId,
  onSuccess,
  onError,
  returnUrl,
  returnLabel,
  classes,
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
          />
        }
        classes={classes}
      />
    </AnySpendFingerprintWrapper>
  );
}
