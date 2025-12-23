"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, parseUnits, formatUnits } from "viem";
import {
  ORDERLY_CHAINS,
  ORDERLY_VAULT_ABI,
  ORDERLY_HASHES,
  ORDERLY_DEPOSIT_FEE_BUFFER,
  ORDERLY_DEFAULT_CHAIN_ID,
  computeOrderlyAccountId,
  computeBrokerHash,
  getOrderlyChainConfig,
  isOrderlyChainSupported,
  type OrderlyChainConfig,
} from "../../constants/orderly";

/**
 * Create a public client for a specific chain
 */
function createChainClient(chainConfig: OrderlyChainConfig) {
  return createPublicClient({
    transport: http(chainConfig.rpcUrl),
  });
}

export interface OrderlyDepositFeeParams {
  /** The wallet address of the depositor */
  walletAddress?: `0x${string}`;
  /** The broker ID for Orderly */
  brokerId: string;
  /** The chain ID to deposit on (defaults to Arbitrum) */
  chainId?: number;
  /** The amount to deposit (in USDC, e.g., "100" for $100) */
  amount?: string;
  /** Whether to apply the 5% buffer (default: true) */
  applyBuffer?: boolean;
}

export interface OrderlyDepositFeeResult {
  /** The raw deposit fee in wei */
  feeWei: bigint | undefined;
  /** The deposit fee with buffer applied (in wei) */
  feeWithBufferWei: bigint | undefined;
  /** The deposit fee formatted in native token (ETH, AVAX, etc.) */
  feeFormatted: string | undefined;
  /** The deposit fee with buffer formatted */
  feeWithBufferFormatted: string | undefined;
  /** Whether the fee is loading */
  isLoading: boolean;
  /** Error if fee fetch failed */
  error: Error | null;
  /** The computed accountId for this wallet/broker combination */
  accountId: `0x${string}` | undefined;
  /** The broker hash */
  brokerHash: `0x${string}` | undefined;
  /** The chain config being used */
  chainConfig: OrderlyChainConfig | undefined;
  /** Whether the chain is supported */
  isChainSupported: boolean;
  /** Refetch the deposit fee */
  refetch: () => void;
  /** Fetch fee for a specific amount (useful for dynamic calculations) */
  fetchFeeForAmount: (
    amountUsdc: string,
    targetChainId?: number,
  ) => Promise<{
    feeWei: bigint;
    feeWithBufferWei: bigint;
  }>;
}

/**
 * Hook to fetch the Orderly vault deposit fee for any supported chain
 *
 * @example
 * ```tsx
 * const { feeFormatted, feeWithBufferWei, isLoading, chainConfig } = useOrderlyDepositFee({
 *   walletAddress: address,
 *   brokerId: "my_broker_id",
 *   chainId: 42161, // Arbitrum
 *   amount: "100", // $100 USDC
 * });
 *
 * // Display the fee
 * console.log(`Deposit fee: ${feeFormatted} ${chainConfig?.name === 'Avalanche' ? 'AVAX' : 'ETH'}`);
 * ```
 */
export function useOrderlyDepositFee({
  walletAddress,
  brokerId,
  chainId = ORDERLY_DEFAULT_CHAIN_ID,
  amount,
  applyBuffer = true,
}: OrderlyDepositFeeParams): OrderlyDepositFeeResult {
  // Get chain config
  const chainConfig = useMemo(() => getOrderlyChainConfig(chainId), [chainId]);
  const isChainSupported = useMemo(() => isOrderlyChainSupported(chainId), [chainId]);

  // Compute accountId and brokerHash
  const accountId = useMemo(() => {
    if (!walletAddress) return undefined;
    return computeOrderlyAccountId(walletAddress, brokerId);
  }, [walletAddress, brokerId]);

  const brokerHash = useMemo(() => {
    return computeBrokerHash(brokerId);
  }, [brokerId]);

  // Convert amount to USDC smallest units (using chain-specific decimals)
  const amountInUnits = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0 || !chainConfig) return undefined;
    try {
      return parseUnits(amount, chainConfig.usdcDecimals);
    } catch {
      return undefined;
    }
  }, [amount, chainConfig]);

  // Fetch deposit fee from contract
  const fetchDepositFee = useCallback(async (): Promise<bigint> => {
    if (!walletAddress || !accountId || !amountInUnits || !chainConfig) {
      throw new Error("Missing required parameters for fee calculation");
    }

    const client = createChainClient(chainConfig);

    const depositData = {
      accountId: accountId,
      brokerHash: brokerHash!,
      tokenHash: ORDERLY_HASHES.USDC_TOKEN_HASH,
      tokenAmount: amountInUnits,
    };

    const fee = await client.readContract({
      address: chainConfig.vaultAddress,
      abi: ORDERLY_VAULT_ABI,
      functionName: "getDepositFee",
      args: [walletAddress, depositData],
    });

    return fee as bigint;
  }, [walletAddress, accountId, brokerHash, amountInUnits, chainConfig]);

  // Use react-query for caching and refetching
  const {
    data: feeWei,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orderly-deposit-fee", walletAddress, brokerId, chainId, amount],
    queryFn: fetchDepositFee,
    enabled: !!walletAddress && !!accountId && !!amountInUnits && !!chainConfig,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });

  // Calculate fee with buffer
  const feeWithBufferWei = useMemo(() => {
    if (!feeWei) return undefined;
    return applyBuffer ? (feeWei * ORDERLY_DEPOSIT_FEE_BUFFER) / 100n : feeWei;
  }, [feeWei, applyBuffer]);

  // Format fees for display
  const feeFormatted = useMemo(() => {
    if (!feeWei) return undefined;
    return formatUnits(feeWei, 18);
  }, [feeWei]);

  const feeWithBufferFormatted = useMemo(() => {
    if (!feeWithBufferWei) return undefined;
    return formatUnits(feeWithBufferWei, 18);
  }, [feeWithBufferWei]);

  // Function to fetch fee for a specific amount on any chain
  const fetchFeeForAmount = useCallback(
    async (
      amountUsdc: string,
      targetChainId?: number,
    ): Promise<{ feeWei: bigint; feeWithBufferWei: bigint }> => {
      const effectiveChainId = targetChainId ?? chainId;
      const targetChainConfig = getOrderlyChainConfig(effectiveChainId);

      if (!walletAddress || !accountId || !brokerHash || !targetChainConfig) {
        throw new Error("Wallet address, broker ID, and valid chain are required");
      }

      const client = createChainClient(targetChainConfig);
      const units = parseUnits(amountUsdc, targetChainConfig.usdcDecimals);

      const depositData = {
        accountId: accountId,
        brokerHash: brokerHash,
        tokenHash: ORDERLY_HASHES.USDC_TOKEN_HASH,
        tokenAmount: units,
      };

      const fee = await client.readContract({
        address: targetChainConfig.vaultAddress,
        abi: ORDERLY_VAULT_ABI,
        functionName: "getDepositFee",
        args: [walletAddress, depositData],
      });

      const feeValue = fee as bigint;
      const feeWithBuffer = (feeValue * ORDERLY_DEPOSIT_FEE_BUFFER) / 100n;

      return {
        feeWei: feeValue,
        feeWithBufferWei: feeWithBuffer,
      };
    },
    [walletAddress, accountId, brokerHash, chainId],
  );

  return {
    feeWei,
    feeWithBufferWei,
    feeFormatted,
    feeWithBufferFormatted,
    isLoading,
    error: error as Error | null,
    accountId,
    brokerHash,
    chainConfig,
    isChainSupported,
    refetch,
    fetchFeeForAmount,
  };
}

export default useOrderlyDepositFee;
