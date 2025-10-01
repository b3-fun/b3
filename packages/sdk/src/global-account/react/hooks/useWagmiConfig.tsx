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
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [supportedChains[0], ...supportedChains.slice(1)],
        transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http(rpcUrls?.[chain.id])])) as any,
        connectors: [
          inAppWalletConnector({
            ...ecocystemConfig,
            client,
            onConnect,
          }),
          // injected(),
          // coinbaseWallet({ appName: "HypeDuel" }),
        ],
      }),
    [partnerId],
  );

  return wagmiConfig;
}
