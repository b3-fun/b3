import { fetchSimpleHashData } from "@b3dotfun/sdk/shared/utils/simplehash";
import { useQuery } from "@tanstack/react-query";
async function fetchAccountAssets(address: string) {
  if (!address) throw new Error("Address is required");

  const [nftResponse] = await Promise.all([
    fetchSimpleHashData(`/v0/nfts/owners`, {
      chains: "b3,b3-sepolia,base",
      wallet_addresses: address,
      count: true,
    }),
    // we are not using the tokenResponse anywhere in the app, let's not call it, if we don't need it
    // getERC20Balances(address, {
    //   chainIds: [8333, 1993, 8453, 84532],
    //   includeSpam: false,
    //   metadata: true,
    // }),
  ]);

  return {
    nftResponse,
    //tokenResponse,
  };
}

export function useAccountAssets(address?: string) {
  return useQuery({
    queryKey: ["accountAssets", address],
    queryFn: () => fetchAccountAssets(address!),
    enabled: Boolean(address),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
}
