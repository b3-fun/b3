/**
 * Represents a signer configuration for transactions
 */
export interface Signer {
  /** List of approved target addresses for this signer */
  approvedTargets: readonly string[] | string[];

  /** Timestamp when this signer configuration expires (as BigInt) */
  endTimestamp: bigint;

  /** Maximum amount of native tokens allowed per transaction (as BigInt) */
  nativeTokenLimitPerTransaction: bigint;

  /** Address of the signer */
  signer: string;

  /** Timestamp when this signer configuration becomes active (as BigInt) */
  startTimestamp: bigint;
}

/**
 * Array of active signers
 */
export type ActiveSigners = readonly Signer[] | Signer[];
