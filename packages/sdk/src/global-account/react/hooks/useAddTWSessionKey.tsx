import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import createDebug from "debug";
import { Chain, Hex, sendTransaction, ThirdwebClient } from "thirdweb";
import { addSessionKey } from "thirdweb/extensions/erc4337";
import { useActiveAccount } from "thirdweb/react";
import { Address } from "viem";

const debug = createDebug("@@b3:useHandleTWConnect");

export function useAddTWSessionKey({
  onSuccess,
  onError,
  refetchSigners,
  chain,
}: {
  chain?: Chain;
  onSuccess: (
    transactionResult: { transactionHash: Hex } & {
      client: ThirdwebClient;
      chain: Chain;
    },
  ) => void;
  onError: (error: Error) => void;
  refetchSigners: () => Promise<any>;
}) {
  if (!chain) {
    throw new Error("Chain is required");
  }

  const account = useActiveAccount();

  const newSessionKey = async ({
    sessionKeyAddress,
    approvedTargets,
    nativeTokenLimitPerTransaction,
    permissionStartTimestamp,
    permissionEndTimestamp,
  }: {
    sessionKeyAddress: Address;
    approvedTargets: Address[];
    nativeTokenLimitPerTransaction: number;
    permissionStartTimestamp: Date;
    permissionEndTimestamp: Date;
  }) => {
    if (!account || !chain) return;

    debug("@@newSessionKey:", {
      sessionKeyAddress,
      approvedTargets,
      nativeTokenLimitPerTransaction,
      permissionStartTimestamp,
      permissionEndTimestamp,
    });
    try {
      const transaction = addSessionKey({
        contract: {
          client,
          chain,
          address: account.address as `0x${string}`,
        },
        account,
        sessionKeyAddress,
        permissions: {
          approvedTargets,
          nativeTokenLimitPerTransaction,
          permissionStartTimestamp,
          permissionEndTimestamp,
        },
      });

      debug("@@ecosystem:newSessionKey:transaction:", transaction);

      const transactionResult = await sendTransaction({ transaction, account });
      debug("@@ecosystem:newSessionKey:transactionResult:", transactionResult);
      onSuccess(transactionResult);

      await refetchSigners();
    } catch (error) {
      onError(error as Error);
      console.error("@@ecosystem:newSessionKey:error:", error);
    }
  };

  return { newSessionKey };
}
