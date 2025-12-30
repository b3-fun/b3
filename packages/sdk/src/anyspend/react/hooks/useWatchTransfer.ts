import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUnits } from "viem";
import { useBalance } from "wagmi";
import { isNativeToken } from "../../utils";

export interface TransferResult {
  amount: string;
  formattedAmount: string;
  txHash?: string;
  timestamp: number;
}

export interface UseWatchTransferProps {
  /** Address to watch for incoming transfers */
  address: string;
  /** Chain ID to watch on */
  chainId: number;
  /** Token address (use zero address for native token) */
  tokenAddress: string;
  /** Token decimals */
  tokenDecimals: number;
  /** Token symbol */
  tokenSymbol: string;
  /** Whether watching is enabled */
  enabled?: boolean;
  /** Callback when a transfer is detected */
  onTransferDetected?: (result: TransferResult) => void;
}

/**
 * Hook to watch for incoming transfers to an address by monitoring balance changes.
 * When a transfer is detected (balance increases), it captures the amount and notifies.
 */
export function useWatchTransfer({
  address,
  chainId,
  tokenAddress,
  tokenDecimals,
  tokenSymbol,
  enabled = true,
  onTransferDetected,
}: UseWatchTransferProps) {
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const initialBalanceRef = useRef<bigint | null>(null);
  const transferDetectedRef = useRef(false);

  const isNative = isNativeToken(tokenAddress);
  // Get current balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address as `0x${string}`,
    chainId,
    token: isNative ? undefined : (tokenAddress as `0x${string}`),
    query: {
      enabled: enabled && !!address,
      refetchInterval: 3000,
    },
  });

  // Initialize or update the initial balance
  useEffect(() => {
    if (balanceData && initialBalanceRef.current === null && enabled) {
      initialBalanceRef.current = balanceData.value;
      setIsWatching(true);
    }
  }, [balanceData, enabled]);

  // Check for balance increase (transfer detected)
  useEffect(() => {
    if (!enabled || transferDetectedRef.current || initialBalanceRef.current === null || !balanceData) {
      return;
    }

    const currentBalance = balanceData.value;
    const initialBalance = initialBalanceRef.current;

    if (currentBalance > initialBalance) {
      const transferAmount = currentBalance - initialBalance;
      const formattedAmount = formatUnits(transferAmount, tokenDecimals);

      const result: TransferResult = {
        amount: transferAmount.toString(),
        formattedAmount,
        timestamp: Date.now(),
      };

      transferDetectedRef.current = true;
      setTransferResult(result);
      setIsWatching(false);
      onTransferDetected?.(result);
    }
  }, [balanceData, enabled, tokenDecimals, onTransferDetected]);

  // Reset function to start watching again
  const reset = useCallback(() => {
    transferDetectedRef.current = false;
    initialBalanceRef.current = null;
    setTransferResult(null);
    setIsWatching(false);
  }, []);

  return useMemo(
    () => ({
      /** Whether currently watching for transfers */
      isWatching,
      /** The detected transfer result, if any */
      transferResult,
      /** Whether a transfer has been detected */
      hasTransfer: transferResult !== null,
      /** Reset and start watching again */
      reset,
      /** Manually refetch balance */
      refetchBalance,
    }),
    [isWatching, transferResult, reset, refetchBalance],
  );
}
