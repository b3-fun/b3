import { ANYSPEND_MAINNET_BASE_URL, ANYSPEND_TESTNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import { OnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import {
  GetOrderAndTxsResponse,
  GetQuoteRequest,
  GetQuoteResponse,
  Token,
  zGetCoinbaseOnrampOptionsResponse,
  zGetOrderAndTxsResponse,
  zGetOrderHistoryResponse,
  zGetTokenListResponse,
} from "@b3dotfun/sdk/anyspend/types";
import { getNativeToken, isNativeToken } from "@b3dotfun/sdk/anyspend/utils";
import invariant from "invariant";

// Service functions
export const anyspendService = {
  getTokenList: async (isMainnet: boolean, chainId: number, query: string): Promise<Token[]> => {
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/chains/${chainId}/tokens?limit=100&term=${query}`,
    );
    const data = await response.json();
    invariant(response.status === 200, `Failed to fetch token list for chain ${chainId}`);
    const parsedData = zGetTokenListResponse.parse(data);
    return parsedData.data;
  },

  getToken: async (isMainnet: boolean, chainId: number, tokenAddress: string): Promise<Token> => {
    if (isNativeToken(tokenAddress)) {
      return getNativeToken(chainId);
    }
    const tokenList = await anyspendService.getTokenList(isMainnet, chainId, tokenAddress);
    const token = tokenList.find((t: Token) => t.address.toLowerCase() === tokenAddress.toLowerCase());
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
    const data = await response.json();
    if (response.status !== 200) throw new Error(data.message);
    return data as GetQuoteResponse;
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
    const data = await response.json();
    invariant(data.statusCode === 200, data.message);
    return data;
  },

  getOrderAndTransactions: async (isMainnet: boolean, orderId: string | undefined): Promise<GetOrderAndTxsResponse> => {
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/orders/${orderId}`,
    );
    const responseData = await response.json();
    const data = zGetOrderAndTxsResponse.parse(responseData);

    return data;
  },

  getOrderHistory: async (
    isMainnet: boolean,
    creatorAddress: string | undefined,
    limit: number = 100,
    offset: number = 0,
  ) => {
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
    const responseData = await response.json();
    const data = zGetOrderHistoryResponse.parse(responseData);
    return data;
  },

  getCoinbaseOnrampOptions: async (isMainnet: boolean, country: string) => {
    const params = new URLSearchParams({
      country,
    });
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/onramp/coinbase/options?${params.toString()}`,
    );
    const data = await response.json();
    const parsedData = zGetCoinbaseOnrampOptionsResponse.parse(data.data);
    return parsedData;
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
    const data = await response.json();
    invariant(response.status === 200, "Failed to check Stripe support");
    return data.data;
  },

  getStripeClientSecret: async (isMainnet: boolean, paymentIntentId: string): Promise<string | null> => {
    const response = await fetch(
      `${isMainnet ? ANYSPEND_MAINNET_BASE_URL : ANYSPEND_TESTNET_BASE_URL}/stripe/clientSecret?paymentIntentId=${paymentIntentId}`,
    );
    const data = await response.json();
    return data.data;
  },
};
