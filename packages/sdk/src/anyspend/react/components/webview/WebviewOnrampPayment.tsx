import { getChainName, STRIPE_CONFIG } from "@b3dotfun/sdk/anyspend";
import { useAnyspendCreateOnrampOrder, useGeoOnrampOptions, useStripeClientSecret } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { AddressElement, Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface WebviewOnrampPaymentProps {
  srcAmountOnRamp: string;
  recipientAddress?: string;
  destinationToken: components["schemas"]["Token"];
  partnerId?: string;
  anyspendQuote: GetQuoteResponse | undefined;
  onPaymentSuccess: (orderId: string) => void;
  userId?: string;
}

export function WebviewOnrampPayment(props: WebviewOnrampPaymentProps) {
  const fingerprintConfig = getFingerprintConfig();
  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <WebviewOnrampPaymentInner {...props} />
    </AnySpendFingerprintWrapper>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({
  order,
  onPaymentSuccess,
}: {
  order: components["schemas"]["Order"];
  onPaymentSuccess: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressElement, setShowAddressElement] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "An error occurred");
        console.error("Payment error:", submitError);
      } else {
        console.log("Payment successful");
        onPaymentSuccess(order.id);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Payment error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment element changes
  const handlePaymentElementChange = (event: any) => {
    // Show address element only for card payments
    console.log("@@stripe-web2-payment:payment-element-change:", JSON.stringify(event, null, 2));
    setShowAddressElement(event.value.type === "card");
  };

  const stripeElementOptions = {
    layout: "tabs" as const,
    fields: {
      billingDetails: "auto" as const,
    },
    wallets: {
      applePay: "auto" as const,
      googlePay: "auto" as const,
    },
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="px-6 py-4">
          <h2 className="mb-4 text-lg font-semibold">Payment Details</h2>
          <PaymentElement options={stripeElementOptions} onChange={handlePaymentElementChange} />

          {showAddressElement && (
            <div className="mt-4">
              <AddressElement
                options={{
                  mode: "billing",
                  fields: {
                    phone: "always",
                  },
                  // More granular control
                  display: {
                    name: "split", // or 'split' for first/last name separately
                  },
                  // Validation
                  validation: {
                    phone: {
                      required: "auto", // or 'always', 'never'
                    },
                  },
                }}
              />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <span>Complete Payment</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function WebviewOnrampPaymentInner({
  srcAmountOnRamp,
  recipientAddress,
  destinationToken,
  anyspendQuote,
  onPaymentSuccess,
  userId,
  partnerId,
}: WebviewOnrampPaymentProps) {
  const [stableAmountForGeo, setStableAmountForGeo] = useState(srcAmountOnRamp);
  const hasInitialized = useRef(false);
  const [createdOrder, setCreatedOrder] = useState<components["schemas"]["Order"] | null>(null);
  const orderCreationAttempted = useRef(false);

  // Only update the stable amount on first render or when explicitly needed
  useEffect(() => {
    if (!hasInitialized.current && srcAmountOnRamp) {
      setStableAmountForGeo(srcAmountOnRamp);
      hasInitialized.current = true;
    }
  }, [srcAmountOnRamp]);

  const { geoData, stripeWeb2Support, isLoading: isLoadingGeoOnramp } = useGeoOnrampOptions(true, stableAmountForGeo);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      setCreatedOrder(data.data);
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  const { clientSecret, isLoadingStripeClientSecret } = useStripeClientSecret(
    true,
    createdOrder?.stripePaymentIntentId || "",
  );

  // Create order when component mounts and all required data is available
  useEffect(() => {
    const createOrderIfPossible = async () => {
      if (
        !orderCreationAttempted.current &&
        recipientAddress &&
        srcAmountOnRamp &&
        parseFloat(srcAmountOnRamp) > 0 &&
        stripeWeb2Support.isSupport &&
        anyspendQuote &&
        geoData
      ) {
        orderCreationAttempted.current = true;

        try {
          const getDstToken = (): components["schemas"]["Token"] => {
            return {
              ...destinationToken,
              chainId: destinationToken.chainId,
              address: destinationToken.address,
            };
          };

          createOrder({
            isMainnet: true,
            recipientAddress,
            orderType: "swap",
            dstChain: getDstToken().chainId,
            dstToken: getDstToken(),
            srcFiatAmount: srcAmountOnRamp,
            onramp: {
              vendor: "stripe-web2",
              paymentMethod: "",
              country: geoData.country || "US",
              ipAddress: geoData.ip,
              redirectUrl: `${window.location.origin}${userId ? `?userId=${userId}` : ""}`,
            },
            expectedDstAmount: anyspendQuote.data?.currencyOut?.amount?.toString() || "0",
            partnerId,
          });
        } catch (err: any) {
          console.error(err);
          toast.error("Failed to create order: " + err.message);
        }
      }
    };

    createOrderIfPossible();
  }, [
    recipientAddress,
    srcAmountOnRamp,
    anyspendQuote,
    geoData,
    createOrder,
    destinationToken,
    userId,
    partnerId,
    stripeWeb2Support.isSupport,
  ]);

  // Check if all required data is loaded
  const isLoading = isLoadingGeoOnramp || !anyspendQuote || !destinationToken.metadata?.logoURI;

  // Show loading state while data is being fetched or order is being created
  if (isLoading || isCreatingOrder || isLoadingStripeClientSecret) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="text-as-brand h-8 w-8 animate-spin" />
        <span className="text-as-primary/70">
          {isCreatingOrder
            ? "Creating payment session..."
            : isLoadingStripeClientSecret
              ? "Loading payment form..."
              : "Loading payment details..."}
        </span>
      </div>
    );
  }

  // If we have a created order and client secret, show the payment form
  if (createdOrder && clientSecret) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
        {/* Order Summary Card */}
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="px-6 py-4">
            <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
            <div className="flex flex-col divide-y">
              {/* Destination Token */}
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Receiving</span>
                <div className="flex items-center gap-2">
                  {destinationToken.metadata?.logoURI && (
                    <img
                      src={destinationToken.metadata.logoURI}
                      alt={destinationToken.symbol}
                      className="h-5 w-5 rounded-full"
                    />
                  )}
                  <span className="font-medium">
                    {anyspendQuote?.data?.currencyOut?.amount
                      ? Number(
                          formatUnits(BigInt(anyspendQuote.data.currencyOut.amount), destinationToken.decimals),
                        ).toFixed(4)
                      : "0"}{" "}
                    {destinationToken.symbol}
                  </span>
                </div>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Network</span>
                <span className="font-medium">{getChainName(destinationToken.chainId)}</span>
              </div>

              {/* Recipient Section */}
              {recipientAddress && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Recipient</span>
                  <span className="font-medium">{centerTruncate(recipientAddress)}</span>
                </div>
              )}

              {/* Amount Section */}
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">You Pay</span>
                <span className="text-lg font-semibold">${parseFloat(srcAmountOnRamp).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Elements */}
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "flat",
              variables: {
                colorPrimary: "#2563eb",
                colorBackground: "#ffffff",
                borderRadius: "12px",
              },
            },
          }}
        >
          <StripePaymentForm order={createdOrder} onPaymentSuccess={onPaymentSuccess} />
        </Elements>
      </div>
    );
  }

  // Show initial order summary while waiting for order creation
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[460px]"
    >
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="px-6 py-4">
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
          <div className="flex flex-col divide-y">
            {/* Destination Token */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Receiving</span>
              <div className="flex items-center gap-2">
                {destinationToken.metadata?.logoURI && (
                  <img
                    src={destinationToken.metadata.logoURI}
                    alt={destinationToken.symbol}
                    className="h-5 w-5 rounded-full"
                  />
                )}
                <span className="font-medium">
                  {anyspendQuote?.data?.currencyOut?.amount
                    ? Number(
                        formatUnits(BigInt(anyspendQuote.data.currencyOut.amount), destinationToken.decimals),
                      ).toFixed(4)
                    : "0"}{" "}
                  {destinationToken.symbol}
                </span>
              </div>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Network</span>
              <span className="font-medium">{getChainName(destinationToken.chainId)}</span>
            </div>

            {/* Recipient Section */}
            {recipientAddress && (
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Recipient</span>
                <span className="font-medium">{centerTruncate(recipientAddress)}</span>
              </div>
            )}

            {/* Amount Section */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">You Pay</span>
              <span className="text-lg font-semibold">${parseFloat(srcAmountOnRamp).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
