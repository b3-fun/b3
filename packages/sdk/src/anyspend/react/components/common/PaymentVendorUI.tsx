import { components } from "@b3dotfun/sdk/anyspend/types/api";
import PaymentOneClick from "./PaymentOneClick";
import PaymentStripeWeb2 from "./PaymentStripeWeb2";

interface PaymentVendorUIProps {
  order: components["schemas"]["Order"];
  dstTokenSymbol: string;
}

export default function PaymentVendorUI({ order, dstTokenSymbol }: PaymentVendorUIProps) {
  const vendor = order.onrampMetadata?.vendor;

  // Handle one-click payment flows (Coinbase, Stripe redirect)
  if (order.oneClickBuyUrl) {
    return <PaymentOneClick order={order} dstTokenSymbol={dstTokenSymbol} />;
  }

  // Handle Stripe Web2 payment flow
  if (vendor === "stripe-web2") {
    return <PaymentStripeWeb2 order={order} />;
  }

  // Return null for unsupported vendors
  return null;
}
