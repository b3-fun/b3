import { z } from "zod";

export enum OnrampVendor {
  Coinbase = "coinbase",
  Stripe = "stripe",
  StripeWeb2 = "stripe-web2"
}

export const zOnrampMetadata = z.object({
  country: z.string(),
  vendor: z.nativeEnum(OnrampVendor),
  paymentMethod: z.string(),
  ipAddress: z.string().ip("Invalid IP address").optional(),
  redirectUrl: z.string()
});
