"use client";

import { useQuery } from "@tanstack/react-query";

interface UseExchangeRateProps {
  baseCurrency: string;
  quoteCurrency: string;
  refreshInterval?: number;
}

async function fetchExchangeRate(baseCurrency: string, quoteCurrency: string) {
  const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${baseCurrency}`);
  if (!response.ok) {
    throw new Error("Failed to fetch exchange rate");
  }
  const data = await response.json();
  return parseFloat(data.data.rates[quoteCurrency]);
}

export function useExchangeRate({ baseCurrency, quoteCurrency, refreshInterval = 30000 }: UseExchangeRateProps) {
  const {
    data: rate = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["exchangeRate", baseCurrency, quoteCurrency],
    queryFn: () => fetchExchangeRate(baseCurrency, quoteCurrency),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    rate,
    isLoading,
    error,
    refetch,
  };
}

export default useExchangeRate;
