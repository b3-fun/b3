import { useMemo } from "react";
import type { AnySpendAllClasses } from "./types/classes";
import { AnySpendDeposit } from "./AnySpendDeposit";

export interface AnySpendWorkflowTriggerProps {
  /** Payment recipient address (hex) */
  recipientAddress: string;
  /** Destination chain ID */
  chainId: number;
  /** Destination token address */
  tokenAddress: string;
  /** Required payment amount in token base units (wei) */
  amount: string;
  /** Workflow ID to trigger */
  workflowId: string;
  /** Organization ID that owns the workflow */
  orgId: string;
  /** Optional callback metadata merged into the order */
  callbackMetadata?: {
    /** Passed as trigger result inputs — accessible via {{root.result.inputs.*}} */
    inputs?: Record<string, unknown>;
  } & Record<string, unknown>;
  /** Callback when payment succeeds */
  onSuccess?: (amount: string) => void;
  /** Callback when modal is closed */
  onClose?: () => void;
  /** Display mode */
  mode?: "modal" | "page";
  /** Custom action label */
  actionLabel?: string;
  /** Custom class names */
  classes?: AnySpendAllClasses;
}

export function AnySpendWorkflowTrigger({
  recipientAddress,
  chainId,
  tokenAddress,
  amount,
  workflowId,
  orgId,
  callbackMetadata,
  onSuccess,
  onClose,
  mode,
  actionLabel,
  classes,
}: AnySpendWorkflowTriggerProps) {
  const metadata = useMemo(
    () => ({
      workflowId,
      orgId,
      ...callbackMetadata,
    }),
    [workflowId, orgId, callbackMetadata],
  );

  return (
    <AnySpendDeposit
      recipientAddress={recipientAddress}
      destinationTokenAddress={tokenAddress}
      destinationTokenChainId={chainId}
      destinationTokenAmount={amount}
      callbackMetadata={metadata}
      onSuccess={onSuccess}
      onClose={onClose}
      mode={mode}
      actionLabel={actionLabel}
      classes={classes}
      allowDirectTransfer
    />
  );
}
