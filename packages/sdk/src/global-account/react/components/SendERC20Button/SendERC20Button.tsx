import { Button, useUnifiedChainSwitchAndExecute } from "@b3dotfun/sdk/global-account/react";
import type { JSX } from "react";
import { useCallback } from "react";
import { encodeFunctionData, erc20Abi } from "viem";

interface SendERC20ButtonProps {
  chainId: number;
  to: `0x${string}`;
  tokenAddress: `0x${string}`;
  amount: bigint;
  className?: string;
  children?: string | JSX.Element;
  onSuccess?: (tx: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

export function SendERC20Button({
  chainId,
  to,
  tokenAddress,
  amount,
  className,
  children,
  onSuccess,
  onError,
}: SendERC20ButtonProps) {
  const { switchChainAndExecute, isSwitchingOrExecuting } = useUnifiedChainSwitchAndExecute();

  const handleSendERC20 = useCallback(async () => {
    try {
      const bytecode = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amount],
      });
      const tx = await switchChainAndExecute(chainId, {
        to: tokenAddress as `0x${string}`,
        data: bytecode,
        value: BigInt(0),
      });
      if (tx) {
        onSuccess?.(tx as `0x${string}`);
      }
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [switchChainAndExecute, chainId, to, tokenAddress, amount, onSuccess, onError]);

  const buttonText = isSwitchingOrExecuting ? "Sending..." : String(children);

  return (
    <Button onClick={handleSendERC20} disabled={isSwitchingOrExecuting} className={className}>
      {buttonText}
    </Button>
  );
}
