"use client";

import { useTokenData } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { type ReactNode, useMemo } from "react";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import type { AnySpendCheckoutClasses } from "../types/classes";
import type { AnySpendContent, AnySpendSlots, AnySpendTheme } from "../types/customization";
import { AnySpendCustomizationProvider } from "../context/AnySpendCustomizationContext";
import type { CheckoutItem, CheckoutSummaryLine } from "./AnySpendCheckout";
import { CheckoutCartPanel } from "./CheckoutCartPanel";
import { CheckoutPaymentPanel, type PaymentMethod } from "./CheckoutPaymentPanel";
import { PoweredByBranding } from "./PoweredByBranding";

export interface AnySpendCheckoutTriggerProps {
  /** Payment recipient address (hex) */
  recipientAddress: string;
  /** Destination token address */
  destinationTokenAddress: string;
  /** Destination chain ID */
  destinationTokenChainId: number;
  /** Line items to display in the cart (optional — if omitted, only the payment panel is shown) */
  items?: CheckoutItem[];
  /** Total amount in wei — required when items are not provided */
  totalAmount?: string;
  /** Organization name */
  organizationName?: string;
  /** Organization logo URL */
  organizationLogo?: string;
  /** Theme color (hex) */
  themeColor?: string;
  /** Custom button text */
  buttonText?: string;
  /** Workflow ID to trigger on payment */
  workflowId?: string;
  /** Organization ID that owns the workflow */
  orgId?: string;
  /** Optional callback metadata merged into the order */
  callbackMetadata?: {
    /** Passed as trigger result inputs — accessible via {{root.result.inputs.*}} */
    inputs?: Record<string, unknown>;
  } & Record<string, unknown>;
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
  /** Display mode — set automatically when used inside B3DynamicModal */
  mode?: "modal" | "page";
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
  /** Shipping cost. String = amount in wei. Object = amount + custom label. */
  shipping?: string | { amount: string; label?: string };
  /** Tax amount. String = amount in wei. Object = amount + custom label + optional rate display. */
  tax?: string | { amount: string; label?: string; rate?: string };
  /** Discount amount (displayed as negative). String = amount in wei. Object = amount + label + optional code. */
  discount?: string | { amount: string; label?: string; code?: string };
  /** Additional summary line items (fees, tips, etc.) */
  summaryLines?: CheckoutSummaryLine[];
}

/** CSS overrides applied when the trigger is rendered inside the B3 modal. */
const MODAL_STYLE_OVERRIDES = `
  .anyspend-checkout-trigger .anyspend-payment-methods { border: none; border-radius: 0; }
  .anyspend-checkout-trigger .anyspend-payment-title { font-size: 0; padding-left: 0.75rem; }
  .anyspend-checkout-trigger .anyspend-payment-title::before { content: "Payment options"; font-size: 1.125rem; }
  .anyspend-checkout-trigger .anyspend-payment-panel { gap: 0; }
  .anyspend-checkout-trigger .anyspend-payment-method-btn { padding-left: 0.5rem; padding-right: 0.5rem; }
  .anyspend-checkout-trigger .anyspend-payment-method-panel { padding-left: 0.5rem; padding-right: 0.5rem; }
`;

export function AnySpendCheckoutTrigger({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  items,
  totalAmount: totalAmountOverride,
  organizationName,
  organizationLogo,
  themeColor,
  buttonText = "Pay",
  workflowId,
  orgId,
  callbackMetadata,
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
  shipping,
  tax,
  discount,
  summaryLines,
}: AnySpendCheckoutTriggerProps) {
  // Merge workflowId + orgId into callbackMetadata
  const mergedMetadata = useMemo(() => {
    if (!workflowId && !orgId && !callbackMetadata) return undefined;
    return {
      ...(workflowId ? { workflowId } : {}),
      ...(orgId ? { orgId } : {}),
      ...callbackMetadata,
    };
  }, [workflowId, orgId, callbackMetadata]);

  // Compute total from items + adjustments or use override
  const computedTotal = useMemo(() => {
    if (totalAmountOverride) return totalAmountOverride;
    if (!items || items.length === 0) return "0";
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

  const formattedTotal = useMemo(
    () => formatTokenAmount(BigInt(computedTotal || "0"), tokenDecimals),
    [computedTotal, tokenDecimals],
  );

  const hasItems = items && items.length > 0;
  const fingerprint = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprint}>
      <AnySpendCustomizationProvider slots={slots} content={content} theme={theme}>
        {/* 
          Apply modal-specific style overrides for checkout components.
          Using dangerouslySetInnerHTML is necessary here to inject scoped styles that override
          the default checkout styles when rendered in modal context. This is a static constant
          and poses no XSS risk. Alternative approaches like CSS-in-JS or style portals would
          add unnecessary complexity for this simple use case.
        */}
        <style dangerouslySetInnerHTML={{ __html: MODAL_STYLE_OVERRIDES }} />

        <div className="anyspend-checkout-trigger flex flex-col">
          {/* Cart summary with items */}
          {hasItems && (
            <div className="border-b border-gray-200 p-5 dark:border-gray-700">
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
            </div>
          )}

          {/* Total-only header when no items */}
          {!hasItems && (
            <div className="border-b border-gray-200 p-5 dark:border-gray-700">
              <div className="flex flex-col gap-3">
                <div className={cn("flex items-center justify-between", classes?.cartSummary)}>
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className={cn("text-base font-semibold text-gray-900 dark:text-gray-100", classes?.cartTotal)}>
                    {formattedTotal} {tokenSymbol}
                  </span>
                </div>
                {footer === undefined ? (
                  <PoweredByBranding
                    organizationName={organizationName}
                    organizationLogo={organizationLogo}
                    classes={classes}
                  />
                ) : (
                  footer
                )}
              </div>
            </div>
          )}

          {/* Payment methods */}
          <div className="px-2 py-3">
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
              callbackMetadata={mergedMetadata}
              classes={classes}
              defaultPaymentMethod={defaultPaymentMethod}
              senderAddress={senderAddress}
            />
          </div>
        </div>
      </AnySpendCustomizationProvider>
    </AnySpendFingerprintWrapper>
  );
}
