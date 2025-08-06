import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useCallback, useMemo, useState } from "react";
import { Chain, prepareTransaction, sendTransaction as twSendTransaction } from "thirdweb";
import { Account } from "thirdweb/wallets";

export function useSendTransactionAA() {
  const [isSending, setIsSending] = useState(false);

  const sendTransaction = useCallback(
    async ({
      account,
      chain,
      to,
      data,
      value,
    }: {
      account: Account;
      chain: Chain;
      to: `0x${string}`;
      data: `0x${string}`;
      value: bigint;
    }) => {
      setIsSending(true);
      try {
        const transaction = prepareTransaction({
          client,
          chain,
          to,
          data,
          value,
        });
        const sendTxResponse = await twSendTransaction({ account, transaction });
        return sendTxResponse.transactionHash;
      } finally {
        setIsSending(false);
      }
    },
    [],
  );

  return useMemo(() => ({ sendTransaction, isSending }), [sendTransaction, isSending]);
}
