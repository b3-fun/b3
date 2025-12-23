"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";

import {
  ORDERLY_CHAINS,
  ORDERLY_SUPPORTED_CHAIN_IDS,
  ORDERLY_HASHES,
  getOrderlyChainConfig,
  getOrderlyUsdcToken,
  computeOrderlyAccountId,
  computeBrokerHash,
} from "../../constants/orderly";
import { AnySpendDeposit, type DepositContractConfig, type ChainConfig } from "./AnySpendDeposit";

// Orderly vault deposit function ABI - must be an array of ABI items
const ORDERLY_DEPOSIT_ABI = JSON.stringify([
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "depositData",
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
  /** The target chain ID to deposit on (must be Orderly-supported) */
  chainId: number;
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
  /** Source chain ID to pre-select */
  sourceChainId?: number;
  /** Payment type - crypto or fiat */
  paymentType?: "crypto" | "fiat";
  /** Custom header component */
  header?: React.ReactNode;
}

/**
 * AnySpendOrderlyDeposit - Deposit any token from any chain to Orderly Network
 *
 * Uses AnySpend to swap any token to USDC and deposit directly to Orderly vault
 * in a single transaction flow.
 *
 * @example
 * ```tsx
 * <AnySpendOrderlyDeposit
 *   brokerId="my_broker_id"
 *   chainId={42161}
 *   onSuccess={(amount) => console.log("Deposited!", amount)}
 * />
 * ```
 */
export function AnySpendOrderlyDeposit({
  brokerId,
  chainId,
  beneficiaryAddress,
  onSuccess,
  onClose,
  mode = "modal",
  className,
  minAmount = 1,
  sourceChainId,
  paymentType,
  header,
}: AnySpendOrderlyDepositProps) {
  const { address: connectedAddress } = useAccount();

  // Use beneficiary address or connected wallet
  const effectiveAddress = beneficiaryAddress ?? connectedAddress;

  // Validate chain is Orderly-supported
  const chainConfig = useMemo(() => getOrderlyChainConfig(chainId), [chainId]);
  const isChainSupported = ORDERLY_SUPPORTED_CHAIN_IDS.includes(chainId);

  // Get USDC token for the target chain
  const destinationToken = useMemo(() => getOrderlyUsdcToken(chainId), [chainId]);

  // Build supported chains list (only Orderly-supported chains)
  const supportedChains: ChainConfig[] = useMemo(() => {
    return ORDERLY_SUPPORTED_CHAIN_IDS.map(id => {
      const config = ORDERLY_CHAINS[id];
      return {
        id,
        name: config.name,
        iconUrl: config.logoUri,
      };
    });
  }, []);

  // Compute Orderly identifiers for the deposit
  const accountId = useMemo(() => {
    if (!effectiveAddress) return undefined;
    return computeOrderlyAccountId(effectiveAddress, brokerId);
  }, [effectiveAddress, brokerId]);

  const brokerHash = useMemo(() => computeBrokerHash(brokerId), [brokerId]);

  // Build the deposit contract config for AnySpend
  const depositContractConfig: DepositContractConfig | undefined = useMemo(() => {
    if (!chainConfig || !accountId || !brokerHash) return undefined;

    // For tuple arguments, pass as a JSON array representing the tuple fields
    // The tuple is: (bytes32 accountId, bytes32 brokerHash, bytes32 tokenHash, uint128 tokenAmount)
    const tupleArg = JSON.stringify({
      accountId: accountId,
      brokerHash: brokerHash,
      tokenHash: ORDERLY_HASHES.USDC_TOKEN_HASH,
      tokenAmount: "{{amount_out}}", // Will be replaced with actual swapped amount
    });

    return {
      functionAbi: ORDERLY_DEPOSIT_ABI,
      functionName: "deposit",
      functionArgs: [tupleArg],
      to: chainConfig.vaultAddress,
      spenderAddress: chainConfig.vaultAddress, // USDC approval goes to vault
      action: "Deposit to Orderly",
    };
  }, [chainConfig, accountId, brokerHash]);

  // Validation
  if (!isChainSupported || !chainConfig) {
    return (
      <div className={cn("text-sm text-red-500", className)}>
        Chain {chainId} is not supported by Orderly Network
      </div>
    );
  }

  if (!destinationToken) {
    return (
      <div className={cn("text-sm text-red-500", className)}>
        Could not find USDC token for chain {chainId}
      </div>
    );
  }

  if (!effectiveAddress) {
    return (
      <div className={cn("text-as-secondary text-sm", className)}>
        Connect wallet to deposit
      </div>
    );
  }

  if (!depositContractConfig) {
    return (
      <div className={cn("text-as-secondary text-sm", className)}>
        Loading deposit configuration...
      </div>
    );
  }

  // Custom header for Orderly deposit
  const defaultHeader = () => (
    <div className="mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-as-primary text-xl font-bold">Deposit to Orderly</h1>
        <p className="text-as-secondary mt-1 text-sm">
          Swap any token and deposit to {chainConfig.name}
        </p>
      </div>
    </div>
  );

  return (
    <div className={cn("anyspend-orderly-deposit", className)}>
      <AnySpendDeposit
        mode={mode}
        recipientAddress={effectiveAddress}
        destinationToken={destinationToken}
        destinationChainId={chainId}
        depositContractConfig={depositContractConfig}
        supportedChains={supportedChains}
        minDestinationAmount={minAmount}
        sourceTokenChainId={sourceChainId}
        paymentType={paymentType}
        onSuccess={onSuccess}
        onClose={onClose}
        actionLabel="Deposit to Orderly"
        chainSelectionTitle="Pay from"
        chainSelectionDescription="Select source chain for your deposit"
        header={header ? () => <>{header}</> : defaultHeader}
      />
    </div>
  );
}

export default AnySpendOrderlyDeposit;
