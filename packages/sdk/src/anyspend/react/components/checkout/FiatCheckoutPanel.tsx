"use client";

import {
  useAnyspendCreateOnrampOrder,
  useAnyspendQuote,
  useGeoOnrampOptions,
  useStripeClientSecret,
} from "@b3dotfun/sdk/anyspend/react";
import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import { getStripePromise } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { ShinyButton, TextShimmer, useB3Config, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { AddressElement, Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { PaymentIntentResult, StripePaymentElementOptions } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";
import { KycGate } from "./KycGate";

interface FiatCheckoutPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  themeColor?: string;
  /** @deprecated Use onOrderCreated instead. Kept for backward compatibility. */
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  /** Called when payment is confirmed — triggers lifecycle tracking in parent */
  onOrderCreated?: (orderId: string) => void;
  onError?: (error: Error) => void;
  callbackMetadata?: Record<string, unknown>;
  classes?: AnySpendCheckoutClasses;
  /** When true, fees are added on top (payer pays more, receiver gets exact amount) */
  feeOnTop?: boolean;
  /** When true, identity verification is required before card payment. Defaults to false. */
  kycEnabled?: boolean;
}

export function FiatCheckoutPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  themeColor,
  onSuccess,
  onOrderCreated,
  onError,
  callbackMetadata,
  classes,
  feeOnTop,
  kycEnabled = false,
}: FiatCheckoutPanelProps) {
  // Stable refs for callback props to avoid re-triggering effects
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);
  const { theme, stripePublishableKey } = useB3Config();

  // Clean decimal string for API calls (no commas, no subscripts)
  const formattedAmount = useMemo(() => {
    const decimals = tokenData?.decimals || 18;
    return formatUnits(BigInt(totalAmount).toString(), decimals);
  }, [totalAmount, tokenData]);

  // Determine if destination token is a stablecoin (amount ≈ USD)
  const isStablecoin = useMemo(() => {
    return [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC Base
      "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT Ethereum
    ].some(addr => addr.toLowerCase() === destinationTokenAddress.toLowerCase());
  }, [destinationTokenAddress]);

  // Get USD equivalent via quote for non-stablecoin tokens
  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote({
    type: "swap",
    srcChain: 8453, // Base (USDC source)
    dstChain: destinationTokenChainId,
    srcTokenAddress: USDC_BASE.address,
    dstTokenAddress: destinationTokenAddress,
    tradeType: "EXACT_OUTPUT",
    amount: totalAmount,
  });

  // USD amount to charge: direct for stablecoins, quote-derived for others.
  // Rounded to 2 decimals so minor quote fluctuations don't retrigger the Stripe support check.
  const usdAmount = useMemo(() => {
    if (isStablecoin) return formattedAmount;
    if (!anyspendQuote?.data?.currencyIn?.amount) return null;
    const raw = formatUnits(anyspendQuote.data.currencyIn.amount, USDC_BASE.decimals);
    return parseFloat(raw).toFixed(2);
  }, [isStablecoin, formattedAmount, anyspendQuote]);

  const {
    geoData,
    stripeOnrampSupport,
    stripeWeb2Support,
    isLoading: isLoadingGeo,
  } = useGeoOnrampOptions(usdAmount || "0");

  // KYC state — pre-approved when kycEnabled is false (feature flag off)
  const [kycApproved, setKycApproved] = useState(() => !kycEnabled);

  const handleKycResolved = useCallback((approved: boolean) => {
    setKycApproved(approved);
  }, []);

  // Order state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const orderCreatedRef = useRef(false);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      const id = data.data?.id;
      const intentId = data.data?.stripePaymentIntentId;
      if (id && intentId) {
        setOrderId(id);
        setStripePaymentIntentId(intentId);
      } else {
        setOrderError("Failed to initialize payment. Please try again.");
      }
    },
    onError: (error: Error) => {
      setOrderError(error.message || "Failed to create payment order.");
      onErrorRef.current?.(error);
    },
  });

  // Auto-create onramp order when Stripe Web2 is supported, KYC approved, and all data is ready
  useEffect(() => {
    if (
      !isLoadingGeo &&
      (!isStablecoin ? !isLoadingAnyspendQuote : true) &&
      usdAmount &&
      parseFloat(usdAmount) > 0 &&
      stripeWeb2Support?.isSupport &&
      kycApproved &&
      !orderCreatedRef.current &&
      !orderId &&
      !isCreatingOrder &&
      !orderError &&
      tokenData &&
      recipientAddress
    ) {
      orderCreatedRef.current = true;

      const dstToken = {
        address: destinationTokenAddress,
        chainId: destinationTokenChainId,
        decimals: tokenData.decimals || 18,
        symbol: tokenData.symbol || "",
        name: tokenData.name || "",
        metadata: {
          logoURI: tokenData.logoURI || "",
        },
      };

      createOrder({
        recipientAddress,
        orderType: "swap",
        dstChain: destinationTokenChainId,
        dstToken,
        srcFiatAmount: usdAmount,
        onramp: {
          vendor: "stripe-web2",
          paymentMethod: "",
          country: geoData?.country || "US",
          redirectUrl: window.location.origin,
        },
        expectedDstAmount: totalAmount,
        callbackMetadata,
        feeOnTop,
      });
    }
  }, [
    isLoadingGeo,
    isStablecoin,
    isLoadingAnyspendQuote,
    usdAmount,
    stripeWeb2Support,
    kycApproved,
    orderId,
    isCreatingOrder,
    orderError,
    tokenData,
    recipientAddress,
    destinationTokenAddress,
    destinationTokenChainId,
    totalAmount,
    geoData,
    callbackMetadata,
    createOrder,
    feeOnTop,
  ]);

  // Loading geo/stripe support check (and quote for non-stablecoins)
  if (isLoadingGeo || (!isStablecoin && isLoadingAnyspendQuote)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("anyspend-fiat-loading flex flex-col items-center gap-3 py-6", classes?.fiatPanel)}
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Loading payment form...
        </TextShimmer>
      </motion.div>
    );
  }

  const hasStripeWeb2 = stripeWeb2Support && stripeWeb2Support.isSupport;
  const hasStripeRedirect = !!stripeOnrampSupport;

  // Not available in region
  if (!hasStripeWeb2 && !hasStripeRedirect) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("anyspend-fiat-unavailable py-4 text-center", classes?.fiatPanel)}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Card payments are not available in your region for this amount.
        </p>
      </motion.div>
    );
  }

  // KYC gate — shown before order creation when verification is needed
  if (!kycApproved) {
    return <KycGate themeColor={themeColor} classes={classes} enabled onStatusResolved={handleKycResolved} />;
  }

  // Order creation error - show with retry
  if (orderError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("anyspend-fiat-error flex flex-col items-center gap-3 py-4", classes?.fiatPanel)}
      >
        <p className="text-sm text-red-500">{orderError}</p>
        <button
          onClick={() => {
            setOrderError(null);
            orderCreatedRef.current = false;
          }}
          className="anyspend-fiat-retry text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  // Creating order / waiting for PaymentIntent
  if (hasStripeWeb2 && (isCreatingOrder || !stripePaymentIntentId)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("anyspend-fiat-initializing flex flex-col items-center gap-3 py-6", classes?.fiatPanel)}
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Initializing secure payment...
        </TextShimmer>
      </motion.div>
    );
  }

  // Stripe Web2 embedded form
  if (hasStripeWeb2 && stripePaymentIntentId && orderId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("anyspend-fiat-stripe flex flex-col gap-3", classes?.fiatPanel)}
      >
        {usdAmount && (
          <div className="anyspend-fiat-summary rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total</span>
              <span className="font-medium text-gray-900 dark:text-white">${parseFloat(usdAmount).toFixed(2)}</span>
            </div>
            {!isStablecoin && tokenData && (
              <div className="mt-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>
                  {formattedAmount} {tokenData.symbol}
                </span>
                <span>incl. fees</span>
              </div>
            )}
          </div>
        )}
        <StripeCheckout
          stripePaymentIntentId={stripePaymentIntentId}
          stripePublishableKey={stripePublishableKey}
          theme={theme}
          themeColor={themeColor}
          orderId={orderId}
          onSuccess={onSuccess}
          onOrderCreated={onOrderCreated}
          onError={onError}
          classes={classes}
        />
      </motion.div>
    );
  }

  // TODO: Dead code — Stripe onramp is disabled at backend (isStripeOnrampSupported hardcoded false).
  // Remove this block or implement onClick if Stripe onramp is re-enabled.
  return (
    <div className={cn("anyspend-fiat-redirect flex flex-col gap-3 py-2", classes?.fiatPanel)}>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        You'll be redirected to Stripe to complete your payment securely.
      </p>
      <ShinyButton
        accentColor={themeColor || "hsl(var(--as-brand))"}
        className="anyspend-fiat-redirect-btn w-full"
        textClassName="text-white"
      >
        <span className="flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          Pay with Card
        </span>
      </ShinyButton>
      <p className="anyspend-fiat-secured flex items-center justify-center gap-1 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        Secured by Stripe
      </p>
    </div>
  );
}

// -------------------------------------------------------------------
// Stripe Elements wrapper - fetches client secret, renders Elements
// -------------------------------------------------------------------

interface StripeCheckoutProps {
  stripePaymentIntentId: string;
  stripePublishableKey?: string | null;
  theme?: string;
  themeColor?: string;
  orderId: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onOrderCreated?: (orderId: string) => void;
  onError?: (error: Error) => void;
  classes?: AnySpendCheckoutClasses;
}

function StripeCheckout({
  stripePaymentIntentId,
  stripePublishableKey,
  theme,
  themeColor,
  orderId,
  onSuccess,
  onOrderCreated,
  onError,
  classes,
}: StripeCheckoutProps) {
  const { clientSecret, isLoadingStripeClientSecret, stripeClientSecretError } =
    useStripeClientSecret(stripePaymentIntentId);

  if (isLoadingStripeClientSecret) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="anyspend-stripe-loading flex flex-col items-center gap-3 py-6"
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Loading payment form...
        </TextShimmer>
      </motion.div>
    );
  }

  if (stripeClientSecretError || !clientSecret) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="anyspend-stripe-error py-4 text-center"
      >
        <p className="text-sm text-red-500">
          {stripeClientSecretError?.message || "Failed to load payment form. Please try again."}
        </p>
      </motion.div>
    );
  }

  return (
    <Elements
      stripe={getStripePromise(stripePublishableKey)}
      options={{
        clientSecret,
        appearance: {
          theme: theme === "light" ? "stripe" : "night",
          variables: {
            borderRadius: "8px",
          },
        },
      }}
    >
      <StripeCheckoutForm
        themeColor={themeColor}
        orderId={orderId}
        onSuccess={onSuccess}
        onOrderCreated={onOrderCreated}
        onError={onError}
        classes={classes}
      />
    </Elements>
  );
}

// -------------------------------------------------------------------
// Inner form component (inside Elements context)
// -------------------------------------------------------------------

interface StripeCheckoutFormProps {
  themeColor?: string;
  orderId: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onOrderCreated?: (orderId: string) => void;
  onError?: (error: Error) => void;
  classes?: AnySpendCheckoutClasses;
}

function StripeCheckoutForm({
  themeColor,
  orderId,
  onSuccess,
  onOrderCreated,
  onError,
  classes,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [showAddressElement, setShowAddressElement] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      setStripeReady(true);
    }
  }, [stripe, elements]);

  const handlePaymentElementChange = useCallback((event: any) => {
    setShowAddressElement(event.value?.type === "card");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage("Payment system is not ready. Please wait.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = (await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })) as PaymentIntentResult;

      if (result.error) {
        console.error("@@checkout-stripe:error:", JSON.stringify(result.error, null, 2));
        setMessage(result.error.message || "Payment failed. Please try again.");
        return;
      }

      console.log("@@checkout-stripe:success:", JSON.stringify({ orderId }, null, 2));
      // Payment succeeded — notify parent to show order lifecycle tracking
      onOrderCreated?.(orderId);
      // Also fire legacy callback for backward compatibility
      onSuccess?.({ orderId, txHash: undefined });
    } catch (error: any) {
      const errorMessage = error?.message || "Payment failed. Please try again.";
      setMessage(errorMessage);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onError?.(errorObj);
    } finally {
      setLoading(false);
    }
  };

  const stripeElementOptions: StripePaymentElementOptions = {
    layout: "tabs" as const,
    fields: {
      billingDetails: "auto" as const,
    },
    wallets: {
      applePay: "auto" as const,
      googlePay: "auto" as const,
    },
  };

  if (!stripeReady) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="anyspend-stripe-loading flex flex-col items-center gap-3 py-6"
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Loading payment form...
        </TextShimmer>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="anyspend-stripe-form flex flex-col gap-4"
    >
      <div className="anyspend-stripe-payment-element">
        <PaymentElement onChange={handlePaymentElementChange} options={stripeElementOptions} />
      </div>

      <AnimatePresence initial={false}>
        {showAddressElement && (
          <motion.div
            key="address-element"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className="anyspend-stripe-address-element"
          >
            <AddressElement
              options={{
                mode: "billing",
                fields: {
                  phone: "always",
                },
                display: {
                  name: "split",
                },
                validation: {
                  phone: {
                    required: "always",
                  },
                },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence initial={false}>
        {message && (
          <motion.div
            key="stripe-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className="anyspend-stripe-error rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <ShinyButton
        type="submit"
        accentColor={themeColor || "hsl(var(--as-brand))"}
        disabled={!stripe || !elements || loading}
        className={cn("anyspend-stripe-submit w-full", classes?.payButton)}
        textClassName="text-white"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Complete Payment
          </span>
        )}
      </ShinyButton>

      <p className="anyspend-fiat-secured flex items-center justify-center gap-1 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        Secured by Stripe
      </p>
    </motion.form>
  );
}
