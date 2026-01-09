import { useState } from "react";

interface UseRecipientAddressStateProps {
  /** Fixed recipient address from props (highest priority) */
  recipientAddressFromProps?: string;
  /** Connected wallet address from payment method */
  walletAddress?: string;
  /** Global account address */
  globalAddress?: string;
}

interface UseRecipientAddressStateResult {
  /** User explicitly selected recipient address (undefined means no explicit selection) */
  selectedRecipientAddress: string | undefined;
  /** Function to update the user-selected recipient address */
  setSelectedRecipientAddress: (address: string | undefined) => void;
  /** Effective recipient address (follows priority: props > user selection > wallet/global) */
  effectiveRecipientAddress: string | undefined;
  /** Reset recipient address state */
  resetRecipientAddress: () => void;
}

/**
 * Custom hook to manage recipient address state with automatic priority handling:
 *
 * **Priority System:**
 * 1. `recipientAddressFromProps` - Fixed recipient from component props (highest priority)
 * 2. `selectedRecipientAddress` - User's explicit manual selection
 * 3. `walletAddress` or `globalAddress` - Auto-selected fallback
 *
 * **Key Features:**
 * - Automatically manages recipient address based on priority
 * - Preserves user's manual selections
 * - Updates automatically when wallet/global address changes (if no manual selection)
 * - Derived value approach - no useEffect needed, no stale state bugs
 *
 * @example
 * ```tsx
 * const {
 *   selectedRecipientAddress,
 *   setSelectedRecipientAddress,
 *   effectiveRecipientAddress,
 *   resetRecipientAddress
 * } = useRecipientAddressState({
 *   recipientAddressFromProps,
 *   walletAddress,
 *   globalAddress,
 * });
 *
 * // Use effectiveRecipientAddress for display and operations
 * // Use setSelectedRecipientAddress when user explicitly selects
 * // Call resetRecipientAddress when switching tabs or going back
 * ```
 */
export function useRecipientAddressState({
  recipientAddressFromProps,
  walletAddress,
  globalAddress,
}: UseRecipientAddressStateProps = {}): UseRecipientAddressStateResult {
  // selectedRecipientAddress: explicitly selected by user (undefined means no explicit selection)
  const [selectedRecipientAddress, setSelectedRecipientAddress] = useState<string | undefined>(undefined);

  // The effective recipient address, derived on each render, respecting priority.
  const effectiveRecipientAddress =
    selectedRecipientAddress || recipientAddressFromProps || walletAddress || globalAddress;

  // Helper function to reset user's manual selection.
  const resetRecipientAddress = () => {
    setSelectedRecipientAddress(undefined);
  };

  return {
    selectedRecipientAddress,
    setSelectedRecipientAddress,
    effectiveRecipientAddress,
    resetRecipientAddress,
  };
}
