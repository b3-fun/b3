import { ANYSPEND_MAINNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import { OnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { getNativeToken, isNativeToken } from "@b3dotfun/sdk/anyspend/utils";
import app from "@b3dotfun/sdk/global-account/app";
import invariant from "invariant";
import { components } from "../types/api";
import {
  CreateOrderResponse,
  GetCoinbaseOnrampOptionsResponse,
  GetOrderAndTxsResponse,
  GetOrderHistoryResponse,
  GetQuoteRequest,
  GetQuoteResponse,
  GetStripeClientSecret,
  GetStripeSupportedResponse,
  GetTokenListResponse,
} from "../types/api_req_res";
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  GetCheckoutSessionResponse,
} from "../types/checkoutSession";
import { VisitorData } from "../types/fingerprint";

// Service functions
export const anyspendService = {
  getTokenList: async (chainId: number, query: string): Promise<components["schemas"]["Token"][]> => {
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/chains/${chainId}/tokens?limit=100&term=${query}`);
    const body: GetTokenListResponse = await response.json();
    invariant(response.status === 200, `Failed to fetch token list for chain ${chainId}`);
    return body.data;
  },

  getToken: async (chainId: number, tokenAddress: string): Promise<components["schemas"]["Token"]> => {
    if (isNativeToken(tokenAddress)) {
      return getNativeToken(chainId);
    }
    const tokenList = await anyspendService.getTokenList(chainId, tokenAddress);
    const token = tokenList.find(
      (t: components["schemas"]["Token"]) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
    );
    if (!token) {
      throw new Error(`Token ${tokenAddress} not found on chain ${chainId}`);
    }
    return token;
  },

  getQuote: async (req: GetQuoteRequest, partnerId?: string): Promise<GetQuoteResponse> => {
    const url = `${ANYSPEND_MAINNET_BASE_URL}/orders/quote`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...req, partnerId }),
    });
    const data: GetQuoteResponse = await response.json();
    if (response.status !== 200) throw new Error(data.message);
    return data;
  },

  // Order related
  createOrder: async ({
    recipientAddress,
    type,
    srcChain,
    dstChain,
    srcTokenAddress,
    dstTokenAddress,
    srcAmount,
    payload,
    onramp,
    metadata,
    creatorAddress,
    partnerId,
    clientReferenceId,
    visitorData,
  }: {
    recipientAddress: string;
    type: string;
    srcChain: number;
    dstChain: number;
    srcTokenAddress: string;
    dstTokenAddress: string;
    srcAmount: string;
    payload: Record<string, any>;
    onramp?: OnrampOptions;
    metadata: Record<string, any>;
    creatorAddress?: string;
    partnerId?: string;
    clientReferenceId?: string;
    visitorData?: VisitorData;
  }) => {
    const accessToken = await app.authentication.getAccessToken();
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(visitorData?.requestId && { "X-Fingerprint-Request-Id": visitorData.requestId }),
        ...(visitorData?.visitorId && { "X-Fingerprint-Visitor-Id": visitorData.visitorId }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        recipientAddress,
        type,
        srcChain,
        dstChain,
        srcTokenAddress,
        dstTokenAddress,
        srcAmount,
        payload,
        onramp,
        metadata,
        creatorAddress,
        partnerId,
        ...(clientReferenceId && { clientReferenceId }),
      }),
    });
    const data: CreateOrderResponse = await response.json();
    invariant(response.status === 200, data.message);
    return data;
  },

  getOrderAndTransactions: async (orderId: string | undefined): Promise<GetOrderAndTxsResponse> => {
    invariant(orderId, "orderId is required");
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/orders/${orderId}`);
    const data: GetOrderAndTxsResponse = await response.json();
    return data;
  },

  getOrderHistory: async (
    creatorAddress: string | undefined,
    limit = 100,
    offset = 0,
  ): Promise<GetOrderHistoryResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (creatorAddress) {
      params.append("creatorAddress", creatorAddress);
    }
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/orders?${params.toString()}`);
    const data: GetOrderHistoryResponse = await response.json();
    return data;
  },

  getCoinbaseOnrampOptions: async (
    country: string | undefined,
    visitorData?: VisitorData,
  ): Promise<GetCoinbaseOnrampOptionsResponse> => {
    invariant(country, "country is required");
    const params = new URLSearchParams({
      country,
      // include fingerprintId and requestId in the query params
      ...(visitorData?.requestId && { requestId: visitorData.requestId }),
      ...(visitorData?.visitorId && { fingerprintId: visitorData.visitorId }),
    });
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/onramp/coinbase/options?${params.toString()}`);
    const data: GetCoinbaseOnrampOptionsResponse = await response.json();
    return data;
  },

  checkStripeSupport: async (
    usdAmount?: string,
    visitorData?: VisitorData,
  ): Promise<{ stripeOnramp: boolean; stripeWeb2: components["schemas"]["StripeWeb2Support"] }> => {
    const params = new URLSearchParams({
      usdAmount: usdAmount || "",
    });
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/onramp/stripe/supported?${params.toString()}`, {
      headers: {
        ...(visitorData?.requestId && { "X-Fingerprint-Request-Id": visitorData.requestId }),
        ...(visitorData?.visitorId && { "X-Fingerprint-Visitor-Id": visitorData.visitorId }),
      },
    });
    const data: GetStripeSupportedResponse = await response.json();
    invariant(response.status === 200, "Failed to check Stripe support");
    return data.data;
  },

  getStripeClientSecret: async (paymentIntentId: string): Promise<string | null> => {
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/stripe/clientSecret?paymentIntentId=${paymentIntentId}`);
    const data: GetStripeClientSecret = await response.json();
    invariant(response.status === 200, "Failed to get Stripe client secret");
    return data.data;
  },

  // Checkout Sessions
  createCheckoutSession: async (
    params: CreateCheckoutSessionRequest,
    options?: { partnerId?: string; accessToken?: string },
  ): Promise<CreateCheckoutSessionResponse> => {
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/checkout-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options?.partnerId && { "x-api-key": options.partnerId }),
        ...(options?.accessToken && { Authorization: `Bearer ${options.accessToken}` }),
      },
      body: JSON.stringify(params),
    });
    const data: CreateCheckoutSessionResponse = await response.json();
    invariant(response.status === 200, data.message);
    return data;
  },

  getCheckoutSession: async (sessionId: string): Promise<GetCheckoutSessionResponse> => {
    const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/checkout-sessions/${sessionId}`);
    const data: GetCheckoutSessionResponse = await response.json();
    return data;
  },
};
