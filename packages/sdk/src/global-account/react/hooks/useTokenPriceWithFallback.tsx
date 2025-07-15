"use client";

import { type ChainId } from "@b3dotfun/sdk/shared/constants/chains/chainPlatformMap";

import { useExchangeRate } from "./useExchangeRate";
import { useTokenPrice } from "./useTokenPrice";

interface UseTokenPriceWithFallbackProps {
  contractAddress: string;
  symbol?: string;
  chainId?: ChainId;
  vsCurrency?: string;
  refreshInterval?: number;
}

export function useTokenPriceWithFallback({
  contractAddress,
  symbol,
  chainId = 8453, // Default to Base
  vsCurrency = "usd",
  refreshInterval = 30000,
}: UseTokenPriceWithFallbackProps) {
  // Try to get the exchange rate using the symbol if provided
  const {
    rate: exchangeRate,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
  } = useExchangeRate({
    baseCurrency: symbol || "",
    quoteCurrency: vsCurrency,
    refreshInterval,
  });

  // Only call useTokenPrice if exchange rate is not available
  const {
    price: tokenPrice,
    isLoading: isTokenPriceLoading,
    error: tokenPriceError,
  } = useTokenPrice({
    contractAddress,
    chainId,
    vsCurrency,
    refreshInterval,
    queryOptions: {
      enabled: !isExchangeRateLoading && !exchangeRate && !exchangeRateError,
    },
  });

  // Determine which price to use
  const price = exchangeRate || tokenPrice;
  const isLoading = isExchangeRateLoading || (isTokenPriceLoading && !exchangeRate);
  const error = exchangeRateError || (!exchangeRate && tokenPriceError);

  return {
    price,
    isLoading,
    error,
  };
}
