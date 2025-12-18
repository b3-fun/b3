import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { gasService, isGasOracleSupported } from "../../services/gas";
import type { GasPriceData } from "../../types/gas";

export interface UseGasPriceOptions {
  /** Refetch interval in ms (default: 10000 = 10s) */
  refetchInterval?: number;
  /** Whether to enable the query (default: true if chainId is supported) */
  enabled?: boolean;
}

export interface UseGasPriceResult {
  /** Gas price data */
  gasPrice: GasPriceData | undefined;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether there's an error */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Whether gas is currently spiking */
  isSpike: boolean;
  /** Refetch function */
  refetch: () => void;
}

/**
 * React hook to fetch current gas price for a chain.
 *
 * @param chainId - The chain ID to fetch gas price for
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * const { gasPrice, isSpike, isLoading } = useGasPrice(8453); // Base
 *
 * if (isSpike) {
 *   return <Warning>Gas prices are high: {gasPrice?.recommendation}</Warning>;
 * }
 * ```
 */
export function useGasPrice(chainId: number | undefined, options: UseGasPriceOptions = {}): UseGasPriceResult {
  const { refetchInterval = 10000, enabled } = options;

  const isSupported = chainId !== undefined && isGasOracleSupported(chainId);
  const queryEnabled = enabled ?? isSupported;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["gasPrice", chainId],
    queryFn: () => gasService.fetch(chainId!),
    enabled: queryEnabled && chainId !== undefined,
    refetchInterval,
    staleTime: 5000, // Consider data fresh for 5s
    retry: 2,
    refetchOnWindowFocus: true,
  });

  return useMemo(
    () => ({
      gasPrice: data,
      isLoading,
      isError,
      error: error as Error | null,
      isSpike: data?.isSpike ?? false,
      refetch,
    }),
    [data, isLoading, isError, error, refetch],
  );
}
