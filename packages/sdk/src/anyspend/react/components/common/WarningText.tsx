import { HYPERLIQUID_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";

export interface WarningTextProps {
  /** The warning message content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A generic warning text component with consistent styling.
 *
 * @example
 * <WarningText>
 *   Custom warning message
 * </WarningText>
 */
export function WarningText({ children, className }: WarningTextProps) {
  return <p className={cn("anyspend-warning text-center text-xs italic text-red-500", className)}>{children}</p>;
}

export interface ChainWarningTextProps {
  /** The chain ID to display warning for */
  chainId: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A chain-aware warning text component that displays chain-specific warnings.
 * Returns null if there's no warning for the given chain.
 *
 * @example
 * <ChainWarningText chainId={HYPERLIQUID_CHAIN_ID} />
 *
 * @example
 * <ChainWarningText chainId={destinationChainId} className="mt-4" />
 */
export function ChainWarningText({ chainId, className }: ChainWarningTextProps) {
  // Chain-specific warning messages
  if (chainId === HYPERLIQUID_CHAIN_ID) {
    return (
      <WarningText className={className}>
        Minimum deposit amount: <b>$1</b>
      </WarningText>
    );
  }

  // No warning for this chain
  return null;
}
