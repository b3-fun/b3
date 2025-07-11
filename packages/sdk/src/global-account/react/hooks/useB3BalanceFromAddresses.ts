import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";

// ABI for just balanceOf
const abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Create a public client for Base
const client = createPublicClient({
  chain: base,
  transport: http(),
});

async function fetchB3Balances(addresses: string[]): Promise<{
  totalBalance: bigint;
  formattedTotal: string;
  breakdown: {
    address: string;
    balance: bigint;
    formatted: string;
  }[];
}> {
  try {
    // Fetch all balances in parallel
    const balances = await Promise.all(
      addresses.map(async address => {
        const balance = await client.readContract({
          address: B3_TOKEN.address,
          abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });

        return {
          address,
          balance,
          formatted: formatUnits(balance, B3_TOKEN.decimals),
        };
      }),
    );

    // Calculate total
    const totalBalance = balances.reduce((sum, { balance }) => sum + balance, BigInt(0));

    return {
      totalBalance,
      formattedTotal: formatNumber(Number(formatUnits(totalBalance, B3_TOKEN.decimals))),
      breakdown: balances,
    };
  } catch (error) {
    console.error("Error fetching B3 balances:", error);
    throw new Error("Failed to fetch B3 balances");
  }
}

export function useB3BalanceFromAddresses(
  addresses?: string[] | string | { address: string } | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
) {
  // Normalize addresses to array
  const normalizedAddresses = Array.isArray(addresses)
    ? addresses
    : typeof addresses === "string"
      ? [addresses]
      : addresses?.address
        ? [addresses.address]
        : [];

  return useQuery({
    queryKey: ["b3Balance", normalizedAddresses.sort()],
    queryFn: () => fetchB3Balances(normalizedAddresses),
    enabled: (options?.enabled ?? true) && normalizedAddresses.length > 0,
    refetchInterval: options?.refetchInterval ?? 30000, // Default 30s refresh
    staleTime: 10000, // Consider data stale after 10s
  });
}

export default useB3BalanceFromAddresses;
