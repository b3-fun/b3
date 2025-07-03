import { OnrampVendor } from "@b3dotfun/sdk/anyspend";
import { VENDOR_DISPLAY_NAMES } from "@b3dotfun/sdk/anyspend/constants";

export function getVendorDisplayName(vendor?: OnrampVendor): string {
  switch (vendor) {
    case OnrampVendor.Coinbase:
      return VENDOR_DISPLAY_NAMES.coinbase;
    case OnrampVendor.Stripe:
    case OnrampVendor.StripeWeb2:
      return VENDOR_DISPLAY_NAMES.stripe;
    default:
      return VENDOR_DISPLAY_NAMES.unknown;
  }
}

export function getPaymentMethodDescription(vendor?: OnrampVendor): string {
  switch (vendor) {
    case OnrampVendor.Stripe:
    case OnrampVendor.StripeWeb2:
      return "card, Apple Pay, Google Pay, and more";
    case OnrampVendor.Coinbase:
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
