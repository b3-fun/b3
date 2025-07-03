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

async function fetchTokenPrice(contractAddress: string, chainId: number, vsCurrency: string = "usd") {
  const platformId = getPlatformId(chainId as ChainId);
  const response = await fetch(
    `https://pro-api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddress}&vs_currencies=${vsCurrency}`,
    {
      headers: {
        accept: "application/json",
        "x-cg-pro-api-key": process.env.COINGECKO_API_KEY as string
      }
    }
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

export function useTokenPrice({
  contractAddress,
  chainId = 8453, // Default to Base
  vsCurrency = "usd",
  refreshInterval = 30000,
  queryOptions = {}
}: UseTokenPriceProps) {
  const {
    data: price = 0,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["tokenPrice", contractAddress, chainId, vsCurrency],
    queryFn: () => fetchTokenPrice(contractAddress, chainId, vsCurrency),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions
  });

  return {
    price,
    isLoading,
    error,
    refetch
  };
}

export default useTokenPrice;
