"use client";

import { Token } from "@b3dotfun/sdk/anyspend";
import { getCoingeckoChainInfo } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

interface UseTokenFromUrlOptions {
  /**
   * Default token to use when URL params are not available
   */
  defaultToken: Token;

  /**
   * The URL parameter prefix to look for (e.g., "from" or "to")
   */
  prefix: string;
}

interface TokenInfo {
  data: {
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      image_url: string;
    };
  };
}

async function fetchTokenInfo(network: string, address: string): Promise<TokenInfo> {
  const response = await fetch("https://api.b3.fun/tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Method": "getCoinGeckoTokenInfo"
    },
    body: JSON.stringify({
      network,
      address
    })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch token info");
  }

  return response.json();
}

/**
 * Hook to parse token data from URL parameters and fetch additional token info.
 * Looks for parameters: [prefix]Currency
 */
export function useTokenFromUrl({ defaultToken, prefix }: UseTokenFromUrlOptions): Token {
  const searchParams = useSearchParams();

  // Get parameters from URL
  const currencyParam = searchParams?.get(`${prefix}Currency`);
  const chainIdParam = searchParams?.get(`${prefix}ChainId`);

  // Determine if we should fetch token info
  const shouldFetchToken = Boolean(
    currencyParam && chainIdParam && currencyParam.toLowerCase() !== defaultToken.address.toLowerCase()
  );

  // Determine network based on chainId
  const network = chainIdParam ? getCoingeckoChainInfo(Number(chainIdParam)).coingecko_id : "";

  const { data: tokenInfo, isError } = useQuery({
    queryKey: ["tokenInfo", network, currencyParam],
    queryFn: () => fetchTokenInfo(network, currencyParam!),
    enabled: shouldFetchToken,
    staleTime: Infinity,
    gcTime: Infinity
  });

  // Return default token if no params or same as default
  if (!shouldFetchToken) {
    return defaultToken;
  }

  // Return basic token info if API call fails or while loading
  if (isError || !tokenInfo) {
    return {
      ...defaultToken,
      address: currencyParam!,
      chainId: Number(chainIdParam)
    };
  }

  // Return enhanced token with API data
  return {
    address: tokenInfo.data.attributes.address,
    chainId: Number(chainIdParam),
    name: tokenInfo.data.attributes.name,
    symbol: tokenInfo.data.attributes.symbol,
    decimals: tokenInfo.data.attributes.decimals,
    metadata: {
      logoURI: tokenInfo.data.attributes.image_url
    }
  };
}
