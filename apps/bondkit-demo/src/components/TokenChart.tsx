"use client";

import { LoadingSpinner } from "@/components/chart/LoadingSpinner";
import { TimeFrameSelector } from "@/components/chart/TimeFrameSelector";
import { TokenHeader } from "@/components/chart/TokenHeader";
import TradingView from "@/components/trading/TradingView";
import { useGetOHLCVData } from "@/hooks/useChartData";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import {
  CandleData,
  TimeFrame,
  TokenChartProps,
  TokenInfo,
  VolumeData,
} from "@/types";
import {
  DEFAULT_API_ENDPOINT_BONDKIT,
  DEFAULT_CHAIN_ID,
  TIME_FRAME_TO_RESOLUTION,
} from "@/types/constants";
import {
  transformToCandleData,
  transformToVolumeData,
} from "@/utils/chartData";
import { useEffect, useState } from "react";

export function TokenChart({
  tokenAddress,
  chainId = DEFAULT_CHAIN_ID,
  apiEndpoint = DEFAULT_API_ENDPOINT_BONDKIT,
}: TokenChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1h");
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Convert timeFrame to resolution
  const resolution = TIME_FRAME_TO_RESOLUTION[timeFrame];

  // Use real API hooks
  const {
    transactions,
    isLoading: txLoading,
    error: txError,
    totalLoaded: txTotalLoaded,
    loadMoreData: loadMoreTx,
    refresh: refreshTx,
  } = useTransactionHistory(tokenAddress, chainId, apiEndpoint);

  const {
    candles,
    isLoading: candleLoading,
    error: candleError,
    tokenInfo: chartTokenInfo,
    totalLoaded: candleTotalLoaded,
    loadMoreData: loadMoreCandles,
    maxReached: candleMaxReached,
  } = useGetOHLCVData(tokenAddress, resolution, chainId, apiEndpoint);

  const isLoading = txLoading || candleLoading;
  const hasError = txError || candleError;

  useEffect(() => {
    if (transactions.length > 0) {
      // Transform transactions to chart data
      const transformedTransactions = transactions.map((tx) => ({
        ...tx,
        _id: tx.txHash,
        bondkitTokenId: tokenAddress,
        value: tx.price * parseFloat(tx.amount),
        createdAt: tx.timestamp,
        updatedAt: tx.timestamp,
        chainId: chainId,
        blockNumber: 0, // Not available in the original interface
      }));

      const chartCandles = transformToCandleData(
        transformedTransactions,
        timeFrame
      );
      const chartVolumes = transformToVolumeData(
        transformedTransactions,
        timeFrame
      );

      setCandleData(chartCandles);
      setVolumeData(chartVolumes);
      setLastUpdated(new Date());
    }
  }, [transactions, timeFrame, tokenAddress, chainId]);

  useEffect(() => {
    if (chartTokenInfo) {
      // Convert ChartTokenInfo to TokenInfo format
      const latestPrice = transactions.length > 0 ? transactions[0].price : 0;
      const previousPrice =
        transactions.length > 24 ? transactions[24].price : latestPrice;
      const change24h =
        previousPrice !== 0
          ? ((latestPrice - previousPrice) / previousPrice) * 100
          : 0;

      const volume24h = transactions
        .filter((tx) => tx.timestamp > Date.now() - 24 * 60 * 60 * 1000)
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      setTokenInfo({
        name: chartTokenInfo.name,
        symbol: chartTokenInfo.symbol,
        currentPrice: latestPrice,
        change24h: change24h,
        volume24h: volume24h,
      });
    }
  }, [chartTokenInfo, transactions]);

  const handleRefresh = () => {
    refreshTx();
  };

  if (isLoading && !tokenInfo) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-center h-32">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-400">Loading token data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Header */}
      {tokenInfo && <TokenHeader tokenInfo={tokenInfo} />}

      {/* Chart Controls */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <TimeFrameSelector
              selectedTimeFrame={timeFrame}
              onTimeFrameChange={setTimeFrame}
            />

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>📊</span>
              <span>Live Data</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="text-blue-400">
                {txTotalLoaded} transactions
              </span>
              <span className="text-purple-400">
                {candleTotalLoaded} candles
              </span>
              {hasError ? (
                <span className="text-red-400">API Error</span>
              ) : (
                <span className="text-green-400">Connected</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              <span className={`${isLoading ? "animate-spin" : ""}`}>🔄</span>
              Refresh
            </button>

            <button
              onClick={loadMoreCandles}
              disabled={candleLoading || candleMaxReached}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              {candleLoading
                ? "Loading..."
                : candleMaxReached
                ? "Max"
                : "Load More"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {hasError && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="space-y-2">
            {txError && (
              <p className="text-red-300 text-sm">
                <span className="font-medium">Transaction Error:</span>{" "}
                {txError}
              </p>
            )}
            {candleError && (
              <p className="text-red-300 text-sm">
                <span className="font-medium">Chart Error:</span> {candleError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Professional TradingView Chart */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading && !tokenInfo ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <TradingView
            tokenAddress={tokenAddress}
            tokenSymbol={tokenInfo?.symbol}
            className="w-full"
          />
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Total Candles</p>
            <p className="text-2xl font-bold text-white">{candleData.length}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Time Frame</p>
            <p className="text-2xl font-bold text-white uppercase">
              {timeFrame}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Data Points</p>
            <p className="text-2xl font-bold text-white">{volumeData.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
