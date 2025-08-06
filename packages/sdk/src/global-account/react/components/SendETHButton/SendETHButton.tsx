import { Button, useSendTransactionAA } from "@b3dotfun/sdk/global-account/react";
import type { JSX } from "react";
import { useCallback } from "react";
import { Chain } from "thirdweb";
import { Account } from "thirdweb/wallets";

interface SendETHButtonProps {
  account: Account;
  chain: Chain;
  to: `0x${string}`;
  value: bigint;
  className?: string;
  children?: string | JSX.Element;
  onSuccess?: (tx: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

export function SendETHButton({
  account,
  chain,
  to,
  value,
  className,
  children,
  onSuccess,
  onError,
}: SendETHButtonProps) {
  const { sendTransaction, isSending } = useSendTransactionAA();

  const handleSendETH = useCallback(async () => {
    try {
      const tx = await sendTransaction({ account, chain, to, data: "0x", value });
      onSuccess?.(tx);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [sendTransaction, account, chain, to, value, onSuccess, onError]);

  const buttonText = isSending ? "Sending..." : String(children);

  return (
    <Button onClick={handleSendETH} disabled={isSending} className={className}>
      {buttonText}
    </Button>
  );
}
