import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { inAppWalletConnector } from "@thirdweb-dev/wagmi-adapter";
import { http } from "viem";
import { createConfig } from "wagmi";

export interface CreateWagmiConfigOptions {
  partnerId: string;
  rpcUrls?: Record<number, string>;
  connectors?: any[];
  overrideDefaultConnectors?: boolean;
}

/**
 * Creates a wagmi config with optional custom RPC URLs and connectors
 * @param options.partnerId - Partner ID for the ecosystem wallet
 * @param options.rpcUrls - Optional mapping of chain IDs to RPC URLs
 * @param options.connectors - Additional connectors to include
 * @param options.overrideDefaultConnectors - If true, only use provided connectors (ignores defaults)
 */
export function createWagmiConfig(options: CreateWagmiConfigOptions) {
  const { partnerId, rpcUrls, connectors = [], overrideDefaultConnectors = false } = options;

  const defaultConnectors = [
    inAppWalletConnector({
      ecosystemId: ecosystemWalletId,
      partnerId,
      client,
    }),
  ];

  const finalConnectors = overrideDefaultConnectors ? connectors : [...defaultConnectors, ...connectors];

  return createConfig({
    chains: [supportedChains[0], ...supportedChains.slice(1)],
    transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http(rpcUrls?.[chain.id])])),
    connectors: finalConnectors,
  });
}
