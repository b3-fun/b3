"use client";

import { useAnyspendCreateOnrampOrder, useGeoOnrampOptions, useStripeClientSecret } from "@b3dotfun/sdk/anyspend/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { getStripePromise } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { ShinyButton, TextShimmer, useB3Config, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { AddressElement, Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { PaymentIntentResult, StripePaymentElementOptions } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

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
}: FiatCheckoutPanelProps) {
  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);
  const { theme, stripePublishableKey } = useB3Config();

  const formattedAmount = useMemo(() => {
    const decimals = tokenData?.decimals || 18;
    return formatTokenAmount(BigInt(totalAmount), decimals);
  }, [totalAmount, tokenData]);

  const {
    geoData,
    stripeOnrampSupport,
    stripeWeb2Support,
    isLoading: isLoadingGeo,
  } = useGeoOnrampOptions(formattedAmount);

  // Order state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const orderCreatedRef = useRef(false);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: (data) => {
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
      onError?.(error);
    },
  });

  // Auto-create onramp order when Stripe Web2 is supported and all data is ready
  useEffect(() => {
    if (
      !isLoadingGeo &&
      stripeWeb2Support?.isSupport &&
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
        srcFiatAmount: formattedAmount,
        onramp: {
          vendor: "stripe-web2",
          paymentMethod: "",
          country: geoData?.country || "US",
          redirectUrl: window.location.origin,
        },
        expectedDstAmount: totalAmount,
        callbackMetadata,
      });
    }
  }, [
    isLoadingGeo,
    stripeWeb2Support,
    orderId,
    isCreatingOrder,
    orderError,
    tokenData,
    recipientAddress,
    destinationTokenAddress,
    destinationTokenChainId,
    formattedAmount,
    totalAmount,
    geoData,
    callbackMetadata,
    createOrder,
  ]);

  // Loading geo/stripe support check
  if (isLoadingGeo) {
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
        className={cn("anyspend-fiat-stripe", classes?.fiatPanel)}
      >
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

  // Fallback: Stripe redirect flow (only if web2 not available but redirect is)
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

function StripeCheckoutForm({ themeColor, orderId, onSuccess, onOrderCreated, onError, classes }: StripeCheckoutFormProps) {
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
        setMessage(result.error.message || "Payment failed. Please try again.");
        return;
      }

      // Payment succeeded — notify parent to show order lifecycle tracking
      onOrderCreated?.(orderId);
      // Also fire legacy callback for backward compatibility
      onSuccess?.({ orderId, txHash: undefined });
    } catch (error: any) {
      const errorMessage = error?.message || "Payment failed. Please try again.";
      setMessage(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
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
