import { z } from "zod";

const zNetwork = z.object({
  name: z.string(),
  displayName: z.string(),
  contractAddress: z.string(),
  chainId: z.string(),
});

const zPaymentLimit = z.object({
  id: z.string(),
  min: z.string(),
  max: z.string(),
});

const zPaymentCurrency = z.object({
  id: z.string(),
  limits: z.array(zPaymentLimit),
});

const zPurchaseCurrency = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  networks: z.array(zNetwork),
  iconUrl: z.string(),
});

// Main response schema
export const zGetCoinbaseOnrampOptionsResponse = z.object({
  paymentCurrencies: z.array(zPaymentCurrency),
  purchaseCurrencies: z.array(zPurchaseCurrency),
});
export type GetCoinbaseOnrampOptionsResponse = z.infer<typeof zGetCoinbaseOnrampOptionsResponse>;
