import { RelayKitProvider } from "@reservoir0x/relay-kit-ui";
import { fetchChainConfigs, MAINNET_RELAY_API, RelayChain, TESTNET_RELAY_API } from "@reservoir0x/relay-sdk";
import { useEffect, useState } from "react";

export function RelayKitProviderWrapper({ isMainnet, children }: { isMainnet: boolean; children: React.ReactNode }) {
  const [relayChains, setRelayChains] = useState<RelayChain[]>([]);

  useEffect(() => {
    const fetchChains = async () => {
      const chains = await fetchChainConfigs(isMainnet ? MAINNET_RELAY_API : TESTNET_RELAY_API);
      setRelayChains(chains);
    };
    fetchChains();
  }, [isMainnet]);

  return (
    <RelayKitProvider
      options={{
        baseApiUrl: isMainnet ? MAINNET_RELAY_API : TESTNET_RELAY_API,
        source: "anyspend",
        duneConfig: {
          apiKey: "OkvN2bWlBPwXkvtmnTeYMQR1hYZBGDJt",
          apiBaseUrl: "https://api.dune.com"
        },
        chains: relayChains,
        privateChainIds: undefined,
        appName: "AnySpend",
        useGasFeeEstimations: true
      }}
    >
      <>{children}</>
    </RelayKitProvider>
  );
}
