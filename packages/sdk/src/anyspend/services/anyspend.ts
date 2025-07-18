import { ANYSPEND_MAINNET_BASE_URL, ANYSPEND_TESTNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import { OnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { getNativeToken, isNativeToken } from "@b3dotfun/sdk/anyspend/utils";
import invariant from "invariant";
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
import { components } from "../types/api";

// Service functions
export const anyspendService = {
  getTokenList: async (
    isMainnet: boolean,
    chainId: number,
    query: string,
  ): Promise<components["schemas"]["Token"][]> => {
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/chains/${chainId}/tokens?limit=100&term=${query}`,
    );
    const body: GetTokenListResponse = await response.json();
    invariant(response.status === 200, `Failed to fetch token list for chain ${chainId}`);
    return body.data;
  },

  getToken: async (
    isMainnet: boolean,
    chainId: number,
    tokenAddress: string,
  ): Promise<components["schemas"]["Token"]> => {
    if (isNativeToken(tokenAddress)) {
      return getNativeToken(chainId);
    }
    const tokenList = await anyspendService.getTokenList(isMainnet, chainId, tokenAddress);
    const token = tokenList.find(
      (t: components["schemas"]["Token"]) => t.address.toLowerCase() === tokenAddress.toLowerCase(),
    );
    if (!token) {
      throw new Error(`Token ${tokenAddress} not found on chain ${chainId}`);
    }
    return token;
  },

  getQuote: async (isMainnet: boolean, req: GetQuoteRequest): Promise<GetQuoteResponse> => {
    const url = `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/orders/quote`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });
    const data: GetQuoteResponse = await response.json();
    if (response.status !== 200) throw new Error(data.message);
    return data;
  },

  // Order related
  createOrder: async ({
    isMainnet,
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
  }: {
    isMainnet: boolean;
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
  }) => {
    const response = await fetch(`${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      }),
    });
    const data: CreateOrderResponse = await response.json();
    invariant(response.status === 200, data.message);
    return data;
  },

  getOrderAndTransactions: async (isMainnet: boolean, orderId: string | undefined): Promise<GetOrderAndTxsResponse> => {
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/orders/${orderId}`,
    );
    const data: GetOrderAndTxsResponse = await response.json();
    return data;
  },

  getOrderHistory: async (
    isMainnet: boolean,
    creatorAddress: string | undefined,
    limit: number = 100,
    offset: number = 0,
  ): Promise<GetOrderHistoryResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (creatorAddress) {
      params.append("creatorAddress", creatorAddress);
    }
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/orders?${params.toString()}`,
    );
    const data: GetOrderHistoryResponse = await response.json();
    return data;
  },

  getCoinbaseOnrampOptions: async (isMainnet: boolean, country: string): Promise<GetCoinbaseOnrampOptionsResponse> => {
    const params = new URLSearchParams({
      country,
    });
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/onramp/coinbase/options?${params.toString()}`,
    );
    const data: GetCoinbaseOnrampOptionsResponse = await response.json();
    return data;
  },

  checkStripeSupport: async (
    isMainnet: boolean,
    ipAddress: string,
    usdAmount?: string,
  ): Promise<{ stripeOnramp: boolean; stripeWeb2: boolean }> => {
    const params = new URLSearchParams({
      ipAddress,
      usdAmount: usdAmount || "",
    });
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/onramp/stripe/supported?${params.toString()}`,
    );
    const data: GetStripeSupportedResponse = await response.json();
    invariant(response.status === 200, "Failed to check Stripe support");
    return data.data;
  },

  getStripeClientSecret: async (isMainnet: boolean, paymentIntentId: string): Promise<string | null> => {
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/stripe/clientSecret?paymentIntentId=${paymentIntentId}`,
    );
    const data: GetStripeClientSecret = await response.json();
    invariant(response.status === 200, "Failed to get Stripe client secret");
    return data.data;
  },
};
