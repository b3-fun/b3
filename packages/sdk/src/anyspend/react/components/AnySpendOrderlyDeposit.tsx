"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";

import {
  ORDERLY_HASHES,
  getOrderlyChainConfig,
  getOrderlyUsdcToken,
  computeOrderlyAccountId,
  computeBrokerHash,
} from "../../constants/orderly";
import { useOrderlyDepositFee } from "../hooks/useOrderlyDepositFee";
import { AnySpendDeposit, type DepositContractConfig } from "./AnySpendDeposit";

// Hardcoded to Arbitrum
const ORDERLY_CHAIN_ID = 42161;

// Orderly vault depositTo function ABI - allows depositing on behalf of another user
// This is the key: depositTo validates accountId against the `receiver` param, not msg.sender
const ORDERLY_DEPOSIT_TO_ABI = JSON.stringify([
  {
    name: "depositTo",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "receiver", type: "address" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "accountId", type: "bytes32" },
          { name: "brokerHash", type: "bytes32" },
          { name: "tokenHash", type: "bytes32" },
          { name: "tokenAmount", type: "uint128" },
        ],
      },
    ],
    outputs: [],
  },
]);

export interface AnySpendOrderlyDepositProps {
  /** The broker ID for Orderly Network */
  brokerId: string;
  /** The beneficiary wallet address (defaults to connected wallet) */
  beneficiaryAddress?: `0x${string}`;
  /** Callback when the deposit succeeds */
  onSuccess?: (amount: string) => void;
  /** Callback when user closes the modal */
  onClose?: () => void;
  /** Display mode */
  mode?: "modal" | "page";
  /** Custom class name for the container */
  className?: string;
  /** Minimum destination amount in USDC */
  minAmount?: number;
  /** Payment type - crypto or fiat */
  paymentType?: "crypto" | "fiat";
  /** Custom header component */
  header?: React.ReactNode;
}

/**
 * AnySpendOrderlyDeposit - Deposit any token from any chain to Orderly Network on Arbitrum
 *
 * Uses AnySpend to swap any token to USDC and deposit directly to Orderly vault
 * in a single transaction flow. Currently hardcoded to Arbitrum.
 *
 * @example
 * ```tsx
 * <AnySpendOrderlyDeposit
 *   brokerId="my_broker_id"
 *   onSuccess={(amount) => console.log("Deposited!", amount)}
 * />
 * ```
 */
export function AnySpendOrderlyDeposit({
  brokerId,
  beneficiaryAddress,
  onSuccess,
  onClose,
  mode = "modal",
  className,
  minAmount = 1,
  paymentType,
  header,
}: AnySpendOrderlyDepositProps) {
  const { address: connectedAddress } = useAccount();

  // Use beneficiary address or connected wallet
  const effectiveAddress = beneficiaryAddress ?? connectedAddress;

  // Get Arbitrum chain config
  const chainConfig = useMemo(() => getOrderlyChainConfig(ORDERLY_CHAIN_ID), []);

  // Get USDC token for Arbitrum
  const destinationToken = useMemo(() => getOrderlyUsdcToken(ORDERLY_CHAIN_ID), []);

  // Compute Orderly identifiers for the deposit
  const accountId = useMemo(() => {
    if (!effectiveAddress) return undefined;
    return computeOrderlyAccountId(effectiveAddress, brokerId);
  }, [effectiveAddress, brokerId]);

  const brokerHash = useMemo(() => computeBrokerHash(brokerId), [brokerId]);

  // Fetch deposit fee from Orderly vault contract using minAmount as estimate
  const { feeWithBufferWei } = useOrderlyDepositFee({
    walletAddress: effectiveAddress,
    brokerId,
    chainId: ORDERLY_CHAIN_ID,
    amount: minAmount.toString(), // Use minAmount for fee estimation
  });

  // Build the deposit contract config for AnySpend
  const depositContractConfig: DepositContractConfig | undefined = useMemo(() => {
    if (!chainConfig || !effectiveAddress || !accountId || !brokerHash || !feeWithBufferWei) return undefined;

    // For tuple arguments, pass as a JSON object representing the tuple fields
    // The tuple is: (bytes32 accountId, bytes32 brokerHash, bytes32 tokenHash, uint128 tokenAmount)
    const tupleArg = JSON.stringify({
      accountId: accountId,
      brokerHash: brokerHash,
      tokenHash: ORDERLY_HASHES.USDC_TOKEN_HASH,
      tokenAmount: "{{amount_out}}", // Will be replaced with actual swapped amount
    });

    return {
      functionAbi: ORDERLY_DEPOSIT_TO_ABI,
      functionName: "depositTo",
      functionArgs: [effectiveAddress, tupleArg], // receiver address first, then tuple data
      to: chainConfig.vaultAddress,
      spenderAddress: chainConfig.vaultAddress, // USDC approval goes to vault
      action: "Deposit to Orderly",
      value: feeWithBufferWei.toString(), // Native token fee for LayerZero cross-chain messaging
    };
  }, [chainConfig, effectiveAddress, accountId, brokerHash, feeWithBufferWei]);

  // Validation
  if (!chainConfig) {
    return <div className={cn("text-sm text-red-500", className)}>Failed to load Arbitrum chain configuration</div>;
  }

  if (!destinationToken) {
    return <div className={cn("text-sm text-red-500", className)}>Could not find USDC token for Arbitrum</div>;
  }

  if (!effectiveAddress) {
    return <div className={cn("text-as-secondary text-sm", className)}>Connect wallet to deposit</div>;
  }

  if (!depositContractConfig) {
    return <div className={cn("text-as-secondary text-sm", className)}>Loading deposit configuration...</div>;
  }

  // Custom header for Orderly deposit
  const defaultHeader = () => (
    <div className="mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-as-primary text-xl font-bold">Deposit to Orderly</h1>
        <p className="text-as-secondary mt-1 text-sm">Swap any token and deposit to Arbitrum</p>
      </div>
    </div>
  );

  return (
    <div className={cn("anyspend-orderly-deposit", className)}>
      <AnySpendDeposit
        mode={mode}
        recipientAddress={effectiveAddress}
        destinationToken={destinationToken}
        destinationChainId={ORDERLY_CHAIN_ID}
        depositContractConfig={depositContractConfig}
        minDestinationAmount={minAmount}
        paymentType={paymentType}
        onSuccess={onSuccess}
        onClose={onClose}
        actionLabel="Deposit to Orderly"
        header={header ? () => <>{header}</> : defaultHeader}
      />
    </div>
  );
}

export default AnySpendOrderlyDeposit;
