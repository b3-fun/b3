"use client";

import { useAnyspendCreateOnrampOrder, useGeoOnrampOptions, useStripeClientSecret } from "@b3dotfun/sdk/anyspend/react";
import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { getStripePromise } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { TextShimmer, useB3Config, useTokenData } from "@b3dotfun/sdk/global-account/react";
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
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onError?: (error: Error) => void;
  classes?: AnySpendCheckoutClasses;
}

export function FiatCheckoutPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  themeColor,
  onSuccess,
  onError,
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

  // Detect if destination token is the same as the onramp source (USDC on Base)
  // In this case, onramp order creation would fail with "Cannot swap same token on same chain"
  const isSameAsOnrampSource = useMemo(() => {
    return (
      destinationTokenChainId === USDC_BASE.chainId &&
      destinationTokenAddress.toLowerCase() === USDC_BASE.address.toLowerCase()
    );
  }, [destinationTokenAddress, destinationTokenChainId]);

  // Order state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const orderCreatedRef = useRef(false);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: (data: any) => {
      const id = data?.data?.id;
      const intentId = data?.data?.stripePaymentIntentId;
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
  // Skip auto-creation when destination is same as source (USDC on Base)
  useEffect(() => {
    if (
      !isLoadingGeo &&
      stripeWeb2Support?.isSupport &&
      !isSameAsOnrampSource &&
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
      });
    }
  }, [
    isLoadingGeo,
    stripeWeb2Support,
    isSameAsOnrampSource,
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

  // Same-token fallback: USDC on Base uses Stripe redirect instead of embedded
  if (isSameAsOnrampSource && hasStripeRedirect) {
    return (
      <div className={cn("anyspend-fiat-redirect flex flex-col gap-3 py-2", classes?.fiatPanel)}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You'll be redirected to Stripe to complete your payment securely.
        </p>
        <button
          className={cn(
            "anyspend-fiat-redirect-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]",
            "bg-blue-600 hover:bg-blue-700",
          )}
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        >
          <Lock className="h-3.5 w-3.5" />
          Pay with Card
        </button>
        <p className="anyspend-fiat-secured flex items-center justify-center gap-1 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          Secured by Stripe
        </p>
      </div>
    );
  }

  // Same-token without redirect support
  if (isSameAsOnrampSource) {
    return (
      <div className={cn("anyspend-fiat-unavailable py-4 text-center", classes?.fiatPanel)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Card payments are not available for this token configuration.
        </p>
      </div>
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
      <button
        className={cn(
          "anyspend-fiat-redirect-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]",
          "bg-blue-600 hover:bg-blue-700",
        )}
        style={themeColor ? { backgroundColor: themeColor } : undefined}
      >
        <Lock className="h-3.5 w-3.5" />
        Pay with Card
      </button>
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
  onError?: (error: Error) => void;
  classes?: AnySpendCheckoutClasses;
}

function StripeCheckoutForm({ themeColor, orderId, onSuccess, onError, classes }: StripeCheckoutFormProps) {
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

      // Payment succeeded
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
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className={cn(
          "anyspend-stripe-submit flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
          !stripe || !elements || loading
            ? "cursor-not-allowed bg-gray-300 dark:bg-gray-600"
            : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
          classes?.payButton,
        )}
        style={themeColor && !loading ? { backgroundColor: themeColor } : undefined}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            Complete Payment
          </>
        )}
      </button>

      <p className="anyspend-fiat-secured flex items-center justify-center gap-1 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        Secured by Stripe
      </p>
    </motion.form>
  );
}
