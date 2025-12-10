import { lazy, Suspense } from "react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import PaymentOneClick from "./PaymentOneClick";

// Lazy load Stripe component to prevent loadStripe() from running at module level
// This prevents EIP-6963 wallet detection events when Stripe is not used
const PaymentStripeWeb2 = lazy(() => import("./PaymentStripeWeb2"));

interface PaymentVendorUIProps {
  order: components["schemas"]["Order"];
  dstTokenSymbol: string;
}

function StripeLoadingFallback() {
  return (
    <div className="relative my-8 flex w-full flex-1 flex-col items-center justify-center">
      <div className="bg-as-on-surface-1 flex w-full flex-col items-center justify-center gap-4 rounded-2xl p-8">
        <div className="bg-as-brand/20 flex h-16 w-16 items-center justify-center rounded-full">
          <div className="text-as-brand h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
        <div className="text-as-primary/70 text-center">
          <div className="text-lg font-medium">Loading payment</div>
          <div className="text-as-primary/50 mt-2 text-sm">Initializing secure payment form...</div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentVendorUI({ order, dstTokenSymbol }: PaymentVendorUIProps) {
  const vendor = order.onrampMetadata?.vendor;

  // Handle one-click payment flows (Coinbase, Stripe redirect)
  if (order.oneClickBuyUrl) {
    return <PaymentOneClick order={order} dstTokenSymbol={dstTokenSymbol} />;
  }

  // Handle Stripe Web2 payment flow
  if (vendor === "stripe-web2" && order.stripePaymentIntentId) {
    return (
      <Suspense fallback={<StripeLoadingFallback />}>
        <PaymentStripeWeb2 order={order} stripePaymentIntentId={order.stripePaymentIntentId} />
      </Suspense>
    );
  }

  // Return null for unsupported vendors
  return null;
}
