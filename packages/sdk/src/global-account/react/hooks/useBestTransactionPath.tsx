"use client";

import { isNativeToken, Token } from "@b3dotfun/sdk/anyspend";
import { useAccountWallet, useOneBalance, useTokenBalance } from "@b3dotfun/sdk/global-account/react";
import { useMemo } from "react";
import { formatUnits } from "viem";

export type TransactionType = "send" | "swap" | "bridge";

const supportedSprinterTokenSymbols = ["ETH", "USDC", "WETH"] as const;

export interface SprinterOption {
  chainId: number;
  balance: bigint;
  formattedBalance: string;
}

export interface TransactionPath {
  type: "native" | "sprinter" | "anyspend";
  hasNativePath: boolean;
  hasSprinterPath: boolean;
  availableBalance: bigint;
  totalCrossChainBalance: number;
  sprinterOptions?: SprinterOption[];
}

export interface TransactionPathResult extends TransactionPath {
  loading: boolean;
}

interface UseBestTransactionPathProps {
  amount: bigint;
  token: Token;
  address?: string;
  transactionType?: TransactionType;
}

/**
 * Hook to determine the optimal transaction path based on user's balances across chains
 *
 * @param props.amount - Amount to transact
 * @param props.token - Token (a Token object)
 * @param props.address - Target address (optional, defaults to self)
 * @param props.transactionType - Type of transaction (optional, defaults to 'send')
 *
 * - type: The recommended path type ('native', 'sprinter', or 'anyspend')
 * - hasNativePath: Whether direct native token transfer is possible (1st best path)
 * - hasSprinterPath: Whether bridging via Sprinter is possible (2nd best path)
 * - availableBalance: The user's balance of this asset
 * - sprinterOptions: Available chains and balances for bridging
 * @returns TransactionPathResult object containing path information and loading state
 */
export function useBestTransactionPath({
  amount,
  token,
  address,
  transactionType: _transactionType = "send",
}: UseBestTransactionPathProps): TransactionPathResult {
  const account = useAccountWallet();
  const effectiveAddress = address || account?.address;

  const isSupportedSprinterToken = supportedSprinterTokenSymbols.includes(
    token.symbol.toUpperCase() as (typeof supportedSprinterTokenSymbols)[number],
  );

  // Get balances across all chains
  const { aggregatedBalances, aggregatedTokenBalances, loading: oneBalanceLoading } = useOneBalance();

  // Get the token balance using our new hook
  const { rawBalance, isLoading: tokenBalanceLoading } = useTokenBalance({
    token,
    address: effectiveAddress,
  });

  // Check if amount is available natively on destination chain
  const hasNativeBalance = useMemo(() => {
    if (!rawBalance || !amount) return false;

    return rawBalance >= amount;
  }, [amount, rawBalance]);

  // Calculate non-native token balance using the same logic as hasNativeBalance
  const nonNativeTokenBalance = useMemo(() => {
    if (isNativeToken(token.address)) return BigInt(0);

    // For sprinter supported tokens, use aggregated balances
    if (isSupportedSprinterToken && !oneBalanceLoading && aggregatedBalances) {
      const asset = aggregatedBalances.find(asset => asset.symbol === token.symbol);
      if (asset) {
        const chainBalance = asset.chainBalances.find(cb => cb.chainId === token.chainId);
        if (chainBalance) {
          return BigInt(chainBalance.balance);
        }
      }
      return BigInt(0);
    }

    // For non-sprinter tokens, use token balance from our new hook
    return rawBalance;
  }, [
    token.address,
    token.symbol,
    token.chainId,
    isSupportedSprinterToken,
    oneBalanceLoading,
    aggregatedBalances,
    rawBalance,
  ]);

  const totalCrossChainBalance = useMemo(() => {
    if (oneBalanceLoading || !aggregatedTokenBalances || !token.symbol) return 0;
    return aggregatedTokenBalances[token.symbol] || 0;
  }, [aggregatedTokenBalances, token.symbol, oneBalanceLoading]);

  // Calculate available sprinter options and determine if sprinter path is available
  const { hasSprinterPath, sprinterOptions } = useMemo(() => {
    if (!isSupportedSprinterToken || oneBalanceLoading || !aggregatedBalances || !token.symbol || !amount) {
      return { hasSprinterPath: false, sprinterOptions: [] };
    }

    const asset = aggregatedBalances.find(asset => asset.symbol === token.symbol);
    if (!asset) {
      return { hasSprinterPath: false, sprinterOptions: [] };
    }

    const options: SprinterOption[] = [];

    // Get all chains where user has sufficient balance
    for (const chainBalance of asset.chainBalances) {
      const balanceBi = BigInt(chainBalance.balance);
      if (balanceBi >= amount && chainBalance.chainId !== token.chainId) {
        options.push({
          chainId: chainBalance.chainId,
          balance: balanceBi,
          formattedBalance: formatUnits(balanceBi, chainBalance.tokenDecimals),
        });
      }
    }

    return {
      hasSprinterPath: options.length > 0,
      sprinterOptions: options,
    };
  }, [isSupportedSprinterToken, oneBalanceLoading, aggregatedBalances, token.symbol, token.chainId, amount]);

  // Determine the best path
  const path = useMemo(() => {
    const availableBalance = (isNativeToken(token.address) ? rawBalance : nonNativeTokenBalance) || BigInt(0);

    // Case 1: Native path if available
    if (hasNativeBalance) {
      return {
        type: "native" as const,
        hasNativePath: true,
        hasSprinterPath,
        availableBalance,
        totalCrossChainBalance,
        sprinterOptions,
      };
    }

    // Case 2: Sprinter path if available
    if (hasSprinterPath) {
      return {
        type: "sprinter" as const,
        hasNativePath: false,
        hasSprinterPath: true,
        availableBalance,
        totalCrossChainBalance,
        sprinterOptions,
      };
    }

    // Case 3: Fallback to anyspend
    return {
      type: "anyspend" as const,
      hasNativePath: false,
      hasSprinterPath: false,
      availableBalance,
      totalCrossChainBalance,
      sprinterOptions: [],
    };
  }, [
    token.address,
    rawBalance,
    nonNativeTokenBalance,
    hasNativeBalance,
    hasSprinterPath,
    totalCrossChainBalance,
    sprinterOptions,
  ]);

  // Combine all loading states
  const loading = oneBalanceLoading || tokenBalanceLoading;

  return {
    ...path,
    loading,
  };
}
