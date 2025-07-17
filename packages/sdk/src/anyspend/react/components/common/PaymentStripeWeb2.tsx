import { USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { useStripeClientSecret } from "@b3dotfun/sdk/anyspend/react";
import { STRIPE_CONFIG } from "@b3dotfun/sdk/anyspend/constants";
import { ShinyButton, useB3 } from "@b3dotfun/sdk/global-account/react";
import { formatStripeAmount } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { HelpCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import HowItWorks from "./HowItWorks";
import PaymentMethodIcons from "./PaymentMethodIcons";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface PaymentStripeWeb2Props {
  isMainnet: boolean;
  order: components["schemas"]["Order"];
  onPaymentSuccess?: (paymentIntent: any) => void;
}

export default function PaymentStripeWeb2({ isMainnet, order, onPaymentSuccess }: PaymentStripeWeb2Props) {
  const { theme } = useB3();

  const { clientSecret, isLoadingStripeClientSecret, stripeClientSecretError } = useStripeClientSecret(
    isMainnet,
    order.stripePaymentIntentId!,
  );

  if (isLoadingStripeClientSecret) {
    return <StripeLoadingState />;
  }

  if (stripeClientSecretError) {
    return <StripeErrorState error={stripeClientSecretError.message} />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret || undefined,
        appearance: { theme: theme === "light" ? "stripe" : "night" },
      }}
    >
      <StripePaymentForm order={order} clientSecret={clientSecret} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
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

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  useEffect(() => {
    if (stripe && elements) {
      setStripeReady(true);
      console.log("@@stripe-web2-payment:initialized:", JSON.stringify({ orderId: order.id }, null, 2));
    }
  }, [stripe, elements, order.id]);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      if (!stripe || !clientSecret) return;

      try {
        const paymentIntent = await stripe.retrievePaymentIntent(clientSecret);
        const amount = paymentIntent.paymentIntent?.amount
          ? formatStripeAmount(paymentIntent.paymentIntent.amount)
          : null;
        setAmount(amount);
      } catch (error) {
        console.error("@@stripe-web2-payment:retrieve-intent-error:", JSON.stringify(error, null, 2));
      }
    };

    fetchPaymentIntent();
  }, [clientSecret, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage("Stripe is not initialized");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log("@@stripe-web2-payment:confirming-payment:", JSON.stringify({ orderId: order.id }, null, 2));
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        console.error("@@stripe-web2-payment:error:", JSON.stringify(error, null, 2));
        setMessage(error.message || "An unexpected error occurred.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log(
          "@@stripe-web2-payment:success:",
          JSON.stringify({ orderId: order.id, paymentIntentId: paymentIntent.id }, null, 2),
        );
        // Payment succeeded without redirect - handle success in the modal
        setMessage(null);

        // Add waitingForDeposit=true to query params
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("waitingForDeposit", "true");
        window.history.replaceState(null, "", currentUrl.toString());

        // Call the success callback if provided
        onPaymentSuccess?.(paymentIntent);
      }
    } catch (error) {
      console.error("@@stripe-web2-payment:confirmation-error:", JSON.stringify(error, null, 2));
      setMessage("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!stripeReady) {
    return <StripeLoadingState />;
  }

  const stripeElementOptions = {
    layout: "tabs" as const,
    defaultValues: {
      billingDetails: {
        name: "",
        email: "",
      },
    },
    fields: {
      billingDetails: "auto" as const,
    },
    wallets: {
      applePay: "auto" as const,
      googlePay: "auto" as const,
    },
  };

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
    <div className="relative my-8 flex w-full flex-1 flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Combined Header with Security and Amount */}
        <div className="bg-as-on-surface-1 w-full rounded-2xl p-6">
          {/* Security Badge */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-as-brand/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <svg className="text-as-brand h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-as-primary text-sm font-medium">Secured by Stripe</div>
                <div className="text-as-primary/50 text-xs">End-to-end encrypted payment</div>
              </div>
            </div>

            {/* How it works button */}
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="text-as-primary/60 hover:text-as-primary flex items-center gap-1 text-xs transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>How it works</span>
            </button>
          </div>

          {/* Amount Display */}
          {amount && (
            <div className="border-as-stroke border-t pt-4">
              <div className="text-as-primary/50 mb-3 text-sm">Payment Breakdown</div>

              {/* Calculate fee breakdown */}
              {(() => {
                const originalAmount = Number(order.srcAmount) / 10 ** USDC_BASE.decimals;
                const finalAmount = Number(amount);
                const calculatedFee = finalAmount - originalAmount;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-as-primary/60">Amount</span>
                      <span className="text-as-primary">${originalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-as-primary/60">Processing fee</span>
                        <Tooltip
                          content={`Credit card companies charge a processing fee of 5.4% + $0.30 for all transactions.\n\nThis fee covers secure payment processing and fraud protection.`}
                        >
                          <Info className="text-as-primary/40 hover:text-as-primary/60 h-3 w-3 transition-colors" />
                        </Tooltip>
                      </div>
                      <span className="text-as-primary">${calculatedFee.toFixed(2)}</span>
                    </div>
                    <div className="border-as-stroke border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-as-primary font-semibold">Total Amount</span>
                        <span className="text-as-primary text-2xl font-bold">${finalAmount.toFixed(2)} USD</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Simplified Payment Form */}
        <div className="bg-as-on-surface-1 w-full rounded-2xl p-6">
          <div className="text-as-primary mb-4 text-lg font-semibold">Payment Details</div>
          <PaymentElement options={stripeElementOptions} />
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
          disabled={!stripe || !elements || loading}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-as-on-surface-1 relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6">
            {/* Modal header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-as-primary text-xl font-semibold">How it works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
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

// Add tooltip component
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)} className="cursor-help">
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-80 -translate-x-1/2">
          <div className="bg-as-on-surface-1 border-as-stroke text-as-primary rounded-lg border p-3 text-sm shadow-lg">
            <div className="whitespace-pre-line">{content}</div>
            <div className="absolute left-1/2 top-full -translate-x-1/2">
              <div className="border-t-as-on-surface-1 border-l-4 border-r-4 border-t-4 border-transparent"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
