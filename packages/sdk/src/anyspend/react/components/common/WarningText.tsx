import { HYPERLIQUID_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import type { ChainWarningTextClasses, WarningTextClasses } from "../types/classes";

export interface WarningTextProps {
  /** The warning message content */
  children: React.ReactNode;
  /** Custom classes for styling */
  classes?: WarningTextClasses;
}

/**
 * A generic warning text component with consistent styling.
 *
 * @example
 * <WarningText>
 *   Custom warning message
 * </WarningText>
 */
export function WarningText({ children, classes }: WarningTextProps) {
  return <p className={classes?.root || "anyspend-warning text-center text-xs italic text-red-500"}>{children}</p>;
}

export interface ChainWarningTextProps {
  /** The chain ID to display warning for */
  chainId: number;
  /** Custom classes for styling */
  classes?: ChainWarningTextClasses;
}

/**
 * A chain-aware warning text component that displays chain-specific warnings.
 * Returns null if there's no warning for the given chain.
 *
 * @example
 * <ChainWarningText chainId={HYPERLIQUID_CHAIN_ID} />
 *
 * @example
 * <ChainWarningText chainId={destinationChainId} classes={{ root: "my-custom-class" }} />
 */
export function ChainWarningText({ chainId, classes }: ChainWarningTextProps) {
  // Chain-specific warning messages
  if (chainId === HYPERLIQUID_CHAIN_ID) {
    return (
      <WarningText classes={classes}>
        Minimum deposit amount: <b>$1</b>
      </WarningText>
    );
  }

  // No warning for this chain
  return null;
}
