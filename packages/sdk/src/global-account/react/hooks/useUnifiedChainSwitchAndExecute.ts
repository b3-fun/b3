import { getChainName, getNativeToken } from "@b3dotfun/sdk/anyspend";
import app from "@b3dotfun/sdk/global-account/app";
import { getThirdwebChain, supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import invariant from "invariant";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { prepareTransaction, sendTransaction as twSendTransaction } from "thirdweb";
import { useSwitchChain, useWalletClient } from "wagmi";
import { useB3 } from "../components";
import { useAccountWallet } from "./useAccountWallet";
import { isAddress } from "viem";

export interface UnifiedTransactionParams {
  to: string;
  data?: string;
  value: bigint;
}

const partnerId = String(
  process.env.PUBLIC_THIRDWEB_PARTNER_ID ||
    process.env.NEXT_PUBLIC_THIRDWEB_PARTNER_ID ||
    process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID ||
    process.env.NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID,
);
invariant(partnerId, "Partner ID is required");

export function useUnifiedChainSwitchAndExecute() {
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitchingOrExecuting, setIsSwitchingOrExecuting] = useState(false);

  const { isActiveSmartWallet, isActiveEOAWallet } = useAccountWallet();
  const { account: aaAccount } = useB3();

  // Handle EOA wallet chain switch and execute transaction
  const handleEOASwitchChainAndSendTransaction = useCallback(
    async (targetChainId: number, params: UnifiedTransactionParams): Promise<string | undefined> => {
      if (!walletClient) {
        toast.error("Please connect your wallet");
        return;
      }

      const providerId = walletClient.chain.id;
      const onCorrectChain = providerId === targetChainId;

      // Helper function to execute the transaction
      const executeTransaction = async (): Promise<string> => {
        const signer = walletClient.account;
        if (!signer) {
          throw new Error("No account connected");
        }

        // Get the target chain configuration instead of using potentially stale walletClient.chain
        const targetChain = supportedChains.find(chain => chain.id === targetChainId);
        if (!targetChain) {
          throw new Error(`Chain ${targetChainId} is not supported`);
        }

        invariant(isAddress(params.to), "params.to is not a valid address");

        const hash = await walletClient.sendTransaction({
          account: signer,
          chain: targetChain,
          to: params.to,
          data: params.data as `0x${string}`,
          value: params.value,
        });

        toast.success(`Transaction sent: ${hash.slice(0, 10)}...`);
        return hash;
      };

      try {
        setIsSwitchingOrExecuting(true);

        if (onCorrectChain) {
          return await executeTransaction();
        }

        const switchingToastId = toast.info(`Switching to ${getChainName(targetChainId)}…`);

        const targetChain = supportedChains.find(chain => chain.id === targetChainId);
        if (!targetChain) {
          toast.error(`Chain ${targetChainId} is not supported`);
          return;
        }

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

        toast.dismiss(switchingToastId);
        return await executeTransaction();
      } catch (e: any) {
        if (e?.code === -32603 || e?.message?.includes("f is not a function")) {
          // This is a workaround for a bug in the wallet provider.
          toast(`Switched to ${getChainName(targetChainId)}. Executing…`);
          return await handleEOASwitchChainAndSendTransaction(targetChainId, params);
        } else {
          console.error(e);
          toast.error(e?.message ?? "Unexpected error");
          return undefined;
        }
      } finally {
        setIsSwitchingOrExecuting(false);
      }
    },
    [walletClient, switchChainAsync],
  );

  // Handle AA wallet transaction (no chain switch needed for AA)
  const handleAASendTransaction = useCallback(
    async (targetChainId: number, params: UnifiedTransactionParams): Promise<string | undefined> => {
      if (!aaAccount) {
        toast.error("Smart wallet not connected");
        return;
      }

      try {
        setIsSwitchingOrExecuting(true);

        const chain = getThirdwebChain(targetChainId);

        const transaction = prepareTransaction({
          client,
          chain,
          to: params.to,
          data: params.data as `0x${string}`,
          value: params.value,
        });

        // Check if we can use global-accounts-intents, if yes, create an intent.
        try {
          await app.service("global-accounts-intents").create({
            partnerId: partnerId,
            chainId: targetChainId,
            to: params.to,
            data: params.data || "0x",
            value: params.value.toString(),
          });
        } catch (err: any) {
          console.error("Create global-accounts-intents error", err);
        }

        toast.info("Sending transaction…");
        const start = performance.now();
        const sendTxResponse = await twSendTransaction({
          account: aaAccount,
          transaction,
        });
        const end = performance.now();
        console.log("Time taken to send transaction", end - start);

        toast.success("Transaction sent successfully");
        return sendTxResponse.transactionHash;
      } catch (err: any) {
        console.error("Send transaction error", err);
        toast.error(err?.message ?? "Transaction failed");
        return undefined;
      } finally {
        setIsSwitchingOrExecuting(false);
      }
    },
    [aaAccount],
  );

  // Unified switch chain and execute function
  const switchChainAndExecute = useCallback(
    async (targetChainId: number, params: UnifiedTransactionParams): Promise<string | undefined> => {
      // Check which wallet type is active
      if (isActiveSmartWallet) {
        return handleAASendTransaction(targetChainId, params);
      } else if (isActiveEOAWallet) {
        return handleEOASwitchChainAndSendTransaction(targetChainId, params);
      } else {
        toast.error("No wallet connected");
        return undefined;
      }
    },
    [isActiveSmartWallet, isActiveEOAWallet, handleAASendTransaction, handleEOASwitchChainAndSendTransaction],
  );

  return {
    switchChainAndExecute,
    switchChainAndExecuteWithEOA: handleEOASwitchChainAndSendTransaction,
    isSwitchingOrExecuting,
    isActiveSmartWallet,
    isActiveEOAWallet,
  };
}
