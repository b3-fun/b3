import { STRIPE_CONFIG } from "@b3dotfun/sdk/anyspend/constants";
import { OrderDetailsCollapsible, useStripeClientSecret } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ShinyButton, useB3, useModalStore, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { formatStripeAmount } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { AddressElement, CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, PaymentIntentResult, StripeCardElement } from "@stripe/stripe-js";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";
import HowItWorks from "./HowItWorks";
import PaymentMethodIcons from "./PaymentMethodIcons";

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface PaymentStripeWeb2Props {
  order: components["schemas"]["Order"];
  stripePaymentIntentId: string;
  onPaymentSuccess?: (paymentIntent: any) => void;
}

export default function PaymentStripeWeb2({ order, stripePaymentIntentId, onPaymentSuccess }: PaymentStripeWeb2Props) {
  const { theme } = useB3();
  const fingerprintConfig = getFingerprintConfig();

  const { clientSecret, isLoadingStripeClientSecret, stripeClientSecretError } =
    useStripeClientSecret(stripePaymentIntentId);

  if (isLoadingStripeClientSecret) {
    return <StripeLoadingState />;
  }

  if (stripeClientSecretError) {
    return <StripeErrorState error={stripeClientSecretError.message} />;
  }

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: clientSecret || undefined,
          appearance: { theme: theme === "light" ? "stripe" : "night" },
        }}
      >
        <StripePaymentForm order={order} clientSecret={clientSecret} onPaymentSuccess={onPaymentSuccess} />
      </Elements>
    </AnySpendFingerprintWrapper>
  );
}

function StripeLoadingState() {
  return (
    <div className="relative my-8 flex w-full flex-1 flex-col items-center justify-center">
      <div className="bg-as-on-surface-1 flex w-full flex-col items-center justify-center gap-4 rounded-2xl p-8">
        <div className="bg-as-brand/20 flex h-16 w-16 items-center justify-center rounded-full">
          <div className="text-as-brand h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
        <div className="text-as-primary/70 text-center">
          <div className="text-lg font-medium">Initializing payment</div>
          <div className="text-as-primary/50 mt-2 text-sm">Setting up secure payment form...</div>
        </div>
      </div>
    </div>
  );
}

function StripeErrorState({ error }: { error: string }) {
  return (
    <div className="relative my-8 flex w-full flex-1 flex-col items-center justify-center">
      <div className="bg-as-red/10 border-as-red/20 flex w-full items-center gap-3 rounded-2xl border p-4">
        <div className="bg-as-red flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="text-as-red text-sm font-medium">Error: {error}</div>
      </div>
    </div>
  );
}

function StripePaymentForm({
  order,
  clientSecret,
  onPaymentSuccess,
}: {
  order: components["schemas"]["Order"];
  clientSecret: string | null;
  onPaymentSuccess?: (paymentIntent: any) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  // Require-completion flags for Card & Address
  const [cardComplete, setCardComplete] = useState<boolean>(false);
  const [addressComplete, setAddressComplete] = useState<boolean>(false);
  // Snapshot of AddressElement value to pass to billing_details
  const [addressValue, setAddressValue] = useState<any>(null);

  // Helper function to mark "How it works" as seen
  const markHowItWorksAsSeen = useCallback(() => {
    setShowHowItWorks(false);
    localStorage.setItem("b3-payment-how-it-works-seen", "true");
  }, []);

  useEffect(() => {
    if (stripe && elements) {
      setStripeReady(true);
    }
  }, [stripe, elements, order.id]);

  // Check if user has seen "How it works" before
  useEffect(() => {
    const hasSeenHowItWorks = localStorage.getItem("b3-payment-how-it-works-seen");
    if (!hasSeenHowItWorks) {
      setShowHowItWorks(true);
    }
  }, []);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      if (!stripe || !clientSecret) return;

      try {
        const paymentIntent = await stripe.retrievePaymentIntent(clientSecret);
        const amt = paymentIntent.paymentIntent?.amount ? formatStripeAmount(paymentIntent.paymentIntent.amount) : null;
        setAmount(amt);
      } catch (error) {
        console.error("@@stripe-web2-payment:retrieve-intent-error:", JSON.stringify(error, null, 2));
      }
    };

    fetchPaymentIntent();
  }, [clientSecret, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setMessage("Stripe is not initialized");
      return;
    }

    setLoading(true);
    setMessage(null);

    // Block submission until both card and billing address are complete
    if (!cardComplete || !addressComplete) {
      setMessage("Please complete all required billing address and card fields.");
      setLoading(false);
      return;
    }

    try {
      const card = elements.getElement(CardElement) as StripeCardElement | null;
      if (!card) {
        setMessage("Card element not found");
        setLoading(false);
        return;
      }

      const result = (await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            // Map AddressElement values into billing_details
            name: addressValue?.name
              ? typeof addressValue.name === "string"
                ? addressValue.name
                : [addressValue.name.firstName, addressValue.name.lastName].filter(Boolean).join(" ")
              : undefined,
            phone: addressValue?.phone || undefined,
            address: addressValue?.address
              ? {
                  line1: addressValue.address.line1 || undefined,
                  line2: addressValue.address.line2 || undefined,
                  city: addressValue.address.city || undefined,
                  state: addressValue.address.state || undefined, // province/region
                  postal_code: addressValue.address.postal_code || undefined,
                  country: addressValue.address.country || undefined,
                }
              : undefined,
          },
        },
      })) as PaymentIntentResult;

      if (result.error) {
        // This point will only be reached if there is an immediate error.
        // Otherwise, the customer will be redirected to the `return_url`.
        console.error("@@stripe-web2-payment:error:", JSON.stringify(result.error, null, 2));
        setMessage(result.error.message || "An unexpected error occurred.");
        return;
      }

      // At this point TypeScript knows result.paymentIntent exists and error is undefined
      console.log(
        "@@stripe-web2-payment:success:",
        JSON.stringify({ orderId: order.id, paymentIntentId: result.paymentIntent.id }, null, 2),
      );

      // Payment succeeded without redirect - handle success in the modal
      setMessage(null);

      // Add waitingForDeposit=true to query params
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("waitingForDeposit", "true");
      window.history.replaceState(null, "", currentUrl.toString());

      // Call the success callback if provided
      onPaymentSuccess?.(result.paymentIntent);
    } catch (error) {
      console.error("@@stripe-web2-payment:confirmation-error:", JSON.stringify(error, null, 2));
      setMessage("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle 3DS redirect
  useEffect(() => {
    // Check if we're returning from Stripe
    const url = new URL(window.location.href);
    const fromStripe = url.searchParams.get("fromStripe");
    const paymentIntent = url.searchParams.get("payment_intent");

    if (fromStripe && paymentIntent) {
      // Close the modal as we're returning from 3DS
      setB3ModalOpen(true);

      // Clean up URL params
      url.searchParams.delete("fromStripe");
      window.history.replaceState({}, "", url.toString());
    }
  }, [setB3ModalOpen]);

  const profile = useProfile({ address: order.recipientAddress });
  const recipientName = profile.data?.name?.replace(/\.b3\.fun/g, "");

  if (!stripeReady) {
    return <StripeLoadingState />;
  }

  const howItWorksSteps = [
    {
      number: 1,
      description: "Enter your payment details securely using Stripe's encrypted form",
    },
    {
      number: 2,
      description: "Your payment is processed instantly and securely through our payment partner",
    },
    {
      number: 3,
      description: "After payment confirmation, your order will be processed and completed automatically",
    },
  ];

  return (
    <div className="relative mt-1 flex w-full flex-1 flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <OrderDetailsCollapsible
          order={order}
          dstToken={order.metadata.dstToken}
          tournament={
            order.type === "join_tournament" || order.type === "fund_tournament" ? order.metadata.tournament : undefined
          }
          nft={order.type === "mint_nft" ? order.metadata.nft : undefined}
          recipientName={recipientName}
          formattedExpectedDstAmount={formatTokenAmount(BigInt(order.srcAmount), order.metadata.dstToken.decimals)}
          showTotal={true}
          totalAmount={amount ? `$${Number(amount).toFixed(2)}` : undefined}
        />

        {/* Simplified Payment Form (Card + LinkAuth) */}
        <div className="w-full">
          <div className="text-as-primary mb-4 text-lg font-semibold">Payment Details</div>

          {/* Card input */}
          <div className="border-as-stroke mb-4 rounded-lg border p-3">
            <CardElement options={{}} onChange={(e: any) => setCardComplete(!!e.complete)} />
          </div>

          <AddressElement
            options={{
              mode: "billing",
              fields: { phone: "always" },
              display: { name: "split" },
              validation: { phone: { required: "always" } },
            }}
            // Ensure we mirror Stripe's built-in completeness signal and capture values
            onChange={(e: any) => {
              setAddressComplete(!!e.complete);
              setAddressValue(e.value);
            }}
          />
        </div>

        {/* Error Message */}
        {message && (
          <div className="bg-as-red/10 border-as-red/20 flex w-full items-center gap-3 rounded-2xl border p-4">
            <div className="bg-as-red flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-as-red text-sm font-medium">{message}</div>
          </div>
        )}

        {/* Submit Button */}
        <ShinyButton
          type="submit"
          accentColor="hsl(var(--as-brand))"
          disabled={!stripe || !elements || loading || !cardComplete || !addressComplete}
          className="relative w-full py-4 text-lg font-semibold"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-white">Processing Payment...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-white">Complete Payment</span>
              {amount && <span className="text-white/90">${Number(amount).toFixed(2)}</span>}
            </div>
          )}
        </ShinyButton>
      </form>

      {/* How it works modal */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={e => {
            if (e.target === e.currentTarget) {
              markHowItWorksAsSeen();
            }
          }}
        >
          <div className="bg-as-on-surface-1 relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6">
            {/* Modal header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-as-primary text-xl font-semibold">How it works</h2>
              <button
                onClick={markHowItWorksAsSeen}
                className="text-as-primary/60 hover:text-as-primary transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal content */}
            <div className="space-y-6">
              <PaymentMethodIcons />
              <HowItWorks steps={howItWorksSteps} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
