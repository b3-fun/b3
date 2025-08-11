import { Candle, ChartTokenInfo, Resolution } from "@/types";
import {
  APPEND_CANDLE_LIMIT,
  DEFAULT_API_ENDPOINT_BONDKIT,
  DEFAULT_CANDLE_LIMIT,
  DEFAULT_CHAIN_ID,
  MAX_LIMIT,
  RESOLUTION_TO_SECONDS,
} from "@/types/constants";
import { useCallback, useEffect, useState } from "react";

export function useGetOHLCVData(
  tokenAddress: string,
  resolution: Resolution = "1D",
  chainId: number = DEFAULT_CHAIN_ID,
  apiEndpoint: string = DEFAULT_API_ENDPOINT_BONDKIT
) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<ChartTokenInfo>({
    name: "Loading...",
    symbol: "...",
    contractAddress: tokenAddress,
    chainId: chainId,
  });

  const fetchOHLCVData = useCallback(
    async (toTimestamp?: number, appendData = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const limit = appendData ? APPEND_CANDLE_LIMIT : DEFAULT_CANDLE_LIMIT;
        const to = toTimestamp || Math.floor(Date.now() / 1000); // Convert to seconds
        const resolutionSeconds = RESOLUTION_TO_SECONDS[resolution];
        const from = to - resolutionSeconds * limit; // Calculate from based on resolution and limit

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-service-method": "getOHLCVData",
          },
          body: JSON.stringify({
            contractAddress: tokenAddress,
            chainId: chainId,
            resolution: resolution,
            from: from,
            to: to,
            limit: limit,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.candles || data.candles.length === 0) {
          if (!appendData) setCandles([]);
          return;
        }

        const newCandles: Candle[] = data.candles.map((candle: any) => ({
          timestamp: Math.floor(candle.timestamp / 1000), // Ensure timestamp is in seconds
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        setCandles((prev) => {
          if (appendData) {
            const combined = [...newCandles, ...prev];
            const uniqueCandles = combined.filter(
              (candle, index, arr) =>
                arr.findIndex((c) => c.timestamp === candle.timestamp) === index
            );
            return uniqueCandles.sort((a, b) => a.timestamp - b.timestamp);
          } else {
            return newCandles.sort((a, b) => a.timestamp - b.timestamp);
          }
        });

        if (data.tokenInfo) {
          setTokenInfo(data.tokenInfo);
        }

        setTotalLoaded((prev) =>
          appendData ? prev + newCandles.length : newCandles.length
        );
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch chart data"
        );
        if (!appendData) {
          setCandles([]);
          setTotalLoaded(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [tokenAddress, chainId, resolution, apiEndpoint]
  );

  const loadInitialData = useCallback(async () => {
    await fetchOHLCVData();
  }, [fetchOHLCVData]);

  const loadMoreData = useCallback(async () => {
    if (isLoading || totalLoaded >= MAX_LIMIT || candles.length === 0) return;

    const oldestCandle = candles[0];
    const endTime = oldestCandle.timestamp; // Already in seconds

    await fetchOHLCVData(endTime, true);
  }, [fetchOHLCVData, isLoading, totalLoaded, candles]);

  useEffect(() => {
    setCandles([]);
    setTotalLoaded(0);
    loadInitialData();
  }, [resolution, loadInitialData]);

  return {
    candles,
    isLoading,
    totalLoaded,
    tokenInfo,
    loadMoreData,
    maxReached: totalLoaded >= MAX_LIMIT,
    error,
  };
}
