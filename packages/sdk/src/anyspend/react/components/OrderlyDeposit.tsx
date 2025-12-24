"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ShinyButton, StyleRoot } from "@b3dotfun/sdk/global-account/react";

import {
  ORDERLY_VAULT_ABI,
  ORDERLY_HASHES,
  computeOrderlyAccountId,
  computeBrokerHash,
  getOrderlyChainConfig,
  isOrderlyChainSupported,
} from "../../constants/orderly";
import { useOrderlyDepositFee } from "../hooks/useOrderlyDepositFee";

export interface OrderlyDepositProps {
  /** The broker ID for Orderly Network */
  brokerId: string;
  /** The chain ID to deposit on */
  chainId: number;
  /** The amount to deposit in USDC (e.g., "100" for $100) */
  amount: string;
  /** The beneficiary wallet address (defaults to connected wallet) */
  beneficiaryAddress?: `0x${string}`;
  /** Callback when deposit succeeds */
  onSuccess?: (txHash: string) => void;
  /** Callback when deposit fails */
  onError?: (error: Error) => void;
  /** Custom button text */
  buttonText?: string;
  /** Whether to show the fee breakdown */
  showFeeBreakdown?: boolean;
  /** Custom class name for the container */
  className?: string;
}

type DepositState = "idle" | "switching-chain" | "approving" | "depositing" | "success" | "error";

/**
 * OrderlyDeposit - Single-screen deposit component for Orderly Network
 *
 * Receives chain and amount as props, fetches deposit fee automatically,
 * and executes the deposit in one click.
 *
 * @example
 * ```tsx
 * <OrderlyDeposit
 *   brokerId="my_broker_id"
 *   chainId={42161}
 *   amount="100"
 *   onSuccess={(txHash) => console.log("Deposited!", txHash)}
 * />
 * ```
 */
export function OrderlyDeposit({
  brokerId,
  chainId,
  amount,
  beneficiaryAddress,
  onSuccess,
  onError,
  buttonText,
  showFeeBreakdown = true,
  className,
}: OrderlyDepositProps) {
  const { address: connectedAddress } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  // Use beneficiary address or connected wallet
  const effectiveAddress = beneficiaryAddress ?? connectedAddress;

  // State
  const [depositState, setDepositState] = useState<DepositState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Get chain config
  const chainConfig = useMemo(() => getOrderlyChainConfig(chainId), [chainId]);
  const isChainSupported = isOrderlyChainSupported(chainId);
  const isOnCorrectChain = currentChainId === chainId;

  // Compute Orderly identifiers
  const accountId = useMemo(() => {
    if (!effectiveAddress) return undefined;
    return computeOrderlyAccountId(effectiveAddress, brokerId);
  }, [effectiveAddress, brokerId]);

  const brokerHash = useMemo(() => computeBrokerHash(brokerId), [brokerId]);

  // Fetch deposit fee
  const { feeWithBufferWei, feeFormatted, isLoading: isFeeLoading, error: feeError } = useOrderlyDepositFee({
    walletAddress: effectiveAddress,
    brokerId,
    chainId,
    amount,
  });

  // Wagmi hooks
  const { sendTransactionAsync } = useSendTransaction();
  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle tx confirmation
  useEffect(() => {
    if (isTxConfirmed && txHash) {
      setDepositState("success");
      onSuccess?.(txHash);
    }
  }, [isTxConfirmed, txHash, onSuccess]);

  // Validation
  const isValidAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  }, [amount]);

  const canDeposit = useMemo(() => {
    return (
      effectiveAddress &&
      accountId &&
      brokerHash &&
      chainConfig &&
      isValidAmount &&
      feeWithBufferWei &&
      !isFeeLoading &&
      depositState === "idle"
    );
  }, [
    effectiveAddress,
    accountId,
    brokerHash,
    chainConfig,
    isValidAmount,
    feeWithBufferWei,
    isFeeLoading,
    depositState,
  ]);

  // Execute deposit
  const executeDeposit = useCallback(async () => {
    if (!effectiveAddress || !accountId || !brokerHash || !chainConfig || !feeWithBufferWei) {
      return;
    }

    setErrorMessage(undefined);

    try {
      // Switch chain if needed
      if (!isOnCorrectChain) {
        setDepositState("switching-chain");
        await switchChainAsync({ chainId });
      }

      // Approve USDC
      setDepositState("approving");
      const amountInUnits = parseUnits(amount, chainConfig.usdcDecimals);

      await sendTransactionAsync({
        to: chainConfig.usdcAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [chainConfig.vaultAddress, amountInUnits],
        }),
      });

      // Small delay to ensure approval is mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Deposit to vault
      setDepositState("depositing");
      const depositTxHash = await sendTransactionAsync({
        to: chainConfig.vaultAddress,
        value: feeWithBufferWei,
        data: encodeFunctionData({
          abi: ORDERLY_VAULT_ABI,
          functionName: "deposit",
          args: [
            {
              accountId: accountId,
              brokerHash: brokerHash,
              tokenHash: ORDERLY_HASHES.USDC_TOKEN_HASH,
              tokenAmount: amountInUnits,
            },
          ],
        }),
      });

      setTxHash(depositTxHash);
    } catch (err: any) {
      console.error("Deposit error:", err);
      setDepositState("error");
      setErrorMessage(err.shortMessage || err.message || "Deposit failed");
      onError?.(err);
    }
  }, [
    effectiveAddress,
    accountId,
    brokerHash,
    chainConfig,
    feeWithBufferWei,
    isOnCorrectChain,
    switchChainAsync,
    chainId,
    amount,
    sendTransactionAsync,
    onError,
  ]);

  // Reset state
  const reset = useCallback(() => {
    setDepositState("idle");
    setTxHash(undefined);
    setErrorMessage(undefined);
  }, []);

  // Button text based on state
  const getButtonText = () => {
    if (buttonText && depositState === "idle") return buttonText;

    switch (depositState) {
      case "switching-chain":
        return `Switching to ${chainConfig?.name}...`;
      case "approving":
        return "Approving USDC...";
      case "depositing":
        return "Depositing...";
      case "success":
        return "Deposit Successful!";
      case "error":
        return "Try Again";
      default:
        if (!isOnCorrectChain) {
          return `Switch to ${chainConfig?.name} & Deposit`;
        }
        return `Deposit ${amount} ${chainConfig?.usdcSymbol || "USDC"}`;
    }
  };

  // Error states
  if (!isChainSupported) {
    return <div className={cn("text-sm text-red-500", className)}>Chain {chainId} is not supported by Orderly</div>;
  }

  if (!effectiveAddress) {
    return <div className={cn("text-as-secondary text-sm", className)}>Connect wallet to deposit</div>;
  }

  const isProcessing = depositState !== "idle" && depositState !== "success" && depositState !== "error";

  return (
    <StyleRoot>
      <div className={cn("anyspend-orderly-deposit flex flex-col gap-3", className)}>
        {/* Fee breakdown */}
        {showFeeBreakdown && (
          <div className="bg-as-surface-secondary rounded-lg p-3">
            <div className="flex flex-col gap-2 text-sm">
              <div className="text-as-secondary flex items-center justify-between">
                <span>Amount</span>
                <span className="text-as-primary font-medium">
                  {amount} {chainConfig?.usdcSymbol}
                </span>
              </div>
              <div className="text-as-secondary flex items-center justify-between">
                <span>Network</span>
                <div className="flex items-center gap-1.5">
                  {chainConfig?.logoUri && <img src={chainConfig.logoUri} alt="" className="h-4 w-4 rounded-full" />}
                  <span className="text-as-primary">{chainConfig?.name}</span>
                </div>
              </div>
              <div className="text-as-secondary flex items-center justify-between">
                <span>Deposit Fee</span>
                <span className="text-as-primary">
                  {isFeeLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : feeFormatted ? (
                    `~${parseFloat(feeFormatted).toFixed(6)} ETH`
                  ) : feeError ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    "..."
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Success state */}
        {depositState === "success" && txHash && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600">Deposit successful!</p>
              <a
                href={`${chainConfig?.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-500 underline"
              >
                View transaction
              </a>
            </div>
          </div>
        )}

        {/* Error state */}
        {depositState === "error" && errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="flex-1 text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* Deposit button */}
        <ShinyButton
          onClick={depositState === "error" ? reset : executeDeposit}
          disabled={!canDeposit && depositState !== "error"}
          className={cn("w-full", depositState === "success" && "pointer-events-none")}
          accentColor={
            depositState === "success"
              ? "hsl(142, 76%, 36%)"
              : depositState === "error"
                ? "hsl(0, 84%, 60%)"
                : "hsl(var(--as-brand))"
          }
        >
          <div className="flex items-center justify-center gap-2">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {depositState === "success" && <CheckCircle2 className="h-4 w-4" />}
            {getButtonText()}
          </div>
        </ShinyButton>
      </div>
    </StyleRoot>
  );
}

export default OrderlyDeposit;
