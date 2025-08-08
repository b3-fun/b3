import { getChainName, getNativeToken } from "@b3dotfun/sdk/anyspend";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import invariant from "invariant";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSwitchChain, useWalletClient } from "wagmi";

export function useChainSwitchWithAction() {
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitchingOrExecuting, setIsSwitchingOrExecuting] = useState(false);

  const run = useCallback(async (fn: () => Promise<void>) => {
    try {
      setIsSwitchingOrExecuting(true);
      await fn();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Unexpected error");
    } finally {
      setIsSwitchingOrExecuting(false);
    }
  }, []);

  const switchChainAndExecute = useCallback(
    async (targetChainId: number, action: () => Promise<void>) => {
      if (!walletClient) {
        toast.error("Please connect your wallet");
        return;
      }

      const providerId = walletClient.chain.id;
      const onCorrectChain = providerId === targetChainId;

      if (onCorrectChain) {
        return run(() => action());
      }

      toast.info(`Switching to ${getChainName(targetChainId)}…`);

      const targetChain = supportedChains.find(chain => chain.id === targetChainId);
      if (!targetChain) {
        toast.error(`Chain ${targetChainId} is not supported`);
        return;
      }

      try {
        const blockExplorerUrl = targetChain.blockExplorers?.default.url;
        invariant(blockExplorerUrl, "Block explorer URL is required");
        const nativeCurrency = getNativeToken(targetChainId);
        await switchChainAsync({
          chainId: targetChainId,
          addEthereumChainParameter: {
            chainName: targetChain.name,
            rpcUrls: [targetChain.rpcUrls.default.http[0]],
            blockExplorerUrls: [blockExplorerUrl],
            nativeCurrency: {
              name: nativeCurrency.name,
              symbol: nativeCurrency.symbol,
              decimals: nativeCurrency.decimals,
            },
          },
        });
        await run(() => action());
      } catch (e: any) {
        if (e?.code === -32603 || e?.message?.includes("f is not a function")) {
          // This is a workaround for a bug in the wallet provider.
          toast(`Switched to ${getChainName(targetChainId)}. Executing…`);
          await switchChainAndExecute(targetChainId, action);
        } else {
          toast.error(e?.message ?? "Unexpected error");
        }
      }
    },
    [walletClient, run, switchChainAsync],
  );

  return { switchChainAndExecute, isSwitchingOrExecuting };
}
