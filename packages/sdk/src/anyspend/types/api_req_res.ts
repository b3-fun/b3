import { paths } from "./api";

export type GetOrderAndTxsResponse =
  paths["/orders/{orderId}"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetQuoteRequest = paths["/orders/quote"]["post"]["requestBody"]["content"]["application/json"];
// Base type from auto-generated API
type BaseGetQuoteResponse = paths["/orders/quote"]["post"]["responses"]["200"]["content"]["application/json"];

// Extended type with additional points fields
export type GetQuoteResponse = BaseGetQuoteResponse & {
  data: BaseGetQuoteResponse["data"] & {
    pointsAmount?: number;
    pointsMultiplier?: number;
  };
};
export type GetCoinbaseOnrampOptionsResponse =
  paths["/onramp/coinbase/options"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetOrderHistoryResponse = paths["/orders"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetTokenListResponse =
  paths["/chains/{chainId}/tokens"]["get"]["responses"]["200"]["content"]["application/json"];
export type CreateOrderResponse = paths["/orders"]["post"]["responses"]["200"]["content"]["application/json"];
export type GetStripeSupportedResponse =
  paths["/onramp/stripe/supported"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetStripeClientSecret =
  paths["/stripe/clientSecret"]["get"]["responses"]["200"]["content"]["application/json"];
