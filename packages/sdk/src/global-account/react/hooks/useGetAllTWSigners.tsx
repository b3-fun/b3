import { Signer } from "@b3dotfun/sdk/global-account/types";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import createDebug from "debug";
import { Chain } from "thirdweb";
import { getAllActiveSigners } from "thirdweb/extensions/erc4337";

interface UseGetAllTWSignersProps {
  chain?: Chain;
  accountAddress?: string;
  queryOptions?: Partial<UseQueryOptions<TWSignerWithMetadata[], Error>>;
}

interface PartnerMetadata {
  name: string;
  description?: string;
  website?: string;
  icon?: string;
}

interface SessionKeyData {
  partnerId: string;
  ecosystemId?: string;
  sessionKey: string;
  ecoSystemAddress: string;
  approvedTargets: string[];
  timestamp: number;
  permissionStartTimestamp: number;
  permissionEndTimestamp: number;
  partnerInfo: PartnerMetadata | null;
}

interface WorkerResponse {
  success: boolean;
  address: string;
  keys: SessionKeyData[];
}

// Export the interface so it can be used in other components
export interface TWSignerWithMetadata extends Signer {
  id: string;
  partner: {
    name: string;
    id: string;
    description?: string;
    website?: string;
    icon?: string;
  };
  metadata: {
    ecosystemId?: string;
    timestamp: number;
    permissionStartTimestamp: number;
    permissionEndTimestamp: number;
    approvedTargets: string[];
  };
  createdAt: string;
  endTimestamp: bigint;
  nativeTokenLimitPerTransaction: bigint;
}

const debug = createDebug("@@b3:useGetAllTWSigners");

export function useGetAllTWSigners({ chain, accountAddress, queryOptions }: UseGetAllTWSignersProps) {
  return useQuery({
    ...queryOptions,
    queryKey: ["useGetAllTWSigners", chain?.id, accountAddress],
    queryFn: async () => {
      if (!chain || !accountAddress) {
        return [] as TWSignerWithMetadata[];
      }

      debug("@@getAllActiveSigners:start");
      const signers = await getAllActiveSigners({
        contract: {
          client,
          chain,
          address: accountAddress as `0x${string}`,
        },
      });

      // Wait half a second for the sync, this is a hack
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch metadata from our worker
      let sessionKeysMetadata: Record<string, SessionKeyData> = {};
      try {
        const response = await fetch(
          `https://partner-session-keys-production.sean-430.workers.dev/?address=${accountAddress}&timestamp=${Date.now()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = (await response.json()) as WorkerResponse;
          sessionKeysMetadata = data.keys.reduce(
            (acc, key) => {
              acc[key.sessionKey] = key;
              return acc;
            },
            {} as Record<string, SessionKeyData>,
          );
        }
      } catch (error) {
        debug("Error fetching session keys metadata:", error);
      }

      // If no signers, return empty array
      if (!signers || !Array.isArray(signers) || signers.length === 0) {
        debug("@@useGetAllTWSigners:no signers");
        return [] as TWSignerWithMetadata[];
      }

      // Transform and combine the data
      const result = signers.map(signer => {
        const metadata = sessionKeysMetadata[signer.signer];
        return {
          ...signer,
          id: signer.signer,
          metadata,
          partner: {
            id: metadata?.partnerId || signer.signer,
            name: metadata?.partnerInfo?.name || "",
          },
          createdAt: metadata ? new Date(metadata.timestamp).toISOString() : "",
        };
      });
      return result;
    },
    // Respect queryOptions.enabled if explicitly set (e.g. signersEnabled=false from SignInWithB3Flow)
    enabled: queryOptions?.enabled !== false && Boolean(chain && accountAddress),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Consider data stale immediately
  });
}
