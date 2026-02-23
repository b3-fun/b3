"use client";

import { useTokenData } from "@b3dotfun/sdk/global-account/react";
import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import { formatUnits, safeBigInt } from "@b3dotfun/sdk/shared/utils/number";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useAnyspendQuote } from "../../hooks/useAnyspendQuote";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import { CheckoutCartPanel } from "./CheckoutCartPanel";
import { CheckoutFormPanel } from "./CheckoutFormPanel";
import { CheckoutLayout } from "./CheckoutLayout";
import { CheckoutPaymentPanel, type PaymentMethod } from "./CheckoutPaymentPanel";

export type { AnySpendCheckoutClasses } from "../types/classes";
import type { AnySpendCheckoutClasses } from "../types/classes";
import { AnySpendCustomizationProvider } from "../context/AnySpendCustomizationContext";
import type { AnySpendContent, AnySpendSlots, AnySpendTheme } from "../types/customization";
import type {
  CheckoutFormSchema,
  CheckoutFormComponentProps,
  ShippingOption,
  DiscountResult,
  AddressData,
} from "../../../types/forms";

export type { CheckoutFormSchema, CheckoutFormComponentProps, ShippingOption, DiscountResult, AddressData };

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

  // ===== NEW: Custom Form Props =====

  /** JSON form schema defining fields to collect from the customer */
  formSchema?: CheckoutFormSchema | null;
  /** Custom React component to render as the checkout form */
  formComponent?: React.ComponentType<CheckoutFormComponentProps>;
  /** Called when form data changes */
  onFormSubmit?: (data: Record<string, unknown>) => void;

  // ===== NEW: Shipping Props =====

  /** Shipping options to display */
  shippingOptions?: ShippingOption[] | null;
  /** Whether to collect a shipping address */
  collectShippingAddress?: boolean;
  /** Called when shipping option changes */
  onShippingChange?: (option: ShippingOption) => void;

  // ===== NEW: Discount Code Props =====

  /** Enable discount code input */
  enableDiscountCode?: boolean;
  /** Called when discount is applied */
  onDiscountApplied?: (result: DiscountResult) => void;
  /** Async function to validate a discount code. Returns DiscountResult. */
  validateDiscount?: (code: string) => Promise<DiscountResult>;
}

const emptyAddress: AddressData = { street: "", city: "", state: "", zip: "", country: "" };

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
  checkoutSessionId,
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
  shipping: shippingProp,
  tax,
  discount: discountProp,
  summaryLines,
  // New form props
  formSchema,
  formComponent,
  onFormSubmit,
  // New shipping props
  shippingOptions,
  collectShippingAddress,
  onShippingChange: onShippingChangeProp,
  // New discount props
  enableDiscountCode,
  onDiscountApplied: onDiscountAppliedProp,
  validateDiscount,
}: AnySpendCheckoutProps) {
  // ===== Form state =====
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountResult | null>(null);
  const [shippingAddress, setShippingAddress] = useState<AddressData>(emptyAddress);

  const handleFormDataChange = useCallback(
    (data: Record<string, unknown>) => {
      setFormData(data);
      onFormSubmit?.(data);
    },
    [onFormSubmit],
  );

  const handleShippingChange = useCallback(
    (option: ShippingOption) => {
      setSelectedShipping(option);
      onShippingChangeProp?.(option);
    },
    [onShippingChangeProp],
  );

  const handleDiscountApplied = useCallback(
    (result: DiscountResult) => {
      setAppliedDiscount(result);
      onDiscountAppliedProp?.(result);
    },
    [onDiscountAppliedProp],
  );

  const handleDiscountRemoved = useCallback(() => {
    setAppliedDiscount(null);
  }, []);

  // Merge static shipping prop with dynamic shipping selection
  const effectiveShipping = useMemo(() => {
    if (selectedShipping) {
      return { amount: selectedShipping.amount, label: selectedShipping.name };
    }
    if (shippingProp) {
      return typeof shippingProp === "string" ? { amount: shippingProp } : shippingProp;
    }
    return undefined;
  }, [selectedShipping, shippingProp]);

  // Merge static discount prop with dynamic discount
  const effectiveDiscount = useMemo(() => {
    if (appliedDiscount?.valid && appliedDiscount.discount_amount) {
      return {
        amount: appliedDiscount.discount_amount,
        label: appliedDiscount.discount_type === "percentage" ? `${appliedDiscount.discount_value}% off` : "Discount",
      };
    }
    if (discountProp) {
      return typeof discountProp === "string" ? { amount: discountProp } : discountProp;
    }
    return undefined;
  }, [appliedDiscount, discountProp]);

  // Compute total from items + adjustments (including dynamic shipping/discount)
  const computedTotal = useMemo(() => {
    if (totalAmountOverride) return totalAmountOverride;
    let total = BigInt(0);
    for (const item of items) {
      total += safeBigInt(item.amount) * BigInt(item.quantity);
    }
    if (effectiveShipping?.amount) total += safeBigInt(effectiveShipping.amount);
    const taxAmt = typeof tax === "string" ? tax : tax?.amount;
    if (taxAmt) total += safeBigInt(taxAmt);
    if (effectiveDiscount?.amount) total -= safeBigInt(effectiveDiscount.amount);
    if (summaryLines) {
      for (const line of summaryLines) total += safeBigInt(line.amount);
    }
    if (total < BigInt(0)) total = BigInt(0);
    return total.toString();
  }, [items, totalAmountOverride, effectiveShipping, tax, effectiveDiscount, summaryLines]);

  // Get destination token metadata
  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);
  const tokenSymbol = tokenData?.symbol || "";
  const tokenDecimals = tokenData?.decimals || 18;

  // Resolve USD equivalent for non-stablecoin tokens (shown in cart summary)
  const isStablecoin = useMemo(() => {
    return [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC Base
      "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT Ethereum
    ].some(addr => addr.toLowerCase() === destinationTokenAddress.toLowerCase());
  }, [destinationTokenAddress]);

  const { anyspendQuote } = useAnyspendQuote({
    type: "swap",
    srcChain: 8453,
    dstChain: destinationTokenChainId,
    srcTokenAddress: USDC_BASE.address,
    dstTokenAddress: destinationTokenAddress,
    tradeType: "EXACT_OUTPUT",
    amount: computedTotal,
  });

  const usdEquivalent = useMemo(() => {
    if (isStablecoin) return null; // stablecoins already show USD-equivalent amounts
    if (!anyspendQuote?.data?.currencyIn?.amount) return null;
    const raw = formatUnits(anyspendQuote.data.currencyIn.amount, USDC_BASE.decimals);
    return `$${parseFloat(raw).toFixed(2)}`;
  }, [isStablecoin, anyspendQuote]);

  const fingerprint = getFingerprintConfig();

  // Build callbackMetadata to include form data with the order
  const checkoutFormMetadata = useMemo(() => {
    const meta: Record<string, unknown> = {};
    if (Object.keys(formData).length > 0) meta.formData = formData;
    if (selectedShipping) meta.shippingOptionId = selectedShipping.id;
    if (selectedShipping) meta.shippingAmount = selectedShipping.amount;
    if (shippingAddress.street) meta.shippingAddress = shippingAddress;
    if (appliedDiscount?.valid) {
      meta.discountCode = appliedDiscount.discount_value;
      meta.discountAmount = appliedDiscount.discount_amount;
    }
    // Extract common fields for customer enrichment
    if (formData.email) meta.customerEmail = formData.email;
    if (formData.name) meta.customerName = formData.name;
    if (checkoutSessionId) meta.checkoutSessionId = checkoutSessionId;
    return Object.keys(meta).length > 0 ? meta : undefined;
  }, [formData, selectedShipping, shippingAddress, appliedDiscount, checkoutSessionId]);

  // Check if required form fields are filled
  const isFormValid = useMemo(() => {
    if (!formSchema) return true;
    return formSchema.fields.filter(f => f.required).every(f => formData[f.id] != null && formData[f.id] !== "");
  }, [formSchema, formData]);

  // Check if we have a form panel to show
  const hasFormContent =
    (formSchema && formSchema.fields.length > 0) ||
    formComponent ||
    slots?.checkoutForm ||
    (shippingOptions && shippingOptions.length > 0) ||
    collectShippingAddress ||
    enableDiscountCode;

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprint}>
      <AnySpendCustomizationProvider slots={slots} content={content} theme={theme}>
        <CheckoutLayout
          mode={mode}
          paymentPanel={
            <>
              {/* Form panel renders above payment panel in the left/payment column */}
              {hasFormContent && (
                <div className="mb-6">
                  <CheckoutFormPanel
                    formSchema={formSchema}
                    formComponent={formComponent}
                    shippingOptions={shippingOptions}
                    collectShippingAddress={collectShippingAddress}
                    enableDiscountCode={enableDiscountCode}
                    validateDiscount={validateDiscount}
                    tokenSymbol={tokenSymbol}
                    tokenDecimals={tokenDecimals}
                    classes={classes}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                    selectedShipping={selectedShipping}
                    onShippingChange={handleShippingChange}
                    appliedDiscount={appliedDiscount}
                    onDiscountApplied={handleDiscountApplied}
                    onDiscountRemoved={handleDiscountRemoved}
                    shippingAddress={shippingAddress}
                    onShippingAddressChange={setShippingAddress}
                    checkoutFormSlot={slots?.checkoutForm}
                  />
                  <div className="mt-6 border-t border-gray-200 dark:border-neutral-700" />
                </div>
              )}
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
                callbackMetadata={checkoutFormMetadata}
                isFormValid={isFormValid}
              />
            </>
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
              shipping={effectiveShipping}
              tax={typeof tax === "string" ? { amount: tax } : tax}
              discount={effectiveDiscount}
              summaryLines={summaryLines}
              usdEquivalent={usdEquivalent}
            />
          }
          classes={classes}
        />
      </AnySpendCustomizationProvider>
    </AnySpendFingerprintWrapper>
  );
}
