import { RelayKitProvider } from "@reservoir0x/relay-kit-ui";
import { fetchChainConfigs, MAINNET_RELAY_API, RelayChain } from "@reservoir0x/relay-sdk";
import { useEffect, useState } from "react";

export function RelayKitProviderWrapper({
  children,
  simDuneApiKey,
}: {
  children: React.ReactNode;
  simDuneApiKey?: string;
}) {
  const [relayChains, setRelayChains] = useState<RelayChain[]>([]);

  useEffect(() => {
    const fetchChains = async () => {
      const chains = await fetchChainConfigs(MAINNET_RELAY_API);
      setRelayChains(chains);
    };
    fetchChains();
  }, []);

  return (
    <RelayKitProvider
      options={{
        baseApiUrl: MAINNET_RELAY_API,
        source: "anyspend",
        duneConfig: {
          apiKey: simDuneApiKey,
          apiBaseUrl: "https://api.sim.dune.com",
        },
        chains: relayChains,
        privateChainIds: undefined,
        appName: "AnySpend",
        useGasFeeEstimations: true,
      }}
    >
      <>{children}</>
    </RelayKitProvider>
  );
}
