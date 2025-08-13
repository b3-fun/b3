import { b3Mainnet, b3Testnet } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import { fetchNativeTokenPriceWithChange } from "./useTokenPrice";
interface NativeBalanceResponse {
  data: Array<{
    tokenDecimals: number;
    chainId: number;
    balance: string;
  }>;
}

async function fetchNativeBalance(address: string, chainIds: string) {
  if (!address) throw new Error("Address is required");

  const response = await fetch(
    `https://api.sprinter.buildwithsygma.com/accounts/${address}/assets/native?whitelistedChains=${chainIds}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch native balance");
  }

  const data: NativeBalanceResponse = await response.json();

  // Calculate total balance in ETH across all chains
  const total = data.data.reduce((acc, curr) => {
    const balance = formatUnits(BigInt(curr.balance), curr.tokenDecimals);
    return acc + Number(balance);
  }, 0);

  // TODO: Revive me once CoinGecko supports B3
  let usdBalances: Record<
    number,
    {
      balance: number;
      formatted: string;
      priceChange24h: number | null;
    }
  > = {};

  let globalPriceChange24h: number | null = null;

  try {
    for (const item of data.data) {
      // Use chain ID once since native token ETH is the same across all chains
      const priceData = await fetchNativeTokenPriceWithChange("eth");

      // Store the price change globally (same for all chains since it's ETH)
      if (globalPriceChange24h === null) {
        globalPriceChange24h = priceData.priceChange24h;
      }

      usdBalances[item.chainId] = {
        balance: total * priceData.price,
        formatted: formatNumber(total * priceData.price),
        priceChange24h: priceData.priceChange24h,
      };
    }
  } catch (error) {
    console.error("@@useNativeBalance:error in price calculation", error);
  }

  const totalUsd = Object.values(usdBalances).reduce((acc, curr) => acc + curr.balance, 0);

  return {
    total,
    formattedTotal: formatNumber(total),
    totalUsd,
    formattedTotalUsd: formatNumber(totalUsd),
    priceChange24h: globalPriceChange24h,
    breakdown: data.data.map(item => {
      const usdBalance = usdBalances[item.chainId]?.balance || 0;
      const priceChange = usdBalances[item.chainId]?.priceChange24h || null;
      return {
        chainId: item.chainId,
        balance: BigInt(item.balance),
        formatted: formatNumber(Number(formatUnits(BigInt(item.balance), item.tokenDecimals))),
        balanceUsd: usdBalance,
        balanceUsdFormatted: formatNumber(usdBalance),
        priceChange24h: priceChange,
      };
    }),
  };
}

export function useNativeBalance(address?: string, chainIds = "8333") {
  return useQuery({
    queryKey: ["nativeBalance", address, chainIds],
    queryFn: () => fetchNativeBalance(address || "", chainIds),
    enabled: Boolean(address),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
}

/**
 * Fetches the native balance of an address from the RPC
 *
 * @param address - The address to fetch the balance of
 * @param chainId - The chain ID to fetch the balance from
 * @returns The native balance of the address
 *
 * TODO: Deprecate Ethers, this is the only thing depending on it
 */
export function useNativeBalanceFromRPC(address: string, chainId: number) {
  const { data: balance = 0, isLoading } = useQuery({
    queryKey: ["nativeBalanceRPC", address, chainId],
    queryFn: async () => {
      if (!address) return 0;

      try {
        const publicClient = createPublicClient({
          chain: chainId === 8333 ? b3Mainnet : b3Testnet,
          transport: http(),
        });

        const balance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });

        return parseFloat(formatEther(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast.error("Failed to fetch wallet balance");
        return 0;
      }
    },
    enabled: Boolean(address),
  });

  return { balance, isLoading };
}
