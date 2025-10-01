import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { inAppWalletConnector } from "@thirdweb-dev/wagmi-adapter";
import { useMemo } from "react";
import { http } from "viem";
import { createConfig } from "wagmi";
import { useAuthentication } from "./useAuthentication";

export function useWagmiConfig(partnerId: string, rpcUrls?: Record<number, string>) {
  const { onConnect } = useAuthentication(partnerId);

  // Stringify rpcUrls for stable comparison to prevent wagmiConfig recreation
  // when parent component passes new object references with same content
  const rpcUrlsString = useMemo(() => (rpcUrls ? JSON.stringify(rpcUrls) : undefined), [rpcUrls]);

  const ecocystemConfig = useMemo(() => {
    return {
      ecosystemId: ecosystemWalletId,
      partnerId: partnerId,
      client,
    };
  }, [partnerId]);

  /**
   * Creates wagmi config with optional custom RPC URLs
   * @param rpcUrls - Optional mapping of chain IDs to RPC URLs
   */
  const wagmiConfig = useMemo(() => {
    const parsedRpcUrls = rpcUrlsString ? JSON.parse(rpcUrlsString) : undefined;

    return createConfig({
      chains: [supportedChains[0], ...supportedChains.slice(1)],
      transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http(parsedRpcUrls?.[chain.id])])),
      connectors: [
        inAppWalletConnector({
          ...ecocystemConfig,
          client,
          onConnect,
        }),
        // injected(),
        // coinbaseWallet({ appName: "HypeDuel" }),
      ],
    });
  }, [partnerId, rpcUrlsString, ecocystemConfig, onConnect]);

  return wagmiConfig;
}
