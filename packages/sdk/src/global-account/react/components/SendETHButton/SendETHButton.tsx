import { Button, useUnifiedChainSwitchAndExecute } from "@b3dotfun/sdk/global-account/react";
import type { JSX } from "react";
import { useCallback } from "react";

interface SendETHButtonProps {
  chainId: number;
  to: `0x${string}`;
  value: bigint;
  className?: string;
  children?: string | JSX.Element;
  onSuccess?: (tx: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

export function SendETHButton({ chainId, to, value, className, children, onSuccess, onError }: SendETHButtonProps) {
  const { switchChainAndExecute, isSwitchingOrExecuting } = useUnifiedChainSwitchAndExecute();

  const handleSendETH = useCallback(async () => {
    try {
      const tx = await switchChainAndExecute(chainId, { to: to as `0x${string}`, value });
      if (tx) {
        onSuccess?.(tx as `0x${string}`);
      }
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [switchChainAndExecute, chainId, to, value, onSuccess, onError]);

  const buttonText = isSwitchingOrExecuting ? "Sending..." : String(children);

  return (
    <Button onClick={handleSendETH} disabled={isSwitchingOrExecuting} className={className}>
      {buttonText}
    </Button>
  );
}
