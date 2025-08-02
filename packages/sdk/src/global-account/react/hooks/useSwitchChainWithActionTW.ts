import { getChainName, getNativeToken } from "@b3dotfun/sdk/anyspend";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { prepareTransaction, sendTransaction } from "thirdweb";
import { useActiveWallet, useSwitchActiveWalletChain } from "thirdweb/react";
import { WalletClient } from "viem";

export function useChainSwitchWithActionTW() {
  const activeWallet = useActiveWallet();
  const switchChain = useSwitchActiveWalletChain();
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
    async (targetChainId: number, action: (client: WalletClient) => Promise<void>) => {
      if (!activeWallet) {
        toast.error("Please connect your wallet");
        return;
      }

      const account = activeWallet.getAccount();
      if (!account) {
        toast.error("No account found");
        return;
      }

      // Get current chain ID from the active wallet
      const currentChainId = activeWallet.getChain()?.id;
      const onCorrectChain = currentChainId === targetChainId;

      // Get target chain for thirdweb
      const targetChain = supportedChains.find(chain => chain.id === targetChainId);
      if (!targetChain) {
        toast.error(`Chain ${targetChainId} is not supported`);
        return;
      }

      // Create a wrapper that implements the WalletClient interface using thirdweb
      const walletClient = {
        account: {
          address: account.address as `0x${string}`,
          type: "json-rpc" as const,
        },
        chain: {
          id: targetChainId,
        },
        sendTransaction: async (params: any) => {
          // Prepare and send transaction using thirdweb
          // Create thirdweb chain with rpc
          const thirdwebChain = {
            id: targetChain.id,
            name: targetChain.name,
            nativeCurrency: targetChain.nativeCurrency,
            rpc: targetChain.rpcUrls.default.http[0],
            blockExplorers: targetChain.blockExplorers?.default ? [targetChain.blockExplorers.default] : undefined,
            ...(targetChain.testnet === true && { testnet: true }),
          };

          const transaction = prepareTransaction({
            to: params.to,
            value: params.value || 0n,
            data: params.data,
            chain: thirdwebChain as any,
            client,
          });

          const walletAccount = activeWallet.getAccount();
          if (!walletAccount) {
            throw new Error("No wallet account available");
          }

          const result = await sendTransaction({
            transaction,
            account: walletAccount,
          });

          return result.transactionHash;
        },
        writeContract: async (params: any) => {
          // For contract writes, we need to encode the function call
          // This is a simplified approach - the actual encoding should be done by the caller
          // Create thirdweb chain with rpc
          const thirdwebChain = {
            id: targetChain.id,
            name: targetChain.name,
            nativeCurrency: targetChain.nativeCurrency,
            rpc: targetChain.rpcUrls.default.http[0],
            blockExplorers: targetChain.blockExplorers?.default ? [targetChain.blockExplorers.default] : undefined,
            ...(targetChain.testnet === true && { testnet: true }),
          };

          const transaction = prepareTransaction({
            to: params.address,
            data: params.data || "0x",
            chain: thirdwebChain as any,
            client,
          });

          const walletAccount = activeWallet.getAccount();
          if (!walletAccount) {
            throw new Error("No wallet account available");
          }

          const result = await sendTransaction({
            transaction,
            account: walletAccount,
          });

          return result.transactionHash;
        },
      } as WalletClient;

      if (onCorrectChain) {
        return run(() => action(walletClient));
      }

      toast.info(`Switching to ${getChainName(targetChainId)}…`);

      try {
        // Switch chain using thirdweb's switchChain
        await switchChain({
          id: targetChainId,
          name: targetChain.name,
          rpc: targetChain.rpcUrls.default.http[0],
          nativeCurrency: getNativeToken(targetChainId),
          blockExplorers: targetChain.blockExplorers?.default ? [targetChain.blockExplorers.default] : undefined,
        });

        // Execute the action with the wallet client
        await run(() => action(walletClient));
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
    [activeWallet, switchChain, run],
  );

  return { switchChainAndExecute, isSwitchingOrExecuting };
}
