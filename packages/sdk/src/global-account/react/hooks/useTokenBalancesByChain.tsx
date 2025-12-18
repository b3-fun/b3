"use client";

import { getERC20Balances, TokenData } from "@b3dotfun/sdk/shared/utils/thirdweb-insights";
import { useQuery } from "@tanstack/react-query";

import { viemToThirdwebChain } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { getChainById } from "@b3dotfun/sdk/shared/utils/chains";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import invariant from "invariant";
import { getWalletBalance } from "thirdweb/wallets";

type GetWalletBalanceResult = {
  value: bigint;
  decimals: number;
  displayValue: string;
  symbol: string;
  name: string;
  chainId: number;
};

export interface TokenBalancesByChain {
  nativeTokens: GetWalletBalanceResult[];
  fungibleTokens: TokenData[];
  isLoading: boolean;
  error: Error | null;
}

interface UseTokenBalancesByChainProps {
  address: string;
  chainsIds: number | number[];
  enabled?: boolean;
}

export function useTokenBalancesByChain({
  address,
  chainsIds,
  enabled = true,
}: UseTokenBalancesByChainProps): TokenBalancesByChain {
  // Normalize chains to array
  const chainIds = Array.isArray(chainsIds) ? chainsIds : [chainsIds];

  const {
    data: combinedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tokenBalancesByChain", address, chainIds.join(",")],
    queryFn: async () => {
      try {
        // Run both fetches in parallel
        const [nativeTokens, fungibleResponse] = await Promise.all([
          // Fetch native token balances
          Promise.all(
            chainIds.map(async chainId => {
              const chain = getChainById(chainId);
              invariant(chain, "Chain is required");
              const walletBalance = await getWalletBalance({
                address,
                client,
                chain: viemToThirdwebChain(chain),
              });

              return {
                ...walletBalance,
              };
            }),
          ),
          getERC20Balances(address, {
            chainIds,
          }),
        ]);

        return {
          nativeTokens,
          fungibleTokens: fungibleResponse.data,
        };
      } catch (err) {
        console.error("Error fetching token balances:", err);
        throw err;
      }
    },
    enabled: enabled && !!address && chainIds.length > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2, // Limit retries on failure
  });

  return {
    nativeTokens: combinedData?.nativeTokens ?? [],
    fungibleTokens: combinedData?.fungibleTokens ?? [],
    isLoading,
    error: error as Error | null,
  };
}
