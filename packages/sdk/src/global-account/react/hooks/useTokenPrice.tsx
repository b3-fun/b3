"use client";

import { getPlatformId, type ChainId } from "@b3dotfun/sdk/shared/constants/chains/chainPlatformMap";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

interface UseTokenPriceProps {
  contractAddress: string;
  chainId?: ChainId;
  vsCurrency?: string;
  refreshInterval?: number;
  queryOptions?: Omit<
    UseQueryOptions<number, Error>,
    "queryKey" | "queryFn" | "refetchInterval" | "staleTime" | "retry" | "retryDelay"
  >;
}

interface TokenPriceResponse {
  [contractAddress: string]: {
    [currency: string]: number;
  };
}

interface TokenPriceWithChangeResponse {
  [contractAddress: string]: {
    [key: string]: number; // For both currency prices and price change keys like "usd_24h_change"
  };
}

interface NativeTokenPriceResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      token_prices: {
        [address: string]: string;
      };
    };
  };
}

export async function fetchNativeTokenPriceUsd(contractAddress: string, network: string) {
  const response = await fetch(
    `https://coingecko-api.sean-430.workers.dev?localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}&url=https://pro-api.coingecko.com/api/v3/onchain/simple/networks/${network}/token_price/${contractAddress}`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch native token price: ${response.status} ${response.statusText}`);
  }

  const data: NativeTokenPriceResponse = await response.json();

  // Find the price using case-insensitive address comparison
  const prices = data.data?.attributes?.token_prices || {};
  const price = Object.entries(prices).find(
    ([address]) => address.toLowerCase() === contractAddress.toLowerCase(),
  )?.[1];

  if (!price) {
    throw new Error(`No price data found for native token: ${contractAddress}`);
  }

  // Convert string price to number
  const numericPrice = Number(price);
  if (isNaN(numericPrice)) {
    throw new Error(`Invalid price data for native token: ${contractAddress}`);
  }

  return numericPrice;
}

export async function fetchNativeTokenPriceWithChange(contractAddress: string, network: string) {
  // For ETH, use the regular simple price API instead of on-chain API to get price changes
  const coinId = network === "eth" ? "ethereum" : network;

  const response = await fetch(
    `https://coingecko-api.sean-430.workers.dev?localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}&url=https://pro-api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch native token price with change: ${response.status} ${response.statusText}`);
  }

  interface SimpleTokenPriceWithChangeResponse {
    [coinId: string]: {
      usd: number;
      usd_24h_change: number;
    };
  }

  const data: SimpleTokenPriceWithChangeResponse = await response.json();

  if (!data[coinId]) {
    throw new Error(`No price data found for coin: ${coinId}`);
  }

  const price = data[coinId].usd;
  const priceChange = data[coinId].usd_24h_change;

  if (typeof price !== "number") {
    throw new Error(`Invalid price data for coin: ${coinId}`);
  }

  return {
    price,
    priceChange24h: priceChange || null,
  };
}

export async function fetchTokenPrice(contractAddress: string, chainId: number, vsCurrency = "usd") {
  const platformId = getPlatformId(chainId as ChainId);

  const response = await fetch(
    `https://coingecko-api.sean-430.workers.dev?localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}&url=https://pro-api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddress}&vs_currencies=${vsCurrency}`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token price: ${response.status} ${response.statusText}`);
  }

  const data: TokenPriceResponse = await response.json();

  // Check if the contract address exists in the response
  if (!data[contractAddress]) {
    throw new Error(`No price data found for contract address: ${contractAddress}`);
  }

  // Check if the requested currency exists in the response
  if (typeof data[contractAddress][vsCurrency] !== "number") {
    throw new Error(`No price data found for currency: ${vsCurrency}`);
  }

  // Return the price with proper type checking
  return data[contractAddress][vsCurrency] as number;
}

export async function fetchTokenPriceWithChange(contractAddress: string, chainId: number, vsCurrency = "usd") {
  const platformId = getPlatformId(chainId as ChainId);

  const response = await fetch(
    `https://coingecko-api.sean-430.workers.dev?localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}&url=https://pro-api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddress}&vs_currencies=${vsCurrency}&include_24hr_change=true`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token price with change: ${response.status} ${response.statusText}`);
  }

  const data: TokenPriceWithChangeResponse = await response.json();

  // Check if the contract address exists in the response
  if (!data[contractAddress]) {
    throw new Error(`No price data found for contract address: ${contractAddress}`);
  }

  // Check if the requested currency exists in the response
  if (typeof data[contractAddress][vsCurrency] !== "number") {
    throw new Error(`No price data found for currency: ${vsCurrency}`);
  }

  // Get the price change key (e.g., "usd_24h_change")
  const priceChangeKey = `${vsCurrency}_24h_change` as keyof (typeof data)[typeof contractAddress];
  const priceChange = data[contractAddress][priceChangeKey] as number | undefined;

  // Return the price and price change with proper type checking
  return {
    price: data[contractAddress][vsCurrency] as number,
    priceChange24h: priceChange || null,
  };
}

export function useTokenPrice({
  contractAddress,
  chainId = 8453, // Default to Base
  vsCurrency = "usd",
  refreshInterval = 30000,
  queryOptions = {},
}: UseTokenPriceProps) {
  const {
    data: price = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tokenPrice", contractAddress, chainId, vsCurrency],
    queryFn: () => fetchTokenPrice(contractAddress, chainId, vsCurrency),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });

  return {
    price,
    isLoading,
    error,
    refetch,
  };
}

export default useTokenPrice;
