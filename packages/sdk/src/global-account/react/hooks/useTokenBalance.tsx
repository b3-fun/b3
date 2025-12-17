"use client";

import { isNativeToken } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAccountWallet, useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { getERC20Balances, getNativeTokenBalance } from "@b3dotfun/sdk/shared/utils/thirdweb-insights";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface UseTokenBalanceProps {
  token: components["schemas"]["Token"];
  address?: string;
}

export interface TokenBalanceResult {
  rawBalance: bigint | null;
  formattedBalance: string;
  isLoading: boolean;
}

export function useTokenBalance({ token, address }: UseTokenBalanceProps): TokenBalanceResult {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const account = useAccountWallet();

  const effectiveAddress = address || account?.address;

  const {
    data: tokenBalance,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["tokenBalance", effectiveAddress, token.chainId, token.address],
    queryFn: async (): Promise<{ formatted: string; raw: bigint | null }> => {
      if (!effectiveAddress) return { formatted: "0", raw: null };

      if (isNativeToken(token.address)) {
        const nativeToken = await getNativeTokenBalance(effectiveAddress, token.chainId);
        if (nativeToken && nativeToken.balance) {
          const rawBalance = nativeToken.balance;
          return {
            formatted: formatTokenAmount(BigInt(rawBalance), Number(nativeToken.decimals || 18)),
            raw: BigInt(rawBalance),
          };
        }
        return { formatted: "0", raw: null };
      }

      const response = await getERC20Balances(effectiveAddress, {
        chainIds: [token.chainId],
        includeSpam: false,
      });
      const tokenBalance = response.data?.find(t => t.token_address === token.address);
      if (tokenBalance?.balance) {
        return {
          formatted: formatTokenAmount(BigInt(tokenBalance.balance), Number(tokenBalance.decimals || 18)),
          raw: BigInt(tokenBalance.balance),
        };
      }
      return { formatted: "0", raw: null };
    },
    enabled: isAuthenticated && !!effectiveAddress,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    structuralSharing: false,
  });

  // Force a refetch when the wallet or token changes
  useEffect(() => {
    if (isAuthenticated && effectiveAddress) {
      refetch();
    }
  }, [isAuthenticated, effectiveAddress, token.address, token.chainId, token.symbol, refetch]);

  // Determine if we're actually loading
  const isActuallyLoading = !isAuthenticated || !effectiveAddress || isLoading || (isFetching && !tokenBalance);

  return {
    rawBalance: tokenBalance?.raw || BigInt(0),
    formattedBalance: tokenBalance?.formatted || "0",
    isLoading: isActuallyLoading,
  };
}
