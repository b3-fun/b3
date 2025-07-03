"use client";

import { Token } from "@b3dotfun/sdk/anyspend";
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

/**
 * Hook to parse token data from URL parameters.
 * Looks for parameters: [prefix]Currency
 */
export function useTokenFromUrl({ defaultToken, prefix }: UseTokenFromUrlOptions): Token {
  const searchParams = useSearchParams();

  if (!searchParams) {
    return defaultToken;
  }

  // Get parameters from URL
  const currencyParam = searchParams.get(`${prefix}Currency`);
  const chainIdParam = searchParams.get(`${prefix}ChainId`);
  if (!currencyParam || !chainIdParam) {
    return defaultToken;
  }

  // If the currency is the same as the default token, return that
  if (currencyParam.toLowerCase() === defaultToken.address.toLowerCase()) {
    return defaultToken;
  }

  return {
    ...defaultToken,
    address: currencyParam,
    chainId: Number(chainIdParam)
  };
}
