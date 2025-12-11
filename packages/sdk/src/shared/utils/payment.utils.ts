import { getStripePublishableKey, VENDOR_DISPLAY_NAMES } from "@b3dotfun/sdk/anyspend/constants";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { loadStripe } from "@stripe/stripe-js";

// Cache Stripe promises per publishable key (supports multiple partners)
const stripePromiseCache: Map<string, ReturnType<typeof loadStripe>> = new Map();

/**
 * Get or create a Stripe promise for the given publishable key.
 * @param stripePublishableKey - Partner-specific Stripe publishable key from B3Provider
 */
export function getStripePromise(stripePublishableKey?: string | null) {
  const publishableKey = getStripePublishableKey(stripePublishableKey);

  let cached = stripePromiseCache.get(publishableKey);
  if (!cached) {
    cached = loadStripe(publishableKey);
    stripePromiseCache.set(publishableKey, cached);
  }
  return cached;
}

export function getVendorDisplayName(vendor?: components["schemas"]["OnrampMetadata"]["vendor"]): string {
  switch (vendor) {
    case "coinbase":
      return VENDOR_DISPLAY_NAMES.coinbase;
    case "stripe":
    case "stripe-web2":
      return VENDOR_DISPLAY_NAMES.stripe;
    default:
      return VENDOR_DISPLAY_NAMES.unknown;
  }
}

export function getPaymentMethodDescription(vendor?: components["schemas"]["OnrampMetadata"]["vendor"]): string {
  switch (vendor) {
    case "stripe":
    case "stripe-web2":
      return "card, Apple Pay, Google Pay, and more";
    case "coinbase":
      return "debit card, or using your Coinbase account";
    default:
      return "supported payment method";
  }
}

export function formatStripeAmount(amount: number): string {
  return (amount / 100).toFixed(2);
}

export function generateReturnUrl(orderId: string): string {
  return `${window.location.origin}?orderId=${orderId}&waitingForDeposit=true`;
}
