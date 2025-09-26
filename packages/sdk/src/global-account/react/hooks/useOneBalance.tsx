"use client";

import { fetchBalances } from "@b3dotfun/sdk/shared/utils/fetchBalances";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAccountWallet } from "./useAccountWallet";

export interface Asset {
  symbol: string;
  name: string;
}

export interface ChainBalance {
  chainId: number;
  balance: string;
  tokenDecimals: number;
}

export interface AssetBalance {
  symbol: string;
  name: string;
  totalBalance: string;
  chainBalances: ChainBalance[];
}

export const useOneBalance = (bypassCache = false) => {
  const account = useAccountWallet();
  const address = account?.address;
  const sprinterTestnet = false;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["balances", address, `testnet-${sprinterTestnet}`],
    queryFn: () => fetchBalances(address, sprinterTestnet),
    enabled: !!address,
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes (renamed from cacheTime in v5)
  });

  useEffect(() => {
    if (bypassCache) {
      refetch();
    }
  }, [bypassCache, refetch]);

  const aggregatedTokenBalances = useMemo(() => {
    const tokenBalances: { [key: string]: number } = {};
    data?.forEach(asset => {
      const totalBalance = asset.chainBalances.reduce((sum, balance) => {
        return sum + parseFloat(balance.balance) / Math.pow(10, balance.tokenDecimals);
      }, 0);
      tokenBalances[asset.symbol] = (tokenBalances[asset.symbol] || 0) + totalBalance;
    });
    return tokenBalances;
  }, [data]);

  const totalBalanceInEth = useMemo(() => {
    return (
      data?.reduce((total, asset) => {
        if (asset.symbol === "ETH" || asset.symbol === "WETH") {
          return total + parseFloat(asset.totalBalance);
        }
        // TODO: Add conversion logic for other assets to ETH equivalent
        return total;
      }, 0) || 0
    );
  }, [data]);

  const totalB3BalanceInEth = useMemo(() => {
    const b3Balance = data?.reduce((total, asset) => {
      if (asset.symbol === "ETH") {
        const b3ChainBalance = asset.chainBalances.find(balance => balance.chainId === 8333);
        if (b3ChainBalance) {
          return total + parseFloat(b3ChainBalance.balance) / Math.pow(10, b3ChainBalance.tokenDecimals);
        }
      }
      return total;
    }, 0);

    return b3Balance || 0;
  }, [data]);

  const formatNumber = (num: number) => {
    return num.toFixed(3);
  };

  return {
    totalBalanceInEth,
    totalB3BalanceInEth,
    formattedTotalBalance: `${formatNumber(totalBalanceInEth)} ETH`,
    aggregatedBalances: data || [],
    aggregatedTokenBalances,
    loading: isLoading,
    refetch,
  };
};
