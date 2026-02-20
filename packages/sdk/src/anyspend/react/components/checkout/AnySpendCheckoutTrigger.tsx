"use client";

import { useTokenData } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { useMemo } from "react";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import type { AnySpendCheckoutClasses } from "../types/classes";
import type { CheckoutItem } from "./AnySpendCheckout";
import { CheckoutCartPanel } from "./CheckoutCartPanel";
import { CheckoutPaymentPanel } from "./CheckoutPaymentPanel";
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
  /** When true, allows direct transfer without swap if source and destination token/chain are the same */
  allowDirectTransfer?: boolean;
}

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
  allowDirectTransfer = false,
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

  // Compute total from items or use override
  const computedTotal = useMemo(() => {
    if (totalAmountOverride) return totalAmountOverride;
    if (!items || items.length === 0) return "0";
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

  const formattedTotal = useMemo(
    () => formatTokenAmount(BigInt(computedTotal || "0"), tokenDecimals),
    [computedTotal, tokenDecimals],
  );

  const hasItems = items && items.length > 0;
  const fingerprint = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprint}>
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
              <PoweredByBranding
                organizationName={organizationName}
                organizationLogo={organizationLogo}
                classes={classes}
              />
            </div>
          </div>
        )}

        {/* Payment methods */}
        <div className="p-5">
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
            allowDirectTransfer={allowDirectTransfer}
          />
        </div>
      </div>
    </AnySpendFingerprintWrapper>
  );
}
