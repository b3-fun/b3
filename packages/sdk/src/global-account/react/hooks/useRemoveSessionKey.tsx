import { ActiveSigners } from "@b3dotfun/sdk/global-account/types";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import createDebug from "debug";
import { useCallback, useState } from "react";
import { Chain, Hex, sendTransaction, ThirdwebClient } from "thirdweb";
import { removeSessionKey } from "thirdweb/extensions/erc4337";
import { useActiveAccount } from "thirdweb/react";

const debug = createDebug("@@b3:useHandleTWConnect");

export function useRemoveSessionKey({
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
  const [isRemovingSessionKey, setIsRemovingSessionKey] = useState(false);
  if (!chain) {
    throw new Error("Chain is required");
  }

  const account = useActiveAccount();

  const removeSessionKeyHandler = useCallback(
    async (signer: ActiveSigners[number]) => {
      if (!account || !chain) return;

      setIsRemovingSessionKey(true);

      try {
        const transaction = removeSessionKey({
          contract: {
            client,
            chain,
            address: account.address as `0x${string}`,
          },
          account,
          sessionKeyAddress: signer.signer as `0x${string}`,
        });

        debug("@@ecosystem:removeSessionKey:transaction:", transaction);

        const transactionResult = await sendTransaction({ transaction, account });
        debug("@@ecosystem:removeSessionKey:transactionResult:", transactionResult);
        onSuccess(transactionResult);

        await refetchSigners();
      } catch (error) {
        onError(error as Error);
        console.error("@@ecosystem:removeSessionKey:error:", error);
      } finally {
        setIsRemovingSessionKey(false);
      }
    },
    [account, chain, onSuccess, onError, refetchSigners],
  );

  return { removeSessionKey: removeSessionKeyHandler, isRemovingSessionKey };
}
