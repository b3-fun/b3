import { useUnifiedChainSwitchAndExecute } from "@b3dotfun/sdk/global-account/react";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { encodeFunctionData, erc20Abi } from "viem";
import { useCallback } from "react";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";

interface DirectTransferParams {
  chainId: number;
  tokenAddress: string;
  recipientAddress: string;
  amount: bigint;
  method: CryptoPaymentMethodType;
}

/**
 * Hook for executing direct token transfers (same chain, same token)
 * bypassing the swap backend.
 */
export function useDirectTransfer() {
  const { switchChainAndExecute, switchChainAndExecuteWithEOA, isSwitchingOrExecuting } = useUnifiedChainSwitchAndExecute();

  const executeDirectTransfer = useCallback(
    async ({ chainId, tokenAddress, recipientAddress, amount, method }: DirectTransferParams): Promise<string | undefined> => {
      const isNative = isNativeToken(tokenAddress);

      // Choose the correct execution function based on payment method
      const execute = method === CryptoPaymentMethodType.CONNECT_WALLET
        ? switchChainAndExecuteWithEOA
        : switchChainAndExecute;

      let txHash: string | undefined;
      if (isNative) {
        // Native token transfer (ETH, etc.)
        txHash = await execute(chainId, {
          to: recipientAddress,
          value: amount,
        });
      } else {
        // ERC20 token transfer
        const transferData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipientAddress as `0x${string}`, amount],
        });
        txHash = await execute(chainId, {
          to: tokenAddress,
          data: transferData,
          value: BigInt(0),
        });
      }

      return txHash;
    },
    [switchChainAndExecute, switchChainAndExecuteWithEOA],
  );

  return {
    executeDirectTransfer,
    isTransferring: isSwitchingOrExecuting,
  };
}
